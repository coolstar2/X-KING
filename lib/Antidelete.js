const chalk = require('chalk');
const config = require("../config");

class AntideleteModule {
    constructor() {
        this.ownerJid = null;
        this.enabled = false;
        this.conn = null;
    }

    isGroup(jid) {
        return jid.endsWith('@g.us');
    }

    isStatus(jid) {
        return jid === 'status@broadcast';
    }

    shouldTrackMessage(message) {
        if (this.isStatus(message.key.remoteJid)) return false;
        if (!message.message) return false;

        const excludedTypes = [
            'protocolMessage',
            'senderKeyDistributionMessage',
            'messageContextInfo'
        ];

        const messageType = Object.keys(message.message)[0];
     //   console.log(chalk.blue(`📩 Tracking message of type: ${messageType}`));

        return !excludedTypes.includes(messageType);
    }

    setOwnerJid() {
        const ownerNumbers = config.OWNER_NUMBER;
        if (!ownerNumbers) {
            this.logError('Owner numbers not set in global settings');
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
            message: {
                conversation: "*ANTIDELETE DETECTED*"
            }
        };
    }

    async getGroupName(jid) {
        try {
            const groupMetadata = await this.conn.groupMetadata(jid);
            return groupMetadata.subject;
        } catch (error) {
            this.logError('Error fetching group name', error);
            return jid.split('@')[0];
        }
    }

    async handleMessageUpdate(update, store) {
        if (!config.ANTI_DELETE_ENABLED || !this.enabled || !this.ownerJid || !this.conn) return;

        const chat = update.key.remoteJid;
        const messageId = update.key.id;

        if (this.isStatus(chat)) return;

        const isDeleted = 
            update.update.message === null || 
            update.update.messageStubType === 2 ||
            (update.update.message?.protocolMessage?.type === 0);

        if (isDeleted) {
          //  console.log(chalk.yellow(`🔍 Antidelete: Detected deleted message ${messageId} in ${chat}`));

            try {
                let deletedMessage = await store.loadMessage(chat, messageId);

                // Fallback: Fetch last messages from chat if store fails
                if (!deletedMessage) {
               //     console.log(chalk.yellow('Deleted message not found in store, fetching recent messages...'));
                    const recentMessages = await store.loadMessage(chat, 10);
                    deletedMessage = recentMessages.messages.find(msg => msg.key.id === messageId);
                }

                if (!deletedMessage) {
                    console.log(chalk.red('❌ Deleted message still not found.'));
                    return;
                }

                if (!this.shouldTrackMessage(deletedMessage)) return;

                await this.forwardDeletedMessage(chat, deletedMessage);
            } catch (error) {
                this.logError('Error handling deleted message', error);
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

            //    console.log(chalk.green(`✅ Antidelete: Forwarded deleted message to ${config.ANTIDELETE_IN_CHAT ? 'original chat' : 'owner'}`));
            }
        } catch (error) {
            this.logError('Error forwarding deleted message', error);
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

    logError(message, error) {
        console.error(chalk.red(`❌ ${message}: ${error?.message || error}`));
    }

    async setup(conn) {
        if (!config.ANTI_DELETE_ENABLED) {
         //   console.log(chalk.yellow('Antidelete is disabled in global settings'));
            return this;
        }

        if (this.conn) {
      //      console.log(chalk.yellow('Antidelete module is already set up.'));
            return this;
        }

        try {
            this.setOwnerJid();
            this.enabled = true;
            this.conn = conn;
            console.log(chalk.blue(`🚀 Antidelete module initialized. Enabled: ${this.enabled}`));
            return this;
        } catch (error) {
            this.logError('Error setting up Antidelete module', error);
            throw error;
        }
    }

    async execute(conn, update, options = {}) {
        await this.handleMessageUpdate(update, store);
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