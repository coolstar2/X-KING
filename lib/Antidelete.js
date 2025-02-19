const chalk = require('chalk');
const config = require("../config");
const { makeInMemoryStore, proto } = require('@whiskeysockets/baileys');

class AntideleteModule {
    constructor() {
        this.ownerJid = null;
        this.enabled = false;
        this.conn = null;
        this.store = makeInMemoryStore(); // Initialize store immediately
    }

    isGroup(jid) {
        return jid.endsWith('@g.us');
    }

    isStatus(jid) {
        return jid === 'status@broadcast';
    }

    shouldTrackMessage(message) {
        if (this.isStatus(message.key.remoteJid) || !message.message) return false;

        const excludedTypes = [
            'protocolMessage',
            'senderKeyDistributionMessage',
            'messageContextInfo'
        ];

        const messageType = Object.keys(message.message)[0];
        console.log(chalk.blue(`📩 Tracking message of type: ${messageType}`));

        return !excludedTypes.includes(messageType);
    }

    setOwnerJid() {
        const ownerNumbers = config.OWNER_NUMBER;
        if (!ownerNumbers) {
            console.error(chalk.red('❌ Owner numbers not set in config'));
            return;
        }
        this.ownerJid = `${ownerNumbers.split(',')[0].trim()}@s.whatsapp.net`;
    }

    createFakeReply(id) {
        return {
            key: {
                fromMe: false,
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast",
                id: id
            },
            message: { conversation: "*ANTIDELETE DETECTED*" }
        };
    }

    async getGroupName(jid) {
        try {
            const groupMetadata = await this.conn.groupMetadata(jid);
            return groupMetadata.subject;
        } catch (error) {
            console.error(chalk.red('❌ Error fetching group name:', error.message));
            return jid.split('@')[0];
        }
    }

    async handleMessageUpdate(update) {
        if (!config.ANTI_DELETE_ENABLED || !this.enabled || !this.ownerJid || !this.conn) return;

        const chat = update.key.remoteJid;
        const messageId = update.key.id;

        if (this.isStatus(chat)) return;

        const isDeleted = update.update?.message === null ||
            update.update?.messageStubType === 2 ||
            (update.update?.message?.protocolMessage?.type === proto.Message.ProtocolMessage.Type.REVOKE);

        if (isDeleted) {
            console.log(chalk.yellow(`🔍 Antidelete: Detected deleted message ${messageId} in ${chat}`));

            try {
                let deletedMessage = await this.store.loadMessage(chat, messageId);

                if (!deletedMessage) {
                    console.log(chalk.yellow('Deleted message not found in store, fetching recent messages...'));
                    const recentMessages = await this.store.loadMessages(chat, 10);
                    deletedMessage = recentMessages.find(msg => msg.key.id === messageId);
                }

                if (!deletedMessage) {
                    console.log(chalk.red('❌ Deleted message still not found.'));
                    return;
                }

                if (!this.shouldTrackMessage(deletedMessage)) return;

                await this.forwardDeletedMessage(chat, deletedMessage);
            } catch (error) {
                console.error(chalk.red('❌ Error handling deleted message:', error.message));
            }
        }
    }

    async forwardDeletedMessage(chat, deletedMessage) {
        if (!this.conn) return;
        
        const deletedBy = deletedMessage.key.fromMe ? this.conn.user.id : deletedMessage.key.participant || chat;
        const sender = deletedMessage.key.participant || deletedMessage.key.remoteJid;

        const sendToJid = config.ANTIDELETE_IN_CHAT ? chat : this.ownerJid;

        try {
            const forwardedMessage = await this.conn.sendMessage(
                sendToJid,
                { forward: deletedMessage },
                { quoted: this.createFakeReply(deletedMessage.key.id) }
            );
            
            if (forwardedMessage) {
                const chatName = this.isGroup(chat) ? 
                    await this.getGroupName(chat) : 
                    "Private Chat";
                
                const mentions = [sender, deletedBy].filter((jid, index, self) => 
                    self.indexOf(jid) === index
                );

                const notificationText = config.ANTIDELETE_IN_CHAT 
                    ? this.createPublicNotification(sender, deletedBy)
                    : this.createNotificationText(chatName, sender, deletedBy, chat);

                await this.conn.sendMessage(
                    sendToJid,
                    {
                        text: notificationText,
                        mentions: mentions
                    },
                    { quoted: forwardedMessage }
                );

                console.log(chalk.green(`✅ Antidelete: Forwarded deleted message to ${config.ANTIDELETE_IN_CHAT ? 'original chat' : 'owner'}`));
            }
        } catch (error) {
            console.error(chalk.red('❌ Error forwarding deleted message:', error.message));
        }
    }

    createPublicNotification(sender, deletedBy) {
        return `*⚠️ DELETED MESSAGE DETECTED*\n\n` +
               `• Author: @${sender.split('@')[0]}\n` +
               `• Deleted by: @${deletedBy.split('@')[0]}\n` +
               `• Time: ${new Date().toLocaleTimeString()}`;
    }

    createNotificationText(chatName, sender, deletedBy, chat) {
        return `*[DELETED MESSAGE INFORMATION]*\n\n` +
               `*TIME:* ${new Date().toLocaleString()}\n` +
               `*MESSAGE FROM:* @${sender.split('@')[0]}\n` +
               `*CHAT:* ${chatName}\n` +
               `*DELETED BY:* @${deletedBy.split('@')[0]}\n` +
               `*IS GROUP:* ${this.isGroup(chat) ? 'Yes' : 'No'}`;
    }

    async setup(conn) {
        if (!config.ANTI_DELETE_ENABLED) {
            console.log(chalk.yellow('Antidelete is disabled in global settings'));
            return this;
        }

        if (this.enabled) {
            console.log(chalk.yellow('Antidelete module is already set up. Restarting it.'));
            this.reset();  // Properly reset before reinitializing
        }

        try {
            this.setOwnerJid();
            this.enabled = true;
            this.conn = conn;

            // Properly bind store to conn
            this.store.bind(this.conn.ev);

            console.log(chalk.blue(`🚀 Antidelete module initialized. Enabled: ${this.enabled}`));
            return this;
        } catch (error) {
            console.error(chalk.red('❌ Error setting up Antidelete module:', error.message));
            throw error;
        }
    }

    reset() {
        this.enabled = false;
        this.conn = null;
        this.store = makeInMemoryStore();  // Reinitialize store
    }

    async execute(update) {
        await this.handleMessageUpdate(update);
    }
}

let antideleteModule = null;

async function setupAntidelete(conn) {
    if (!antideleteModule) {
        antideleteModule = new AntideleteModule();
    }
    return antideleteModule.setup(conn);
}

module.exports = {
    setupAntidelete
};