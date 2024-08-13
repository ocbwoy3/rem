import { AtprotoData, DidResolver, HandleResolver } from "@atproto/identity";

const didres = new DidResolver({})
const hdlres = new HandleResolver({})

// https://github.com/bluesky-social/atproto/blob/main/packages/identity/README.md

export async function resolveHandleToDid(handle:string): Promise<string> {
	const did: string|undefined = await hdlres.resolve(handle)

	if (did == undefined) {
		throw new Error('Expected handle to resolve')
	}

	const doc = await didres.resolve(did)

	const data = await didres.resolveAtprotoData(did)

	if (data.handle != handle) {
		throw new Error('Invalid Handle (did not match DID document)')
	}

	return did

}

export async function resolveHandleAtprotoData(handle:string): Promise<AtprotoData> {
	const did: string|undefined = await hdlres.resolve(handle)

	if (did == undefined) {
		throw new Error('Expected handle to resolve')
	}

	const doc = await didres.resolve(did)

	const data = await didres.resolveAtprotoData(did)

	if (data.handle != handle) {
		throw new Error('Invalid Handle (did not match DID document)')
	}

	return data

}


console.warn(`[REM/atproto] Loaded DID Handle resolver`);