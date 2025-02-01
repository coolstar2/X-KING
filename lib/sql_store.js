
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const chalk = require('chalk');

class dbmanager {
    static async createSchema(db) {
       
        await db.exec('PRAGMA journal_mode = WAL;');
        await db.exec('PRAGMA synchronous = NORMAL;');
        
        await db.exec(`
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                remoteJid TEXT NOT NULL,
                message TEXT,
                timestamp INTEGER,
                pushName TEXT,
                participant TEXT,
                messageType TEXT
            )
        `);
        
        
        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_remoteJid 
            ON messages (remoteJid)
        `);
        
        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_remoteJid_timestamp 
            ON messages (remoteJid, timestamp DESC)
        `);
    }
}

// to handle much messages in a queue
class msg_queue {
    constructor(db) {
        this.db = db;
        this.writeQueue = [];
        this.isProcessingQueue = false;
    }

    async processQueue() {
        if (this.isProcessingQueue || this.writeQueue.length === 0) return;

        this.isProcessingQueue = true;
        try {
            await this.db.run('BEGIN TRANSACTION');
            
            const stmt = await this.db.prepare(`
                INSERT OR REPLACE INTO messages 
                (id, remoteJid, message, timestamp, pushName, participant) 
                VALUES (?, ?, ?, ?, ?, ?)`
            );

            while (this.writeQueue.length > 0) {
                const message = this.writeQueue.shift();
                const { key, messageTimestamp, pushName, participant } = message;
                
                await stmt.run(
                    key.id,
                    key.remoteJid,
                    JSON.stringify(message),
                    messageTimestamp,
                    pushName,
                    participant
                );
            }

            await stmt.finalize();
            await this.db.run('COMMIT');

        } catch (error) {
            console.error(chalk.red('Error processing write queue:', error));
            await this.db.run('ROLLBACK');
            this.writeQueue.unshift(...this.writeQueue);
        } finally {
            this.isProcessingQueue = false;
            setTimeout(() => this.processQueue(), 100);
        }
    }

    addToQueue(message) {
        this.writeQueue.push(message);
        if (!this.isProcessingQueue) {
            this.processQueue();
        }
    }
}

// main file
class sql_store {
    constructor(logger) {
        this.logger = logger;
        this.db = null;
        this.queueProcessor = null;
    }

    async initialize() {
        try {
            this.db = await open({
                filename: path.join(__dirname, 'store.db'),
                driver: sqlite3.Database
            });

            await dbmanager.createSchema(this.db);
            this.queueProcessor = new msg_queue(this.db);

            console.log(chalk.green('SQLite store initialized successfully'));
        } catch (error) {
            console.error(chalk.red('Error initializing SQLite store:', error));
            throw error;
        }
    }

    
    async writeMessage(message) {
        this.queueProcessor.addToQueue(message);
    }

    async loadMessage(jid, messageId) {
        try {
            const result = await this.db.get(
                'SELECT message FROM messages WHERE remoteJid = ? AND id = ?',
                [jid, messageId]
            );
            return result ? JSON.parse(result.message) : undefined;
        } catch (error) {
            console.error(chalk.red('Error loading message:', error));
            return undefined;
        }
    }
    
    async getname(jid) {
        try {
            if (!jid) return 'User';

            // Clean the JID to handle both individual and group participants
            const cleanJid = jid.split('@')[0] + '@s.whatsapp.net';

            const result = await this.db.get(
                `SELECT pushName 
                 FROM messages 
                 WHERE (remoteJid = ? OR participant = ?) 
                 AND pushName IS NOT NULL 
                 ORDER BY timestamp DESC 
                 LIMIT 1`,
                [cleanJid, cleanJid]
            );

            return result?.pushName || 'User';
        } catch (error) {
            console.error(chalk.red('Error getting pushName:', error));
            return 'User';
        }
    }

    
    async getChatHistory(jid, limit = 50) {
        try {
            return await this.db.all(
                'SELECT message FROM messages WHERE remoteJid = ? ORDER BY timestamp DESC LIMIT ?',
                [jid, limit]
            );
        } catch (error) {
            console.error(chalk.red('Error getting chat history:', error));
            return [];
        }
    }

    async clearOldMessages(daysToKeep = 1) {
    try {
        const cutoffTime = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);
        
        const result = await this.db.run(
            'DELETE FROM messages WHERE timestamp < ?',
            [cutoffTime]
        );

        if (result.changes > 1000) {
            await this.db.run('VACUUM');
        }
    } catch (error) {
        console.error('Cleanup error');
    }
}

   
    async bind(ev) {
        ev.on('messages.upsert', async ({ messages }) => {
            for (const message of messages) {
                await this.writeMessage(message);
            }
        });
    }
    
    async close() {
        try {
            if (this.db) {
                await this.db.close();
                console.log(chalk.green('Database connection closed successfully'));
            }
        } catch (error) {
            console.error(chalk.red('Error closing database connection:', error));
        }
    }
}

module.exports = sql_store;
module.exports.dbmanager = dbmanager;