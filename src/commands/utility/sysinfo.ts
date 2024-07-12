import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	InteractionDeferReplyOptions,
	Client
} from "discord.js";

import * as si from 'systeminformation';
import checkDiskSpace from 'check-disk-space';
import * as os from 'os';
import * as fs from 'node:fs';
import { exec } from "child_process";
import { getLexicons, getMethods } from "../../api/atproto/LexiconRegistrate";
import { cwd } from "process";

function formatBytes(bytes: number, decimals = 2, noext:boolean=false): string {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))}${ noext ? "" : ` ${sizes[i]}`}`
}

module.exports = {
	data: new SlashCommandBuilder()
	.setName('sysinfo')
	.setDescription('Provides information about the device PrikolsHub is running on.'),
	async execute(interaction: CommandInteraction) {

		if (os.type()!='Linux') {
			await interaction.reply({ephemeral:true,content:"This command is only supported on Linux."})
			return;
		}

		await interaction.deferReply(({ephemeral: false,fetchReply: false} as InteractionDeferReplyOptions))

		// resolve owner

		const client: Client = interaction.client
		const owner_id: string = ((client as any).application?.owner?.owner?.id || (client as Client).application?.owner?.id)

		if (interaction.user.id != owner_id) {
			await interaction.followUp("You are not the owner of this bot!")
			return
		}

		let opj: {[a: string]: string} = {}
		try {
			let osrel = fs.readFileSync('/etc/os-release', 'utf-8')
			
			osrel?.split('\n')?.forEach((line, index) => {
				let words = line?.split('=')
				let key = words[0]?.toLowerCase()
				if (key === '') return
				let value = words[1]?.replace(/"/g,'')
				opj[key] = value
			})
		} catch {}
		
		let osPrettyName = `${opj.pretty_name || opj.name || "Unknown, likely Windows"} ${os.arch}`

		const simem = await si.mem()
		const sisys = await si.system()
		const sicpu = await si.cpu()
		const sicpuspeed = await si.cpuCurrentSpeed()
		const sicputemp = await si.cpuTemperature()

		const diskusedroot = await checkDiskSpace(os.type()=='Windows_NT' ? 'C:\\' : "/") // LINUX ONLY

		let uptimeoutput = "error"
		let uptimeoutput_2 = "error"

		if (os.type()!='Windows_NT') {
			uptimeoutput = await (new Promise(async(resolve)=>{
				exec('uptime -p',(e,stdout)=>{
					resolve(stdout.trim().replace(/\s/g,' ').trim().replace(/up /,''))
				})
			}))
	
			uptimeoutput_2 = await (new Promise(async(resolve)=>{
				exec('uptime -s',(e,stdout)=>{
					resolve(stdout.trim().replace(/\s/g,' ').trim())
				})
			}))
		}

		const msg = `# Device information
		**User:** ${os.userInfo().username}@${os.hostname()}
		**Uptime:** \`${uptimeoutput}, since ${uptimeoutput_2}\`
		**OS:** ${osPrettyName}
		**CPU:** ${sicpu.cores}x ${sicpuspeed.avg}GHz ${sicpu.manufacturer} ${sicpu.brand} ${sicpu.model}
		**CPU Temp:** ${sicputemp.main}°C
		**System:** ${sisys.manufacturer} ${sisys.model}
		**Memory (used/total):** ${formatBytes(simem.used,2)} of ${formatBytes(simem.total,2)}
		**Swap (used/total):** ${formatBytes(simem.swapused,2)} of ${formatBytes(simem.swaptotal,2)}
		**Disk \`${os.type()=='Windows_NT' ? 'C:\\' : "/"}\` (used/total):** ${formatBytes(diskusedroot.size-diskusedroot.free,2)} of ${formatBytes(diskusedroot.size,2)} 
		
		# PrikolsHub.ts
		**Version:** ${require("../../../package.json").version}
		**Proccess ID:** ${process.pid}
		**Working dir:** \`${cwd()}\`

		# AT Protocol (atproto)
		**Loaded Lexicons:** ${Object.keys(getMethods()).length}
		\`\`\`
		${Object.keys(getMethods()).join(', ')}
		\`\`\`
		
		`.replace(/\t/g,'') // HACK
		
		await interaction.followUp(msg);
	},
};
