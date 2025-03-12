const { commands } = require("../lib/event");
const { command, isPrivate } = require("../lib/");
const fs = require("fs");
const path = require("path");
const config = require("../config"); // Import config
const hand = config.HANDLERS[2];
const stickerCommandsPath = path.join(__dirname, "../lib/sticker_commands.json");

// Load existing sticker commands
const loadStickerCommands = () => {
  if (!fs.existsSync(stickerCommandsPath)) return {};
  return JSON.parse(fs.readFileSync(stickerCommandsPath));
};

// Save sticker commands to file
const saveStickerCommands = (data) => {
  fs.writeFileSync(stickerCommandsPath, JSON.stringify(data, null, 2));
};

// Get stored command for a sticker hash
const getStickerCommand = (stickerHash) => {
  if (!stickerHash) return null;
  const stickerCommands = loadStickerCommands();
  return stickerCommands[stickerHash] || null;
};

// **Set a command to a sticker**
command(
  {
    pattern: "set",
    fromMe: isPrivate,
    desc: "Bind a command to a sticker",
    type: "setcmd",
  },
  async (king, match, m) => {
    if (!m.quoted) return await king.reply("*_Reply to a sticker with a command_*");
    if (!m.quoted.message?.stickerMessage?.fileSha256) return await king.reply("*_Reply to a valid sticker_*");
    if (!match) return await king.reply("*_Provide a command to bind to this sticker_*");

    try {
      const stickerHash = m.quoted.message.stickerMessage.fileSha256.toString("base64");
      const stickerCommands = loadStickerCommands();

      const commandName = match.trim().toLowerCase();
      stickerCommands[stickerHash] = commandName;
      saveStickerCommands(stickerCommands);

      await king.reply(`✅ *Command set successfully!*\n\n📌 *Sticker now triggers:* \`${commandName}\``);
    } catch (error) {
      console.error(error);
      await king.reply("*_Failed to bind command to sticker_*");
    }
  }
);

// **List all attached sticker commands**
command(
  {
    pattern: "list",
    fromMe: isPrivate,
    desc: "List all bound sticker commands",
    type: "setcmd",
  },
  async (king, _, m) => {
    const stickerCommands = loadStickerCommands();
    if (Object.keys(stickerCommands).length === 0) return await king.reply("*No sticker commands set yet!*");

    let msg = "*Sticker Commands List:*\n\n";
    for (const [hash, cmd] of Object.entries(stickerCommands)) {
      msg += `🔹 *Sticker Hash:* \`${hash.slice(0, 10)}...\`\n⚡ *Command:* \`${cmd}\`\n\n`;
    }

    await king.reply(msg);
  }
);

// **Unbind a specific command from a sticker**
command(
  {
    pattern: "unbind",
    fromMe: isPrivate,
    desc: "Remove a bound command from a sticker",
    type: "setcmd",
  },
  async (king, _, m) => {
    if (!m.quoted) return await king.reply("*_Reply to a sticker to remove its command_*");
    if (!m.quoted.message?.stickerMessage?.fileSha256) return await king.reply("*_Reply to a valid sticker_*");

    try {
      const stickerHash = m.quoted.message.stickerMessage.fileSha256.toString("base64");
      const stickerCommands = loadStickerCommands();

      if (!stickerCommands[stickerHash]) return await king.reply("*_No command found for this sticker_*");

      delete stickerCommands[stickerHash];
      saveStickerCommands(stickerCommands);

      await king.reply("✅ *Sticker command removed successfully!*");
    } catch (error) {
      console.error(error);
      await king.reply("*_Failed to unbind command from sticker_*");
    }
  }
);

// **Delete all sticker commands**
command(
  {
    pattern: "delete",
    fromMe: isPrivate,
    desc: "Delete all sticker commands",
    type: "setcmd",
  },
  async (king, _, m) => {
    try {
      saveStickerCommands({});
      await king.reply("✅ *All sticker commands deleted successfully!*");
    } catch (error) {
      console.error(error);
      await king.reply("*_Failed to delete sticker commands_*");
    }
  }
);

command(
  {
    on: "sticker",
  },
  async (king, _, m, conn) => {
    try {
      if (!m.message?.stickerMessage?.fileSha256) return;

      const stickerHash = m.message.stickerMessage.fileSha256.toString("base64");
      const commandName = getStickerCommand(stickerHash);

      if (!commandName) return;

      console.log("Sticker triggered command:", commandName);

      const pluginss = require("../lib/event");
      const allCommands = await pluginss.commands || commands;

      let targetCommand = null;
      for (const cmd of allCommands) {
        if (!cmd.pattern) continue;

        // Convert pattern to string and extract the command name
        const patternStr = cmd.pattern.toString().toLowerCase();
        if (patternStr.includes(commandName)) {
          targetCommand = cmd;
          break;
        }
      }

      if (targetCommand) {
        console.log("Found matching command:", targetCommand.pattern);
        // Create a fake message with the command prefix to trigger the handler properly
        const fakeMessage = { ...m };
        // Add the command with # prefix to the message
        fakeMessage.body = `${hand}${commandName}`;

        let whats = new (require("../lib/Base").King)(conn, fakeMessage, fakeMessage);
        await targetCommand.function(whats, "", fakeMessage, conn);
      } else {
        console.log("No matching command found for:", commandName);
        await king.reply(`❌ *Command not found:* \`${commandName}\``);
      }
    } catch (error) {
      console.error("Sticker command execution error:", error);
      await king.reply(`Error: ${error.message}`);
    }
  }
);