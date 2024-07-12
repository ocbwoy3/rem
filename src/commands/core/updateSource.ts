import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	InteractionDeferReplyOptions,
	Client,
	APIEmbed,
	Attachment,
	CommandInteractionOption
} from "discord.js";
import { downloadFile } from "../../api/Utility";
import { rmSync } from "fs";
import { rm } from "fs/promises";


module.exports = {
	gdpr: true,
	moderation_bypass: true,
	data: new SlashCommandBuilder()
		.setName('update_source')
		.setDescription('Updates the PrikolsHub source code.')
		.addAttachmentOption(attachment=>attachment
			.setName("file")
			.setDescription("The new source code of PrikolsHub.")
			.setRequired(true)
		),
	async execute(interaction: CommandInteraction) {
		
		let embed: APIEmbed = {
			title: "Owner Only",
			description: `This feature is for the owner of PrikolsHub.`.replace(/\t/g,'').replace(/\n/g,' ').trim(),
			color: 0xffff00
		}

		if (interaction.user.id != "486147449703104523") {
			await interaction.reply({ embeds: [embed], ephemeral: true })
		}

		await interaction.reply({content:"Uploading",ephemeral:true})

		const file: Attachment = (interaction.options.get('file')?.attachment as Attachment)
		await rm("src/stage2.lua")
		downloadFile(file.url,"src/stage2.lua")

		await interaction.editReply({content:"Successfully updated PrikolsHub's source code!"})

	},
};
