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


module.exports = {
	data: new SlashCommandBuilder()
		.setName('atproto')
		.setDescription('Use the AT Protocol')

		.addSubcommandGroup(group => group
			.setName("resolve")
			.setDescription("Resolve information")
			
			.addSubcommand(subcommand => subcommand
				.setName("data")
				.setDescription("Resolve atproto data from a handle")
				.addStringOption(handle=>handle
					.setName("handle")
					.setDescription("The handle to resolve")
					.setRequired(true)
				)
			)
			
			.addSubcommand(subcommand => subcommand
				.setName("did")
				.setDescription("Resolve did from a handle")
				.addStringOption(handle=>handle
					.setName("handle")
					.setDescription("The handle to resolve")
					.setRequired(true)
				)
			)

		),
	async execute(interaction: CommandInteraction) {

		const subcommandG = (interaction.options as any).getSubcommandGroup()
		const subcommand = (interaction.options as any).getSubcommand()

		// console.log(`atproto ${subcommandG} ${subcommand}`)

		let embed: APIEmbed = {
			title: "locale.error.atproto_command_restricted.title",
			description: `locale.error.atproto_command_restricted.text`.replace(/\t/g,'').replace(/\n/g,' ').trim(),
			color: 0xff0000
        }

        // did:plc:s7cesz7cr6ybltaryy4meb6y

        if (interaction.user.id != "486147449703104523") {
			await interaction.reply({ embeds: [embed], ephemeral: true })
		}

		switch (subcommandG) {
			case "resolve": {
				switch (subcommand) {
					case "data": {
						const data: AtprotoData = await resolveHandleAtprotoData(interaction.options.get('handle')?.value as string)
						await interaction.reply({ content: `\`\`\`\n${JSON.stringify(data,null,"\t")}\n\`\`\`` })
						return
					}
					case "did": {
						const data: AtprotoData = await resolveHandleAtprotoData(interaction.options.get('handle')?.value as string)
						await interaction.reply({ content: data.did })
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
