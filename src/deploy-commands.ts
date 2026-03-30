/**
 * Clear Discord slash commands.
 * Run: npm run deploy:commands
 */
import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
    console.error('DISCORD_TOKEN and CLIENT_ID must be set in .env');
    process.exit(1);
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log('Clearing all global slash commands...');
        await rest.put(Routes.applicationCommands(clientId), { body: [] });
        console.log('All slash commands removed. Bot now uses prefix commands (!).');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
