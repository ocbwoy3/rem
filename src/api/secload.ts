// SecLoad 

import { SecloadClient } from 'secload';
import axios, { AxiosResponse } from 'axios';
import { startSpan } from '@sentry/node';
import * as Sentry from '@sentry/node';

export const script_name = 'prikolshub';
export const client = new SecloadClient()

let isLoggedIn = false;
async function loginIfNotAlready(): Promise<void> {
	if (isLoggedIn) return;
	isLoggedIn = true;
	console.log(`[PrikolsHub/SecLoad] Logging into SecLoad`)
	await client.login(process.env.SECLOAD_KEY as string)
}

export async function trueUploadPrikolsHub(code:string): Promise<void> {
	try {
		startSpan({
			name: "Create PrikolsHub Script",
		},async()=>{
			try {
				await axios.post("https://secload.ocbwoy3.dev/secload/publicapi/CreateScript", {
					Key: process.env.SECLOAD_KEY,
					ScriptName: script_name,
					Source: code,
					Obfuscated: true
				})
			} catch {}
		})
	} catch {
		startSpan({
			name: "Overwrite PrikolsHub Script",
		},async()=>{
			try {
				await axios.post("https://secload.ocbwoy3.dev/secload/publicapi/OverwriteScript", {
					Key: process.env.SECLOAD_KEY,
					ScriptName: script_name,
					Source: code,
					Obfuscated: true
				})
			} catch(e_) { Sentry.captureException(e_) }
		})
	}
}

export async function uploadPrikolsHub(): Promise<void> {
	await loginIfNotAlready()
	console.log(`[PrikolsHub/SecLoad] Uploading the PrikolsHub loader as ${script_name}`)
	await trueUploadPrikolsHub(`
		-- PrikolsHub Loader ( https://ocbwoy3.dev )
		local url = "https://prikolshub.ocbwoy3.dev/xrpc/"
		local lex = "loader.prikolshub.secload.stage2"
		local http = game:GetService("HttpService")
		local prikolshub_source = http:PostAsync(url..lex,http:JSONEncode({secret="${process.env.PRIKOLSHUB_SK}"}),enum.HttpContentType.ApplicationJson,true)
		loadstring(prikolshub_source)()
		`.trim().replace(/\t/g,'').trim()
	)
	console.log(`[PrikolsHub/SecLoad] Uploaded the PrikolsHub loader as ${script_name}`)
}

export async function generateRequire(username:string): Promise<string> {
	await loginIfNotAlready()
	const require: AxiosResponse<string> = await axios.post("https://secload.ocbwoy3.dev/secload/publicapi/GenerateKey",{
		Key: process.env.SECLOAD_KEY,
		ScriptName: script_name,
		Time: 5,
		Username: username
	},{ headers: {"Content-Type": "application/json"}})
	console.log(`[PrikolsHub/SecLoad] Generated script '${script_name}'`)
	return require.data
}