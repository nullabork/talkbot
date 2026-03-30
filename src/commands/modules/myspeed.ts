import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('myspeed')
    .setDescription('Set your voice speed')
    .addNumberOption(option =>
        option.setName('speed')
            .setDescription('Speed value (0.25 to 4.0)')
            .setRequired(false)
            .setMinValue(0.25)
            .setMaxValue(4.0),
    )
    .addBooleanOption(option =>
        option.setName('reset')
            .setDescription('Reset speed to default')
            .setRequired(false),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const Common = require('@helpers/common');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const reset = interaction.options.getBoolean('reset');
    if (reset) {
        server.addMemberSetting(member, 'speed', 'default');
        await interaction.reply(server.lang('general.auto', { key: 'myspeed' }));
        return;
    }

    const speedVal = interaction.options.getNumber('speed');
    if (speedVal === null) {
        const currentSpeed = server.getMemberSetting(member, 'speed') || 'default';
        await interaction.reply(server.lang('myspeed.usage', { speed: currentSpeed }));
        return;
    }

    const speed = Common.numberClamp(speedVal, 0.25, 4.0);
    server.addMemberSetting(member, 'speed', speed);
    await interaction.reply(server.lang('myspeed.okay', { speed }));
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const Common = require('@helpers/common');
    commands.add(new BotCommand({
        command_name: 'myspeed',
        command_arg: 's',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            if (msg.args.length === 0) {
                msg.il8nResponse('myspeed.usage', { speed: s.getMemberSetting(m, 'speed') || 'default' });
                return;
            }
            if (msg.args[0] === 'default') {
                s.addMemberSetting(m, 'speed', 'default');
                msg.il8nResponse('general.auto', { key: 'myspeed' });
                return;
            }
            let speed = parseFloat(msg.args[0]);
            speed = Common.numberClamp(speed, 0.25, 4.0);
            s.addMemberSetting(m, 'speed', speed);
            msg.il8nResponse('myspeed.okay', { speed });
        },
        short_help: 'myspeed.shorthelp',
        long_help: 'myspeed.longhelp',
        group: 'personalization',
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'myspeed' });
}

module.exports = { data, execute, register, unRegister };
