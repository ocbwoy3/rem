import express, { Request, response, Router } from "express";
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
import WebSocket, { AddressInfo, MessageEvent, Server } from "ws";
import expressWs, { Router as wsRouter } from "express-ws";
import { createServer } from "http";
import { isValidJwt } from "./atproto/JwtTokenHelper";
import { PDS_DID } from "./atproto/BlueskyHandleLinkingHelper";
import { REMGlobalEventsWS, SocketRecvMessageType, SocketSendMessageType } from "./RemUISocketHelper";

export const app = expressWs(express()).app;
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
	if (!did) {
		res.status(404).contentType("text/plain").send("User not found");
		return
	};
	res.contentType("text/plain").set('Cache-Control','no-store').send(did?.atprotoDid)
});

app.use((req, res, next) => {
	const userAgent: string = req.get('user-agent')?.toLowerCase() || "googlebot";
  
	// wtf is cors??????
	res.set('Access-Control-Allow-Origin','*')
	res.set('Access-Control-Allow-Headers','*')

 if (req.url.includes('com.atproto.sync.subscribeRepos')) {
    res.status(403).send('This is not an AT Protocol PDS!! Bluesky: @ocbwoy3.dev')
return;
  }

	if (!userAgent.includes('googlebot')) {
		next();
	} else if (req.url === '/robots.txt') {
		next();
	} else {
		res.set('Cache-Control','no-store').status(403).send('Forbidden');
	}
});

export let cachedGitBranchName = "unknown";
export let cachedGitCommitHash = "git";

exec("git branch --show-current",(_,stdout:string)=>{
	cachedGitBranchName = stdout.trim()
})

exec("git rev-parse --short HEAD",(_,stdout:string)=>{
	cachedGitCommitHash = stdout.trim()
})

app.get("/",(req,res)=>{
	res.contentType("text/plain").send(`rem ${cachedGitBranchName}@${cachedGitCommitHash} - https://github.com/ocbwoy3/rem

Most API routes are under /xrpc/`)
})

app.get("/robots.txt",(req,res)=>{
	res.set('Cache-Control','no-store').contentType("text/plain").send("User-agent: *\nDisallow: /")
})

app.get("/api/fflags.json",async(req,res)=>{
	res.set('Cache-Control','no-store').contentType("application/json").send(JSON.stringify(await GetAllFFlags(),null,4))
})

app.get("/api/fflag_doc.json",async(req,res)=>{
	res.set('Cache-Control','no-store').contentType("application/json").send(JSON.stringify(FFlagDoc,null,4))
})

const router = Router() as wsRouter;

router.ws("/remui/socket",async(ws: WebSocket, req: Request)=>{
	
	console.log(`[REM/Socket] New connection from ${req.socket.remoteAddress || req.socket.localAddress}`)

	if (!(req.headers.authorization || req.query.jwt)) {
		ws.close(1000,"Unauthorized");
		return;
	};

	const ownerDid = await isValidJwt(req.query.jwt as string);

	if (!ownerDid) {
		ws.close(1000,"Unauthorized - Invalid JWT, is it expired?");
		return;
	};
	
	console.log(`[REM/Socket] ${req.socket.remoteAddress || req.socket.localAddress} logged in as ${ownerDid}`)

	let acknowledged = false;
	let _res = (a:any)=>{}

	ws.onmessage = (me: MessageEvent) => {
		const msg = me.data.toString("utf-8");
		// console.log(msg) // TODO: RemUI framework
		try {
			const mt = msg.toString();
			if (mt.length > 25) return;
			const m = JSON.parse(mt);
			if (m.t === SocketRecvMessageType.ACK.valueOf()) {
				acknowledged = true;
				try { _res(true) } catch {};
				ws.send(JSON.stringify({
					t: SocketSendMessageType.ACK
				}))
			}	
		} catch(e_) {console.error(e_)};
	}

	await new Promise((resolve)=>{
		_res = resolve;
		setTimeout(() => { try { resolve(true) } catch {} }, 2000);
	});

	if (acknowledged === false) {
		ws.close(1000,"Did not acknowledge to connection.")
	}

	ws.send(JSON.stringify({
		t: SocketSendMessageType.WELCOME,
		c: {
			pds: PDS_DID,
			did: ownerDid
		}
	}));

	ws.send(JSON.stringify({
		t: SocketSendMessageType.MESSAGE,
		c: {
			user: "SYSTEM",
			id: 1,
			msg: `Welcome to this REM instance. You are connected to ${PDS_DID} as ${ownerDid}`,
			ji: "REM Global Chat"
		}
	}))

	const cb2 = (m:any)=>{
		ws.send(JSON.stringify(m))
	}

	REMGlobalEventsWS.on('send',cb2)

	const cb3 = ()=>{
		try { ws.close() } catch {};
		REMGlobalEventsWS.removeListener('send',cb2);
		REMGlobalEventsWS.removeListener('close',cb3);
	}

	ws.onclose = cb3;

	if (ws.readyState !== ws.OPEN) cb3();


})

app.use(router);

export function startApp() {
	
	console.log(`[REM/atproto] Loading atproto`)
	
	loadLexicons()

	const xrpc_server = makeServer()
	app.use(xrpc_server.router)
	
	app.listen(PORT,async()=>{
		console.log(`[REM/Server] Started express server at http://127.0.0.1:${PORT}`)
	})

}