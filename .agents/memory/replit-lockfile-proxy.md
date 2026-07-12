---
name: Replit lockfile proxy issue
description: Replit's npm proxy breaks external cloud builds — covers Firebase Cloud Build and EAS Build.
---

Replit routes all npm/yarn installs through a local proxy (`package-firewall.replit.local`). Any lockfile (`package-lock.json` or `yarn.lock`) generated inside Replit embeds this hostname as the registry URL. External cloud build servers cannot reach this proxy, so they fail.

The proxy intercepts at the system/network level — even `npm install --registry https://registry.npmjs.org` still produces tainted lockfiles.

Check for contamination: `grep -c "package-firewall.replit.local" package-lock.json` — if count > 0, the file is tainted.

**Firebase Cloud Build fix:** Delete `functions/package-lock.json` and `functions/yarn.lock` before every `firebase deploy --only functions`. Cloud Build will do a clean install from the real registry.

**EAS Build (Expo) fix:**
1. Delete the tainted lockfile: `rm mobile/package-lock.json`
2. Add `package-lock.json` to `mobile/.gitignore` so it never gets committed
3. Add `"EAS_BUILD_SKIP_LOCKFILE_CHECK": "1"` to the `env` block of every profile in `eas.json` — EAS's clean servers will run `npm install` against the public registry without needing a lockfile
