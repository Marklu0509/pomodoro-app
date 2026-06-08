# Privacy Policy — FocusFlow Pomodoro (Chrome Extension)

_Last updated: 2026-06-08_

FocusFlow Pomodoro ("the extension") helps you run Pomodoro focus sessions,
optionally block distracting sites during focus, and sync your sessions to your
FocusFlow account.

## What we collect
- **Account credentials**: when you sign in, your email and password are sent
  over HTTPS to the FocusFlow backend (`https://pomodoro.marklu.page`) solely to
  authenticate you. The extension does **not** store your password.
- **Authentication token**: a JWT returned after login is stored locally in
  `chrome.storage.local` so you stay signed in. It never leaves your browser
  except as the `Authorization` header on requests to the FocusFlow API.
- **Focus session data**: when a focus session completes, its duration (and the
  optional linked task id) is sent to the FocusFlow API to power your stats.
- **Local settings**: your timer durations and blocked-site list are stored
  locally in `chrome.storage.local`.

## What we do NOT do
- We do **not** collect, store, or transmit your browsing history.
- The site-blocking feature uses Chrome's `declarativeNetRequest` rules locally
  in your browser; the list of sites you visit is never sent anywhere.
- We do **not** sell or share your data with third parties.
- We do **not** use analytics or advertising trackers.

## Data storage & retention
- Account and session data is stored on the FocusFlow server you authenticate
  against. You can delete your tasks/sessions from the web app.
- Local data (token, settings) is removed when you log out or uninstall the
  extension.

## Permissions and why they are needed
- `storage` — save your timer state, token, and settings locally.
- `alarms` — keep the countdown running in the background.
- `notifications` — alert you when a focus or break period ends.
- `declarativeNetRequest` — block distracting sites during focus (locally).
- Host access to a small set of social/video domains — required so the extension
  can redirect those sites to a "focus mode" page while you're focusing.
- Host access to `pomodoro.marklu.page` — to call the FocusFlow API.

## Contact
Questions: marklu0509@gmail.com
