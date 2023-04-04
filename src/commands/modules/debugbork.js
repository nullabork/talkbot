/*jshint esversion: 9 */
// models
const BotCommand = require('@models/BotCommand');

/**
 * Command: debugbork
 *
 * Allows the dev to kill the server if required
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 */
function kill(msg) {
    if (msg.ownerIsDev()) {
        // provide the # of minutes before killing
        if (msg.args[0] * 60000 > 59999) {
            // its a number > 1 minute
            for (var server_id in msg.world.servers)
                if (msg.world.servers[server_id].inChannel())
                    msg.world.servers[server_id].talk('The bot is rebooting in ' + msg.args[0] + ' minutes');
            setTimeout(function () {
                msg.world.kill('debugbork ' + msg.args[0]);
            }, msg.args[0] * 60000);
        } else msg.world.kill('debugbork');
    }
}

/**
 * Command: debug
 *
 * Outputs debugging information to the current channel
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 */
function debug(msg) {
    if (!msg.ownerIsDev()) return;

    var member_count = 0;
    var active_server_count = 0;
    var active_server_names = '';

    for (var id in msg.world.servers) {
        var server = msg.world.servers[id];
        if (server.isBound()) {
            active_server_count++;
            var chansize = 'no connection';
            if (server.connection) chansize = server.connection.channel.members.size;
            active_server_names +=
                server.server_name + '(' + chansize + '): ' + build_permitted_string(server) + '\n';
        }
        member_count += server.guild.memberCount;
    }

    var r = 'Active: ' + active_server_count + '\n';
    r += 'Servers: ' + msg.message.client.guilds.cache.size + '\n';
    r += 'Total members: ' + member_count + '\n';
    r += 'Total characters: ' + msg.world.getTotalCharacterCount() + '\n';
    r += '\nActive Servers:\n' + active_server_names;

    msg.response(r);
}

function build_permitted_string(server) {
    var members = '';
    for (var id in server.permitted) {
        if (server.permitted[id]) {
            var prefix = id == server.bound_to.id ? '(master)' : '';
            var member = server.guild.members.cache.find((x) => x.id == id);
            if (member) {
                prefix += member.user.bot ? '(bot)' : '';
                members += ', ' + prefix + member.displayName;
            } else {
                var role = server.guild.roles.find((x) => x.id == id);
                if (role) members += ', (role)' + (role.name[0] == '@' ? role.name.substring(1) : role.name);
                else members += ', ' + id;
            }
        }
    }
    if (members.length < 2) return '';
    return members.trim().substring(2);
}

var command_kill = new BotCommand({
    command_name: 'debugbork',
    execute: kill,
    short_help: 'debugbork.shorthelp',
    long_help: 'debugbork.longhelp',
    hidden: true,
});

var command_debug = new BotCommand({
    command_name: 'debug',
    execute: debug,
    short_help: 'debug.shorthelp',
    long_help: 'debug.longhelp',
    hidden: true,
    group: 'admin',
});

exports.register = function (commands) {
    commands.add(command_kill);
    commands.add(command_debug);
};

exports.unRegister = function (commands) {
    commands.remove(command_kill);
    commands.remove(command_debug);
};
