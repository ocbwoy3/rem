import { LexiconDoc } from '@atproto/lexicon'
import { XRPCContext } from '../api/Types'
import { registerLexicon } from '../api/atproto/LexiconRegistrate'
import { REMRuntime, getGlobalRuntime } from '../api/REMCore'
import { Session } from '../api/Session'

const lexicon: LexiconDoc = {
	lexicon: 1,
	id: 'app.rem.session.getInfo',
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
			}
		},
	},
}

const runtime: REMRuntime = (getGlobalRuntime() as REMRuntime)

async function method(ctx: XRPCContext) {
	try {
		//console.log(ctx.input,ctx.auth,ctx.params)
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
			body: {
				gameName: ses.GameName,
				serverAddress: ses.ServerIPAddress,
				serverRegion: ses.SessionRegion,
				jobId: ses.JobId,
				placeId: ses.PlaceId
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