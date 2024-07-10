import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	InteractionDeferReplyOptions,
	Client,
	APIEmbed
} from "discord.js";


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
		await interaction.reply({ embeds: [embed], ephemeral: true })
	},
};
