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
import { getGlobalRuntime, PrikolsHubRuntime } from "../../api/PrikolsHubCore";
import { Session } from "../../api/Session";

function genEmbed(title: string, desc:string, col:number): APIEmbed {
	const embed: APIEmbed = {
		title: title,
		description: desc,
		color: col
	}

	return embed
}

const runtime: PrikolsHubRuntime = (getGlobalRuntime() as PrikolsHubRuntime)

module.exports = {
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
		),

	async execute(interaction: CommandInteraction) {

		const subcommand = (interaction.options as any).getSubcommand()

		const ses: Session = (await runtime.getSessionByChannelId(interaction.channelId) as any)
	
		if (!ses) {
			interaction.reply({ embeds: [genEmbed("Error","Current channel is not a session!",0xff0000)], ephemeral: true })
			return
		}

		await interaction.deferReply({ fetchReply: true, ephemeral: false})

		switch (subcommand) {
			case "end": {
				await ses.EndSession()
				await interaction.followUp({ content: `Attempted to end the session!` })
				return
			}
			case "execute": {
				const code: string = (interaction.options.get('code')?.value as string)
				await ses.queueCommands("execute",[code])
				await interaction.followUp({ content: `Attempted to run code!` })
				return
			}
			default: { await interaction.followUp({ content:"unknown subcommand" }) }
		}
	},
};
