import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import firebase from 'firebase/compat/app'
import { auth, db, googleProvider } from '../lib/firebase'
import { registerForPushNotifications, onForegroundMessage } from '../lib/notifications'

const AppContext = createContext()

export function AppProvider({ children }) {
    const [user, setUser] = useState(null)
    const [groups, setGroups] = useState([])
    const [expenses, setExpenses] = useState([])
    const [usersMap, setUsersMap] = useState({})
    const [loading, setLoading] = useState(true)
    const [groupsLoaded, setGroupsLoaded] = useState(false)
    const [expensesLoaded, setExpensesLoaded] = useState(false)

    // Auth Listener
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    // Register for push notifications when user logs in.
    // Only auto-call if permission is already granted — mobile Chrome silently
    // ignores requestPermission() without a real user gesture (tap).
    useEffect(() => {
        if (!user) return
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            registerForPushNotifications(user.uid)
        }

        const unsubForeground = onForegroundMessage((payload) => {
            const { title, body } = payload.notification || {}
            if (title && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(title, {
                    body: body || '',
                    icon: '/logo.png'
                })
            }
        })
        return () => unsubForeground()
    }, [user])

    // 1. Groups Listener
    useEffect(() => {
        if (!user) {
            setGroups([])
            setGroupsLoaded(true)
            return
        }

        const unsubGroups = db.collection('groups')
            .where('members', 'array-contains', user.uid)
            .onSnapshot(snapshot => {
                const groupList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setGroups(groupList)
                setGroupsLoaded(true)
            }, error => {
                console.error("Error fetching groups:", error)
                setGroupsLoaded(true)
            })

        return () => unsubGroups()
    }, [user])

    const chunkArray = (arr, size) => arr.length ? [arr.slice(0, size), ...chunkArray(arr.slice(size), size)] : [];

    // 2. Expenses Listener (Optimized)
    const groupIdsString = useMemo(() => groups.map(g => g.id).sort().join(','), [groups]);

    useEffect(() => {
        if (!user || !groupIdsString) {
            setExpenses([])
            setExpensesLoaded(true)
            return
        }

        const groupIds = groupIdsString.split(',');
        const chunks = chunkArray(groupIds, 10);
        const expensesMap = new Map();
        let pending = chunks.length

        const unsubs = chunks.map(chunk => {
            return db.collection('expenses')
                .where('groupId', 'in', chunk)
                .onSnapshot(snapshot => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'removed') {
                            expensesMap.delete(change.doc.id);
                        } else {
                            expensesMap.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
                        }
                    });
                    setExpenses(Array.from(expensesMap.values()));
                    if (pending > 0) {
                        pending -= 1
                        if (pending === 0) setExpensesLoaded(true)
                    }
                }, error => {
                    console.error("Error fetching expenses:", error)
                    if (pending > 0) {
                        pending -= 1
                        if (pending === 0) setExpensesLoaded(true)
                    }
                })
        });

        return () => unsubs.forEach(unsub => unsub())
    }, [user, groupIdsString])

    // 3. Users Listener (Optimized)
    const userIdsString = useMemo(() => {
        const uids = new Set();
        if (user) uids.add(user.uid);
        groups.forEach(g => {
            if (g.members) g.members.forEach(uid => uids.add(uid));
        });
        return Array.from(uids).sort().join(',');
    }, [groups, user]);

    useEffect(() => {
        if (!user || !userIdsString) {
            setUsersMap({})
            return
        }

        const userIds = userIdsString.split(',');
        const chunks = chunkArray(userIds, 10);
        const map = new Map();

        const unsubs = chunks.map(chunk => {
            return db.collection('users')
                .where(firebase.firestore.FieldPath.documentId(), 'in', chunk)
                .onSnapshot(snapshot => {
                    snapshot.docs.forEach(doc => {
                        map.set(doc.id, { id: doc.id, ...doc.data() });
                    });
                    setUsersMap(Object.fromEntries(map));
                })
        });

        return () => unsubs.forEach(unsub => unsub())
    }, [user, userIdsString])

    useEffect(() => {
        if (!user || !user.email) return;

        db.collection('groups')
            .where('memberEmails', 'array-contains', user.email)
            .get()
            .then(snapshot => {
                snapshot.docs.forEach(doc => {
                    const data = doc.data()
                    if (!data.members.includes(user.uid)) {
                        console.log("Auto-joining group from invite:", doc.id)
                        db.collection('groups').doc(doc.id).update({
                            members: firebase.firestore.FieldValue.arrayUnion(user.uid)
                        })
                    }
                })
            })
            .catch(err => console.error("Error checking invites:", err))
    }, [user])

    // Actions
    const login = (email, password) => auth.signInWithEmailAndPassword(email, password)

    const resetPassword = (email) => auth.sendPasswordResetEmail(email)

    const register = async (name, email, password) => {
        // This will throw if it fails, which is what we want so the UI can handle it
        const res = await auth.createUserWithEmailAndPassword(email, password)
        await res.user.updateProfile({ displayName: name })

        // Send verification email
        try {
            await res.user.sendEmailVerification()
            console.log("Verification email sent to:", email)
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError)
            // Continue execution so user is still saved to DB
        }

        await db.collection('users').doc(res.user.uid).set({
            name,
            email,
            uid: res.user.uid
        })
    }

    const logout = () => auth.signOut()

    const signInWithGoogle = async () => {
        try {
            const result = await auth.signInWithPopup(googleProvider)
            const user = result.user

            // Check if user exists in Firestore
            const userDoc = await db.collection('users').doc(user.uid).get()

            if (!userDoc.exists) {
                // Create new user profile
                await db.collection('users').doc(user.uid).set({
                    name: user.displayName,
                    email: user.email,
                    uid: user.uid,
                    photoURL: user.photoURL,
                    createdAt: new Date()
                })
            } else {
                // If the user changed their Google email, sync it to our database
                const existingData = userDoc.data();
                if (existingData.email !== user.email) {
                    await db.collection('users').doc(user.uid).update({ 
                        email: user.email 
                    });
                    console.log("Synced new email address to profile");
                }
            }
            return user
        } catch (error) {
            console.error("Error signing in with Google:", error)
            throw error
        }
    }

    const addGroup = async (name, memberEmails) => {
        if (!user) {
            console.error("Attempted to add group but no user logged in")
            return
        }

        console.log("Creating group:", name, "for user:", user.uid)

        const memberUids = [user.uid]
        const emailsToFind = memberEmails || []

        Object.values(usersMap).forEach(u => {
            if (emailsToFind.includes(u.email) && !memberUids.includes(u.uid)) {
                memberUids.push(u.uid)
            }
        })

        console.log("Group members:", memberUids)

        try {
            const groupRes = await db.collection('groups').add({
                name,
                createdBy: user.uid,
                createdAt: new Date(), // Compat uses Date or Timestamp
                members: memberUids,
                memberEmails: [user.email, ...emailsToFind]
            })

            // Send invitation emails to users who don't have accounts yet
            for (const email of emailsToFind) {
                const userExists = Object.values(usersMap).some(u => u.email === email)
                console.log(`Checking if user ${email} exists:`, userExists)
                if (!userExists) {
                    console.log(`Sending invitation email to ${email}...`)
                    try {
                        await db.collection('mail').add({
                            from: 'noreply@balaconnect.com',
                            to: email,
                            message: {
                                subject: `Invite to join ${name} on Trackcents`,
                                html: `
                                    <h2>You've been invited!</h2>
                                    <p>${user.displayName || user.email} has invited you to join the group <strong>${name}</strong> on Trackcents.</p>
                                    <p>Trackcents helps you track and split expenses with friends easily.</p>
                                    <a href="https://expense.balaconnect.com/signup" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 10px;">Sign Up Now</a>
                                `
                            }
                        })
                        console.log(`Invitation document added for ${email}`)
                    } catch (mailErr) {
                        console.error(`Failed to add mail doc for ${email}:`, mailErr)
                    }
                }
            }
            console.log("Group added successfully")
        } catch (error) {
            console.error("Error adding group:", error)
        }
    }

    const updateGroup = async (groupId, data) => {
        try {
            await db.collection('groups').doc(groupId).update(data)
        } catch (error) {
            console.error("Error updating group:", error)
            throw error
        }
    }

    const deleteGroup = async (groupId) => {
        try {
            // 1. Delete all expenses in the group
            const expensesSnapshot = await db.collection('expenses').where('groupId', '==', groupId).get()
            const batch = db.batch()

            expensesSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref)
            })

            // 2. Delete the group itself
            const groupRef = db.collection('groups').doc(groupId)
            batch.delete(groupRef)

            await batch.commit()
            console.log("Group and related expenses deleted successfully")
        } catch (error) {
            console.error("Error deleting group:", error)
            throw error
        }
    }

    const inviteToGroup = async (groupId, email, groupName) => {
        if (!email) return
        try {
            const groupRef = db.collection('groups').doc(groupId)
            const existingUser = Object.values(usersMap).find(u => u.email === email)

            if (existingUser) {
                console.log(`User ${email} exists, adding to members.`)
                // User exists, add to members array
                await groupRef.update({
                    members: firebase.firestore.FieldValue.arrayUnion(existingUser.uid),
                    memberEmails: firebase.firestore.FieldValue.arrayUnion(email)
                })
            } else {
                console.log(`User ${email} doesn't exist, sending invite...`)
                // User doesn't exist, just add to email list and send invite
                await groupRef.update({
                    memberEmails: firebase.firestore.FieldValue.arrayUnion(email)
                })

                // Create invitation email trigger
                try {
                    await db.collection('mail').add({
                        from: 'noreply@balaconnect.com',
                        to: email,
                        message: {
                            subject: `Invite to join ${groupName} on Trackcents`,
                            html: `
                                <h2>You've been invited!</h2>
                                <p>${user.displayName || user.email} has invited you to join the group <strong>${groupName}</strong> on Trackcents.</p>
                                <p>Trackcents helps you track and split expenses with friends easily.</p>
                                <a href="https://expense.balaconnect.com/signup" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 10px;">Sign Up Now</a>
                            `
                        }
                    })
                    console.log(`Invitation document added for ${email}`)
                } catch (mailErr) {
                    console.error("Failed to crate mail document:", mailErr)
                }
            }
        } catch (error) {
            console.error("Error inviting member:", error)
            throw error
        }
    }

    const removeGroupMember = async (groupId, uid) => {
        try {
            const groupRef = db.collection('groups').doc(groupId)
            const userDoc = await db.collection('users').doc(uid).get()
            const userEmail = userDoc.data()?.email

            const updates = {
                members: firebase.firestore.FieldValue.arrayRemove(uid)
            }

            if (userEmail) {
                updates.memberEmails = firebase.firestore.FieldValue.arrayRemove(userEmail)
            }

            await groupRef.update(updates)
        } catch (error) {
            console.error("Error removing member:", error)
            throw error
        }
    }

    const updateUser = async (uid, data) => {
        try {
            await db.collection('users').doc(uid).update(data)
            // Also update local state if it's the current user
            if (user && user.uid === uid) {
                // Auth profile update
                if (data.name) {
                    await user.updateProfile({ displayName: data.name })
                }
            }
        } catch (error) {
            console.error("Error updating user:", error)
            throw error
        }
    }

    const updateExpense = async (expenseId, data) => {
        try {
            await db.collection('expenses').doc(expenseId).update(data)
        } catch (error) {
            console.error("Error updating expense:", error)
            throw error
        }
    }

    const deleteExpense = async (expenseId) => {
        try {
            await db.collection('expenses').doc(expenseId).delete()
        } catch (error) {
            console.error("Error deleting expense:", error)
            throw error
        }
    }

    const addComment = async (expenseId, text) => {
        if (!user) return
        try {
            const comment = {
                id: Date.now().toString(), // Simple ID
                userId: user.uid,
                userName: user.displayName || user.email,
                text,
                createdAt: new Date().toISOString()
            }
            await db.collection('expenses').doc(expenseId).update({
                comments: firebase.firestore.FieldValue.arrayUnion(comment)
            })
        } catch (error) {
            console.error("Error adding comment:", error)
            throw error
        }
    }

    const addExpense = async (groupId, description, amount, date, paidBy, splitAmong, splitType = 'equal', splitDetails = {}, currency = 'USD') => {
        try {
            console.log(`Adding expense to group ${groupId}:`, { description, amount, date, paidBy, splitType, currency })
            await db.collection('expenses').add({
                groupId,
                description,
                amount: parseFloat(amount),
                currency,
                paidBy,
                splitAmong,
                splitType,
                splitDetails,
                comments: [],
                date: date || new Date().toISOString().split('T')[0],
                createdAt: new Date()
            })
            console.log("Expense added successfully")
        } catch (error) {
            console.error("Error adding expense to Firestore:", error)
            throw error // Rethrow so modal can handle it
        }
    }

    const getGroupExpenses = (groupId) => expenses.filter(e => e.groupId === groupId)

    const getGroupMembers = (groupId) => {
        const group = groups.find(g => g.id === groupId)
        if (!group) return []

        return group.members.map(uid => ({
            id: uid,
            name: usersMap[uid]?.name || 'Unknown Member',
            email: usersMap[uid]?.email || ''
        }))
    }

    const calculateBalance = (expensesList) => {
        if (!user) return 0
        let totalPaid = 0
        let totalShare = 0

        expensesList.forEach(expense => {
            if (expense.paidBy === user.uid) {
                totalPaid += expense.amount
            }
            if (Array.isArray(expense.splitAmong) && expense.splitAmong.includes(user.uid)) {
                if (expense.splitType === 'percentage' && expense.splitDetails) {
                    const percentage = expense.splitDetails[user.uid] || 0
                    totalShare += (expense.amount * percentage) / 100
                } else {
                    totalShare += (expense.amount / expense.splitAmong.length)
                }
            }
        })
        return totalPaid - totalShare
    }

    const getUserBalance = () => calculateBalance(expenses)

    const getGroupUserBalance = (groupId) => calculateBalance(expenses.filter(e => e.groupId === groupId))

    const getFriends = () => {
        if (!user) return []
        const friendIds = new Set()
        groups.forEach(group => {
            if (group.members) {
                group.members.forEach(m => {
                    if (m !== user.uid) friendIds.add(m)
                })
            }
        })

        return Array.from(friendIds).map(uid => ({
            id: uid,
            name: usersMap[uid]?.name || 'Unknown',
            email: usersMap[uid]?.email || ''
        }))
    }

    const getFriendBalance = (friendUid) => {
        if (!user) return 0
        let balance = 0 // + means they owe you, - means you owe them

        expenses.forEach(expense => {
            const group = groups.find(g => g.id === expense.groupId)
            if (!group) return // Should be in a group we know

            const splitCount = expense.splitAmong ? expense.splitAmong.length : 1
            const shareAmount = expense.amount / splitCount

            // 1. You paid, they are in split -> They owe you (+)
            if (expense.paidBy === user.uid && expense.splitAmong.includes(friendUid)) {
                if (expense.splitType === 'percentage' && expense.splitDetails) {
                    const percentage = expense.splitDetails[friendUid] || 0
                    balance += (expense.amount * percentage) / 100
                } else {
                    balance += shareAmount
                }
            }

            // 2. They paid, you are in split -> You owe them (-)
            if (expense.paidBy === friendUid && expense.splitAmong.includes(user.uid)) {
                if (expense.splitType === 'percentage' && expense.splitDetails) {
                    const percentage = expense.splitDetails[user.uid] || 0
                    balance -= (expense.amount * percentage) / 100
                } else {
                    balance -= shareAmount
                }
            }
        })

        return balance
    }

    return (
        <AppContext.Provider value={{
            user,
            groups,
            expenses,
            loading,
            dataLoading: !groupsLoaded || !expensesLoaded,
            login,
            register,
            logout,
            signInWithGoogle,
            resetPassword,
            addGroup,
            updateGroup,
            inviteToGroup,
            removeGroupMember,
            updateUser,
            deleteGroup,
            addExpense,
            updateExpense,
            deleteExpense,
            addComment,
            getGroupExpenses,
            getGroupMembers,
            getUserBalance,
            getGroupUserBalance,
            getFriends,
            getFriendBalance,
            users: Object.values(usersMap)
        }}>
            {!loading && children}
        </AppContext.Provider>
    )
}

export function useApp() {
    return useContext(AppContext)
}
