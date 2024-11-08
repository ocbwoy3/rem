import { randomBytes } from 'crypto';
import { PDS_DID } from './BlueskyHandleLinkingHelper';
import { prisma } from '../db/Prisma';
import * as elliptic from 'elliptic';

const EC = new elliptic.ec('secp256k1');

function base64urlEncode(str: string): string {
	return Buffer.from(str)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

function isHex(hex: string): boolean {
	return /^[0-9a-fA-F]+$/.test(hex) && hex.length === 64;
}

function jwtSign(payload: any, privateKeyHex: string): string {
	if (!isHex(privateKeyHex)) {
		throw new Error("Invalid private key format. Must be a 64-character hexadecimal string.");
	}

	const key = EC.keyFromPrivate(privateKeyHex);

	const header = {
		typ: 'at+jwt',
		alg: 'ES256K'
	};

	const encodedHeader = base64urlEncode(JSON.stringify(header));
	const encodedPayload = base64urlEncode(JSON.stringify(payload));
	const message = `${encodedHeader}.${encodedPayload}`;

	// Sign the message using secp256k1
	const signature = key.sign(message);

	// Convert signature to DER format and encode it in base64 URL
	const derSignature = Buffer.from(signature.toDER()).toString('base64');
	const encodedSignature = derSignature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

	return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export function generateJwt(subjectDid: string): string {
	const pkHex = randomBytes(32).toString("hex")
	const payload = {
		scope: 'com.atproto.access',
		sub: subjectDid,
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + 7889238,
		aud: PDS_DID
	};
	
	return jwtSign(payload, pkHex);
}

export async function isValidJwt(jwt: string): Promise<boolean|string> {

	const user = await prisma.user.findFirst({
		where: {
			accessJwt: { equals: jwt }
		}
	});

	if (!user || user.enableJwt === false || user.jwtExpiry < Math.floor(Date.now() / 1000)) return false;
	return user.atprotoDid;
}
