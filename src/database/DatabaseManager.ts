import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import SQL from 'sql-template-strings';
import {
    BotSettingsDBInterface,
    GuildSettingsDBInterface,
    MemberSettingsDBInterface,
} from '@Database/DatabaseInterfaces';

class DatabaseManager {
    private db: Promise<Database<sqlite3.Database, sqlite3.Statement>>;

    constructor(private dbFile: string) {
        this.db = open({ filename: dbFile, driver: sqlite3.Database });
    }

    private tables = {
        BotSettings: 'BotSettings',
        GuildSettings: 'GuildSettings',
        MemberSettings: 'MemberSettings',
    };

    async setup(): Promise<void> {
        const db = await this.db;
        const statement = SQL`
            CREATE TABLE IF NOT EXISTS ${this.tables.BotSettings} (
                id INTEGER PRIMARY KEY,
                defaultVoice TEXT NOT NULL,
                defaultSpeed INTEGER NOT NULL,
                defaultPitch INTEGER NOT NULL,
                defaultVolume INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ${this.tables.GuildSettings} (
                id INTEGER PRIMARY KEY,
                guildId TEXT PRIMARY KEY NOT NULL,
                prefix TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS ${this.tables.MemberSettings} (
                id INTEGER PRIMARY KEY,
                memberId TEXT PRIMARY KEY NOT NULL,
                serviceId TEXT PRIMARY KEY,
                serciveName TEXT PRIMARY KEY,
                voice TEXT NOT NULL,
                speed INTEGER NOT NULL,
                pitch INTEGER NOT NULL,
                volume INTEGER NOT NULL
            );
        `;
        await db.exec(statement);
    }

    async updateGuildSettings(guildId: string, settings: GuildSettingsDBInterface): Promise<void> {
        const db = await this.db;
        const update = SQL`
            UPDATE ${this.tables.GuildSettings}
            SET prefix = ${settings.prefix}, guildId = ${settings.guildId}
            WHERE guildId = ${settings.guildId};
        `;
        await db.run(update);
    }

    async insertGuildSettings(settings: GuildSettingsDBInterface): Promise<void> {
        const db = await this.db;
        const insert = SQL`
            INSERT INTO ${this.tables.GuildSettings} (guildId, prefix)
            VALUES (${settings.guildId}, ${settings.prefix});
        `;
        await db.run(insert);
    }


    async close(): Promise<void> {
        const db = await this.db;
        await db.close();
    }
}
