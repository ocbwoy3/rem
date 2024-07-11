import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	InteractionDeferReplyOptions,
	Client,
	APIEmbed
} from "discord.js";
import { PrikolsHubRuntime, getGlobalRuntime } from "../../api/PrikolsHubCore";
import { Session } from "../../api/Session";

const runtime: PrikolsHubRuntime = (getGlobalRuntime() as PrikolsHubRuntime)

module.exports = {
	gdpr: true,
	moderation_bypass: true,
	data: new SlashCommandBuilder()
		.setName('end_session')
		.setDescription('Ends a session'),
	async execute(interaction: CommandInteraction) {

		let embed: APIEmbed = {
			title: "End Session",
			description: `Attempting to end the session.`,
			color: 0x0000ff
		}

		const ses: Session = (await runtime.getSessionByChannelId(interaction.channelId) as any)
		
		interaction.reply({ embeds: [embed], ephemeral: true })

		ses.EndSession()
	},
};
