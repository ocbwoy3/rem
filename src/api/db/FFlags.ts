import AllFFlagsOld from "../../fflag_doc.json";
import { DBPrisma as prisma } from "./Prisma";

export type FFlagDoc = { [flag:string]: {desc: string, default: boolean} }
export type FFlag = {name: string, state: boolean}

const AllFFlags: FFlagDoc = AllFFlagsOld

export async function GetFFlag(fflag: string): Promise<boolean> {
	const flagdata: FFlag | null = await prisma.featureFlag.findFirst({
		where: {
			name: { equals: fflag }
		}
	})
	return (flagdata as FFlag).state
}

async function GetFFlagUnsafe(fflag: string): Promise<boolean|null> {
	const flagdata: FFlag | null = await prisma.featureFlag.findFirst({
		where: {
			name: { equals: fflag }
		}
	})
	if (flagdata===null) return null;
	return flagdata.state
}

export async function SetFFlag(fflag: string, state: boolean): Promise<void> {
	const flagdata: boolean | null = await GetFFlagUnsafe(fflag)
	console.log(`[REM/fflag] FFlag modified: ${fflag} | ${flagdata} -> ${state}`)

	if (!flagdata) {
		await prisma.featureFlag.create({
			data: {
				name: fflag,
				state: state
			}
		})
		return
	}
	await prisma.featureFlag.update({
		where: {
			name: fflag
		},
		data: {
			state: state
		}
	})
	return
}

export async function GetAllFFlags(): Promise<{[flag:string]: boolean}> {
	let fflags: {[flag:string]: boolean} = {}
	const FFlagNames = Object.keys(AllFFlags)
	
	FFlagNames.forEach(async(flag: string)=>{
		fflags[flag] = await GetFFlag(flag)
	})

	await new Promise(async(resolve)=>{
		while (Object.keys(fflags).length != FFlagNames.length) {
			await new Promise(resolve=>{setTimeout(resolve,1)})
		}
		resolve(null)
	})

	return fflags

}

export async function InitFFlags(): Promise<void> {
	const FFlagNames = Object.keys(AllFFlags)
	console.log(`[REM/fflag] Checking ${FFlagNames.length} FFlags`)
	let nonexistentFlags = 0
	FFlagNames.forEach(async(flag: string)=>{
		const flagdata: boolean | null = await GetFFlagUnsafe(flag)
		if (flagdata===null) {
			nonexistentFlags++
			await SetFFlag(flag,AllFFlags[flag].default)
		}
	})
	console.log(`[REM/fflag] Applying defaults to ${nonexistentFlags} new FFlags (async)`)
}

export async function ResetFFlags() {
	await prisma.featureFlag.deleteMany({})
	console.log(`[REM/fflag] DELETED ALL FFLAGS FROM DB!!!`)
	console.log(`[REM/fflag] Restoring defaults from fflag_doc.json`)
	await InitFFlags()
}