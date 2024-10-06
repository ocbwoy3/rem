import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	InteractionDeferReplyOptions,
	Client,
	APIEmbed
} from "discord.js";
import { resolveHandleAtprotoData, resolveHandleToDid, updateHandle } from "../../api/atproto/DIDHandleResolver";
import { AtprotoData } from "@atproto/identity";
import { BotOwner, atproto_url } from "../../../config.json";
import { getUserInfo, prisma } from "../../api/db/Prisma";
import { isValidHandle } from "../../api/atproto/HandleUtil";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('atproto')
		.setDescription('Use the AT Protocol')

		.addSubcommandGroup(group => group
			.setName("identity")
			.setDescription("Resolve information")
			
			.addSubcommand(subcommand => subcommand
				.setName("resolve")
				.setDescription("Resolve atproto data from a handle")
				.addStringOption(handle=>handle
					.setName("handle")
					.setDescription("The handle to resolve")
					.setRequired(true)
				)
			)
			
			.addSubcommand(subcommand => subcommand
				.setName("change_handle")
				.setDescription("Changes your atproto handle in the db")
				.addStringOption(handle=>handle
					.setName("new_handle")
					.setDescription("Your new handle")
					.setRequired(true)
				)
			)

		),
	async execute(interaction: CommandInteraction) {

		const subcommandG = (interaction.options as any).getSubcommandGroup()
		const subcommand = (interaction.options as any).getSubcommand()

		// console.log(`atproto ${subcommandG} ${subcommand}`)

		let embed: APIEmbed = {
			title: ":warning: Work in Progress",
			description: `This feature is work in progress. You can contribute at https://github.com/ocbwoy3/rem`.replace(/\t/g,'').replace(/\n/g,' ').trim(),
			color: 0xffff00
		}

		// did:plc:s7cesz7cr6ybltaryy4meb6y

		// if (interaction.user.id != BotOwner) { await interaction.reply({ embeds: [embed], ephemeral: true }) }

		/*

		# Success!

		If you are using a custom domain, you'll need to add a TXT record in your domain's DNS panel:
		Name: `_atproto.ocbwoy3.dev`
		Type: `TXT`
		Content: `did=did:plc:s7cesz7cr6ybltaryy4meb6y`
		
		If you are unable to add a DNS record, you can add a file to your site instead:
		Path: `https://ocbwoy3.dev/.well-known/atproto-did`
		Content: `did:plc:s7cesz7cr6ybltaryy4meb6y`
		
		*/

		switch (subcommandG) {
			case "identity": {
				switch (subcommand) {
					case "change_handle": {
						const new_handle = interaction.options.get('new_handle')?.value as string
						const ud = await getUserInfo(interaction.user.id)

						const isValid = await isValidHandle(new_handle)

						if (isValid !== true) {
							let embed: APIEmbed = {
								title: "Error",
								description: `Your handle is invalid. Try another handle.\n\`\`\`\n${isValid}\n\`\`\``,
								color: 0xff0000
							}
							return interaction.reply({ embeds: [embed], ephemeral: true });
						}

						prisma.user.update({
							where: {
								discordUserId: interaction.user.id
							},
							data: {
								atprotoHandle: new_handle
							}
						}).then(async()=>{

							updateHandle(ud.atprotoDid,ud.atprotoPrivateKey,new_handle)
	
							const stupid = `You'll need to add a DNS record to your domain:
	Name: \`_atproto.${new_handle}\`
	Type: \`TXT\`
	Content: \`did=${ud.atprotoDid}\`
	
	Or add a file to your site:
	Path: \`https://${new_handle}/.well-known/atproto-did\`
	Content: \`${ud.atprotoDid}\`
							`
	
							let embed: APIEmbed = {
								title: "Success",
								description: stupid.replace(/\t/g,'').trim(),
								color: 0x00ff00
							}
	
							if (new_handle.endsWith(atproto_url.replace("*",""))) {
								let embed: APIEmbed = {
									title: "Success",
									description: `Your handle has been successfully changed.\nYour new handle is under \`${atproto_url}\`, the record management was successful.`,
									color: 0x00ff00
								}
								return interaction.reply({ embeds: [embed], ephemeral: true });
							}
	
							return interaction.reply({ embeds: [embed], ephemeral: true });
						}).catch((err: string)=>{
							let embed: APIEmbed = {
								title: "Error",
								description: `Could not update your handle. Most likely it's in use by a different user.\n\`\`\`\n${err}\n\`\`\``,
								color: 0xff0000
							}
							return interaction.reply({ embeds: [embed], ephemeral: true });
						})
					};
					case "resolve": {
						const data: AtprotoData = await resolveHandleAtprotoData(interaction.options.get('handle')?.value as string)
						let embed: APIEmbed = {
							title: "Identity",
							fields: [
								{name: "Handle", inline: false, value: `\`${data.handle}\``},
								{name: "DID", inline: false, value: `\`${data.did}\``},
								{name: "Signing Key", inline: false, value: `\`${data.signingKey}\``},
								{name: "PDS", inline: false, value: `\`${data.pds}\``}
							],
							color: 0x00ff00
						}
						return interaction.reply({ embeds: [embed] });
					};
					default: { await interaction.reply({ content:"unknown subcommand" }) };
				}
				return;
			};
			default: { await interaction.reply({ content:"unknown subcommand group" }) };
		}
	},
};
