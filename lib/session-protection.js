import crypto from "crypto";

const validSessions = new Map(); // sessionId -> { created, boxAccessed }
const SECRET_KEY = process.env.SECRET_ADMIN_PASSWORD || "fallback-secret-key";

// Generate HMAC signature for session validation
function generateSessionSignature(sessionId, timestamp) {
  const message = `${sessionId}:${timestamp}:${SECRET_KEY}`;
  return crypto.createHmac("sha256", SECRET_KEY).update(message).digest("hex");
}

// Verify session signature
function verifySessionSignature(sessionId, timestamp, signature) {
  const expected = generateSessionSignature(sessionId, timestamp);
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex")
  );
}

export function createBoxSession() {
  const sessionId = crypto.randomUUID();
  const timestamp = Date.now();
  const signature = generateSessionSignature(sessionId, timestamp);

  // Store session data
  validSessions.set(sessionId, {
    created: timestamp,
    boxAccessed: true,
    signature: signature,
  });

  // Clean up old sessions (older than 1 hour)
  const oneHour = 60 * 60 * 1000;
  for (const [id, session] of validSessions.entries()) {
    if (Date.now() - session.created > oneHour) {
      validSessions.delete(id);
    }
  }

  // Return signed token: sessionId:timestamp:signature
  return `${sessionId}:${timestamp}:${signature}`;
}

export function validateBoxSession(signedToken) {
  if (!signedToken) return false;

  try {
    // Parse the signed token
    const parts = signedToken.split(":");
    if (parts.length !== 3) return false;

    const [sessionId, timestamp, signature] = parts;

    // Verify signature first (prevents tampering)
    if (!verifySessionSignature(sessionId, parseInt(timestamp), signature)) {
      return false;
    }

    // Check if session exists in memory
    const session = validSessions.get(sessionId);
    if (!session || !session.boxAccessed) return false;

    // Verify stored signature matches
    if (session.signature !== signature) return false;

    // Session expires after 1 hour
    const oneHour = 60 * 60 * 1000;
    const sessionTime = parseInt(timestamp);
    if (Date.now() - sessionTime > oneHour) {
      validSessions.delete(sessionId);
      return false;
    }

    // Verify timestamp matches stored session
    if (session.created !== sessionTime) return false;

    return true;
  } catch (error) {
    return false;
  }
}

// Optional: Function to validate admin password and create session
export function validateAdminAccess(password) {
  return password === SECRET_KEY;
}
