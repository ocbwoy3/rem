import { Keypair, Secp256k1Keypair } from "@atproto/crypto";
import { AtprotoData, DidResolver, HandleResolver } from "@atproto/identity";
import { Client as PlcClient } from "@did-plc/lib";
import * as config from "../../../config.json";

const didres = new DidResolver({})
const hdlres = new HandleResolver({})

// https://github.com/bluesky-social/atproto/blob/main/packages/identity/README.md

export async function resolveHandleToDid(handle:string): Promise<string> {
	const did: string|undefined = await hdlres.resolve(handle)

	if (did == undefined) {
		throw new Error('Invalid handle (cannot find DID document)')
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
		throw new Error('Invalid handle (cannot find DID document)')
	}

	const doc = await didres.resolve(did)

	const data = await didres.resolveAtprotoData(did)

	if (data.handle != handle) {
		throw new Error('Invalid Handle (did not match DID document)')
	}

	return data

}

// creates a did
export async function CreateNewDid(handle: string): Promise<{
	serviceKeypair: Keypair,
	handle: string,
	signingKey: string,
	rotationKeys: string[],
	serverKey: string
}> {
	const serviceKeypair = await Secp256k1Keypair.create()
	const rotationKey = await Secp256k1Keypair.create()
	const plcClient = new PlcClient(`https://plc.directory`)

	const signingKey = serviceKeypair.did();
	const rotationKeys = [serviceKeypair.did()];

	const port = process.env.PORT || 2929
	const url = `http://localhost:${process.env.PORT || 2929}`
	const serverKey = await plcClient.createDid({
		signingKey: signingKey,
		rotationKeys: rotationKeys,
		handle: handle,
		pds: config.RootURL,
		signer: serviceKeypair,
	})
	console.log(`Created new DID - ${signingKey} / ${serverKey}`)
	return {
		serviceKeypair,
		signingKey,
		rotationKeys,
		serverKey,
		handle
	}
}