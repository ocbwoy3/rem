import { DidResolver, HandleResolver } from "@atproto/identity";

const didres = new DidResolver({})
const hdlres = new HandleResolver({})

// https://github.com/bluesky-social/atproto/blob/main/packages/identity/README.md

export async function resolveHandleToDid(handle:string): Promise<string|null> {
	const did: string|undefined = await hdlres.resolve(handle)

	if (did == undefined) {
		throw new Error('expected handle to resolve')
	}

	const doc = await didres.resolve(did)

	const data = await didres.resolveAtprotoData(did)

	if (data.handle != handle) {
		throw new Error('invalid handle (did not match DID document)')
	}

	return did

}