import { LexiconDoc } from '@atproto/lexicon'
import { XRPCContext } from '../api/Types'
import { registerLexicon } from '../api/atproto/LexiconRegistrate'
import * as config from "../../config.json";
import { readdirSync } from 'fs';

const lexicon: LexiconDoc = {
	lexicon: 1,
	id: 'loader.rem.modules.list',
	defs: {
		main: {
			type: 'query',
			output: {
				encoding: 'application/json'
			}
		},
	},
}

const allModules = readdirSync("src/modules")

async function method(ctx: XRPCContext) {
	if (ctx.req.headers.token !== process.env.PRIKOLSHUB_SK) {
		return {
			encoding: 'application/json',
			body: []
		}
	};

	return {
		encoding: 'application/json',
		body: allModules
	}
}

registerLexicon(lexicon,method)