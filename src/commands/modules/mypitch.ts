import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('mypitch')
    .setDescription('Set your voice pitch')
    .addNumberOption(option =>
        option.setName('pitch')
            .setDescription('Pitch value (-20 to 20)')
            .setRequired(false)
            .setMinValue(-20)
            .setMaxValue(20),
    )
    .addBooleanOption(option =>
        option.setName('reset')
            .setDescription('Reset pitch to default')
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
        server.addMemberSetting(member, 'pitch', 'default');
        await interaction.reply(server.lang('general.auto', { key: 'mypitch' }));
        return;
    }

    const pitchVal = interaction.options.getNumber('pitch');
    if (pitchVal === null) {
        const currentPitch = server.getMemberSetting(member, 'pitch');
        await interaction.reply(server.lang('mypitch.usage', { pitch: currentPitch }));
        return;
    }

    const pitch = Common.numberClamp(pitchVal, -20, 20);
    server.addMemberSetting(member, 'pitch', pitch);
    await interaction.reply(server.lang('mypitch.okay', { pitch }));
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const Common = require('@helpers/common');
    commands.add(new BotCommand({
        command_name: 'mypitch',
        command_arg: 'p',
        execute: (msg: any) => {
            const s = msg.server;
            if (msg.args.length === 0) {
                msg.il8nResponse('mypitch.usage', { pitch: s.getMemberSetting(msg.message.member, 'pitch') });
                return;
            }
            if (msg.args[0] === 'default') {
                s.addMemberSetting(msg.message.member, 'pitch', 'default');
                msg.il8nResponse('general.auto', { key: 'mypitch' });
                return;
            }
            let pitch = parseFloat(msg.content);
            pitch = Common.numberClamp(pitch, -20, 20);
            s.addMemberSetting(msg.message.member, 'pitch', pitch);
            msg.il8nResponse('mypitch.okay', { pitch });
        },
        short_help: 'mypitch.shorthelp',
        long_help: 'mypitch.longhelp',
        group: 'personalization',
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'mypitch' });
}

module.exports = { data, execute, register, unRegister };
