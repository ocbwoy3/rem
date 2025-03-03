import sha1 from "sha1";
import * as config from "../../../config.json";
import { resolveHandleAtprotoData } from "./DIDHandleResolver";
import { AtpBaseClient, BskyAgent } from "@atproto/api";
import assert from "node:assert";
import { Response as AppBskyActorGetProfileResult } from "@atproto/api/dist/client/types/app/bsky/actor/getProfile";

const atpClient = new AtpBaseClient("https://bsky.social")
const bskyClient = new BskyAgent({
	service: "https://public.api.bsky.app"
})


const LINKING_DATA_COLLECTION = "dev.ocbwoy3.rem.connection";

/*

at://did:plc:s7cesz7cr6ybltaryy4meb6y

service:
	id: "#atproto_pds"
	type: "AtprotoPersonalDataServer"
	serviceEndpoint: "https://lionsmane.us-east.host.bsky.network"

----

at://did:plc:s7cesz7cr6ybltaryy4meb6y/dev.ocbwoy3.rem.connection/self

value:
	pds: did:web:rem.ocbwoy3.dev
	proof: 5a333f9af07ea421d598f059718dc94508a5e69c (SHA1 Hash of PDS and User's Discord ID)
	$type: dev.ocbwoy3.rem.connection

*/

export const PDS_DID = `did:web:${config.RootURL.replace("http://","").replace("https://","").replace("/","/")}`

export async function generateUserLinkingHash(userid: string): Promise<string> {
	
	return sha1(PDS_DID+"|"+userid)
}

export async function isValidLinkTarget(handle: string): Promise<boolean> {
	const d = await resolveHandleAtprotoData(handle);
	if (d.pds.endsWith(".host.bsky.network")) return true; // allow only mushroom pds' from bluesky
	return false;
}

export type LinkingData = {pds:string,$type:string,proof:string}

export async function getBlueskyDetails(did:string): Promise<AppBskyActorGetProfileResult> {
	return await bskyClient.app.bsky.actor.getProfile({actor:did})
}

export async function getLinkingData(did: string): Promise<LinkingData> {
	const linkingData = await atpClient.com.atproto.repo.getRecord({
		repo: did,
		collection: LINKING_DATA_COLLECTION,
		rkey: "self"
	})
	const ld: any | LinkingData = linkingData.data.value as LinkingData;
	assert(ld.pds === PDS_DID,"Linked account belongs to a different REM instance");
	assert(ld.$type === LINKING_DATA_COLLECTION,`Collection $type is not ${LINKING_DATA_COLLECTION}`);
	assert(typeof ld.proof === "string","Proof type is not a string");
	return linkingData.data.value as LinkingData;
}
