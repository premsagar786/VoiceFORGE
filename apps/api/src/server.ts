import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { getEnv } from "./env.js";
import { envWarnings } from "./env.js";
import { HttpError } from "./lib/errors.js";
import { prisma } from "./lib/db.js";
import { logger } from "./lib/logger.js";

export async function buildApp(): Promise<FastifyInstance> {
  const env = getEnv();

  const app = Fastify({ loggerInstance: logger });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: env.corsOrigins, credentials: true });
  await app.register(cookie, { secret: env.SESSION_SECRET });

  app.get("/health", async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      app.log.error({ err }, "health check: database unreachable");
      return reply.code(503).send({ ok: false, service: "voiceforge-api", db: "down" });
    }
    return { ok: true, service: "voiceforge-api", db: "up", env: env.NODE_ENV };
  });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof HttpError) {
      return reply
        .code(err.statusCode)
        .send({ error: { code: err.code, message: err.message } });
    }
    const status = typeof err.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 600
      ? err.statusCode
      : 500;
    if (status >= 500) {
      app.log.error({ err }, "unhandled error");
      return reply
        .code(500)
        .send({ error: { code: "internal_error", message: "Internal server error" } });
    }
    return reply
      .code(status)
      .send({ error: { code: "request_error", message: err.message } });
  });

  return app;
}

// Listen only when run directly (not imported by tests).
if (!process.env.VOICEFORGE_NO_LISTEN) {
  const env = getEnv();
  for (const warning of envWarnings(env)) {
    logger.warn(warning);
  }

  const app = await buildApp();
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  logger.info(`voiceforge api listening on ${env.API_URL} (web: ${env.APP_URL})`);
}
