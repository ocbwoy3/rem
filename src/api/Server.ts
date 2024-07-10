import express from "express";
import * as swagger from "swagger-ui-express";
import { loadLexicons, makeServer } from "./Networking/atproto";
const PORT = process.env.PORT || 2929;

export const app = express()


export function startApp() {
	
	loadLexicons()

	const xrpc_server = makeServer()
	app.use(xrpc_server.router)
	
	app.listen(PORT,async()=>{
		console.log(`[PrikolsHub/Server] Started express server at http://127.0.0.1:${PORT}`)
	})
}