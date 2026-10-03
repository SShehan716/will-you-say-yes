/** Logs the technical details for developers; users only ever see the friendly copy. */
export function reportError(context: string, err: unknown): void {
  console.error(`[say-yes] ${context}`, err);
}

export const GENERIC_ERROR = "Something went wrong. Please try again.";
