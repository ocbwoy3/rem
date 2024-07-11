import { LexiconDoc } from '@atproto/lexicon'
import { XRPCContext } from '../Types'

let lexicons: LexiconDoc[] = []
let methods: {[lexicon:string]: (ctx: XRPCContext) => any } = {}

export function registerLexicon(lexicon:LexiconDoc, method: (ctx: XRPCContext) => any ) {
	lexicons.push(lexicon)
	methods[lexicon.id] = method
}

export function getLexicons(): LexiconDoc[] {
	return lexicons
}

export function getMethods(): {[lexicon:string]: (ctx: XRPCContext) => any } {
	return methods
}
