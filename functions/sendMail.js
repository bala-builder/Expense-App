// Replacement for the deprecated "Trigger Email from Firestore" extension
// (firestore-send-email). Keeps the same document contract, so the web and
// mobile clients that write to the `mail` collection need no changes:
//   { from?, to, cc?, bcc?, replyTo?, message: { subject, html?, text? } }
// Delivery status is written back to `delivery` (PROCESSING/SUCCESS/ERROR).
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret, defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

const SMTP_URI = defineSecret('SMTP_URI'); // e.g. smtps://user:pass@smtp.example.com:465
const DEFAULT_FROM = defineString('MAIL_DEFAULT_FROM', { default: 'noreply@balaconnect.com' });

const FieldValue = admin.firestore.FieldValue;

exports.sendMail = onDocumentCreated(
    { document: 'mail/{mailId}', secrets: [SMTP_URI], region: 'us-central1', retry: false },
    async (event) => {
        const snap = event.data;
        if (!snap) return;
        const ref = snap.ref;
        const data = snap.data();

        // Claim the doc so retries / duplicate events never send twice.
        const claimed = await admin.firestore().runTransaction(async (tx) => {
            const cur = (await tx.get(ref)).data();
            const state = cur && cur.delivery && cur.delivery.state;
            if (state && state !== 'PENDING') return false;
            tx.update(ref, {
                delivery: { state: 'PROCESSING', attempts: FieldValue.increment(1), startTime: FieldValue.serverTimestamp() },
            });
            return true;
        });
        if (!claimed) return;

        try {
            if (!data.to || !data.message || !data.message.subject || !(data.message.html || data.message.text)) {
                throw new Error('Invalid mail doc: need `to` and message.subject + (html|text)');
            }
            const transport = nodemailer.createTransport(SMTP_URI.value());
            const info = await transport.sendMail({
                from: data.from || DEFAULT_FROM.value(),
                to: data.to,
                cc: data.cc,
                bcc: data.bcc,
                replyTo: data.replyTo,
                subject: data.message.subject,
                text: data.message.text,
                html: data.message.html,
            });
            console.log(`sendMail: sent ${ref.id} (accepted=${info.accepted.length}, rejected=${info.rejected.length})`);
            await ref.update({
                delivery: {
                    state: 'SUCCESS',
                    endTime: FieldValue.serverTimestamp(),
                    info: { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected },
                },
            });
        } catch (err) {
            console.error('sendMail failed:', err);
            await ref.update({
                delivery: { state: 'ERROR', endTime: FieldValue.serverTimestamp(), error: String(err.message || err) },
            });
        }
    }
);
