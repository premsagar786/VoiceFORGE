/** Error with an HTTP status attached — understood by the central error handler. */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = "http_error",
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const badRequest = (message: string) => new HttpError(400, message, "bad_request");
export const unauthorized = (message = "Authentication required") =>
  new HttpError(401, message, "unauthorized");
export const forbidden = (message = "Forbidden") => new HttpError(403, message, "forbidden");
/** Workspace isolation: cross-workspace access must look like a missing resource. */
export const notFound = (message = "Not found") => new HttpError(404, message, "not_found");
export const tooManyRequests = (message = "Rate limit exceeded") =>
  new HttpError(429, message, "rate_limited");
export const serviceUnavailable = (message: string) =>
  new HttpError(503, message, "service_unavailable");
