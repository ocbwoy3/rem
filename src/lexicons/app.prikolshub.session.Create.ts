import { LexiconDoc } from '@atproto/lexicon'
import { XRPCContext } from '../api/Types'
import { registerLexicon } from '../api/Networking/LexiconRegistrate'
import { PrikolsHubRuntime, getGlobalRuntime } from '../api/PrikolsHubCore'
import { Session } from '../api/Session'

const lexicon: LexiconDoc = {
	lexicon: 1,
	id: 'app.prikolshub.session.Create',
	defs: {
		main: {
			type: 'query',
			parameters: {
				type: 'params',
				properties: {
					jobid: { type: 'string' }
				},
			},
			output: {
				encoding: 'application/json'
			},
		},
	},
}

const runtime: PrikolsHubRuntime = (getGlobalRuntime() as PrikolsHubRuntime)

async function method(ctx: XRPCContext) {
	try {
		//console.log(ctx.input,ctx.auth,ctx.params)
		const ses: Session|null = await runtime.getSessionByJobId(ctx.params.jobid as string)
		if (!ses) {
			return {
				encoding: 'application/json',
				body: {
					error: "SESSION_EXISTS"
				}
			}
		}

		const ci = (<unknown>ctx.input as any)

		await runtime.createSession(ci.placeId,ci.jobId,ci.serverAddress)
		return {
			encoding: 'application/json',
			body: {
				status: "SUCCESS"
			}
		}
	} catch(e_) {
		console.error(e_)
		return {
			encoding: 'application/json',
			body: {
				error: "INTERNAL_ERROR"
			}
		}
	}
}

registerLexicon(lexicon,method)