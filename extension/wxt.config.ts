import { defineConfig } from "wxt";

// WXT config: builds a Manifest V3 extension with React.
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "FocusFlow Pomodoro",
    description:
      "Pomodoro timer that runs in the background, blocks distracting sites during focus, and syncs to your FocusFlow account.",
    permissions: [
      "storage", // persist timer state + token
      "alarms", // background countdown (survives service-worker sleep)
      "notifications", // phase-complete alerts
      "declarativeNetRequest", // block distracting sites during focus (Phase 6.6)
    ],
    host_permissions: [
      "https://pomodoro.marklu.page/*",
      // Needed so declarativeNetRequest can REDIRECT these domains during focus.
      "*://*.facebook.com/*",
      "*://*.youtube.com/*",
      "*://*.twitter.com/*",
      "*://*.x.com/*",
      "*://*.reddit.com/*",
      "*://*.instagram.com/*",
      "*://*.tiktok.com/*",
    ],
    // The redirect target (focus page) must be web-accessible.
    web_accessible_resources: [
      { resources: ["blocked.html"], matches: ["<all_urls>"] },
    ],
    icons: {
      16: "/icon/16.png",
      32: "/icon/32.png",
      48: "/icon/48.png",
      128: "/icon/128.png",
    },
  },
});
