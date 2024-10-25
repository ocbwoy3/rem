import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	InteractionDeferReplyOptions,
	Client,
	APIEmbed,
	Attachment
} from "discord.js";
import { banUser, getUserAdmin, setUserAdmin, unbanUser } from "../../api/db/Prisma";
import { rm, rmSync } from "node:fs";
import { downloadFile } from "../../api/Utility";
import { getGlobalRuntime, REMRuntime } from "../../api/REMCore";
import { Session } from "../../api/Session";
import { GetFFlag } from "../../api/db/FFlags";
import { addToLog } from "../../api/Bot";

function genEmbed(title: string, desc:string, col:number): APIEmbed {
	const embed: APIEmbed = {
		title: title,
		description: desc,
		color: col
	}

	return embed
}

const runtime: REMRuntime = (getGlobalRuntime() as REMRuntime)

export default {
	data: new SlashCommandBuilder()
		.setName('session')
		.setDescription('Control the session')

		.addSubcommand(subcommand => subcommand
			.setName("end")
			.setDescription("End the session")
		)
		
		.addSubcommand(subcommand => subcommand
			.setName("execute")
			.setDescription("Run lua code in the session")
			.addStringOption(code=>code
				.setName("code")
				.setDescription("The code to run")
				.setRequired(true)
			)
			.addStringOption(code=>code
				.setName("owner")
				.setDescription("The owner variable of the running code")
				.setRequired(false)
				.setAutocomplete(true)
			)
		)

		.addSubcommand(subcommand => subcommand
			.setName("kick")
			.setDescription("Kick a player from the server")
			.addStringOption(code=>code
				.setName("player")
				.setDescription("The player to kick")
				.setAutocomplete(true)
				.setRequired(true)
			)
			.addStringOption(code=>code
				.setName("reason")
				.setDescription("Optionally show a reason for the kick")
				.setRequired(false)
			)
		)
		
		.addSubcommand(subcommand => subcommand
			.setName("bufferkill")
			.setDescription("Kills the server with buffers")
		),

	async execute(interaction: CommandInteraction) {

		const subcommand = (interaction.options as any).getSubcommand()

		const ses: Session = (await runtime.getSessionByChannelId(interaction.channelId) as any)
	
		if (!ses) {
			interaction.reply({ embeds: [genEmbed("Error","Current channel is not a session!",0xff0000)], ephemeral: true }).catch(()=>{});
			return
		}

		await interaction.deferReply({ fetchReply: true, ephemeral: false})

		switch (subcommand) {
			case "end": {
				await ses.EndSession()
				addToLog("Session Ended",{user: interaction.user, session: ses },0xff0000);
				await interaction.followUp({ content: `Attempted to end the session!` })
				return
			}
			case "kick": {
				const plr: string = (interaction.options.get('owner')?.value || "[none]") as string;
				const reason: string = (interaction.options.get('reason')?.value || "You have been kicked from the server.") as string;
				await ses.queueCommands("kick",[plr.slice(0,25),reason.slice(0,100)])
				addToLog("Player Kicked",{user: interaction.user, session: ses, owner: plr.slice(0,25), reason: reason.slice(0,100) },0xff00ff);
				await interaction.followUp({ content: `Attempted to run code!` })
				return
			}
			case "execute": {
				if (!(await GetFFlag("DFFlagPublicExecute"))) {
					await interaction.followUp({ content: "Code execution denied, as `DFFlagPublicExecute` is false.", ephemeral: true })
					return
				}
				const code: string = (interaction.options.get('code')?.value as string);
				const owner: string = (interaction.options.get('owner')?.value || "[none]") as string;
				await ses.queueCommands("execute",[code.slice(0,250),owner.slice(0,25)])
				addToLog("Code Executed",{user: interaction.user, session: ses, code: `\`\`\`lua\n${code.slice(0,250)}\n\`\`\``, owner: owner.slice(0,25) },0xff00ff);
				await interaction.followUp({ content: `Attempted to run code!` })
				return
			}

			case "bufferkill": {
				await ses.queueCommands("killserver_buf")
				addToLog("Server Crashed (Buffer Spam)",{user: interaction.user, session: ses },0xff0000);
				await interaction.followUp({ content: `Attempted to crash server by creating buffers.` })
				return
			}

			default: { await interaction.followUp({ content:"unknown subcommand" }) }
		}
	},
};
