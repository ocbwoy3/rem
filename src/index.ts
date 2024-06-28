import { version } from "../package.json";
import * as config from "../config.json";
import * as os from "node:os";
console.log(`[PrikolsHub] PrikolsHub.ts version ${version}`)

import { configDotenv } from "dotenv";
configDotenv()

import { client as djs_client, setExecutionContext } from "./api/Bot";
import { Session } from "./api/Session";
import { RobloxMessage } from "./api/Types";
import { PrikolsHubRuntime } from "./api/PrikolsHubCore";
import { Client, Embed, TextChannel, APIEmbed, APIEmbedField, Channel } from "discord.js";

const client: Client = djs_client
const Runtime = new PrikolsHubRuntime(client)

console.log("[PrikolsHub] Logging into Discord")

setExecutionContext(Runtime)

client.on('ready',async()=>{
	const logs_channel: TextChannel = (await client.channels.fetch(config.LogChannelId) as TextChannel)
	new Promise(async()=>{
		let embed: APIEmbed = {
			title: "PrikolsHub has started!",
			color: 0x00ff00,
			fields: [
				({name:"PrikolsHub.ts version",value:version.toString(),inline:false} as APIEmbedField),
				({name:"Hostname",value:os.hostname(),inline:false} as APIEmbedField),
				({name:"Current user",value:os.userInfo().username,inline:false} as APIEmbedField),
				({name:"NodeJS PID",value:process.pid.toString(),inline:false} as APIEmbedField)
			]
		}
		
		logs_channel.send({embeds:[embed]})
	})
})

client.login(process.env.TOKEN)