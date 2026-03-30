import type { ChatInputCommandInteraction } from 'discord.js';

/**
 * Dispatch map: group -> subcommand -> module filename
 * Maps the slash command structure to the execute() in each module file.
 */
const dispatchMap: Record<string, Record<string, string>> = {
    do: {
        follow: 'follow',
        unfollow: 'unfollow',
        sidle: 'sidle',
        transfer: 'transfer',
        tts: 'tts',
        stop: 'stop',
        mute: 'mute',
        unmute: 'unmute',
    },
    voice: {
        set: 'myvoice',
        get: 'details',
        pitch: 'mypitch',
        speed: 'myspeed',
        title: 'mytitle',
        tolang: 'tolang',
        defaults: 'defaults',
        puberty: 'puberty',
        announceme: 'announceme',
        prefix: 'myprefix',
        suffix: 'mysuffix',
    },
    info: {
        help: 'help',
        ping: 'ping',
        who: 'who',
        invite: 'invite',
        voices: 'voices',
        details: 'details',
        stats: 'stats',
    },
    server: {
        permit: 'permit',
        unpermit: 'unpermit',
        adminrole: 'adminrole',
        commandchar: 'commandchar',
        restrict: 'restrict',
        keep: 'keep',
        sfx: 'sfx',
        textrule: 'textrule',
        bind: 'bind',
        twitch: 'twitch',
    },
    dev: {
        debugbork: 'debugbork',
        evalo: 'evalo',
    },
};

const moduleCache: Record<string, { execute: (i: ChatInputCommandInteraction) => Promise<void> }> = {};

function getModule(moduleName: string): { execute: (i: ChatInputCommandInteraction) => Promise<void> } {
    if (!moduleCache[moduleName]) {
        moduleCache[moduleName] = require('./modules/' + moduleName);
    }
    return moduleCache[moduleName];
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const group = interaction.options.getSubcommandGroup(true);
    const subcommand = interaction.options.getSubcommand(true);

    const groupMap = dispatchMap[group];
    if (!groupMap) {
        await interaction.reply({ content: `Unknown command group: ${group}`, ephemeral: true });
        return;
    }

    const moduleName = groupMap[subcommand];
    if (!moduleName) {
        await interaction.reply({ content: `Unknown subcommand: ${subcommand}`, ephemeral: true });
        return;
    }

    const mod = getModule(moduleName);
    await mod.execute(interaction);
}

export { dispatchMap };

module.exports = { execute, dispatchMap };
