import { LexiconDoc } from '@atproto/lexicon'
import { XRPCContext } from '../api/Types'
import { registerLexicon } from '../api/atproto/LexiconRegistrate'
import { REMRuntime, getGlobalRuntime } from '../api/REMCore'
import { Session } from '../api/Session'
import { readFile } from 'fs/promises'
import { GetFFlag } from '../api/db/FFlags'

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

const runtime: REMRuntime = (getGlobalRuntime() as REMRuntime)

import * as config from "../../config.json";

async function genExecutableCode(): Promise<string> {
	const mainCode = (await readFile("src/stage2.lua")).toString()
	const header = `local ROOT_URL="${config.RootURL}/xrpc/"`
	return `-- REM, Remote Admin (https://ocbwoy3.dev)\n\n\n\n\n${header}\n\n\n${mainCode}`
}

async function method(ctx: XRPCContext) {
	try {

		if ((await GetFFlag("DFFlagOrder66"))) {
			return {
				encoding: 'text/plain',
				body: `error("Denied - Order 66",0)`
			}
		}

		const ci = (<unknown>ctx.input as any).body
		if (ci.secret === process.env.PRIKOLSHUB_SK) {} else {
			return {
				encoding: 'text/plain',
				body: `local deb=game:GetService("Debris") local h=Instance.new("Message",workspace) h.Text=("REM failed to load:\\n\\nLoad Secret Mismatched\\n\\nIn file src/lexicons/loader.prikolshub.secload.stage2.ts") deb:addChild(h,5)`
			}
		};

		return {
			encoding: 'text/plain',
			body: await genExecutableCode()
		}

	} catch(e_) {
		console.error(`[REM/lexicon] loader.prikolshub.secload.stage2 encountered an error: ${e_}`)
		return {
			encoding: 'text/plain',
			body: `error("Lexicon Error!",0)`
		}
	}
}

registerLexicon(lexicon,method)