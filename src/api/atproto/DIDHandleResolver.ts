import { Keypair, Secp256k1Keypair } from "@atproto/crypto";
import { AtprotoData, DidResolver, HandleResolver } from "@atproto/identity";
import { Client as PlcClient } from "@did-plc/lib";
import * as config from "../../../config.json";

function uint8ArrayToBinaryString(uint8Array: Uint8Array): string {
	const binaryString = [];
	for (let i = 0; i < uint8Array.length; i++) {
		binaryString.push(String.fromCharCode(uint8Array[i]));
	}
	return binaryString.join('');
}

function binaryStringToUint8Array(binaryString: string): Uint8Array {
	const uint8Array = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		uint8Array[i] = binaryString.charCodeAt(i); 
	}
	return uint8Array;
}

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
	serverKey: string,
	didSecret: string
}> {
	const serviceKeypair = await Secp256k1Keypair.create({exportable:true})
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
		handle,
		didSecret: uint8ArrayToBinaryString(await serviceKeypair.export())
	}
}

export async function updateHandle(did: string, privateKey: string, new_handle: string): Promise<void> {
	const plcClient = new PlcClient(`https://plc.directory`)
	const keypair = new Secp256k1Keypair(binaryStringToUint8Array(privateKey),true)
	await plcClient.updateHandle(did,keypair,new_handle)
}