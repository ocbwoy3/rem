import { LexiconDoc } from '@atproto/lexicon'
import { XRPCContext } from '../api/Types'
import { registerLexicon } from '../api/atproto/LexiconRegistrate'
import { REMRuntime, getGlobalRuntime } from '../api/REMCore'
import { Session } from '../api/Session'

const lexicon: LexiconDoc = {
	lexicon: 1,
	id: 'app.prikolshub.session.create',
	defs: {
		main: {
			type: 'procedure',
			parameters: {
				type: 'params',
				properties: {
					jobid: { type: 'string' }
				},
			},
			input: {
				encoding: 'application/json'
			},
			output: {
				encoding: 'application/json'
			}
		},
	},
}

const runtime: REMRuntime = (getGlobalRuntime() as REMRuntime)

async function method(ctx: XRPCContext) {
	try {
		//console.log(ctx.input,ctx.auth,ctx.params)

		// console.log(ctx.input,ctx.params)

		const ses: Session|null = await runtime.getSessionByJobId(ctx.params.jobid as string)
		if (ses != null) {
			return {
				encoding: 'application/json',
				body: {
					error: "SESSION_EXISTS"
				}
			}
		}

		const ci = (<unknown>ctx.input as any).body
		if (ci.secret === process.env.PRIKOLSHUB_SK) {} else {
			return {
				encoding: 'application/json',
				body: {
					error: "UNAUTHORIZED"
				}
			}
		};

		// console.log(ctx.req.headers)

		// TODO: Remove 127.0.0.1
		const serverAddr: string = ((ctx.req.headers['x-forwarded-for'] || ctx.req.socket.remoteAddress) as string)

		runtime.createSession(ci.placeId,ci.jobId,serverAddr)
		return {
			encoding: 'application/json',
			body: {
				status: "SUCCESS"
			}
		}
	} catch(e_) {
		return {
			encoding: 'application/json',
			body: {
				error: "INTERNAL_ERROR"
			}
		}
	}
}

registerLexicon(lexicon,method)