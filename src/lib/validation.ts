export type EventFormInput = {
  eventName: string;
  amount: string;
};

export type EventValidationResult = {
  fieldErrors: Partial<Record<keyof EventFormInput, string>>;
  parsedAmount: number | null;
};

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const VENMO_USERNAME_PATTERN = /^@?[A-Za-z0-9_-]{3,30}$/;

export function normalizeVenmoUsername(input: string): string {
  return input.trim().replace(/^@+/, "").toLowerCase();
}

export function validateEventForm(input: EventFormInput): EventValidationResult {
  const fieldErrors: Partial<Record<keyof EventFormInput, string>> = {};
  const eventName = input.eventName.trim();
  const rawAmount = input.amount.trim();

  if (!eventName) {
    fieldErrors.eventName = "Event name is required.";
  }

  let parsedAmount: number | null = null;

  if (!rawAmount) {
    fieldErrors.amount = "Amount is required.";
  } else if (!AMOUNT_PATTERN.test(rawAmount)) {
    fieldErrors.amount = "Amount must be a valid number with up to 2 decimals.";
  } else {
    parsedAmount = Number(rawAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      fieldErrors.amount = "Amount must be greater than 0.";
      parsedAmount = null;
    }
  }

  return {
    fieldErrors,
    parsedAmount,
  };
}

export function validateVenmoUsername(input: string): string | null {
  const trimmed = input.trim();

  if (!trimmed) {
    return "Venmo username is required.";
  }

  if (!VENMO_USERNAME_PATTERN.test(trimmed)) {
    return "Use 3-30 letters, numbers, underscores, or hyphens.";
  }

  return null;
}

export function validateParticipantName(name: string): string | null {
  if (!name.trim()) {
    return "Please enter your name.";
  }
  return null;
}
