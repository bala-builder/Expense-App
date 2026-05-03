import React, { useState } from 'react';
import Papa from 'papaparse';
import { useApp } from '../context/AppContext';
import { db } from '../lib/firebase';

const SHALINI_EMAIL = 'sh2611trip@gmail.com';
const SHALINI_NAME = 'Shalini Tripathi';

export default function ImportData() {
    const { user } = useApp();
    const [groupsFile, setGroupsFile] = useState(null);
    const [expensesFile, setExpensesFile] = useState(null);
    const [groupIdsInput, setGroupIdsInput] = useState('2285531, 27787236, 32268278, 45984160, 68881530, 86985065, 90468517');
    const [status, setStatus] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const log = (msg) => {
        console.log(msg);
        setStatus(prev => prev + '\n' + msg);
    };

    const getOrCreateShalini = async () => {
        const snapshot = await db.collection('users').where('email', '==', SHALINI_EMAIL).get();
        if (!snapshot.empty) {
            log(`Found Shalini's user profile: ${snapshot.docs[0].id}`);
            return snapshot.docs[0].id;
        }

        const newUid = 'splitwise_shalini_' + Date.now();
        await db.collection('users').doc(newUid).set({
            name: SHALINI_NAME,
            email: SHALINI_EMAIL,
            uid: newUid,
            createdAt: new Date(),
            isImportedDummy: true
        });
        log(`Created new profile for Shalini with ID: ${newUid}`);
        return newUid;
    };

    const handleImport = async () => {
        if (!user) return alert("Must be logged in!");
        if (!groupsFile || !expensesFile) return alert("Please select both CSV files.");
        
        setIsImporting(true);
        setStatus('Starting import...');

        try {
            const shaliniUid = await getOrCreateShalini();
            const allowedGroupIds = groupIdsInput.split(',').map(s => s.trim()).filter(Boolean);

            // 1. Parse Groups
            const parsedGroupsData = await new Promise((resolve, reject) => {
                Papa.parse(groupsFile, {
                    header: true,
                    complete: (results) => resolve(results.data),
                    error: reject
                });
            });

            log(`Parsed ${parsedGroupsData.length} groups from CSV.`);
            
            const groupMap = {}; // oldId -> newId

            for (const row of parsedGroupsData) {
                const oldId = row['Group ID'];
                if (!oldId || !allowedGroupIds.includes(oldId)) continue;
                if (row['Group deleted at']) {
                    log(`Skipping deleted group: ${row['Name']}`);
                    continue;
                }

                log(`Importing group: ${row['Name']} (${oldId})`);
                const newGroupId = `sw_group_${oldId}`;
                await db.collection('groups').doc(newGroupId).set({
                    name: row['Name'],
                    createdBy: user.uid,
                    createdAt: new Date(row['Added to group'] || Date.now()),
                    members: [user.uid, shaliniUid],
                    memberEmails: [user.email, SHALINI_EMAIL],
                    importedFrom: 'splitwise',
                    splitwiseId: oldId
                }, { merge: true });
                groupMap[oldId] = newGroupId;
            }

            // 2. Parse Expenses
            const parsedExpensesData = await new Promise((resolve, reject) => {
                Papa.parse(expensesFile, {
                    header: true,
                    complete: (results) => resolve(results.data),
                    error: reject
                });
            });

            log(`Parsed ${parsedExpensesData.length} expenses from CSV.`);

            let importedCount = 0;
            const batchLimit = 400; // Firestore batch limit is 500
            let batch = db.batch();
            let batchCount = 0;

            for (const row of parsedExpensesData) {
                const oldGroupId = row['Group ID'];
                if (!oldGroupId || !allowedGroupIds.includes(oldGroupId)) continue;
                if (row['Deleted at']) continue;

                const newGroupId = groupMap[oldGroupId];
                if (!newGroupId) {
                    log(`Warning: Could not find new group ID for expense ${row['Description']}`);
                    continue;
                }

                const cost = parseFloat(row['Cost']);
                if (isNaN(cost) || cost === 0) continue;

                const yourPaid = parseFloat(row['Your paid share'] || 0);
                const yourOwed = parseFloat(row['Your owed share'] || 0);
                
                // Magic math to convert Splitwise multi-payer to Trackcents single-payer
                const actualImpact = yourPaid - yourOwed;
                
                let paidBy, yourAppAmount, shaliniAppAmount;

                if (actualImpact >= 0) {
                    // You are the payer
                    paidBy = user.uid;
                    yourAppAmount = cost - actualImpact;
                    shaliniAppAmount = actualImpact;
                } else {
                    // Shalini is the payer
                    paidBy = shaliniUid;
                    yourAppAmount = -actualImpact;
                    shaliniAppAmount = cost + actualImpact;
                }

                // Protect against division by zero just in case
                const yourPercentage = (yourAppAmount / cost) * 100 || 0;
                const shaliniPercentage = (shaliniAppAmount / cost) * 100 || 0;

                const expenseId = row['Expense ID'] || `sw_missing_id_${Date.now()}_${Math.random()}`;
                const expenseRef = db.collection('expenses').doc(`sw_expense_${expenseId}`);
                batch.set(expenseRef, {
                    groupId: newGroupId,
                    description: row['Description'],
                    amount: cost,
                    currency: row['Currency code'] || 'USD',
                    paidBy,
                    splitAmong: [user.uid, shaliniUid],
                    splitType: 'percentage',
                    splitDetails: {
                        [user.uid]: yourPercentage,
                        [shaliniUid]: shaliniPercentage
                    },
                    date: row['Date'] ? row['Date'].split(' ')[0] : new Date().toISOString().split('T')[0],
                    createdAt: new Date(row['Created at'] || Date.now()),
                    importedFrom: 'splitwise'
                }, { merge: true });

                batchCount++;
                importedCount++;

                if (batchCount >= batchLimit) {
                    await batch.commit();
                    log(`Committed batch of ${batchCount} expenses.`);
                    batch = db.batch();
                    batchCount = 0;
                }
            }

            if (batchCount > 0) {
                await batch.commit();
                log(`Committed final batch of ${batchCount} expenses.`);
            }

            log(`Import complete! Successfully imported ${importedCount} expenses.`);
            
        } catch (err) {
            console.error(err);
            log(`Error during import: ${err.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    const handleCleanup = async () => {
        if (!user) return alert("Must be logged in!");
        if (!window.confirm("Are you sure you want to delete ALL imported Splitwise data from the live database? This cannot be undone.")) return;

        setIsImporting(true);
        setStatus('Starting cleanup of imported data...');

        try {
            let deletedExpenses = 0;
            let deletedGroups = 0;
            let deletedUsers = 0;
            const batchLimit = 400;

            const deleteInBatches = async (snapshot, typeName) => {
                let currentBatch = db.batch();
                let count = 0;
                let totalDeleted = 0;
                
                for (const doc of snapshot.docs) {
                    currentBatch.delete(doc.ref);
                    count++;
                    totalDeleted++;

                    if (count >= batchLimit) {
                        await currentBatch.commit();
                        log(`Deleted batch of ${count} ${typeName}.`);
                        currentBatch = db.batch();
                        count = 0;
                    }
                }

                if (count > 0) {
                    await currentBatch.commit();
                    log(`Deleted final batch of ${count} ${typeName}.`);
                }
                return totalDeleted;
            };

            // 1. Delete Expenses
            const expensesSnapshot = await db.collection('expenses').where('importedFrom', '==', 'splitwise').get();
            if (!expensesSnapshot.empty) {
                deletedExpenses = await deleteInBatches(expensesSnapshot, 'imported expenses');
            } else {
                log('No imported expenses found.');
            }

            // 2. Delete Groups
            const groupsSnapshot = await db.collection('groups').where('importedFrom', '==', 'splitwise').get();
            if (!groupsSnapshot.empty) {
                deletedGroups = await deleteInBatches(groupsSnapshot, 'imported groups');
            } else {
                log('No imported groups found.');
            }

            // 3. Delete Dummy Users
            const usersSnapshot = await db.collection('users').where('isImportedDummy', '==', true).get();
            if (!usersSnapshot.empty) {
                deletedUsers = await deleteInBatches(usersSnapshot, 'dummy user profiles');
            } else {
                log('No dummy users found.');
            }

            setStatus(prev => prev + `\n\nCleanup complete! Deleted ${deletedExpenses} expenses, ${deletedGroups} groups, and ${deletedUsers} dummy users.`);

        } catch (err) {
            console.error(err);
            log(`Error during cleanup: ${err.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Import Splitwise Data</h1>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Shalini's Group IDs (comma separated)</label>
                        <textarea 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={groupIdsInput}
                            onChange={(e) => setGroupIdsInput(e.target.value)}
                            rows={3}
                        />
                        <p className="text-xs text-gray-500 mt-1">Only groups and expenses matching these Splitwise Group IDs will be imported.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">groups.csv</label>
                            <input 
                                type="file" 
                                accept=".csv"
                                onChange={(e) => setGroupsFile(e.target.files[0])}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">expenses.csv</label>
                            <input 
                                type="file" 
                                accept=".csv"
                                onChange={(e) => setExpensesFile(e.target.files[0])}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleImport}
                        disabled={isImporting || !groupsFile || !expensesFile}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50 transition-colors"
                    >
                        {isImporting ? 'Processing...' : 'Start Import'}
                    </button>

                    <div className="pt-6 border-t border-gray-200 mt-6">
                        <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
                        <p className="text-xs text-gray-500 mb-4">This will permanently delete all expenses, groups, and dummy users that were imported using this tool.</p>
                        <button 
                            onClick={handleCleanup}
                            disabled={isImporting}
                            className="w-full bg-white text-red-600 hover:bg-red-50 font-bold py-3 px-4 rounded-xl border border-red-200 disabled:opacity-50 transition-colors"
                        >
                            Delete Imported Data
                        </button>
                    </div>

                    {status && (
                        <div className="mt-6 p-4 bg-gray-900 rounded-lg overflow-x-auto">
                            <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono">
                                {status}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
