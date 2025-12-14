// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
  dsn: "https://5d020cc51f7da6aee6e9875141c25b38@o4510534800375808.ingest.de.sentry.io/4510534847627344",
  integrations: [
    nodeProfilingIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
  
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Ignore operational errors (4xx) like Validation, Duplicate Key, Not Found
    if (error && error.statusCode && error.statusCode < 500) {
      return null;
    }
    
    return event;
  },
});
