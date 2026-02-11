const STORAGE_KEY = "vensoc_guest_identity_key";

function createGuestIdentityKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `guest_${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreateGuestIdentityKey(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const next = createGuestIdentityKey();
  window.localStorage.setItem(STORAGE_KEY, next);
  return next;
}
