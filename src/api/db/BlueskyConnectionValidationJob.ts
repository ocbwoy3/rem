import { User } from "@prisma/client";
import { getBlueskyDetails, getLinkingData, PDS_DID } from "../atproto/BlueskyHandleLinkingHelper";
import { prisma } from "./Prisma";
import assert from "node:assert";

async function handleUser(user: User) {
	if (user.bskyHandleDid === "") return; 
	try {
		const d = await getLinkingData(user.bskyHandleDid);
		assert(d.proof === user.bskyHandleProof,"Handle proof did not match")
		const bskyd = (await getBlueskyDetails(user.bskyHandleDid)).data;
		prisma.user.update({
			where: {
				discordUserId: user.discordUserId
			},
			data: {
				bskyHandle: bskyd.handle,
				bskyName: bskyd.displayName,
				bskyHandleDid: bskyd.did,
				bskyHandleProof: user.bskyHandleProof,
				bskyHandlePDS: PDS_DID
			}
		})
	} catch(e_) {
		console.error("[REM/DBJob]",`${user.discordUserId} handle check failed (${user.bskyHandleDid}) - ${e_}`)
		prisma.user.update({
			where: {
				discordUserId: user.discordUserId
			},
			data: {
				bskyHandle: "",
				bskyHandleDid: "",
				bskyHandlePDS: "",
				bskyHandleProof: "",
				bskyName: ""
			}
		}).catch(()=>{})
	}
}

export async function runDBJob() {
	console.log("[REM/DBJob]",`Running check job - ${new Date().toISOString()}`)
	try {
		const users = await prisma.user.findMany();
		users.forEach(async(a)=>{
			await handleUser(a)
		})
	} catch(e_) {
		console.error("[REM/DBJob]",`${e_}`)
	}
}