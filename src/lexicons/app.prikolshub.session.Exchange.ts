import { LexiconDoc } from '@atproto/lexicon'
import { IncomingSessionMsgRequest, XRPCContext } from '../api/Types'
import { registerLexicon } from '../api/Networking/LexiconRegistrate'
import { PrikolsHubRuntime, getGlobalRuntime } from '../api/PrikolsHubCore'
import { Session } from '../api/Session';

const lexicon: LexiconDoc = {
	lexicon: 1,
	id: 'app.prikolshub.session.Exchange',
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
			},
		}
	}
}

const runtime: PrikolsHubRuntime = (getGlobalRuntime() as PrikolsHubRuntime)

async function method(ctx: XRPCContext) {
	try {
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
			body: await ses.ProcessRequest((<unknown>ctx.input as IncomingSessionMsgRequest))
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