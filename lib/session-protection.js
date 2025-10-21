const validSessions = new Map(); // sessionId -> { created, boxAccessed }

export function createBoxSession() {
  const sessionId = crypto.randomUUID();
  validSessions.set(sessionId, {
    created: Date.now(),
    boxAccessed: true,
  });

  // Clean up old sessions (older than 1 hour)
  const oneHour = 60 * 60 * 1000;
  for (const [id, session] of validSessions.entries()) {
    if (Date.now() - session.created > oneHour) {
      validSessions.delete(id);
    }
  }

  return sessionId;
}

export function validateBoxSession(sessionId) {
  if (!sessionId) return false;

  const session = validSessions.get(sessionId);
  if (!session || !session.boxAccessed) return false;

  // Session expires after 1 hour
  const oneHour = 60 * 60 * 1000;
  if (Date.now() - session.created > oneHour) {
    validSessions.delete(sessionId);
    return false;
  }

  return true;
}
