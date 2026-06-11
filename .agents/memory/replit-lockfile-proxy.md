---
name: Replit lockfile proxy issue
description: Firebase Functions Cloud Build fails when lockfiles generated in Replit are included in the deploy package.
---

Replit routes all npm/yarn installs through a local proxy (`package-firewall.replit.local`). Any lockfile (`package-lock.json` or `yarn.lock`) generated inside Replit embeds this hostname as the registry URL.

When Firebase Cloud Build tries to use that lockfile, it fails because `package-firewall.replit.local` is unreachable from Google's servers. The errors look like:
- npm: `Exit handler never called!` (Error ID: 7fa33aaa)
- yarn: `error Error: getaddrinfo ENOTFOUND package-firewall.replit.local`

**Why:** Lockfiles pin the registry URL, not just package versions.

**How to apply:** Before every `firebase deploy --only functions`, ensure the `functions/` directory has NO `package-lock.json` and NO `yarn.lock`. Delete them if present. Cloud Build will then do a clean `npm install` against the real npm registry and succeed.
