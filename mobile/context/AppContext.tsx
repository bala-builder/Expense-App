import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  signInWithCredential,
  GoogleAuthProvider,
  User,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  writeBatch,
  arrayUnion,
  arrayRemove,
  documentId,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { registerForPushNotifications } from "@/lib/notifications";
import { getMemberShare, getGroupDebts, Settlement } from "@/lib/balance";

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  fcmToken?: string;
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  memberEmails: string[];
  createdAt: any;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  splitAmong: string[];
  splitType: "equal" | "percentage";
  splitDetails: Record<string, number>;
  date: string;
  comments: Comment[];
  createdAt: any;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export type { Settlement };

interface AppContextType {
  user: User | null;
  appUser: AppUser | null;
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  users: AppUser[];
  loading: boolean;
  dataLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  addGroup: (name: string, memberEmails: string[]) => Promise<void>;
  updateGroup: (groupId: string, data: Partial<Group>) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  inviteToGroup: (groupId: string, email: string, groupName: string) => Promise<void>;
  removeGroupMember: (groupId: string, uid: string) => Promise<void>;
  updateUser: (uid: string, data: Partial<AppUser>) => Promise<void>;
  addExpense: (
    groupId: string,
    description: string,
    amount: number,
    date: string,
    paidBy: string,
    splitAmong: string[],
    splitType: "equal" | "percentage",
    splitDetails: Record<string, number>,
    currency: string
  ) => Promise<void>;
  updateExpense: (expenseId: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  addComment: (expenseId: string, text: string) => Promise<void>;
  getGroupExpenses: (groupId: string) => Expense[];
  getGroupSettlements: (groupId: string) => Settlement[];
  getGroupMembers: (groupId: string) => AppUser[];
  getGroupDebtsSummary: (groupId: string) => { fromUid: string; toUid: string; amount: number; currency: string }[];
  addSettlement: (
    groupId: string,
    fromUid: string,
    toUid: string,
    amount: number,
    currency: string,
    date: string,
    note?: string
  ) => Promise<void>;
  deleteSettlement: (settlementId: string) => Promise<void>;
  getUserBalance: () => number;
  getGroupUserBalance: (groupId: string) => number;
  getFriends: () => AppUser[];
  getFriendBalance: (friendUid: string) => number;
}

const AppContext = createContext<AppContextType | null>(null);

const chunkArray = <T,>(arr: T[], size: number): T[][] =>
  arr.length ? [arr.slice(0, size), ...chunkArray(arr.slice(size), size)] : [];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, AppUser>>({});
  const [loading, setLoading] = useState(true);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [expensesLoaded, setExpensesLoaded] = useState(false);
  const [settlementsLoaded, setSettlementsLoaded] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setAppUser(null);
        setGroups([]);
        setExpenses([]);
        setUsersMap({});
        setGroupsLoaded(true);
        setExpensesLoaded(true);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    registerForPushNotifications(user.uid).catch(console.log);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubGroups = onSnapshot(
      query(collection(db, "groups"), where("members", "array-contains", user.uid)),
      (snapshot) => {
        const groupList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Group[];
        setGroups(groupList);
        setGroupsLoaded(true);
      },
      (error) => {
        console.error("Groups error:", error);
        setGroupsLoaded(true);
      }
    );
    return unsubGroups;
  }, [user]);

  const groupIdsString = useMemo(
    () => groups.map((g) => g.id).sort().join(","),
    [groups]
  );

  useEffect(() => {
    if (!user || !groupIdsString) {
      setExpenses([]);
      setExpensesLoaded(true);
      return;
    }
    const groupIds = groupIdsString.split(",");
    const chunks = chunkArray(groupIds, 10);
    const expensesMap = new Map<string, Expense>();
    let pending = chunks.length;

    const unsubs = chunks.map((chunk) =>
      onSnapshot(
        query(collection(db, "expenses"), where("groupId", "in", chunk)),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "removed") {
              expensesMap.delete(change.doc.id);
            } else {
              expensesMap.set(change.doc.id, {
                id: change.doc.id,
                ...change.doc.data(),
              } as Expense);
            }
          });
          setExpenses(Array.from(expensesMap.values()));
          if (pending > 0) {
            pending -= 1;
            if (pending === 0) setExpensesLoaded(true);
          }
        },
        (error) => {
          console.error("Expenses error:", error);
          if (pending > 0) {
            pending -= 1;
            if (pending === 0) setExpensesLoaded(true);
          }
        }
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [user, groupIdsString]);

  useEffect(() => {
    if (!user || !groupIdsString) {
      setSettlements([]);
      setSettlementsLoaded(true);
      return;
    }
    const groupIds = groupIdsString.split(",");
    const chunks = chunkArray(groupIds, 10);
    const settlementsMap = new Map<string, Settlement>();
    let pending = chunks.length;

    const unsubs = chunks.map((chunk) =>
      onSnapshot(
        query(collection(db, "settlements"), where("groupId", "in", chunk)),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "removed") {
              settlementsMap.delete(change.doc.id);
            } else {
              settlementsMap.set(change.doc.id, {
                id: change.doc.id,
                ...change.doc.data(),
              } as Settlement);
            }
          });
          setSettlements(Array.from(settlementsMap.values()));
          if (pending > 0) {
            pending -= 1;
            if (pending === 0) setSettlementsLoaded(true);
          }
        },
        (error) => {
          console.error("Settlements error:", error);
          if (pending > 0) {
            pending -= 1;
            if (pending === 0) setSettlementsLoaded(true);
          }
        }
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [user, groupIdsString]);

  const userIdsString = useMemo(() => {
    const uids = new Set<string>();
    if (user) uids.add(user.uid);
    groups.forEach((g) => g.members?.forEach((uid) => uids.add(uid)));
    return Array.from(uids).sort().join(",");
  }, [groups, user]);

  useEffect(() => {
    if (!user || !userIdsString) {
      setUsersMap({});
      return;
    }
    const userIds = userIdsString.split(",");
    const chunks = chunkArray(userIds, 10);
    const map = new Map<string, AppUser>();

    const unsubs = chunks.map((chunk) =>
      onSnapshot(
        query(collection(db, "users"), where(documentId(), "in", chunk)),
        (snapshot) => {
          snapshot.docs.forEach((d) => {
            map.set(d.id, { id: d.id, ...d.data() } as any);
          });
          setUsersMap(Object.fromEntries(map));
          if (user && map.has(user.uid)) {
            setAppUser(map.get(user.uid) || null);
          }
        }
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [user, userIdsString]);

  useEffect(() => {
    if (!user?.email) return;
    getDocs(
      query(
        collection(db, "groups"),
        where("memberEmails", "array-contains", user.email)
      )
    ).then((snapshot) => {
      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (!data.members.includes(user.uid)) {
          updateDoc(doc(db, "groups", d.id), {
            members: arrayUnion(user.uid),
          });
        }
      });
    });
  }, [user]);

  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const resetPassword = (email: string) =>
    sendPasswordResetEmail(auth, email);

  const register = async (name: string, email: string, password: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(res.user, { displayName: name });
    try {
      await sendEmailVerification(res.user);
    } catch {}
    const userRef = doc(db, "users", res.user.uid);
    await setDoc(userRef, { name, email, uid: res.user.uid, createdAt: serverTimestamp() });
  };

  const logout = () => signOut(auth);

  const signInWithGoogleToken = async (idToken: string) => {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    const u = result.user;
    const userRef = doc(db, "users", u.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        name: u.displayName,
        email: u.email,
        uid: u.uid,
        photoURL: u.photoURL,
        createdAt: serverTimestamp(),
      });
    }
  };

  const addGroup = async (name: string, memberEmails: string[]) => {
    if (!user) return;
    const memberUids = [user.uid];
    const emailsToFind = memberEmails || [];

    Object.values(usersMap).forEach((u) => {
      if (emailsToFind.includes(u.email) && !memberUids.includes(u.uid)) {
        memberUids.push(u.uid);
      }
    });

    const groupRef = await addDoc(collection(db, "groups"), {
      name,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      members: memberUids,
      memberEmails: [user.email, ...emailsToFind],
    });

    for (const email of emailsToFind) {
      const userExists = Object.values(usersMap).some((u) => u.email === email);
      if (!userExists) {
        await addDoc(collection(db, "mail"), {
          from: "noreply@balaconnect.com",
          to: email,
          message: {
            subject: `Invite to join ${name} on Trackcents`,
            html: `<h2>You've been invited!</h2><p>${user.displayName || user.email} has invited you to join the group <strong>${name}</strong> on Trackcents.</p><p>Trackcents helps you track and split expenses with friends easily.</p><a href="https://expense.balaconnect.com/signup" style="background:#2563eb;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;display:inline-block;margin-top:10px;">Sign Up Now</a>`,
          },
        }).catch(console.error);
      }
    }
  };

  const updateGroup = async (groupId: string, data: Partial<Group>) => {
    await updateDoc(doc(db, "groups", groupId), data as any);
  };

  const deleteGroup = async (groupId: string) => {
    const expSnap = await getDocs(
      query(collection(db, "expenses"), where("groupId", "==", groupId))
    );
    const setSnap = await getDocs(
      query(collection(db, "settlements"), where("groupId", "==", groupId))
    );
    const batch = writeBatch(db);
    expSnap.docs.forEach((d) => batch.delete(d.ref));
    setSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, "groups", groupId));
    await batch.commit();
  };

  const inviteToGroup = async (
    groupId: string,
    email: string,
    groupName: string
  ) => {
    if (!email || !user) return;
    const groupRef = doc(db, "groups", groupId);
    const existingUser = Object.values(usersMap).find((u) => u.email === email);

    if (existingUser) {
      await updateDoc(groupRef, {
        members: arrayUnion(existingUser.uid),
        memberEmails: arrayUnion(email),
      });
    } else {
      await updateDoc(groupRef, {
        memberEmails: arrayUnion(email),
      });
      await addDoc(collection(db, "mail"), {
        from: "noreply@balaconnect.com",
        to: email,
        message: {
          subject: `Invite to join ${groupName} on Trackcents`,
          html: `<h2>You've been invited!</h2><p>${user.displayName || user.email} has invited you to join <strong>${groupName}</strong> on Trackcents.</p><a href="https://expense.balaconnect.com/signup" style="background:#2563eb;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;display:inline-block;margin-top:10px;">Sign Up Now</a>`,
        },
      }).catch(console.error);
    }
  };

  const removeGroupMember = async (groupId: string, uid: string) => {
    const groupRef = doc(db, "groups", groupId);
    const userSnap = await getDoc(doc(db, "users", uid));
    const userEmail = userSnap.data()?.email;
    const updates: any = { members: arrayRemove(uid) };
    if (userEmail) updates.memberEmails = arrayRemove(userEmail);
    await updateDoc(groupRef, updates);
  };

  const updateUser = async (uid: string, data: Partial<AppUser>) => {
    await updateDoc(doc(db, "users", uid), data as any);
    if (user && user.uid === uid && data.name) {
      await updateProfile(user, { displayName: data.name });
    }
  };

  const addExpense = async (
    groupId: string,
    description: string,
    amount: number,
    date: string,
    paidBy: string,
    splitAmong: string[],
    splitType: "equal" | "percentage" = "equal",
    splitDetails: Record<string, number> = {},
    currency: string = "USD"
  ) => {
    await addDoc(collection(db, "expenses"), {
      groupId,
      description,
      amount: parseFloat(String(amount)),
      currency,
      paidBy,
      splitAmong,
      splitType,
      splitDetails,
      comments: [],
      date: date || new Date().toISOString().split("T")[0],
      createdAt: serverTimestamp(),
    });
  };

  const updateExpense = async (expenseId: string, data: Partial<Expense>) => {
    await updateDoc(doc(db, "expenses", expenseId), data as any);
  };

  const deleteExpense = async (expenseId: string) => {
    await deleteDoc(doc(db, "expenses", expenseId));
  };

  const addComment = async (expenseId: string, text: string) => {
    if (!user) return;
    const comment: Comment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      userName: user.displayName || user.email || "Unknown",
      text,
      createdAt: new Date().toISOString(),
    };
    await updateDoc(doc(db, "expenses", expenseId), {
      comments: arrayUnion(comment),
    });
  };

  const getGroupExpenses = (groupId: string) =>
    expenses.filter((e) => e.groupId === groupId);

  const getGroupSettlements = (groupId: string) =>
    settlements.filter((s) => s.groupId === groupId);

  const addSettlement = async (
    groupId: string,
    fromUid: string,
    toUid: string,
    amount: number,
    currency: string = "USD",
    date: string,
    note: string = ""
  ) => {
    if (!user) return;
    await addDoc(collection(db, "settlements"), {
      groupId,
      fromUid,
      toUid,
      amount: parseFloat(String(amount)),
      currency,
      date: date || new Date().toISOString().split("T")[0],
      note,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  const deleteSettlement = async (settlementId: string) => {
    await deleteDoc(doc(db, "settlements", settlementId));
  };

  const getGroupMembers = (groupId: string): AppUser[] => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return [];
    return group.members.map((uid) => ({
      uid,
      name: usersMap[uid]?.name || "Unknown",
      email: usersMap[uid]?.email || "",
      photoURL: usersMap[uid]?.photoURL,
    }));
  };

  const calculateBalance = (expensesList: Expense[], settlementsList: Settlement[] = []) => {
    if (!user) return 0;
    let totalPaid = 0;
    let totalShare = 0;
    expensesList.forEach((expense) => {
      if (expense.paidBy === user.uid) totalPaid += expense.amount;
      totalShare += getMemberShare(expense, user.uid);
    });
    let settlementAdjust = 0;
    settlementsList.forEach((s) => {
      if (s.fromUid === user.uid) settlementAdjust += s.amount;
      if (s.toUid === user.uid) settlementAdjust -= s.amount;
    });
    return totalPaid - totalShare + settlementAdjust;
  };

  const getGroupDebtsSummary = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return [];
    return getGroupDebts(
      getGroupExpenses(groupId),
      group.members,
      getGroupSettlements(groupId)
    );
  };

  const getUserBalance = () => calculateBalance(expenses, settlements);

  const getGroupUserBalance = (groupId: string) =>
    calculateBalance(
      expenses.filter((e) => e.groupId === groupId),
      settlements.filter((s) => s.groupId === groupId)
    );

  const getFriends = (): AppUser[] => {
    if (!user) return [];
    const friendIds = new Set<string>();
    groups.forEach((g) =>
      g.members?.forEach((m) => {
        if (m !== user.uid) friendIds.add(m);
      })
    );
    return Array.from(friendIds).map((uid) => ({
      uid,
      name: usersMap[uid]?.name || "Unknown",
      email: usersMap[uid]?.email || "",
      photoURL: usersMap[uid]?.photoURL,
    }));
  };

  const getFriendBalance = (friendUid: string): number => {
    if (!user) return 0;
    let balance = 0;
    expenses.forEach((expense) => {
      const splitCount = expense.splitAmong?.length || 1;
      const shareAmount = expense.amount / splitCount;

      if (expense.paidBy === user.uid && expense.splitAmong?.includes(friendUid)) {
        if (expense.splitType === "percentage" && expense.splitDetails) {
          balance += (expense.amount * (expense.splitDetails[friendUid] || 0)) / 100;
        } else {
          balance += shareAmount;
        }
      }

      if (expense.paidBy === friendUid && expense.splitAmong?.includes(user.uid)) {
        if (expense.splitType === "percentage" && expense.splitDetails) {
          balance -= (expense.amount * (expense.splitDetails[user.uid] || 0)) / 100;
        } else {
          balance -= shareAmount;
        }
      }
    });

    settlements.forEach((s) => {
      const isUserFrom = s.fromUid === user.uid && s.toUid === friendUid;
      const isUserTo = s.fromUid === friendUid && s.toUid === user.uid;
      if (isUserFrom || isUserTo) balance += s.amount;
    });

    return balance;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        appUser,
        groups,
        expenses,
        settlements,
        loading,
        dataLoading: !groupsLoaded || !expensesLoaded || !settlementsLoaded,
        login,
        register,
        logout,
        signInWithGoogle: signInWithGoogleToken,
        resetPassword,
        addGroup,
        updateGroup,
        deleteGroup,
        inviteToGroup,
        removeGroupMember,
        updateUser,
        addExpense,
        updateExpense,
        deleteExpense,
        addComment,
        getGroupExpenses,
        getGroupSettlements,
        getGroupMembers,
        getGroupDebtsSummary,
        addSettlement,
        deleteSettlement,
        getUserBalance,
        getGroupUserBalance,
        getFriends,
        getFriendBalance,
        users: Object.values(usersMap),
      }}
    >
      {!loading && children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
