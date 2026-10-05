/**
 * Turn what the network or database says into words an Admin can act on.
 * Messages our own database rules raise ("That month is closed...") are already
 * written for people, so anything not recognised passes through unchanged.
 */
export function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (/jwt|token.*(expired|invalid)|not authenticated|invalid claim|refresh token/.test(m)) {
    return "Your session has ended. Please sign in again.";
  }
  if (/failed to fetch|networkerror|network request failed|load failed|fetch failed|timeout|timed out/.test(m)) {
    return "No connection. Check your internet and try again.";
  }
  if (/permission denied|row-level security|violates row-level/.test(m)) {
    return "You don’t have access to do that. If your access was removed, ask an Admin to approve your email again.";
  }
  if (/employees_enrollment_no_key/.test(m)) return "Another employee already has that enrollment number.";
  return message;
}
