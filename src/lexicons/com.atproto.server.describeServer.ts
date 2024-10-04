import { LexiconDoc } from '@atproto/lexicon'
import { XRPCContext } from '../api/Types'
import { registerLexicon } from '../api/atproto/LexiconRegistrate'
import * as config from "../../config.json";

const lexicon: LexiconDoc = {
	lexicon: 1,
	id: 'com.atproto.server.describeServer',
	defs: {
		main: {
			type: 'query',
			output: {
				encoding: 'application/json'
			}
		},
	},
}

async function method(ctx: XRPCContext) {
	return {
		encoding: 'application/json',
		body: {
			did: `did:web:${config.RootURL
				.replace("http://","")
				.replace("https://","")
				.replace("/","/")
			}`,
			availableUserDomains: [`.${config.RootURL
				.replace("http://","")
				.replace("https://","")
				.replace("/","/")
			}`],
			inviteCodeRequired:true,
			links: {
				termsOfService: "https://ocbwoy3.dev/server-rules",
				privacyPolicy:  "https://ocbwoy3.dev/legal",
				sourceCode: "https://github.com/ocbwoy3/rem"
			},
			contact: {}
		}
	}
}

registerLexicon(lexicon,method)