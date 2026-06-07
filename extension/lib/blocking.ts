// Site blocking during focus, via declarativeNetRequest dynamic rules.
// Only main-frame navigations to blocked domains are redirected to /blocked.html.

export const DEFAULT_BLOCKED = [
  "facebook.com",
  "youtube.com",
  "twitter.com",
  "x.com",
  "reddit.com",
  "instagram.com",
  "tiktok.com",
];

const KEY = "blockedSites";

export async function getBlockedSites(): Promise<string[]> {
  const { [KEY]: sites } = await chrome.storage.local.get(KEY);
  return Array.isArray(sites) && sites.length > 0 ? (sites as string[]) : DEFAULT_BLOCKED;
}

export async function setBlockedSites(sites: string[]): Promise<void> {
  await chrome.storage.local.set({ [KEY]: sites });
}

/** Turn blocking ON: redirect main-frame requests to blocked domains. */
export async function enableBlocking(): Promise<void> {
  const sites = await getBlockedSites();
  const existing = await chrome.declarativeNetRequest.getDynamicRules();

  const addRules: chrome.declarativeNetRequest.Rule[] = sites.map((domain, i) => ({
    id: i + 1,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: { extensionPath: "/blocked.html" },
    },
    condition: {
      requestDomains: [domain],
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules,
  });
}

/** Turn blocking OFF: remove all dynamic rules. */
export async function disableBlocking(): Promise<void> {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  if (existing.length === 0) return;
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: [],
  });
}
