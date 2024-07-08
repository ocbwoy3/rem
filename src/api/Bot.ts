import { version } from "../../package.json";
import * as config from "../../config.json";

import {
	Client,
	GatewayIntentBits,
	User,
	REST,
	Routes,
	RESTPostAPIApplicationCommandsJSONBody,
	Events,
	Collection,
	Interaction,
	APIEmbed,
	APIEmbedField,
	ForumChannel,
	GuildForumThreadCreateOptions,
	MessageCreateOptions,
	ThreadChannel,
	StartThreadOptions,
	MessagePayload
} from "discord.js";
import { CommandModuleExports } from "./Types";
import * as fs from "node:fs";
import * as path from "node:path";
import { PrikolsHubRuntime } from "./PrikolsHubCore";
import { Blacklist } from "../../config.json";
import { Session } from "./Session";
import { downloadFile } from "./Utility";
import { tmpdir } from "node:os";
import { message } from "noblox.js";

export const client: any = (new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent
	]
}) as Client)

async function registerCommands() {
	client.commands = new Collection()

	const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];
	// Grab all the command folders from the commands directory you created earlier
	const foldersPath = path.join(__dirname, '..', 'commands');
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		// Grab all the command files from the commands directory you created earlier
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
		// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command: CommandModuleExports = require(filePath);
			if ('data' in command && 'execute' in command) {
				commands.push(command.data.toJSON());
				client.commands.set(command.data.name, command)
			} else {
				console.warn(`[PrikolsHub/Bot:registerCommands] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}

	// Construct and prepare an instance of the REST module
	const rest = new REST().setToken(process.env.TOKEN as string);

	// and deploy your commands!
	await (async () => {
		try {
			console.log(`[PrikolsHub/Bot:registerCommands] Started refreshing ${commands.length} command(s).`);

			// The put method is used to fully refresh all commands in the guild with the current set
			const data = await rest.put(
				Routes.applicationCommands(process.env.APP_ID as string),
				{ body: commands },
			);

			console.log(`[PrikolsHub/Bot:registerCommands] Successfully reloaded ${(data as any).length} command(s).`);
		} catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error);
		}
	})();
}

client.on('ready', async () => {
	console.log(`[PrikolsHub/Bot:onReady] Logged in as ${(client.user as User).tag}`);
	await client.application.fetch()
	try {
		await registerCommands()
	} catch (e_: any) {
		console.warn(`[PrikolsHub/Bot:onReady] Failed to register commands: ${e_.toString()}`)
	}
	console.log(`[PrikolsHub/Bot:onReady] Bot successfully loaded!`)
});

var executionContext: PrikolsHubRuntime | null = null;

export function setExecutionContext(newContext: PrikolsHubRuntime | null): void {
	executionContext = newContext
}

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
	try {

		if (interaction.isAutocomplete()) return;

		if (interaction.user.id.toString() in Blacklist) {
			
			const reason: [string, string] = (Blacklist as any)[interaction.user.id.toString()]

			// Twitch's "Banned from ..." UX is poorly made, I guess. So remake it in PrikolsHub!

			let embed: APIEmbed = {
				title: ":warning: You are banned.",
				// top tier discord://-/users/1
				// intentionally being vague about how we ban (user id's) by lying to end user so they dont know
				description: `**Banned using account descriptor.**\nYou are unable to use PrikolsHub until a moderator unbans you. You may be able to request an unban at https://ocbwoy3.dev/appeal or by DMing the [owner]( <discord://-/users/${(client as any).application?.owner?.owner?.id || (client as Client).application?.owner?.id}>) of this bot.`,
				color: 0xff0000,
				fields: [
					({ name: "Reason", value: reason[1], inline: false } as APIEmbedField)
				]
			}
			await interaction.reply({ embeds: [embed], ephemeral: true })
			return
		}

		if (interaction.isButton()) {
			// Parse customId
			const customid = ((interaction as any).customId as string)
			// console.log(interaction, customid)
			if (customid.startsWith('accept_mksession|')) {
				const session: Session | null | undefined = await executionContext?.getSessionByJobId(customid.split('|')[1]);
				if (!session) return;

				// CREATE THE CHANNEL!!!!

				const forum: ForumChannel = (await client.channels.fetch(config.SessionForumChannelId) as ForumChannel);

				// download the thumbnail
				const filepath = await downloadFile(session.thumbnailUrl, `${tmpdir()}/prikolshub-temp-${(new Date()).getMilliseconds().toString()}.png`);

				const thread: ThreadChannel = await forum.threads.create({
					name: `${session.JobId.slice(0,5)} - ${session.GameName.slice(0,30)}`,
					message: {
						content: 
							`# [\`${session.GameName}\`]( <${session.gameUrl}> )
							**JobId:** \`${session.JobId}\`
							**lang.session_requests.server_ip:** \`${session.ServerIPAddress}\``.replace(/\t/g,''),
						files: [filepath]
					},
					appliedTags: []
				});

				await session.AcceptSession(thread);
				await interaction.reply({ content: 'Accepted!', ephemeral: true });
				await interaction.message.delete()

				new Promise(async () => {
					await new Promise(f => setTimeout(f, 10000));
					fs.rmSync(filepath);
				})

				return;
			}
			if (customid.startsWith('reject_mksession|')) {
				let session: Session | null | undefined = await executionContext?.getSessionByJobId(customid.split('|')[1]);
				if (!session) return;

				await executionContext?.deleteSessionByJobId(session.JobId)

				await interaction.reply({ content: 'Declined', ephemeral: true });
				await interaction.message.delete()

				return;
			}
			return;
		}

		if (!interaction.isChatInputCommand()) return;

		const command = client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`[PrikolsHub/Bot:interactionHandler] No command matching "${interaction.commandName}" was found, something shady is going on!`);
			await interaction.reply({
				content: `[PrikolsHub.ts] Cannot find command in \`client.commands\`, something shady is going on!`,
				ephemeral: true
			})
			return;
		}

		try {
			await command.execute(interaction, executionContext);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}

	} catch(e_) {
		console.error(e_)
		if (interaction.isAutocomplete()) return;
		try {
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: '[PrikolsHub.ts] Error', ephemeral: true });
			} else {
				await interaction.reply({ content: '[PrikolsHub.ts] Error', ephemeral: true });
			}
		} catch {}
	}
});