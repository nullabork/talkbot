/*jshint esversion: 9 */
// models
var BotCommand = require('@models/BotCommand'),
    auth = require('@auth');


/* * *
 * Command: follow
 *
 * The bot will listen and respond to command writer if no other person is
 * master
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 * * */
async function follow(msg) {
    const server = msg.server;

    let member = msg.message.member;

    if (server.connecting) return msg.il8nResponse('follow.connecting');
    if (server.leaving) return msg.il8nResponse('follow.leaving');
    if (server.isBound()) {
        if (!server.isMaster(member)) {
            msg.il8nResponse('follow.nope', { name: server.bound_to.displayName });
        } else {
            msg.il8nResponse('follow.huh');
        }
    } else {
        if (member.voice && member.voice.channel) {
            if (!member.voice.channel.joinable) return msg.il8nResponse('follow.permissions');

            if (exceeded_daily_limit(server)) return msg.il8nResponse('follow.limitexceeded');

            const errorFunc = (error) => {
                msg.il8nResponse('follow.error');
                Common.error(error);
                server.release();
            };

            server.setMaster(member);
            const connection = await server.joinVoiceChannel(member.voice.channel);

            if (!connection) {
                msg.il8nResponse('follow.error');
                server.release();
                return;
            }

            server.addMemberSetting(member, 'toLanguage', 'default');
            commands.notify('follow', { member: member, server: server });
            msg.il8nResponse('follow.okay');

            // unmute them if they're muted
            if (server.getMemberSetting(member, 'muted')) {
                server.addMemberSetting(member, 'muted', false);
                msg.il8nResponse('mute.unmuted');
            }
        } else {
            msg.il8nResponse('follow.join');
        }
    }
}

function exceeded_daily_limit(server) {
    if (!server.dailyStats) return false;
    var char_count = server.dailyStats[server.dailyStats.length - 1].characterCount;
    if (!char_count) return false;
    if (!auth.servers || !auth.servers[server.server_id] || !auth.servers[server.server_id].daily_char_limit)
        return false;
    if (auth.servers[server.server_id].daily_char_limit <= 0) return false;
    return char_count < auth.servers[server.server_id].daily_char_limit;
}

function should_pester(server) {
    var threshold = auth.pester_threshold;
    if (auth.servers && auth.servers[server.server_id] && auth.servers[server.server_id].pester_threshold)
        threshold = auth.servers[server.server_id].pester_threshold;

    return server.stats.characterCount > threshold && threshold > 0 && !server.pestered;
}

/* * *
 * Command: unfollow
 *
 * The bot will stop following the command writer is they are the master
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 * * */
function unfollow(msg) {
    var server = msg.server;

    if (server.connecting) return msg.il8nResponse('unfollow.connecting');
    if (server.leaving) return msg.il8nResponse('unfollow.leaving');

    if (!server.isBound()) {
        msg.il8nResponse('unfollow.none');
        return;
    }

    if (!msg.ownerIsMaster()) {
        msg.il8nResponse('unfollow.nope');
        return;
    }

    server.release(() => {
        commands.notify('unfollow', { member: msg.message.member, server: server });

        // using it alot - consider donating!
        if (auth.pester_threshold && should_pester(server)) {
            msg.il8nResponse('unfollow.okaypester');
            server.pestered = true;
        } else {
            msg.il8nResponse('unfollow.okay');
        }
    });
}

/* * *
 * Command: sidle
 *
 * The server admin can sidle into the bot as a permitted person to take over control
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 * * */
function sidle(msg) {
    var server = msg.server;
    if (server.connecting) return msg.il8nResponse('sidle.connecting');
    if (server.leaving) return msg.il8nResponse('sidle.leaving');

    if (!server.isBound()) {
        msg.il8nResponse('sidle.none');
        return;
    }

    if (!msg.ownerCanManageTheServer() && !msg.memberCanManageTheBot()) {
        msg.il8nResponse('sidle.nope');
        return;
    }

    var newMaster = msg.message.member;
    if (!newMaster) {
        msg.il8nResponse('sidle.membernoexist');
        return;
    }

    if (
        !newMaster.voice ||
        !newMaster.voice.channel ||
        !server.guild.voice.connection ||
        newMaster.voice.channel.id != server.guild.voice.connection.channel.id
    ) {
        msg.il8nResponse('sidle.novoice');
        return;
    }

    server.setMaster(newMaster);
    server.addMemberSetting(newMaster, 'toLanguage', 'default');
    msg.il8nResponse('sidle.okay');

    if (server.getMemberSetting(newMaster, 'muted')) {
        server.addMemberSetting(newMaster, 'muted', false);
        msg.il8nResponse('mute.unmuted');
    }
}

/* * *
 * Command: transfer
 *
 * The server admin or master can transfer control of the bot to a third party
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 * * */
async function transfer(msg) {
    var server = msg.server;
    if (server.connecting) return msg.il8nResponse('transfer.connecting');
    if (server.leaving) return msg.il8nResponse('transfer.leaving');

    if (!msg.ownerIsMaster() && !msg.ownerCanManageTheServer() && server.isBound()) {
        msg.il8nResponse('transfer.nopermissions');
        return;
    }

    if (msg.args.length == 0) {
        msg.il8nResponse('transfer.args');
        return;
    }

    if (msg.message.mentions.members.size < 1) {
        msg.il8nResponse('transfer.args');
        return;
    }

    var newMaster = msg.message.mentions.members.first();
    if (!newMaster) {
        msg.il8nResponse('transfer.membernoexist');
        return;
    }

    if (
        !newMaster.voice ||
        !newMaster.voice.channel ||
        (server.guild.voice.channel && newMaster.voice.channel.id != server.connection.channel.id)
    ) {
        msg.il8nResponse('transfer.samevoice');
        return;
    }

    if (!newMaster.voice.channel.joinable) {
        msg.il8nResponse('transfer.channelpermissions');
        return;
    }

    server.setMaster(newMaster);
    if (server.guild.voice.connection) {
        msg.il8nResponse('transfer.okay', { name: newMaster.displayName });
    } else {
        var errorFunc = (err) => {};

        $connection = await server.joinVoiceChannel(newMaster.voice.channel);

        if (!$connection) {
            msg.il8nResponse('transfer.error');
            server.release();
            return;
        }

        msg.il8nResponse('transfer.okay', { name: newMaster.displayName });

        server.addMemberSetting(newMaster, 'toLanguage', 'default');

        // unmute them if they're muted
        if (server.getMemberSetting(newMaster, 'muted')) {
            server.addMemberSetting(newMaster, 'muted', false);
            msg.il8nResponse('mute.unmuted');
        }
    }
}

var command_follow = new BotCommand({
    command_name: 'follow',
    execute: follow,
    short_help: 'follow.shorthelp',
    long_help: 'follow.longhelp',
    group: 'control',
    order: 0,
});

var command_unfollow = new BotCommand({
    command_name: 'unfollow',
    execute: unfollow,
    short_help: 'unfollow.shorthelp',
    long_help: 'unfollow.longhelp',
    group: 'control',
    order: 2,
});

var command_sidle = new BotCommand({
    command_name: 'sidle',
    execute: sidle,
    short_help: 'sidle.shorthelp',
    long_help: 'sidle.longhelp',
    group: 'control',
});

var command_transfer = new BotCommand({
    command_name: 'transfer',
    execute: transfer,
    short_help: 'transfer.shorthelp',
    long_help: 'transfer.longhelp',
    group: 'control',
    order: 3,
    // parameters: "user"
});

exports.register = function (commands) {
    commands.add(command_follow);
    commands.add(command_unfollow);
    commands.add(command_sidle);
    commands.add(command_transfer);
};

exports.unRegister = function (commands) {
    commands.remove(command_follow);
    commands.remove(command_unfollow);
    commands.remove(command_sidle);
    commands.remove(command_transfer);
};
