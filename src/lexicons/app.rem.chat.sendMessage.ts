import { LexiconDoc } from '@atproto/lexicon'
import { XRPCContext } from '../api/Types'
import { registerLexicon } from '../api/atproto/LexiconRegistrate'
import { REMRuntime, getGlobalRuntime } from '../api/REMCore'
import { Session } from '../api/Session'
import { readFile } from 'fs/promises'
import { GetFFlag } from '../api/db/FFlags'

const lexicon: LexiconDoc = {
	lexicon: 1,
	id: 'app.rem.chat.sendMessage',
	defs: {
		main: {
			type: 'procedure',
			parameters: {
				type: 'params',
				properties: {},
			},
			input: {
				encoding: 'text/plain'
			},
			output: {
				encoding: 'application/json'
			}
		},
	},
}

const runtime: REMRuntime = (getGlobalRuntime() as REMRuntime)

import * as config from "../../config.json";
import { isValidJwt } from '../api/atproto/JwtTokenHelper'
import { prisma } from '../api/db/Prisma'
import { EmitWSEvent, SocketSendMessageType } from '../api/RemUISocketHelper'

async function method(ctx: XRPCContext) {
	try {

		if ((await GetFFlag("DFFlag1941"))) {
			return {
				encoding: 'application/json',
				body: {
					status: "err",
					message: "DFFlag1941 is enabled"
				}
			}
		}

		// TODO: Send Message API

		if (!ctx.req.headers.authorization) {
			throw "Unauthorized";
			return;
		};
	
		const ownerDid = await isValidJwt(ctx.req.headers.authorization);
		if (!ownerDid) {
			throw "Unauthorized";
			return;
		};
		if (typeof ownerDid === "boolean") throw "Invalid ownerDid type";

		const user = await prisma.user.findFirst({where:{atprotoDid:{equals:ownerDid}}});
		if (!user) throw "User not found";

		const runtime = getGlobalRuntime()
		const sessions = await runtime?.getSessions() || [];

		let h = user.atprotoHandle;
		if (user.bskyHandle.length > 0) h=user.bskyHandle;

		const content = (ctx.input?.body as string).slice(0,500)

		console.log(`[REM/Chat] G[${ctx.req.socket.remoteAddress || ctx.req.socket.localAddress}] <${h}> ${content}`)
		
		EmitWSEvent(SocketSendMessageType.USER_MSG,{
			ji: `RemUI`,
			discord_name: user.atprotoHandle,
			msg: content
		});
		
		sessions.forEach((session)=>{
			session.queueMessageNonLogging(h,"ff0000",content).catch(()=>{});
		})

		return {
			encoding: 'application/json',
			body: {
				status: "ok",
				message: "Sent"
			}
		}

	} catch(e_) {
		return {
			encoding: 'application/json',
			body: {
				status: "err",
				message: "LexiconError",
				error: e_
			}
		}
	}
}

registerLexicon(lexicon,method)