const plugins = require("../lib/event");
const {
    command,
    isPrivate,
    clockString,
    getUrl,
    parsedJid,
    isAdmin,
    getBuffer
    
} = require("../lib");
const {
    BOT_INFO
} = require("../config");
const config = require("../config");
const { tiny } = require("../lib/fancy_font/fancy");
const Jimp = require("jimp");
const got = require("got");
const fs = require("fs");
const { exec } = require("child_process");
const { PluginDB, installPlugin } = require("../lib/database/plugins");
command(
    {
        pattern: "ping",
        fromMe: isPrivate,
        desc: "To check ping",
        type: "user",
    },
    async (king, match, client) => {
        const start = new Date().getTime();
      let { key } = await king.reply(`*Ping 👑*`);
        const end = new Date().getTime();
var speed = end - start;
 
await new Promise(t => setTimeout(t,0))
         await king.client.sendMessage(king.jid,{text:`*Pong* 
${speed} *𝚖𝚜*` , edit: key});
})
let startTime = Date.now(); // Capture the bot's start time

function formatUptime(ms) {
    let seconds = Math.floor(ms / 1000) % 60;
    let minutes = Math.floor(ms / (1000 * 60)) % 60;
    let hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    let days = Math.floor(ms / (1000 * 60 * 60 * 24));

    return `*Uptime:* ${days}d ${hours}h ${minutes}m ${seconds}s`;
}

command(
    {
        pattern: "uptime",
        fromMe: isPrivate,
        desc: "Check bot uptime",
        type: "user",
    },
    async (king) => {
        let uptime = Date.now() - startTime; // Calculate uptime
        await king.send(formatUptime(uptime));
    }
);
const aliveAudio = "https://files.catbox.moe/x4dvvm.mp3";

command(
  {
    pattern: "alive ?(.*)",
    fromMe: isPrivate,
    desc: "Check if bot is alive",
    type: "user",
  },
  async (king) => {
    try {
      let buff = await getBuffer(aliveAudio);
      await king.client.sendMessage(king.jid, {
        audio: buff,
        mimetype: "audio/mpeg",
        ptt: true,
        seconds: "0xbebc74b",
        fileLength: "100000000",
        contextInfo: {
          externalAdReply: {
            title: "👑 Xking Md is Alive!",
            body: "Your Royal Assistant is Online",
            sourceUrl: "https://whatsapp.com/channel/0029Vb0oIpcLI8YUGHcCSO0S",
            mediaUrl: "",
            mediaType: 1,
            showAdAttribution: true,
            renderLargerThumbnail: false,
            thumbnailUrl: "https://files.catbox.moe/y7memr.jpg",
          },
        },
      });
    } catch (error) {
      return king.reply("⚠ Error: " + error.message);
    }
  }
);
command(
    {
        pattern: "edit",
        fromMe: isPrivate,
        desc: "Edits a replied message to the given text",
        type: "utility",
    },
    async (king, match, m) => {
        if (!m.quoted) {
            return king.reply("⚠️ Reply to a message with `#edit <new text>` to edit it.");
        }

        if (!match) {
            return king.reply("⚠️ Provide the new text to edit the message.\nExample: `#edit New text`");
        }

        try {
            await king.client.sendMessage(king.jid, { text: match, edit: m.quoted.key });
        } catch (error) {
            await king.reply(`❌ Failed to edit message: ${error.message}`);
        }
    }
);
command(
    {
        pattern: "restart",
        fromMe: isPrivate,
        desc: "Restarts the bot",
        type: "system",
    },
    async (king) => {
        await king.reply("♻️ Restarting bot...");
        exec("pm2 restart all", (error, stdout, stderr) => {
            if (error) {
                return king.reply(`❌ Failed to restart: ${error.message}`);
            }
        });
    }
);

command(
    {
        pattern: "shutdown",
        fromMe: isPrivate,
        desc: "Shuts down the bot",
        type: "system",
    },
    async (king) => {
        await king.reply("⚠️ Shutting down bot...");
        exec("pm2 stop all", (error, stdout, stderr) => {
            if (error) {
                return king.reply(`❌ Failed to shut down: ${error.message}`);
            }
        });
    }
);