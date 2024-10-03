import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	InteractionDeferReplyOptions,
	Client,
	APIEmbed
} from "discord.js";
import { resolveHandleAtprotoData, resolveHandleToDid } from "../../api/atproto/DIDHandleResolver";
import { AtprotoData } from "@atproto/identity";
import { BotOwner } from "../../../config.json";

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

        if (interaction.user.id != BotOwner) {
			await interaction.reply({ embeds: [embed], ephemeral: true })
		}

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
					case "resolve": {
						const data: AtprotoData = await resolveHandleAtprotoData(interaction.options.get('handle')?.value as string)
						await interaction.reply({ content: `\`\`\`\n${JSON.stringify(data,null,"\t")}\n\`\`\`` })
						return
					}
					default: { await interaction.reply({ content:"unknown subcommand" }) }
				}
				return
			}
			default: { await interaction.reply({ content:"unknown subcommand group" }) }
		}
	},
};
