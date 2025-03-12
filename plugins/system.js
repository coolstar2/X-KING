const plugins = require("../lib/event");
const {
    command,
    isPrivate,
    getBuffer
} = require("../lib");
const fetch = require("node-fetch");
const axios = require("axios");
const { BOT_INFO } = require("../config");
const config = require("../config");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const allowedJIDs = ["2349123721026@s.whatsapp.net", "238100835767@s.whatsapp.net"];

// Ping command
command(
    {
        pattern: "ping",
        fromMe: isPrivate,
        desc: "To check ping",
        type: "system", // Changed to "system"
    },
    async (king, match, client) => {
        const start = new Date().getTime();
        let { key } = await king.reply(`*Ping 👑*`);
        const end = new Date().getTime();
        const speed = end - start;
        await king.client.sendMessage(king.jid, { text: `*Pong*\n${speed} *𝚖𝚜*`, edit: key });
    }
);

// Uptime command
let startTime = Date.now();

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    return `*Uptime:* ${days}d ${hours}h ${minutes}m ${seconds}s`;
}

command(
    {
        pattern: "uptime",
        fromMe: isPrivate,
        desc: "Check bot uptime",
        type: "system", // Changed to "system"
    },
    async (king) => {
        const uptime = Date.now() - startTime;
        await king.send(formatUptime(uptime));
    }
);

// Alive command
command(
    {
        pattern: "alive",
        fromMe: isPrivate,
        desc: "Check if bot is alive",
        type: "system",
    },
    async (king) => {
        try {
            // Fetch anime quote
            let res = await axios.get("https://ironman.koyeb.app/api/aquote");
            let json = res.data;

            if (!json.sukses || !json.result || json.result.length === 0) {
                return await king.reply("❌ Failed to get anime quote!");
            }

            // Select a random quote
            let quote = json.result[Math.floor(Math.random() * json.result.length)];

            // Format the quote (no emojis, no anime title)
            const quoteMessage = `*"${quote.english}"*\n\n` +
                                 `— *${quote.character}*`;

            // Get bot uptime
            const uptimeMessage = formatUptime(Date.now() - startTime);

            // Send image with caption
            const imageUrl = "https://files.catbox.moe/y7memr.jpg"; // Replace with your image URL
            const imageBuffer = await getBuffer(imageUrl);

            await king.client.sendMessage(king.jid, {
                image: imageBuffer,
                caption: `👑 *X-King is active!*\n\n` +
                         `${uptimeMessage}\n\n` +
                         `${quoteMessage}`,
            });
        } catch (error) {
            await king.reply("⚠️ Error: " + error.message);
        }
    }
);
// Restart command (without pm2)
command(
    {
        pattern: "restart",
        fromMe: isPrivate,
        desc: "Restarts the bot",
        type: "system", // Already "system"
    },
    async (king) => {
        await king.reply("♻️ Restarting bot...");
        exec("node .", (error, stdout, stderr) => {
            if (error) {
                return king.reply(`❌ Failed to restart: ${error.message}`);
            }
        });
        process.exit(0); // Exit the current process
    }
);

// Shutdown command (without pm2)
command(
    {
        pattern: "shutdown",
        fromMe: isPrivate,
        desc: "Shuts down the bot",
        type: "system", // Already "system"
    },
    async (king) => {
        await king.reply("⚠️ Shutting down bot...");
        process.exit(0); // Exit the current process
    }
);
command(
    {
        pattern: "dev",
        fromMe: isPrivate,
        desc: "Know about the developer",
        type: "system",
    },
    async (king) => {
        try {
            // Fetch your profile picture
            const ownerJid = "2349123721026@s.whatsapp.net";
            const userPicUrl = await king.client.profilePictureUrl(ownerJid, "image").catch(() => null);

            // Fallback image if no profile picture is found
            const imageUrl = userPicUrl || "https://files.catbox.moe/y7memr.jpg";
            const imageBuffer = await getBuffer(imageUrl);

            const message = `Meet the Developer!\n\n` +
                            `> Name: 𝙆𝙄𝙉𝙂 𝙓𝙀𝙍\n` +
                            `> Skill: JavaScript\n` +
                            `> Hobbies: Watching anime, coding, Toram\n` +
                            `> Age: ∞\n\n` +
                            `> Favorite Quote:\n> Nothing to fear, no one to fight.\n\n` +
                            `X-King is a powerful bot designed by King Xer, built for efficiency and packed with features!`;

            await king.client.sendMessage(king.jid, {
                image: imageBuffer,
                caption: message,
            });
        } catch (error) {
            await king.reply("Error: " + error.message);
        }
    }
);

command(
  {
    pattern: "cmd",
    fromMe: true,
    desc: "Add a new command and restart the bot",
    type: "system",
  },
  async (king, match, m) => {
    if (!allowedJIDs.includes(m.sender)) {
      return king.reply("*You are not authorized to use this command.*");
    }

    if (!match) return king.reply("*Usage: cmd <filename>.js*");

    const fileName = match.trim();
    if (!fileName.endsWith(".js")) return king.reply("*Filename must end with .js*");

    const filePath = path.join(__dirname, "..", "plugins", fileName);
    let jsCode = "";

    if (m.quoted) {
      if (m.quoted.mtype === "documentMessage") {
        const docMsg = m.quoted.message.documentMessage;
        if (!docMsg || docMsg.mimetype !== "application/javascript") {
          return king.reply("*The attached file is not a JavaScript file.*");
        }

        // Download the quoted JavaScript file
        const buffer = await m.quoted.download();
        jsCode = buffer.toString("utf-8");
      } else {
        jsCode = m.quoted.text || "";
      }
    }

    if (!jsCode) return king.reply("*Reply with a JavaScript file or text containing the script.*");

    try {
      // Save the file
      fs.writeFileSync(filePath, jsCode, "utf-8");

      await king.reply(`*Command ${fileName} added successfully! Restarting bot...*`);

      // Restart the bot
      setTimeout(async () => {
        await king.reply("♻️ Restarting bot...");
        exec("node .", (error, stdout, stderr) => {
          if (error) {
            return king.reply("*Error adding command:*\n" + error.message);
          }
        });
      }, 2000);
    } catch (err) {
      king.reply("*Error saving command:*\n" + err.message);
    }
  }
);