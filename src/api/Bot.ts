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
	APIEmbedField
} from "discord.js";
import { CommandModuleExports } from "./Types";
import * as fs from "node:fs";
import * as path from "node:path";
import { PrikolsHubRuntime } from "./PrikolsHubCore";
import { Blacklist } from "../../config.json";

export const client: Client|any = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent
	]
})

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
				client.commands.set(command.data.name,command)
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

client.on('ready', async() => {
	console.log(`[PrikolsHub/Bot:onReady] Logged in as ${(client.user as User).tag}`);
	await client.application.fetch()
	try {
		await registerCommands()
	} catch(e_: any) {
		console.warn(`[PrikolsHub/Bot:onReady] Failed to register commands: ${e_.toString()}`)
	}
	console.log(`[PrikolsHub/Bot:onReady] Bot successfully loaded!`)
});

var executionContext: PrikolsHubRuntime|null = null;

export function setExecutionContext(newContext:PrikolsHubRuntime|null): void {
	executionContext = newContext
}

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
	if (!interaction.isChatInputCommand()) return;

	
	if ( interaction.user.id.toString() in Blacklist ) {
		const reason: [string,string] = (Blacklist as any)[interaction.user.id.toString()]

		// twitch ux be like this, so why not replicate it in prikolshub?

		let embed: APIEmbed = {
			title: ":warning: You are banned from PrikolsHub",
			// top tier discord://-/users/1
			description: `**${reason[0]}** is banned from using PrikolsHub unless unbanned by an administrator.\nYou can appeal by DMing the [owner]( <discord://-/users/${ (client as any).application?.owner?.owner?.id || (client as Client).application?.owner?.id }>) of this bot.`,
			color: 0xff0000,
			fields: [
				({name:"Reason",value:reason[1],inline:false} as APIEmbedField)
			]
		}
		await interaction.reply({embeds:[embed],ephemeral:true})
		return
	}

	const command = client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`[PrikolsHub/Bot:interactionHandler] No command matching "${interaction.commandName}" was found, something shady is going on!`);
		return;
	}

	try {
		await command.execute(interaction,executionContext);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});