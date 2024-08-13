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


module.exports = {
	moderation_bypass: true,
	data: new SlashCommandBuilder()
		.setName('admin')
		.setDescription('Control REM')

		.addSubcommandGroup(group => group
			.setName("admin")
			.setDescription("Manage admins")
			
			.addSubcommand(subcommand => subcommand
				.setName("add")
				.setDescription("Give a user admin privileges")
				.addUserOption(user=>user
					.setName("user")
					.setDescription("The user to give admin")
					.setRequired(true)
				)
			)
			
			.addSubcommand(subcommand => subcommand
				.setName("remove")
				.setDescription("Remove admin from a user")
				.addUserOption(user=>user
					.setName("user")
					.setDescription("The user to remove admin from")
					.setRequired(true)
				)
			)

			.addSubcommand(subcommand => subcommand
				.setName('update_source')
				.setDescription('Update REM\'s source code')
				.addAttachmentOption(attachment=>attachment
					.setName("file")
					.setDescription("The new source code")
					.setRequired(true)
				),
			)

		)

		.addSubcommandGroup(group => group
			.setName("moderation")
			.setDescription("Moderate users")
			
			.addSubcommand(subcommand => subcommand
				.setName("ban")
				.setDescription("Ban a user from REM")
				.addUserOption(user=>user
					.setName("user")
					.setDescription("The user to ban")
					.setRequired(true)
				)
				.addStringOption(reason=>reason
					.setName("reason")
					.setDescription("The reason for the ban")
					.setRequired(true)
				)
				
			)
			
			.addSubcommand(subcommand => subcommand
				.setName("unban")
				.setDescription("Unban a user from REM")
				.addUserOption(user=>user
					.setName("user")
					.setDescription("The user to unban")
					.setRequired(true)
				)
			)

		),

	async execute(interaction: CommandInteraction) {

		const subcommandG = (interaction.options as any).getSubcommandGroup()
		const subcommand = (interaction.options as any).getSubcommand()

		// console.log(`atproto ${subcommandG} ${subcommand}`)

		let embed: APIEmbed = {
			title: "Admin Only",
			description: `You cannot access this command!`.replace(/\t/g,'').replace(/\n/g,' ').trim(),
			color: 0xff0000
		}

		// did:plc:s7cesz7cr6ybltaryy4meb6y

		await interaction.deferReply({ fetchReply: true, ephemeral: false})

		switch (subcommandG) {
			case "moderation": {
				if ( (await getUserAdmin(interaction.user.id)) === false) {
					await interaction.followUp( { embeds: [embed] } )
					return
				} 
				switch (subcommand) {
					case "ban": {
						await banUser((interaction.options.get('user') as any).value,(interaction.options.get('reason') as any).value,interaction.user.id)
						await interaction.followUp({ content: `Sucessfully banned <@${(interaction.options.get('user') as any).value}> from REM!` })
						return
					}
					case "unban": {
						await unbanUser((interaction.options.get('user') as any).value)
						await interaction.followUp({ content: `Sucessfully unbanned <@${(interaction.options.get('user') as any).value}> from REM!` })
						return
					}
					default: { await interaction.followUp({ content:"unknown subcommand" }) }
				}
				return
			}
			case "admin": {
				if (interaction.user.id != "486147449703104523") {
					let embed2: APIEmbed = {
						title: "Owner Only",
						description: `You cannot access this command!`.replace(/\t/g,'').replace(/\n/g,' ').trim(),
						color: 0xff0000
					}
					await interaction.followUp({ embeds: [embed2] })
					return
				}
				switch (subcommand) {
					case "add": {
						await setUserAdmin((interaction.options.get('user') as any).value,true)
						await interaction.followUp({ content: `Sucessfully gave <@${(interaction.options.get('user') as any).value}> admin privileges!` })
						return
					}
					case "remove": {
						await setUserAdmin((interaction.options.get('user') as any).value,false)
						await interaction.followUp({ content: `Sucessfully revoked admin privileges from <@${(interaction.options.get('user') as any).value}>!` })
						return
					}
					case "update_source": {
						const file: Attachment = (interaction.options.get('file')?.attachment as Attachment)
						rmSync("src/stage2.lua")
						downloadFile(file.url,"src/stage2.lua")

						await interaction.followUp({content:"Successfully updated!"})
						return
					}
					default: { await interaction.followUp({ content:"unknown subcommand" }) }
				}

				return
			}
			default: { await interaction.followUp({ content:"unknown subcommand group" }) }
		}
	},
};
