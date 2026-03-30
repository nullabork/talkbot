import {
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
    SlashCommandSubcommandGroupBuilder,
} from 'discord.js';

/**
 * Single root /talkbot command with subcommand groups.
 *
 * Discord requires: if ANY subcommand groups exist, ALL subcommands must be in groups.
 * You cannot mix flat subcommands with groups on the same command.
 *
 * Groups:
 *   /talkbot follow        (core bot control)
 *   /talkbot voice set     (personal voice settings)
 *   /talkbot info ping     (information commands)
 *   /talkbot server permit (server admin)
 *   /talkbot dev debugbork (developer only)
 */
export const data = new SlashCommandBuilder()
    .setName('talkbot')
    .setDescription('TalkBot text-to-speech commands')

    // ── core control (no extra group label needed — but Discord requires one)
    // Using short name so it feels close to flat: /talkbot do follow
    .addSubcommandGroup((group: SlashCommandSubcommandGroupBuilder) =>
        group
            .setName('do')
            .setDescription('Bot control')
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('follow').setDescription('Bot joins your voice channel'),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('unfollow').setDescription('Bot leaves voice channel'),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('sidle').setDescription('Take over as master'),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('transfer').setDescription('Transfer master to another user')
                    .addUserOption(opt => opt.setName('user').setDescription('User to transfer to').setRequired(true)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('tts').setDescription('Force the bot to speak a message')
                    .addStringOption(opt => opt.setName('message').setDescription('Message to speak').setRequired(true)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('stop').setDescription('Stop the bot speaking')
                    .addBooleanOption(opt => opt.setName('all').setDescription('Stop all queued messages').setRequired(false)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('mute').setDescription('Mute yourself or a user')
                    .addUserOption(opt => opt.setName('user').setDescription('User to mute').setRequired(false)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('unmute').setDescription('Unmute yourself or a user')
                    .addUserOption(opt => opt.setName('user').setDescription('User to unmute').setRequired(false)),
            ),
    )

    // ── voice settings ────────────────────────────────────────
    .addSubcommandGroup((group: SlashCommandSubcommandGroupBuilder) =>
        group
            .setName('voice')
            .setDescription('Personal voice settings')
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('set').setDescription('Set your TTS voice')
                    .addStringOption(opt => opt.setName('voice').setDescription('Voice name').setRequired(true)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('pitch').setDescription('Set voice pitch (-20 to 20)')
                    .addNumberOption(opt => opt.setName('value').setDescription('Pitch value').setRequired(false).setMinValue(-20).setMaxValue(20))
                    .addBooleanOption(opt => opt.setName('reset').setDescription('Reset to default').setRequired(false)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('speed').setDescription('Set voice speed (0.25 to 4.0)')
                    .addNumberOption(opt => opt.setName('value').setDescription('Speed value').setRequired(false).setMinValue(0.25).setMaxValue(4.0))
                    .addBooleanOption(opt => opt.setName('reset').setDescription('Reset to default').setRequired(false)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('title').setDescription('Set your announcement title')
                    .addStringOption(opt => opt.setName('title').setDescription('Title text').setRequired(false)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('tolang').setDescription('Set translation language')
                    .addStringOption(opt => opt.setName('language').setDescription('Language code (en, fr, de)').setRequired(true)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('get').setDescription('Show your current voice settings'),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('defaults').setDescription('Reset all voice settings'),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('puberty').setDescription('Toggle random pitch/speed')
                    .addStringOption(opt => opt.setName('toggle').setDescription('On or off').setRequired(true)
                        .addChoices({ name: 'on', value: 'on' }, { name: 'off', value: 'off' })),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('announceme').setDescription('Toggle join/leave announcements')
                    .addStringOption(opt => opt.setName('toggle').setDescription('On or off').setRequired(true)
                        .addChoices({ name: 'on', value: 'on' }, { name: 'off', value: 'off' })),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('prefix').setDescription('Set message prefix')
                    .addStringOption(opt => opt.setName('action').setDescription('Action').setRequired(true)
                        .addChoices({ name: 'on', value: 'on' }, { name: 'off', value: 'off' }, { name: 'set', value: 'set' }))
                    .addStringOption(opt => opt.setName('text').setDescription('Prefix text (for set)').setRequired(false)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('suffix').setDescription('Set message suffix')
                    .addStringOption(opt => opt.setName('action').setDescription('Action').setRequired(true)
                        .addChoices({ name: 'on', value: 'on' }, { name: 'off', value: 'off' }, { name: 'set', value: 'set' }))
                    .addStringOption(opt => opt.setName('text').setDescription('Suffix text (for set)').setRequired(false)),
            ),
    )

    // ── info ──────────────────────────────────────────────────
    .addSubcommandGroup((group: SlashCommandSubcommandGroupBuilder) =>
        group
            .setName('info')
            .setDescription('Information and help')
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('help').setDescription('Show available commands'),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('ping').setDescription('Check if the bot is alive'),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('who').setDescription('Show master and permitted users'),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('invite').setDescription('Get bot invite link'),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('voices').setDescription('Browse available voices')
                    .addStringOption(opt => opt.setName('search').setDescription('Search filter').setRequired(false)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('details').setDescription('Show voice settings')
                    .addUserOption(opt => opt.setName('user').setDescription('User to inspect').setRequired(false)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('stats').setDescription('Show TTS statistics')
                    .addBooleanOption(opt => opt.setName('daily').setDescription('Sort by daily').setRequired(false)),
            ),
    )

    // ── server admin ──────────────────────────────────────────
    .addSubcommandGroup((group: SlashCommandSubcommandGroupBuilder) =>
        group
            .setName('server')
            .setDescription('Server management')
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('permit').setDescription('Permit a user')
                    .addUserOption(opt => opt.setName('user').setDescription('User to permit').setRequired(true)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('unpermit').setDescription('Remove user permission')
                    .addUserOption(opt => opt.setName('user').setDescription('User to unpermit').setRequired(true)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('adminrole').setDescription('Set admin role')
                    .addRoleOption(opt => opt.setName('role').setDescription('Admin role').setRequired(true)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('commandchar').setDescription('Set prefix character')
                    .addStringOption(opt => opt.setName('char').setDescription('New character').setRequired(false)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('restrict').setDescription('Restrict to specific channels')
                    .addChannelOption(opt => opt.setName('channel').setDescription('Channel').setRequired(false)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('keep').setDescription('Auto-delete old messages')
                    .addStringOption(opt => opt.setName('count').setDescription('Messages to keep, or "all"').setRequired(true)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('sfx').setDescription('Manage sound effects')
                    .addStringOption(opt => opt.setName('action').setDescription('Action').setRequired(true)
                        .addChoices({ name: 'set', value: 'set' }, { name: 'list', value: 'list' }, { name: 'del', value: 'del' }, { name: 'clearall', value: 'clearall' }, { name: 'play', value: 'play' }))
                    .addStringOption(opt => opt.setName('word').setDescription('Trigger word').setRequired(false))
                    .addStringOption(opt => opt.setName('url').setDescription('Sound URL').setRequired(false)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('textrule').setDescription('Manage text rules')
                    .addStringOption(opt => opt.setName('action').setDescription('Action').setRequired(true)
                        .addChoices({ name: 'add', value: 'add' }, { name: 'addregex', value: 'addregex' }, { name: 'list', value: 'list' }, { name: 'del', value: 'del' }, { name: 'clearall', value: 'clearall' }))
                    .addStringOption(opt => opt.setName('find').setDescription('Text to find').setRequired(false))
                    .addStringOption(opt => opt.setName('replacement').setDescription('Replacement').setRequired(false)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('bind').setDescription('Manage auto-follow bindings')
                    .addStringOption(opt => opt.setName('action').setDescription('Action').setRequired(true)
                        .addChoices({ name: 'show', value: 'show' }, { name: 'add', value: 'add' }, { name: 'remove', value: 'remove' }, { name: 'permit', value: 'permit' }, { name: 'unpermit', value: 'unpermit' }, { name: 'echo', value: 'echo' }))
                    .addStringOption(opt => opt.setName('id').setDescription('Channel, user, or role').setRequired(false)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('twitch').setDescription('Manage Twitch integration')
                    .addStringOption(opt => opt.setName('action').setDescription('Action').setRequired(true)
                        .addChoices({ name: 'permit', value: 'permit' }, { name: 'unpermit', value: 'unpermit' }))
                    .addStringOption(opt => opt.setName('channel').setDescription('Twitch channel').setRequired(true))
                    .addStringOption(opt => opt.setName('who').setDescription('mods, subs, all, or username').setRequired(true)),
            ),
    )

    // ── dev ───────────────────────────────────────────────────
    .addSubcommandGroup((group: SlashCommandSubcommandGroupBuilder) =>
        group
            .setName('dev')
            .setDescription('Developer commands')
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('debugbork').setDescription('Kill the bot')
                    .addIntegerOption(opt => opt.setName('minutes').setDescription('Delay').setRequired(false)),
            )
            .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
                sub.setName('evalo').setDescription('Evaluate code')
                    .addStringOption(opt => opt.setName('code').setDescription('JavaScript code').setRequired(true)),
            ),
    ) as SlashCommandBuilder;

/**
 * /tb alias — identical structure, shorter name.
 * Discord doesn't support command aliases, so we register a second command.
 */
export const tbData = new SlashCommandBuilder()
    .setName('tb')
    .setDescription('TalkBot shortcut (alias for /talkbot)');

// Copy all options from /talkbot to /tb
for (const option of data.options) {
    (tbData as any).options.push(option);
}

module.exports = { data, tbData };
