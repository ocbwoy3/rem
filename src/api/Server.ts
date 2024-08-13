import express from "express";
import * as swagger from "swagger-ui-express";
import { loadLexicons, makeServer } from "./atproto/XRPCServer";
const PORT = process.env.PORT || 2929;

import * as Sentry from "@sentry/node";

export const app = express()
console.log(`[REM/Sentry] Set up Express error handler.`)
Sentry.setupExpressErrorHandler(app)

/*
app.get("/debug-sentry", function mainHandler(req, res) {
	throw new Error("My first Sentry error!");
});
*/

app.get("/",function(req,res) {
	res.send("Most API routes are avaiable under /xrpc/")
})

export function startApp() {
	
	console.log(`[REM/atproto] Loading atproto`)
	
	loadLexicons()

	const xrpc_server = makeServer()
	app.use(xrpc_server.router)
	
	app.listen(PORT,async()=>{
		console.log(`[REM/Server] Started express server at http://127.0.0.1:${PORT}`)
	})
}