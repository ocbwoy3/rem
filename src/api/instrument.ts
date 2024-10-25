let integrations: any[] = [];

function instrument(sentry: any) {
	
	sentry.init({
		dsn: process.env.SENTRY_DSN,
		integrations: integrations,

		// Performance Monitoring
		tracesSampleRate: 1.0, //  Capture 100% of the transactions
	
		// Set sampling rate for profiling - this is relative to tracesSampleRate
		profilesSampleRate: 1.0,
	});
}

if (process.versions.bun) {
	instrument(require("@sentry/bun"))
} else {
	integrations.push(require("@sentry/profiling-node"))
	instrument(require("@sentry/node"))
}

console.log(`[REM/Sentry] Started Sentry error tracking`)