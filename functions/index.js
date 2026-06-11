const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

console.log('onExpenseCreated function loaded successfully.');

exports.onExpenseCreated = functions.firestore
    .document('expenses/{expenseId}')
    .onCreate(async (snap, context) => {
        console.log('onExpenseCreated triggered. expenseId:', context.params.expenseId);

        const expense = snap.data();
        console.log('Expense data:', JSON.stringify({
            groupId: expense.groupId,
            paidBy: expense.paidBy,
            splitAmong: expense.splitAmong,
            description: expense.description,
            amount: expense.amount
        }));

        const { groupId, description, amount, currency, paidBy, splitAmong } = expense;

        if (!splitAmong || !Array.isArray(splitAmong) || splitAmong.length === 0) {
            console.log('No splitAmong field or empty array. Skipping.');
            return null;
        }

        const db = admin.firestore();
        const messaging = admin.messaging();

        let groupName = 'your group';
        try {
            const groupDoc = await db.collection('groups').doc(groupId).get();
            if (groupDoc.exists) groupName = groupDoc.data().name || groupName;
        } catch (e) {
            console.error('Failed to fetch group:', e);
        }

        let payerName = 'Someone';
        try {
            const payerDoc = await db.collection('users').doc(paidBy).get();
            if (payerDoc.exists) payerName = payerDoc.data().name || payerName;
        } catch (e) {
            console.error('Failed to fetch payer:', e);
        }

        const recipientUids = splitAmong.filter(uid => uid !== paidBy);
        console.log('Recipients:', recipientUids);

        if (recipientUids.length === 0) {
            console.log('No recipients (payer is the only member). Skipping.');
            return null;
        }

        const tokenDocs = await Promise.all(
            recipientUids.map(uid => db.collection('users').doc(uid).get())
        );

        const tokens = [];
        tokenDocs.forEach(doc => {
            if (doc.exists) {
                const data = doc.data();
                console.log('User', doc.id, 'fcmToken:', !!data.fcmToken, 'fcmTokens count:', Array.isArray(data.fcmTokens) ? data.fcmTokens.length : 0);
                if (data.fcmToken) tokens.push(data.fcmToken);
                if (Array.isArray(data.fcmTokens)) tokens.push(...data.fcmTokens);
            } else {
                console.log('User doc not found for uid:', doc.id);
            }
        });

        if (tokens.length === 0) {
            console.log('No FCM tokens found for any recipient. Notification not sent.');
            return null;
        }

        const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹', CAD: 'CA$', AUD: 'A$' };
        const symbol = symbols[currency] || currency || '$';
        const formattedAmount = `${symbol}${parseFloat(amount).toFixed(2)}`;

        const uniqueTokens = [...new Set(tokens)];
        console.log('Sending to', uniqueTokens.length, 'token(s).');

        const message = {
            notification: {
                title: `New expense in ${groupName}`,
                body: `${payerName} added "${description}" for ${formattedAmount}`
            },
            data: {
                groupId: groupId || '',
                expenseId: context.params.expenseId || ''
            },
            tokens: uniqueTokens
        };

        try {
            const response = await messaging.sendEachForMulticast(message);
            console.log(`Sent ${response.successCount} notifications, ${response.failureCount} failed.`);

            const invalidTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.log('Failed token at index', idx, ':', resp.error && resp.error.code);
                    const code = resp.error && resp.error.code;
                    if (
                        code === 'messaging/invalid-registration-token' ||
                        code === 'messaging/registration-token-not-registered'
                    ) {
                        invalidTokens.push(uniqueTokens[idx]);
                    }
                }
            });

            if (invalidTokens.length > 0) {
                console.log('Cleaning up', invalidTokens.length, 'invalid token(s).');
                const cleanupPromises = tokenDocs.map(async doc => {
                    if (!doc.exists) return;
                    const data = doc.data();
                    const updates = {};
                    let needsUpdate = false;

                    if (data.fcmToken && invalidTokens.includes(data.fcmToken)) {
                        updates.fcmToken = admin.firestore.FieldValue.delete();
                        needsUpdate = true;
                    }
                    if (Array.isArray(data.fcmTokens)) {
                        const cleaned = data.fcmTokens.filter(t => !invalidTokens.includes(t));
                        if (cleaned.length !== data.fcmTokens.length) {
                            updates.fcmTokens = cleaned;
                            needsUpdate = true;
                        }
                    }
                    if (needsUpdate) await doc.ref.update(updates);
                });
                await Promise.all(cleanupPromises);
            }
        } catch (err) {
            console.error('Error sending notifications:', err);
        }

        return null;
    });
