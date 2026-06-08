// frontend/app/privacy/page.tsx
// Public privacy policy (no auth) — used as the Chrome Web Store privacy URL.

export const metadata = {
  title: "Privacy Policy — FocusFlow",
  description: "Privacy policy for the FocusFlow Pomodoro app and browser extension.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-slate-700 dark:text-slate-200">
      <h1 className="text-3xl font-display font-semibold text-slate-900 dark:text-white">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: 2026-06-08</p>

      <p className="mt-6 leading-relaxed">
        FocusFlow Pomodoro (the “app” and “extension”) helps you run Pomodoro
        focus sessions, optionally block distracting sites during focus, and sync
        your sessions to your FocusFlow account.
      </p>

      <Section title="What we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account credentials</strong>: when you sign in, your email and
            password are sent over HTTPS to the FocusFlow backend solely to
            authenticate you. We do not store your password.
          </li>
          <li>
            <strong>Authentication token</strong>: a JWT returned after login is
            stored locally (browser storage) so you stay signed in. It is only
            sent as the authorization header to the FocusFlow API.
          </li>
          <li>
            <strong>Focus session data</strong>: when a session completes, its
            duration and optional linked task id are sent to the API to power your
            stats.
          </li>
          <li>
            <strong>Local settings</strong>: timer durations and your blocked-site
            list are stored locally in the extension.
          </li>
        </ul>
      </Section>

      <Section title="What we do NOT do">
        <ul className="list-disc space-y-2 pl-5">
          <li>We do not collect, store, or transmit your browsing history.</li>
          <li>
            Site blocking uses Chrome’s declarativeNetRequest rules locally; the
            sites you visit are never sent anywhere.
          </li>
          <li>We do not sell or share your data with third parties.</li>
          <li>We do not use analytics or advertising trackers.</li>
        </ul>
      </Section>

      <Section title="Data storage & retention">
        <p className="leading-relaxed">
          Account and session data is stored on the FocusFlow server you
          authenticate against; you can delete your tasks and sessions from the
          web app. Local data (token, settings) is removed when you log out or
          uninstall the extension.
        </p>
      </Section>

      <Section title="Permissions (extension)">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>storage</strong> — save timer state, token, and settings locally.</li>
          <li><strong>alarms</strong> — keep the countdown running in the background.</li>
          <li><strong>notifications</strong> — alert you when a period ends.</li>
          <li><strong>declarativeNetRequest</strong> — block distracting sites during focus (locally).</li>
          <li>Host access to a small set of social/video domains — to redirect them to a focus page while focusing.</li>
          <li>Host access to the FocusFlow API — for login and saving sessions.</li>
        </ul>
      </Section>

      <Section title="Contact">
        <p>
          Questions:{" "}
          <a className="underline" href="mailto:marklu0509@gmail.com">
            marklu0509@gmail.com
          </a>
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>
      <div className="mt-3 leading-relaxed">{children}</div>
    </section>
  );
}
