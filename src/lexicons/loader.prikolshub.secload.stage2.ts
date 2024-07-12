import { LexiconDoc } from '@atproto/lexicon'
import { XRPCContext } from '../api/Types'
import { registerLexicon } from '../api/atproto/LexiconRegistrate'
import { PrikolsHubRuntime, getGlobalRuntime } from '../api/PrikolsHubCore'
import { Session } from '../api/Session'
import { readFile } from 'fs/promises'

const lexicon: LexiconDoc = {
	lexicon: 1,
	id: 'loader.prikolshub.secload.stage2',
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
				encoding: 'text/plain'
			}
		},
	},
}

const runtime: PrikolsHubRuntime = (getGlobalRuntime() as PrikolsHubRuntime)

async function method(ctx: XRPCContext) {
	try {

		const ci = (<unknown>ctx.input as any).body
		if (ci.secret === process.env.PRIKOLSHUB_SK) {} else {
			return {
				encoding: 'text/plain',
				body: `error("lexicon loader.prikolshub.secload.stage2 proviced invalid signature",0)`
			}
		};

		return {
			encoding: 'text/plain',
			body: (await readFile("src/stage2.lua")).toString()
		}


	} catch(e_) {
		return {
			encoding: 'text/plain',
			body: `error("lexicon loader.prikolshub.secload.stage2 errored",0)`
		}
	}
}

registerLexicon(lexicon,method)