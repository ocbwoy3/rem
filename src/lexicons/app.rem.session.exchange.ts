import { LexiconDoc } from '@atproto/lexicon'
import { IncomingSessionMsgRequest, XRPCContext } from '../api/Types'
import { registerLexicon } from '../api/atproto/LexiconRegistrate'
import { REMRuntime, getGlobalRuntime } from '../api/REMCore'
import { Session } from '../api/Session';

const lexicon: LexiconDoc = {
	lexicon: 1,
	id: 'app.rem.session.exchange',
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
		}
	}
}

const runtime: REMRuntime = (getGlobalRuntime() as REMRuntime)

async function method(ctx: XRPCContext) {
	try {

		const ci = (<unknown>ctx.input as any).body
		if (ci.secret === process.env.PRIKOLSHUB_SK) {} else {
			return {
				encoding: 'application/json',
				body: {
					error: "UNAUTHORIZED"
				}
			}
		};

		const ses: Session|null = await runtime.getSessionByJobId(ctx.params.jobid as string)
		if (!ses) {
			return {
				encoding: 'application/json',
				body: {
					error: "SESSION_NOT_FOUND"
				}
			}
		}
		return {
			encoding: 'application/json',
			body: await ses.ProcessRequest((ci as IncomingSessionMsgRequest))
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