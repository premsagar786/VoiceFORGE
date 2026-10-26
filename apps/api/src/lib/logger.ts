import { pino } from "pino";

// Redact contact details and credentials from structured logs (feature spec #11).
// Free-text transcript redaction is handled where transcripts are stored.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.phone",
      "*.phoneNumber",
      "*.callerNumber",
      "*.email",
      "*.password",
      "*.passwordHash",
    ],
    censor: "[redacted]",
  },
});
