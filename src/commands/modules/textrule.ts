import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('textrule')
    .setDescription('Manage text replacement rules')
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('add')
            .setDescription('Add a text replacement rule')
            .addStringOption(opt => opt.setName('find').setDescription('Text to find').setRequired(true))
            .addStringOption(opt => opt.setName('replacement').setDescription('Replacement text').setRequired(true)),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('addregex')
            .setDescription('Add a regex replacement rule')
            .addStringOption(opt => opt.setName('pattern').setDescription('Regex pattern to find').setRequired(true))
            .addStringOption(opt => opt.setName('replacement').setDescription('Replacement text').setRequired(true)),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('list')
            .setDescription('List all text rules'),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('del')
            .setDescription('Delete a text rule')
            .addStringOption(opt => opt.setName('find').setDescription('Rule to delete').setRequired(true)),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('clearall')
            .setDescription('Remove all text rules'),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const Common = require('@helpers/common');
    const CommentBuilder = require('@models/CommentBuilder');
    const botStuff = require('@helpers/bot-stuff');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const sub = interaction.options.getString('action') || interaction.options.getSubcommand();

    if (sub === 'add') {
        if (!botStuff.canManageTheServer(server, member) && !botStuff.canManageTheBot(server, member)) {
            await interaction.reply({ content: server.lang('textrule.nope'), ephemeral: true }); return;
        }
        const find = interaction.options.getString('find', true);
        const replacement = interaction.options.getString('replacement', true);
        server.addSettings('textrules', { [Common.escapeRegExp(find.toLowerCase())]: replacement });
        server.save();
        await interaction.reply(server.lang('textrule.addokay', { find }));
    } else if (sub === 'addregex') {
        if (!botStuff.canManageTheServer(server, member) && !botStuff.canManageTheBot(server, member)) {
            await interaction.reply({ content: server.lang('textrule.nope'), ephemeral: true }); return;
        }
        const pattern = interaction.options.getString('pattern') || interaction.options.getString('find', true);
        const replacement = interaction.options.getString('replacement', true);
        server.addSettings('textrules', { [pattern]: replacement });
        server.save();
        await interaction.reply(server.lang('textrule.addokay', { find: pattern }));
    } else if (sub === 'list') {
        const rules = server.textrules || {};
        if (!Object.keys(rules).length) {
            await interaction.reply(server.lang('textrule.norules')); return;
        }
        const b = CommentBuilder.create({
            data: { _header: 'Your voice text replacements', _data: rules },
            formatKey: false,
        });
        await interaction.reply(b);
    } else if (sub === 'del') {
        if (!botStuff.canManageTheServer(server, member) && !botStuff.canManageTheBot(server, member)) {
            await interaction.reply({ content: server.lang('textrule.nope'), ephemeral: true }); return;
        }
        const find = interaction.options.getString('find', true);
        const rules = server.textrules || {};
        if (!rules[find]) {
            await interaction.reply(server.lang('textrule.none', { find })); return;
        }
        delete server.textrules[find];
        server.save();
        await interaction.reply(server.lang('textrule.delokay', { find }));
    } else if (sub === 'clearall') {
        if (!botStuff.canManageTheServer(server, member) && !botStuff.canManageTheBot(server, member)) {
            await interaction.reply({ content: server.lang('textrule.nope'), ephemeral: true }); return;
        }
        server.textrules = {};
        server.save();
        await interaction.reply(server.lang('textrule.clearallokay'));
    }
}

// Message listener for TTS pipeline
function onMessage({ content, modified, server }: any): string | null {
    content = modified || content;
    if (!content) return null;
    for (const textrule in server.textrules) {
        const re = new RegExp(textrule, 'gi');
        content = content.replace(re, server.textrules[textrule]);
    }
    return content;
}

export const listeners = {
    message: onMessage,
};

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const Common = require('@helpers/common');
    const CommentBuilder = require('@models/CommentBuilder');
    const botStuff = require('@helpers/bot-stuff');
    commands.add(new BotCommand({
        command_name: 'textrule',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            if (!msg.args || msg.args.length === 0) { msg.il8nResponse('textrule.usage'); return; }
            const sub = msg.args[0].toLowerCase();
            if (sub === 'add') {
                if (!botStuff.canManageTheServer(s, m) && !botStuff.canManageTheBot(s, m)) { msg.il8nResponse('textrule.nope'); return; }
                if (msg.args.length < 3) { msg.il8nResponse('textrule.usage'); return; }
                const find = msg.args[1];
                const replacement = msg.args.slice(2).join(' ');
                s.addSettings('textrules', { [Common.escapeRegExp(find.toLowerCase())]: replacement });
                s.save();
                msg.il8nResponse('textrule.addokay', { find });
            } else if (sub === 'addregex') {
                if (!botStuff.canManageTheServer(s, m) && !botStuff.canManageTheBot(s, m)) { msg.il8nResponse('textrule.nope'); return; }
                if (msg.args.length < 3) { msg.il8nResponse('textrule.usage'); return; }
                const pattern = msg.args[1];
                const replacement = msg.args.slice(2).join(' ');
                s.addSettings('textrules', { [pattern]: replacement });
                s.save();
                msg.il8nResponse('textrule.addokay', { find: pattern });
            } else if (sub === 'list') {
                const rules = s.textrules || {};
                if (!Object.keys(rules).length) { msg.il8nResponse('textrule.norules'); return; }
                msg.response(CommentBuilder.create({
                    data: { _header: 'Your voice text replacements', _data: rules },
                    formatKey: false,
                }));
            } else if (sub === 'del' || sub === 'delete' || sub === 'remove') {
                if (!botStuff.canManageTheServer(s, m) && !botStuff.canManageTheBot(s, m)) { msg.il8nResponse('textrule.nope'); return; }
                if (msg.args.length < 2) { msg.il8nResponse('textrule.usage'); return; }
                const find = msg.args[1];
                const rules = s.textrules || {};
                if (!rules[find]) { msg.il8nResponse('textrule.none', { find }); return; }
                delete s.textrules[find];
                s.save();
                msg.il8nResponse('textrule.delokay', { find });
            } else if (sub === 'clearall') {
                if (!botStuff.canManageTheServer(s, m) && !botStuff.canManageTheBot(s, m)) { msg.il8nResponse('textrule.nope'); return; }
                s.textrules = {};
                s.save();
                msg.il8nResponse('textrule.clearallokay');
            } else {
                msg.il8nResponse('textrule.usage');
            }
        },
        short_help: 'textrule.shorthelp',
        long_help: 'textrule.longhelp',
        group: 'server',
        listeners: {
            message: onMessage,
        },
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'textrule' });
}

module.exports = { data, execute, listeners, register, unRegister };
