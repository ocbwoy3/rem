import express from "express";
import * as swagger from "swagger-ui-express";
import { loadLexicons, makeServer } from "./atproto/XRPCServer";
const PORT = process.env.PORT || 2929;

import FFlagDoc from "../fflag_doc.json";

import * as Sentry from "@sentry/node";
import { GetAllFFlags } from "./db/FFlags";

export const app = express()
console.log(`[REM/Sentry] Set up Express error handler`)
Sentry.setupExpressErrorHandler(app)

/*
app.get("/debug-sentry", function mainHandler(req, res) {
	throw new Error("My first Sentry error!");
});
*/

app.get("/",function(req,res) {
	res.send("REM - Remote Admin\nMost API routes are avaiable under /xrpc/")
})

app.get("/api/fflags.json",async function(req,res) {
	res.send(JSON.stringify(await GetAllFFlags(),null,4))
})

app.get("/api/fflag_doc.json",async function(req,res) {
	res.send(JSON.stringify(FFlagDoc,null,4))
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