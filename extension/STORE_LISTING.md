# Chrome Web Store — submission guide & listing copy

Build artifact to upload: `extension/.output/pomodoro-extension-<version>-chrome.zip`
(regenerate with `npm run zip` inside `extension/`).

---

## Store listing copy

**Name:** FocusFlow Pomodoro

**Summary (≤132 chars):**
> A Pomodoro timer that runs in the background, blocks distracting sites while you focus, and syncs your sessions to FocusFlow.

**Category:** Productivity
**Language:** English

**Description:**
```
FocusFlow Pomodoro keeps you in deep work.

• Background timer — the countdown keeps running even when the popup is closed,
  with a live minute badge on the toolbar and a notification when each period ends.
• Focus-mode site blocking — distracting sites (social, video, etc.) are
  redirected to a "stay focused" page while you're in a focus session, and
  unblocked automatically on breaks.
• Synced to your account — completed sessions are saved to your FocusFlow
  account so your stats and streaks stay in sync with the web app. Works
  offline too: sessions are queued and sent when you reconnect.
• Customisable — set your own focus/break lengths and your own block list.

Sign in with your FocusFlow account (create one free at pomodoro.marklu.page).
```

**Privacy policy URL:** _host `PRIVACY.md` somewhere public and paste the URL_
(e.g. add a `/privacy` page on pomodoro.marklu.page, or use a GitHub Pages /
gist URL).

---

## Permission justifications (the store asks for each)
- **storage** — persist timer state, auth token, and user settings locally.
- **alarms** — drive the background countdown reliably (MV3 service workers sleep).
- **notifications** — notify the user when a focus/break period ends.
- **declarativeNetRequest** — block distracting sites during focus, locally.
- **host permissions (social/video domains)** — required to redirect those sites
  to a focus page while focusing. No browsing data is read or sent.
- **host permission (pomodoro.marklu.page)** — call the FocusFlow API for
  login + saving sessions.

**Single purpose:** A Pomodoro focus timer with optional focus-time site blocking.

**Remote code:** None. All code is bundled in the package.

**Data usage (disclosure form):**
- Authentication info (email/password) — used for sign-in, sent to the developer's
  own server over HTTPS. Not sold, not used for tracking.
- App activity (focus sessions) — used to provide stats. Not sold.

---

## Assets needed before submitting
- [x] Icon 128×128 (included).
- [ ] At least 1 screenshot, 1280×800 or 640×400 (popup + a blocked page look great).
- [ ] (Optional) Small promo tile 440×280.
- [ ] Privacy policy hosted at a public URL.

## Submission steps
1. Create a Chrome Web Store developer account ($5 one-time) at
   https://chrome.google.com/webstore/devconsole
2. "New item" → upload the `*-chrome.zip`.
3. Fill in the listing (copy above), category, language, screenshots.
4. Fill the privacy/permissions/data-usage forms (justifications above) and the
   privacy policy URL.
5. Submit for review (typically a few days).

> Note: the broad social-domain host permissions can lengthen review. If it gets
> flagged, an alternative is to switch site-blocking from "redirect" to "block"
> action, which doesn't require those host permissions.
