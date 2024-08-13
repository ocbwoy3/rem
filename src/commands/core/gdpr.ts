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
		.setName('gdpr')
		.setDescription('Issue a GDPR request'), // 🇪🇺
	async execute(interaction: CommandInteraction) {

		let embed: APIEmbed = {
			title: "GDPR Not Avaiable",
			description: `This feature is work in progress.`.replace(/\t/g,'').replace(/\n/g,' ').trim(),
			color: 0x0000ff
		}
		await interaction.reply({ embeds: [embed], ephemeral: true })
	},
};
