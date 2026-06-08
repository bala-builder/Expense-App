const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

exports.notifyOnExpenseCreated = onDocumentCreated('expenses/{expenseId}', async (event) => {
    const expense = event.data.data();
    const { groupId, description, amount, currency, paidBy, splitAmong } = expense;

    if (!splitAmong || !Array.isArray(splitAmong) || splitAmong.length === 0) return;

    const db = getFirestore();
    const messaging = getMessaging();

    // Get group name
    let groupName = 'your group';
    try {
        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (groupDoc.exists) groupName = groupDoc.data().name || groupName;
    } catch (e) {
        console.error('Failed to fetch group:', e);
    }

    // Get payer name
    let payerName = 'Someone';
    try {
        const payerDoc = await db.collection('users').doc(paidBy).get();
        if (payerDoc.exists) payerName = payerDoc.data().name || payerName;
    } catch (e) {
        console.error('Failed to fetch payer:', e);
    }

    // Notify all splitAmong members except the payer
    const recipientUids = splitAmong.filter(uid => uid !== paidBy);
    if (recipientUids.length === 0) return;

    // Fetch FCM tokens for all recipients
    const tokenDocs = await Promise.all(
        recipientUids.map(uid => db.collection('users').doc(uid).get())
    );

    const tokens = [];
    tokenDocs.forEach(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.fcmToken) tokens.push(data.fcmToken);
            if (Array.isArray(data.fcmTokens)) tokens.push(...data.fcmTokens);
        }
    });

    if (tokens.length === 0) {
        console.log('No FCM tokens found for recipients.');
        return;
    }

    const currencySymbol = { USD: '$', EUR: '€', GBP: '£', INR: '₹', CAD: 'CA$', AUD: 'A$' }[currency] || currency;
    const formattedAmount = `${currencySymbol}${parseFloat(amount).toFixed(2)}`;

    const message = {
        notification: {
            title: `New expense in ${groupName}`,
            body: `${payerName} added "${description}" for ${formattedAmount}`
        },
        data: {
            groupId: groupId || '',
            expenseId: event.params.expenseId || ''
        },
        tokens: [...new Set(tokens)]
    };

    try {
        const response = await messaging.sendEachForMulticast(message);
        console.log(`Sent ${response.successCount} notifications, ${response.failureCount} failed.`);

        // Clean up invalid tokens
        const invalidTokens = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                const code = resp.error?.code;
                if (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered') {
                    invalidTokens.push(message.tokens[idx]);
                }
            }
        });

        if (invalidTokens.length > 0) {
            console.log('Removing invalid tokens:', invalidTokens);
            const cleanupPromises = tokenDocs.map(async doc => {
                if (!doc.exists) return;
                const data = doc.data();
                let needsUpdate = false;
                const updates = {};

                if (data.fcmToken && invalidTokens.includes(data.fcmToken)) {
                    updates.fcmToken = null;
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
});
