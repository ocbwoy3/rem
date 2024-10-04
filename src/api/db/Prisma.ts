import { PrikolsHubServiceBan, PrismaClient, User } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import * as config from '../../../config.json';
import { CreateNewDid } from '../atproto/DIDHandleResolver';

export const prisma = new PrismaClient()//.$extends(withAccelerate())

export async function createUser(discordUserId: string) {
	const userDid = await CreateNewDid(config.atproto_url.replace("*",`u${discordUserId}`))
	const user = await prisma.user.create({
		data: {
			discordUserId: discordUserId,
			isAdmin: false,
			atprotoHandle: config.atproto_url.replace("*",`u${discordUserId}`),
			atprotoSigningKey: userDid.signingKey,
			atprotoDid: userDid.serverKey,
			atprotoPrivateKey: userDid.didSecret
		},
	})
}

export type ModerationReport = {
	discordUserId: string,
	reason: string,
	moderatorId: string
}

export async function userExists(userId: string): Promise<boolean> {
	const x: {isAdmin: boolean} = (await prisma.user.findFirst({
		where: {
			discordUserId: { equals: userId }
		},
		//cacheStrategy: { swr: 5, ttl: 5 },
	}) as any)
	if (!x) return false;
	return true;
}

export async function checkUserModStatus(userId: string): Promise<ModerationReport|null> {
	const banStatus: PrikolsHubServiceBan | null = await prisma.prikolsHubServiceBan.findFirst({
		where: {
			discordUserId: { equals: userId }
		},
		//cacheStrategy: { swr: 5, ttl: 5 },
	})
	if (!banStatus) return null;
	return { discordUserId: banStatus.discordUserId, reason: banStatus.reason, moderatorId: banStatus.moderatorId }
}

export async function getUserInfo(userId: string): Promise<User> {
	if (!(await userExists(userId))) await createUser(userId);
	const ud = (await prisma.user.findFirst({
		where: {
			discordUserId: { equals: userId }
		},
		//cacheStrategy: { swr: 5, ttl: 5 },
	}) as any);
	return ud
}

export async function getUserAdmin(userId: string): Promise<boolean> {
	if (!(await userExists(userId))) await createUser(userId);
	const adminStatus: {isAdmin: boolean} = (await prisma.user.findFirst({
		where: {
			discordUserId: { equals: userId }
		},
		//cacheStrategy: { swr: 5, ttl: 5 },
	}) as any)
	if (!adminStatus) return false;
	return adminStatus.isAdmin
}

export async function setUserAdmin(userId: string, isAdmin:boolean): Promise<boolean> {
	if (!(await userExists(userId))) await createUser(userId);
	const adminStatus: {isAdmin: boolean} = (await prisma.user.update({
		where: {
			discordUserId: userId
		},
		data: {
			isAdmin: isAdmin
		}
	}) as any)
	if (!adminStatus) return false;
	return adminStatus.isAdmin
}

export async function banUser(userId: string, reason: string, moderatorId: string) {
	await prisma.prikolsHubServiceBan.create({
		data: {
			discordUserId: userId,
			reason: reason,
			moderatorId: moderatorId
		}
	})
}

export async function unbanUser(userId: string) {
	await prisma.prikolsHubServiceBan.delete({
		where: {
			discordUserId: userId
		}
	})
}

export async function getUsername(userId: string): Promise<string> {
	if (!(await userExists(userId))) await createUser(userId);
	const usernameGet: {RobloxUsername: string} = (await prisma.user.findFirst({
		where: {
			discordUserId: { equals: userId }
		},
		//cacheStrategy: { swr: 5, ttl: 5 },
	}) as any)
	if (!usernameGet) return "REM_UNDEFINED_USERNAME";
	return usernameGet.RobloxUsername
}

export async function setUsername(userId: string, newUsername: string): Promise<string> {
	if (!(await userExists(userId))) await createUser(userId);
	const usernameSet: {RobloxUsername: string} = (await prisma.user.update({
		where: {
			discordUserId: userId
		},
		data: {
			RobloxUsername: newUsername
		}
	}) as any)
	if (!usernameSet) return "REM_UNDEFINED_USERNAME";
	return usernameSet.RobloxUsername
}

export async function getAnonymous(userId: string): Promise<boolean> {
	if (!(await userExists(userId))) await createUser(userId);
	const wtf: {isAnonymous: boolean} = (await prisma.user.findFirst({
		where: {
			discordUserId: { equals: userId }
		},
		//cacheStrategy: { swr: 5, ttl: 5 },
	}) as any)
	if (!wtf) return false;
	return wtf.isAnonymous
}

export async function setAnonymous(userId: string, newAnonymous: boolean): Promise<boolean> {
	if (!(await userExists(userId))) await createUser(userId);
	const wtf: {isAnonymous: boolean} = (await prisma.user.update({
		where: {
			discordUserId: userId
		},
		data: {
			isAnonymous: newAnonymous
		}
	}) as any)
	if (!wtf) return newAnonymous;
	return wtf.isAnonymous;
}
