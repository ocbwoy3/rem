import {
	SlashCommandBuilder,
	CommandInteraction, APIEmbed
} from "discord.js";
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
		.setName('troll')
		.setDescription('Trolling commands')
		
		.addSubcommand(subcommand => subcommand
			.setName("chathax")
			.setDescription("Forces a player to say something")
			.addStringOption(code=>code
				.setName("text")
				.setDescription("The text to say")
				.setRequired(true)
			)
			.addStringOption(code=>code
				.setName("owner")
				.setDescription("The player to force chat")
				.setRequired(false)
				.setAutocomplete(true)
			)
		)
		.addSubcommand(subcommand => subcommand
			.setName("robloxterm")
			.setDescription("Forces a player to say a bunch of slurs n shit")
			.addStringOption(code=>code
				.setName("owner")
				.setDescription("The player to robloxterm")
				.setRequired(false)
				.setAutocomplete(true)
			)
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
			case "chathax": {
				if (!(await GetFFlag("DFFlagPublicChathax"))) {
					await interaction.followUp({ content: "Chathax denied, as `DFFlagPublicChathax` is false.", ephemeral: true })
					return
				}
				const text: string = (interaction.options.get('text')?.value as string);
				const owner: string = (interaction.options.get('owner')?.value || "[none]") as string;
				await ses.queueCommands("chathax",[text.slice(0,250),owner.slice(0,25)])
				addToLog("Player chathaxed",{user: interaction.user, session: ses, code: `\`\`\`${text.slice(0,250)}\n\`\`\``, owner: owner.slice(0,25) },0xff00ff);
				await interaction.followUp({ content: `Attempted to chathax!` })
				return
			}
			case "robloxterm": {
				if (!(await GetFFlag("DFFlagPublicChathax"))) {
					await interaction.followUp({ content: "Robloxterm denied, as `DFFlagPublicChathax` is false.", ephemeral: true })
					return
				}
				const owner: string = (interaction.options.get('owner')?.value || "[none]") as string;
				await ses.queueCommands("robloxterm",[owner.slice(0,25)])
				addToLog("Player robloxtermed",{user: interaction.user, session: ses, owner: owner.slice(0,25) },0xff00ff);
				await interaction.followUp({ content: `Attempted to robloxterm!` })
				return
			}

			default: { await interaction.followUp({ content:"unknown subcommand" }) }
		}
	},
};
