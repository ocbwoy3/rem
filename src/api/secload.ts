// SecLoad 

import axios, { AxiosResponse } from 'axios';
import { startSpan } from '@sentry/node';
import * as Sentry from '@sentry/node';

export const script_name = 'rem';
const OBFUS = false

let isLoggedIn = false;

// useless shit, secload used secload.scriptlang.com, cloudflare waf broke it all
async function loginIfNotAlready(): Promise<void> {
	if (isLoggedIn) return;
	isLoggedIn = true;
	console.log(`[REM/SecLoad] Logging into SecLoad`)
}

async function removeAllScripts(): Promise<void> {
	let allScripts = await axios.post("https://secload.ocbwoy3.dev/secload/publicapi/ListScripts", {
		Key: process.env.SECLOAD_KEY,
	})
	let allScriptsJ: string[] = allScripts.data
	console.log(`[REM/secload] Deleting these ${allScriptsJ.length} scripts:`,allScriptsJ)
	console.log(`[REM/secload] Deleting ALL ${allScriptsJ.length} scripts to free up space`)

	let allPromises: Promise<boolean>[] = []
	allScriptsJ.forEach((scr: string)=>{
		allPromises.push(new Promise(async(resolve,reject)=>{
			await axios.post("https://secload.ocbwoy3.dev/secload/publicapi/RemoveScript", {
				Key: process.env.SECLOAD_KEY,
				ScriptName: scr
			})
			console.log(`[REM/secload] Deleted ${scr} :3`)
			resolve(true)
		}))
	})
	await Promise.all(allPromises)
	console.log(`[REM/secload] Deleted ${allScriptsJ.length} scripts :3`)
}

export async function trueUploadREM(code:string): Promise<void> {
	try { await removeAllScripts() } catch (e_) { console.log(`${e_}`) }
	try {
		await axios.post("https://secload.ocbwoy3.dev/secload/publicapi/CreateScript", {
			Key: process.env.SECLOAD_KEY,
			ScriptName: script_name,
			Source: code,
			Obfuscated: OBFUS
		})
	} catch {
		try {
			await axios.post("https://secload.ocbwoy3.dev/secload/publicapi/OverwriteScript", {
				Key: process.env.SECLOAD_KEY,
				ScriptName: script_name,
				Source: code,
				Obfuscated: OBFUS
			})
		} catch(e_) {
			// AxiosError: Request failed with status code 413
			if (((e_ as any).response as AxiosResponse).data === "API script list exceeds 5,000,000 Bytes (5 Megabytes)") {
				console.log(`[REM/secload] All scripts exceeded 5 MB, what the fuck?`)
				Sentry.captureException(e_)
			} else {
				console.log(`[REM/secload] Failed to overwrite SecLoad Script, what the fuck?`)
				console.log(e_)
				Sentry.captureException(e_)
			}
		}
	}
}

import * as config from "../../config.json";

export async function uploadREM(): Promise<void> {

	let allScripts = await axios.post("https://secload.ocbwoy3.dev/secload/publicapi/ListScripts", {
		Key: process.env.SECLOAD_KEY,
	})
	let allScriptsJ: string[] = allScripts.data
	console.log(`[REM/secload] ${allScriptsJ.length} scripts stored in SecLoad:`,allScriptsJ)

	// await loginIfNotAlready()
	console.log(`[REM/SecLoad] Uploading the loader as ${script_name}`)
	await trueUploadREM(`
		-- REM Loader ( https://ocbwoy3.dev )
		print("[REMLoader]","i like kissing boys :3")
		local url = "${config.RootURL}/xrpc/"
		local lex = "loader.rem.secload.stage2"
		local http = game:GetService("HttpService")
		local PHS = "${process.env.PRIKOLSHUB_SK}"
		local prikolshub_source = http:PostAsync(url..lex,http:JSONEncode({secret=PHS}),Enum.HttpContentType.ApplicationJson,true)
		local f, r = loadstring(prikolshub_source)
		warn("[REMLoader]","loadstring :3",r)
		print("[REMLoader]","setting fenv")
		getfenv(f).P_SECRET = PHS
		print("[REMLoader]","DEFERING main func")
		task.defer(function() f()() print("[REMLoader] main stopped") end)
		`.trim().replace(/\t/g,'').trim()
	)
	console.log(`[REM/SecLoad] Uploaded the loader as ${script_name}`)
}

export async function generateRequire(username:string): Promise<string> {
	await loginIfNotAlready()
	const require: AxiosResponse<string> = await axios.post("https://secload.ocbwoy3.dev/secload/publicapi/GenerateKey",{
		Key: process.env.SECLOAD_KEY,
		ScriptName: script_name,
		Time: 5,
		Username: username
	},{ headers: {"Content-Type": "application/json"}})
	console.log(`[REM/SecLoad] Generated script '${script_name}'`)
	return require.data
}