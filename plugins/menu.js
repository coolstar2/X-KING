const plugins = require("../lib/event");
const { command, isPrivate } = require("../lib");
const { BOT_INFO } = require("../config");
const config = require("../config");
const { tiny } = require("../lib/fancy_font/fancy");
const { getDevice } = require("@whiskeysockets/baileys");

// Fetch Profile Picture Function
async function getProfilePicture(client, jid) {
  return await client.profilePictureUrl(jid, "image").catch(() => null);
}

// Menu Command
command(
  {
    pattern: "menu",
    fromMe: isPrivate,
    desc: "Show All Commands or Commands by Type",
    dontAddCommandList: true,
    type: "user",
  },
  async (king, match, m, client) => {
    try {
      let categoryFilter = match ? match.toLowerCase().trim() : null; // If "menu <type>" is used, filter by that type

      let { prefix } = king;
      let [date, time] = new Date()
        .toLocaleString("en-IN", { timeZone: "Africa/Lagos" })
        .split(",");
      let usern = king.pushName;
      const readMore = String.fromCharCode(8206).repeat(4001);

      let menu = `╔┉┉┉〔 𝐗-𝐊𝐈𝐍𝐆 𝐌𝐄𝐍𝐔 〕┉┉┉┉┉❍
╔┅┅┅┅┅┅┅┅┅┅┅┅❍
✻ ┋ *ᴏᴡɴᴇʀ*: *${BOT_INFO.split(";")[1]}*
✻ ┋ *ᴜꜱᴇʀ*: ${usern}
✻ ┋ *ᴅᴀᴛᴇ*: ${date}
✻ ┋ *ᴛɪᴍᴇ*: ${time}
✻ ┋ *ᴄᴏᴍᴍᴀɴᴅꜱ*: ${plugins.commands.length}
✻ ┋ *ᴍᴏᴅᴇ*: ${config.WORK_TYPE}
✻ ┋ *ᴩʀᴇꜰɪx*: ${config.HANDLERS[2]}
✻ ┋ *VERSION*: ${require("../package.json").version}
╚┅┅┅┅┅┅┅┅┅┅┅┅❍`;

      let cmnd = [];
      let category = [];

      plugins.commands.map((command) => {
        let cmd = command.pattern instanceof RegExp ? command.pattern.toString().split(/\W+/)[1] : null;
        if (!command.dontAddCommandList && cmd) {
          let type = command.type ? command.type.toLowerCase() : "";
          if (type !== "misc" && (!categoryFilter || type === categoryFilter)) { 
            if (!category.includes(type)) category.push(type);
            cmnd.push({ cmd, type });
          }
        }
      });

      if (category.length === 0) {
        return king.reply(`No commands found for type: *${categoryFilter}*`);
      }

      cmnd.sort();
      category.sort().forEach((cmmd) => {
        menu += `\n   ╔─────────────┈❍
   ➻┊  ❲ *${cmmd.toUpperCase()}* ❳
   ╚┬────────────┈❍
   ╔┴────────────┈❍`;
        let comad = cmnd.filter(({ type }) => type == cmmd);
        comad.forEach(({ cmd }) => {
          menu += `\n   │  ✧ ${config.HANDLERS[2]}${cmd.trim()}`;
        });
        menu += `\n   ╚┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄❍`;
      });

      menu += `\n🔥 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 *𝗫-𝗞𝗜𝗡𝗚* 🔥`;

      let penu = tiny(menu);
      let profilePic = await getProfilePicture(client, king.jid) || "https://files.catbox.moe/y7memr.jpg";

      return await client.sendMessage(king.jid, {
        image: { url: profilePic },
        caption: penu,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363311728087920@newsletter",
            newsletterName: "X-KING",
          },
        },
      });
    } catch (e) {
      king.reply(e.toString());
    }
  }
);