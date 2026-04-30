import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_BLOCKED_DOMAINS, BLOCKED_KEYWORDS } from "../constants/blocklist";

const STORAGE_KEY = "guardian_blocked_domains";

/** Loads blocked domains from storage (initialises with defaults on first run). */
export async function getBlockedDomains(): Promise<string[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BLOCKED_DOMAINS));
  return DEFAULT_BLOCKED_DOMAINS;
}

/** Adds a domain to the blocked list. Cleans protocol/www/path automatically. */
export async function addDomain(raw: string): Promise<string[]> {
  const cleaned = raw
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .trim();
  if (!cleaned) return getBlockedDomains();
  const domains = await getBlockedDomains();
  if (!domains.includes(cleaned)) {
    const updated = [...domains, cleaned];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
  return domains;
}

/** Removes a domain from the blocked list. */
export async function removeDomain(domain: string): Promise<string[]> {
  const domains = await getBlockedDomains();
  const updated = domains.filter((d) => d !== domain);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/** Resets the blocked list back to the built-in defaults. */
export async function resetToDefaults(): Promise<string[]> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BLOCKED_DOMAINS));
  return DEFAULT_BLOCKED_DOMAINS;
}

/**
 * Returns true if the given URL should be blocked.
 * Checks both the explicit domain list AND keyword patterns in the URL.
 */
export function isDomainBlocked(url: string, blockedList: string[]): boolean {
  const lower = url.toLowerCase();
  // Domain match
  if (blockedList.some((domain) => lower.includes(domain))) return true;
  // Keyword match in URL path/query
  if (BLOCKED_KEYWORDS.some((kw) => lower.includes(kw))) return true;
  return false;
}

/**
 * Returns true if the URL appears to be an incognito / private-mode page.
 * (Chrome for Android opens chrome://newtab?incognito=true in incognito tabs)
 */
export function isIncognitoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("incognito=true") ||
    lower.includes("incognito") ||
    lower.includes("private") ||
    lower.startsWith("chrome-extension://") ||
    lower.startsWith("about:blank")
  );
}
