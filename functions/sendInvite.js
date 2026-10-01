// Callable used by the web and mobile apps to invite someone to a group by
// email. Clients can no longer write to the `mail` collection directly: this
// function checks the caller belongs to the group, rate-limits them, builds
// the email itself (group/sender names HTML-escaped) and enqueues it for
// the sendMail function.
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

const FROM = 'noreply@balaconnect.com';
const SIGNUP_URL = 'https://expense.balaconnect.com/signup';
const MAX_INVITES_PER_HOUR = 30;
const EMAIL_RE = /^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$/;

const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

exports.sendInvite = onCall({ region: 'us-central1' }, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
    const uid = request.auth.uid;
    const { groupId } = request.data || {};
    const email = String((request.data || {}).email || '').trim().toLowerCase();

    if (typeof groupId !== 'string' || !groupId) throw new HttpsError('invalid-argument', 'groupId required.');
    if (email.length > 254 || !EMAIL_RE.test(email)) throw new HttpsError('invalid-argument', 'Invalid email.');

    const db = admin.firestore();
    const groupSnap = await db.collection('groups').doc(groupId).get();
    if (!groupSnap.exists) throw new HttpsError('not-found', 'Group not found.');
    const group = groupSnap.data();
    if (!Array.isArray(group.members) || !group.members.includes(uid)) {
        throw new HttpsError('permission-denied', 'You are not a member of this group.');
    }
    const listed = (group.memberEmails || []).map((e) => String(e).toLowerCase());
    if (!listed.includes(email)) {
        throw new HttpsError('failed-precondition', 'Add the email to the group before inviting.');
    }

    // Fixed-window rate limit per caller.
    const quotaRef = db.collection('inviteQuota').doc(uid);
    const now = Date.now();
    await db.runTransaction(async (tx) => {
        const q = (await tx.get(quotaRef)).data() || {};
        const fresh = !q.windowStart || now - q.windowStart > 3600 * 1000;
        const count = fresh ? 0 : q.count;
        if (count >= MAX_INVITES_PER_HOUR) {
            throw new HttpsError('resource-exhausted', 'Too many invites. Try again later.');
        }
        tx.set(quotaRef, { windowStart: fresh ? now : q.windowStart, count: count + 1 });
    });

    let senderName = request.auth.token.name || request.auth.token.email || 'A friend';
    try {
        const u = await db.collection('users').doc(uid).get();
        if (u.exists && u.data().name) senderName = u.data().name;
    } catch (e) {
        console.error('sender lookup failed:', e);
    }

    const groupName = String(group.name || 'a group').slice(0, 100);
    await db.collection('mail').add({
        from: FROM,
        to: email,
        invitedBy: uid,
        message: {
            subject: `Invite to join ${groupName} on Trackcents`.slice(0, 200),
            html:
                `<h2>You've been invited!</h2>` +
                `<p>${esc(senderName)} has invited you to join the group <strong>${esc(groupName)}</strong> on Trackcents.</p>` +
                `<p>Trackcents helps you track and split expenses with friends easily.</p>` +
                `<a href="${SIGNUP_URL}" style="background:#2563eb;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;display:inline-block;margin-top:10px;">Sign Up Now</a>`,
        },
    });
    return { ok: true };
});
