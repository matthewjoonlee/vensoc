const VENMO_BASE_URL = "https://venmo.com";

export function buildVenmoNote(eventName: string): string {
  return `${eventName.trim()}-via.Vensoc`;
}

export function buildVenmoPayLink(params: {
  organizerVenmoUsername: string;
  amount: number;
  eventName: string;
}): string {
  const username = params.organizerVenmoUsername.trim().replace(/^@+/, "");
  const url = new URL(`/${username}`, VENMO_BASE_URL);
  url.searchParams.set("txn", "pay");
  url.searchParams.set("amount", params.amount.toFixed(2));
  url.searchParams.set("note", buildVenmoNote(params.eventName));
  return url.toString();
}
