import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('sfx')
    .setDescription('Manage sound effects')
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('set')
            .setDescription('Set a sound effect for a word or emoji')
            .addStringOption(opt => opt.setName('word').setDescription('Word or emoji trigger').setRequired(true))
            .addStringOption(opt => opt.setName('url').setDescription('HTTPS URL to sound file').setRequired(true)),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('list')
            .setDescription('List all sound effects'),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('del')
            .setDescription('Delete a sound effect')
            .addStringOption(opt => opt.setName('word').setDescription('Word or emoji to remove').setRequired(true)),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('clearall')
            .setDescription('Remove all sound effects'),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('play')
            .setDescription('Play a sound effect')
            .addStringOption(opt => opt.setName('word').setDescription('Word, emoji, or URL to play').setRequired(true)),
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

    if (sub === 'set') {
        if (!botStuff.canManageTheServer(server, member)) {
            await interaction.reply({ content: server.lang('sfx.nope'), ephemeral: true }); return;
        }
        const word = interaction.options.getString('word');
        const url = interaction.options.getString('url');
        if (!word || !url) { await interaction.reply({ content: 'Both word and url are required for set.', ephemeral: true }); return; }
        if (url.substring(0, 5) !== 'https') {
            await interaction.reply(server.lang('sfx.needshttps')); return;
        }
        server.audioEmojis[word] = url;
        server.save();
        await interaction.reply(server.lang('sfx.okay', { sfx_word: word }));
    } else if (sub === 'list') {
        const sfx = server.audioEmojis || {};
        if (!Object.keys(sfx).length) {
            await interaction.reply(server.lang('sfx.nosfx')); return;
        }
        const b = CommentBuilder.create({
            data: { _header: 'Your server sound effects', _data: sfx },
            formatKey: false,
        });
        await interaction.reply(b);
    } else if (sub === 'del') {
        if (!botStuff.canManageTheServer(server, member)) {
            await interaction.reply({ content: server.lang('sfx.nope'), ephemeral: true }); return;
        }
        const word = interaction.options.getString('word');
        if (!word) { await interaction.reply({ content: 'Word is required for del.', ephemeral: true }); return; }
        if (!server.audioEmojis[word]) {
            await interaction.reply(server.lang('sfx.none', { sfx_word: word })); return;
        }
        delete server.audioEmojis[word];
        server.save();
        await interaction.reply(server.lang('sfx.notnotokay', { sfx_word: word }));
    } else if (sub === 'clearall') {
        if (!botStuff.canManageTheServer(server, member)) {
            await interaction.reply({ content: server.lang('sfx.nope'), ephemeral: true }); return;
        }
        server.audioEmojis = {};
        server.save();
        await interaction.reply(server.lang('sfx.clearallokay'));
    } else if (sub === 'play') {
        const word = interaction.options.getString('word');
        if (!word) { await interaction.reply({ content: 'Word is required for play.', ephemeral: true }); return; }
        const sfxs = server.audioEmojis || {};
        if (Common.isURL(word)) {
            server.talk(Common.makeAudioSSML(word), server.getMemberSettings(member));
            await interaction.reply({ content: 'Playing...', ephemeral: true });
        } else if (sfxs[word]) {
            server.talk(Common.makeAudioSSML(sfxs[word]), server.getMemberSettings(member));
            await interaction.reply({ content: 'Playing...', ephemeral: true });
        } else {
            await interaction.reply({ content: 'SFX not found.', ephemeral: true });
        }
    }
}

// Token listener for TTS pipeline
function onToken({ token, modified, server }: any): string | null {
    const Common = require('@helpers/common');
    token = modified || token;
    if (!server.audioEmojis) return null;
    if (server.audioEmojis[token] && server.audioEmojis.hasOwnProperty(token)) {
        return Common.makeAudioSSML(server.audioEmojis[token]);
    }
    return null;
}

export const listeners = {
    token: onToken,
};

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const Common = require('@helpers/common');
    const CommentBuilder = require('@models/CommentBuilder');
    const botStuff = require('@helpers/bot-stuff');
    commands.add(new BotCommand({
        command_name: 'sfx',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            if (!msg.args || msg.args.length === 0) {
                msg.il8nResponse('sfx.usage');
                return;
            }
            const sub = msg.args[0].toLowerCase();
            if (sub === 'set' || sub === 'add') {
                if (!botStuff.canManageTheServer(s, m)) { msg.il8nResponse('sfx.nope'); return; }
                if (msg.args.length < 3) { msg.il8nResponse('sfx.usage'); return; }
                const word = msg.args[1];
                const url = msg.args[2];
                if (url.substring(0, 5) !== 'https') { msg.il8nResponse('sfx.needshttps'); return; }
                s.audioEmojis[word] = url;
                s.save();
                msg.il8nResponse('sfx.okay', { sfx_word: word });
            } else if (sub === 'list') {
                const sfx = s.audioEmojis || {};
                if (!Object.keys(sfx).length) { msg.il8nResponse('sfx.nosfx'); return; }
                msg.response(CommentBuilder.create({
                    data: { _header: 'Your server sound effects', _data: sfx },
                    formatKey: false,
                }));
            } else if (sub === 'del' || sub === 'delete' || sub === 'remove') {
                if (!botStuff.canManageTheServer(s, m)) { msg.il8nResponse('sfx.nope'); return; }
                if (msg.args.length < 2) { msg.il8nResponse('sfx.usage'); return; }
                const word = msg.args[1];
                if (!s.audioEmojis[word]) { msg.il8nResponse('sfx.none', { sfx_word: word }); return; }
                delete s.audioEmojis[word];
                s.save();
                msg.il8nResponse('sfx.notnotokay', { sfx_word: word });
            } else if (sub === 'clearall') {
                if (!botStuff.canManageTheServer(s, m)) { msg.il8nResponse('sfx.nope'); return; }
                s.audioEmojis = {};
                s.save();
                msg.il8nResponse('sfx.clearallokay');
            } else if (sub === 'play') {
                if (msg.args.length < 2) { msg.il8nResponse('sfx.usage'); return; }
                const word = msg.args[1];
                const sfxs = s.audioEmojis || {};
                if (Common.isURL(word)) {
                    s.talk(Common.makeAudioSSML(word), s.getMemberSettings(m));
                } else if (sfxs[word]) {
                    s.talk(Common.makeAudioSSML(sfxs[word]), s.getMemberSettings(m));
                } else {
                    msg.il8nResponse('sfx.none', { sfx_word: word });
                }
            } else {
                msg.il8nResponse('sfx.usage');
            }
        },
        short_help: 'sfx.shorthelp',
        long_help: 'sfx.longhelp',
        group: 'server',
        listeners: {
            token: onToken,
        },
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'sfx' });
}

module.exports = { data, execute, listeners, register, unRegister };
