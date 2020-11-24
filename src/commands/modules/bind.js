/*jshint esversion: 9 */

var Command = require('@models/Command');
(CommentBuilder = require('@models/CommentBuilder')),
    (auth = require('@auth')),
    (Common = require('@helpers/common'));

class Bind extends Command {
    // core COMMAND getters
    get group() {
        return 'server';
    }

    get hidden() {
        return false;
    }

    static getChannelNames(server, string) {
        let obj = {};
        const channelNames = (server.bind || []).forEach((id) => {
            const channel = server.guild.channels.cache.get(id);

            if (channel && channel.name) {
                obj[channel.name] = id;
            } else {
                obj[id] = 'Channel Not Found';
            }
        });

        if (!server.bind || !server.bind) {
            obj = [' No Channels Bound!'];
        }

        return obj;
    }

    usage(input, server) {
        let usage = server.lang('bindusage.title');
        let command = auth.command_char + this.command_name;

        return input.response(
            CommentBuilder.create({
                data: {
                    [usage]: Bind.getChannelNames(server),
                    'Auto permitting': [server.bindPermit ? 'Turned ON' : ' Turned OFF'],
                    commands: {
                        [command]: server.lang('bindusage.noargs'),
                        [command + ' none']: server.lang('bindusage.none'),
                        [command + ' #channel']: server.lang('bindusage.channels'),
                        [command + ' permit']: server.lang('bindusage.permit'),
                        [command + ' unpermit']: server.lang('bindusage.unpermit'),
                    },
                },
            }),
        );
    }

    execute({ input }) {
        const server = input.server;

        if (input.args.length == 0) {
            this.usage(input, server);
            return;
        }

        if (!input.ownerCanManageTheServer()) {
            input.il8nResponse('bind.nopermissions');
            return;
        }

        let restriction_identifier = input.args[0];

        if (/^(none|default)$/i.test(restriction_identifier)) {
            server.bind = [];
            server.bindPermit = false;
            input.il8nResponse('bind.setdefault');
        } else if (/^(unpermit)$/i.test(restriction_identifier)) {
            server.bindPermit = false;
            input.il8nResponse('bind.unpermit');
        } else if (/^(permit)$/i.test(restriction_identifier)) {
            server.bindPermit = true;
            input.il8nResponse('bind.permit');
        } else if (input.args.length > 0) {
            const mentions = input.message.mentions;
            if (mentions.channels.first()) {
                mentions.channels.forEach((chan) => {
                    if (!server.bind.includes(chan.id)) server.bind.push(chan.id);
                });
            } else {
                for (const arg of input.args) {
                    if (arg.length > 15) {
                        if (!server.bind.includes(arg)) server.bind.push(arg);
                    }
                }
            }

            let usage = server.lang('bindusage.title');
            let command = auth.command_char + this.command_name;

            input.response(
                CommentBuilder.create({
                    data: {
                        [usage]: Bind.getChannelNames(server),
                    },
                }),
            );
        }
    }

    async onUserJoinedChannel({ channelState, member, server }) {
        // throw out these states
        if (!member.voice.channelID) return;
        if (!server.bind || !server.bind.length || !server.bind.includes(channelState.channelID)) return;

        if (!server.isBound()) {
            server.setMaster(member);
            await server.joinVoiceChannel(member.voice.channel);
        } else if (server.bindPermit) {
            server.permit(member.id);
        }
    }

    async onPreValidate({ message, content, server }) {
        const { member, channel, mentions } = message;
        // throw out these states
        if (!member.voice.channelID) return;
        if (!server.bind || !server.bind.length || !server.bind.includes(channel.id)) return;
        const settings = server.getMemberSettings(message.member);

        if (!server.isBound()) {
            server.setMaster(member);
            const connection = await server.joinVoiceChannel(member.voice.channel);

            if (!connection) {
                return;
            }

            setTimeout(() => {
                server.talk(content, settings);
            }, 600);
        } else if (server.bindPermit && !server.permitted[member.id]) {
            server.permit(member.id);
        }
    }
}

//registration
exports.register = (commands) => {
    commands.add(Bind.command);
};

exports.unRegister = (commands) => {
    commands.remove(Bind.command);
};

exports.class = Bind;
