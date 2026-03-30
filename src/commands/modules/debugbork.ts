import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('debugbork')
    .setDescription('Kill the bot (dev only)')
    .addIntegerOption(option =>
        option.setName('minutes')
            .setDescription('Minutes before shutdown')
            .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');

    const devIds = process.env.DEV_IDS?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const isDev = devIds.indexOf(interaction.user.id) >= 0;
    if (!isDev) {
        await interaction.reply({ content: 'Dev only command.', ephemeral: true });
        return;
    }

    const minutes = interaction.options.getInteger('minutes');
    if (minutes && minutes * 60000 > 59999) {
        for (const serverId in world.servers) {
            if (world.servers[serverId].inChannel()) {
                world.servers[serverId].talk('The bot is rebooting in ' + minutes + ' minutes');
            }
        }
        setTimeout(() => { world.kill('debugbork ' + minutes); }, minutes * 60000);
        await interaction.reply({ content: `Shutdown scheduled in ${minutes} minutes.`, ephemeral: true });
    } else {
        world.kill('debugbork');
        await interaction.reply({ content: 'Shutting down now.', ephemeral: true });
    }
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'debugbork',
        execute: (msg: any) => {
            if (!msg.ownerIsDev()) return;
            if (msg.args[0] * 60000 > 59999) {
                for (const sid in msg.world.servers) {
                    if (msg.world.servers[sid].inChannel()) {
                        msg.world.servers[sid].talk('The bot is rebooting in ' + msg.args[0] + ' minutes');
                    }
                }
                setTimeout(() => { msg.world.kill('debugbork ' + msg.args[0]); }, msg.args[0] * 60000);
            } else {
                msg.world.kill('debugbork');
            }
        },
        short_help: 'debugbork.shorthelp',
        long_help: 'debugbork.longhelp',
        hidden: true,
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'debugbork' });
}

module.exports = { data, execute, register, unRegister };
