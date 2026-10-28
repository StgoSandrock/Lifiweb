import type { Instrumentation } from "next";

// Log route templates and error digests, never request headers, bodies or personal data.
export const onRequestError: Instrumentation.onRequestError = (error, _request, context) => {
  const digest = error && typeof error === "object" && "digest" in error && typeof error.digest === "string" ? error.digest : undefined;
  console.error(JSON.stringify({ event: "lifiweb.request_error", route: context.routePath, type: context.routeType, digest }));
};
