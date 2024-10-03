import express, { response } from "express";
import * as swagger from "swagger-ui-express";
import * as config from "../../config.json"
import { loadLexicons, makeServer } from "./atproto/XRPCServer";
const PORT = process.env.PORT || 2929;

import FFlagDoc from "../fflag_doc.json";

import * as Sentry from "@sentry/node";
import { GetAllFFlags } from "./db/FFlags";
import { readFileSync } from "fs";
import { exec } from "child_process";
import { prisma } from "./db/Prisma";

export const app = express()
console.log(`[REM/Sentry] Set up Express error handler`)
Sentry.setupExpressErrorHandler(app)

app.get("/.well-known/atproto-did", async(req, res)=>{
	const handlematch = req.hostname.match(/^([a-zA-Z0-9_]+)/)?.[0] || "ocbwoy3.dev";
	// console.log(config.atproto_url.replace("*",handlematch))
	const did = await prisma.user.findFirst({
		where: {
			atprotoHandle: { equals: config.atproto_url.replace("*",handlematch) }
		}
	})
	if (!did) res.status(404).contentType("text/plain").send("User not found");
	res.contentType("text/plain").set('Cache-Control','no-store').send(did?.atprotoDid)
});

app.use((req, res, next) => {
	const userAgent: string = req.get('user-agent')?.toLowerCase() || "googlebot";
  
	res.set('Cache-Control','no-store')

	if (!userAgent.includes('googlebot')) {
		next();
	} else if (req.url === '/robots.txt') {
		next();
	} else {
		res.status(403).send('Forbidden');
	}
});

let cachedGitBranchName = "unknown";
let gitCommitHash = readFileSync(".git/ORIG_HEAD").toString().substring(0,8)

exec("git branch --show-current",(_,stdout:string)=>{
	cachedGitBranchName = stdout
})

app.get("/",(req,res)=>{
	res.send(`https://github.com/ocbwoy3/rem - ${cachedGitBranchName}@${gitCommitHash}`)
})

app.get("/robots.txt",(req,res)=>{
	res.contentType("text/plain").send("User-agent: *\nDisallow: /")
})

app.get("/api/fflags.json",async(req,res)=>{
	res.contentType("application/json").send(JSON.stringify(await GetAllFFlags(),null,4))
})

app.get("/api/fflag_doc.json",async(req,res)=>{
	res.contentType("application/json").send(JSON.stringify(FFlagDoc,null,4))
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