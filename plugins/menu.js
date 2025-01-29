const plugins = require("../lib/event");
const { command, isPrivate } = require("../lib");
const { BOT_INFO } = require("../config");
const config = require("../config");
const { tiny } = require("../lib/fancy_font/fancy");
const { getDevice } = require("@whiskeysockets/baileys");

command(
  {
    pattern: "menu",
    fromMe: isPrivate,
    desc: "Show All Commands",
    dontAddCommandList: true,
    type: "user",
  },
  async (king, match, m, client) => {
    try {
      // Get device type
      let deviceType;
      try {
        deviceType = getDevice(king.reply_message?.key?.id || king.id);
      } catch {
        deviceType = "Unknown";
      }

      // Define the menus
      const originalMenu = async () => {
        let { prefix } = king;
        let [date, time] = new Date()
          .toLocaleString("en-IN", { timeZone: "Africa/Lagos" })
          .split(",");
        let usern = king.pushName;
        const readMore = String.fromCharCode(8206).repeat(4001);

         let menu = `\n✦ ─────『✙ *X-KING* ✙』───── ✦ 
  | ♣ 𝗼𝘄𝗻𝗲𝗿: ${BOT_INFO.split(";")[1]}
  | ♣ 𝘂𝘀𝗲𝗿: ${usern}
  | ♣ 𝗱𝗮𝘁𝗲: ${date}
  | ♣ 𝘁𝗶𝗺𝗲: ${time}
  | ♣ 𝗱𝗲𝘃𝗶𝗰𝗲: ${deviceType}
  | ♣ 𝗰𝗺𝗱𝘀: ${plugins.commands.length}
  | ♣ 𝗺𝗼𝗱𝗲: ${config.WORK_TYPE}
  | ♣ 𝗽𝗿𝗲𝗳𝗶𝘅: ${config.HANDLERS}
  | ♣ 𝘃𝗲𝗿𝘀𝗶𝗼𝗻: ${require("../package.json").version}
✦ ─────『✙ *X-KING* ✙』───── ✦${readMore}`;

        let cmnd = [];
        let cmd;
        let category = [];
        plugins.commands.map((command, num) => {
          if (command.pattern instanceof RegExp) {
            cmd = command.pattern.toString().split(/\W+/)[1];
          }

          if (!command.dontAddCommandList && cmd !== undefined) {
            let type = command.type ? command.type.toLowerCase() : "misc";

            cmnd.push({ cmd, type });

            if (!category.includes(type)) category.push(type);
          }
        });
        cmnd.sort();
        category.sort().forEach((cmmd) => {
          menu += `\n  「 *${cmmd.toUpperCase()}* 」`;
          let comad = cmnd.filter(({ type }) => type == cmmd);
          comad.forEach(({ cmd }) => {
            menu += `\n[👑]  ${cmd.trim()}`;
          });
          menu += `\n¤──────¤◎¤◎¤──────¤`;
        });
        menu += `\n\n> X-KING 2025-2099`;

        let penu = tiny(menu);

        // Random menu images
        const menuImages = [
          "https://files.catbox.moe/y7memr.jpg"];
        const randomImage = menuImages[Math.floor(Math.random() * menuImages.length)];

        // Send the image with the menu text as caption
        return await client.sendMessage(king.jid, {image: {url: menuImages }, 
			caption: penu,
			contextInfo: {
				forwardingScore: 1,
				isForwarded: true,
				forwardedNewsletterMessageInfo: {
					newsletterJid: '120363379718023410@newsletter',
					newsletterName: 'X-king',
				},
			},
		});
      };

      const iosMenu = async () => {
        let { prefix } = king;
        let [date, time] = new Date()
          .toLocaleString("en-IN", { timeZone: "Africa/Lagos" })
          .split(",");
        let usern = king.pushName;
        const readMore = String.fromCharCode(8206).repeat(4001);

        let menu = `\n✦ ─────『✙ *X-KING* ✙』───── ✦ 
  | ♣ 𝗼𝘄𝗻𝗲𝗿: ${BOT_INFO.split(";")[1]}
  | ♣ 𝘂𝘀𝗲𝗿: ${usern}
  | ♣ 𝗱𝗮𝘁𝗲: ${date}
  | ♣ 𝘁𝗶𝗺𝗲: ${time}
  | ♣ 𝗱𝗲𝘃𝗶𝗰𝗲: ${deviceType}
  | ♣ 𝗰𝗺𝗱𝘀: ${plugins.commands.length}
  | ♣ 𝗺𝗼𝗱𝗲: ${config.WORK_TYPE}
  | ♣ 𝗽𝗿𝗲𝗳𝗶𝘅: ${config.HANDLERS}
  | ♣ 𝘃𝗲𝗿𝘀𝗶𝗼𝗻: ${require("../package.json").version}
✦ ─────『✙ *X-KING* ✙』───── ✦${readMore}`;

        let cmnd = [];
        let cmd;
        let category = [];
        plugins.commands.map((command, num) => {
          if (command.pattern instanceof RegExp) {
            cmd = command.pattern.toString().split(/\W+/)[1];
          }

          if (!command.dontAddCommandList && cmd !== undefined) {
            let type = command.type ? command.type.toLowerCase() : "misc";

            cmnd.push({ cmd, type });

            if (!category.includes(type)) category.push(type);
          }
        });
        cmnd.sort();
        category.sort().forEach((cmmd) => {
          menu += `\n  「 *${cmmd.toUpperCase()}* 」`;
          let comad = cmnd.filter(({ type }) => type == cmmd);
          comad.forEach(({ cmd }) => {
            menu += `\n[👑]  ${cmd.trim()}`;
          });
          menu += `\n¤──────¤◎¤◎¤──────¤`;
        });
        menu += `\n\n> BROUGHT TO YOU BY X-KING`;

        let penu = tiny(menu);

        const menuImages = ["https://files.catbox.moe/y7memr.jpg"];
        const randomImage = menuImages[Math.floor(Math.random() * menuImages.length)];

        return await king.sendFromUrl(randomImage, { caption: penu });
      };

      // Use the appropriate menu based on the device type
      if (deviceType === "iOS") {
        return iosMenu();
      } else {
        return originalMenu();
      }
    } catch (e) {
      king.reply(e.toString());
    }
  }
);