const { command, isPrivate, getJson } = require("../lib/");
const axios = require("axios");
const fetch = require('node-fetch');
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fileType = require("file-type");
const Tesseract = require("tesseract.js");
const config = require("../config");
const { commands } = require("../lib/event");
const hand = config.HANDLERS[2];
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

command(
  {
    pattern: "alya",
    fromMe: true,
    desc: "Toggle prime listener on or off",
    type: "config",
  },
  async (king, match) => {
    primeListener = !primeListener;
    await king.reply(`✅ *Alya Listener is now* ${primeListener ? "ON ✅" : "OFF ❌"}`);
  }
);

command(
  {
    on: "text",
  },
  async (king, match, m) => {
    if (!primeListener || !isAuthorized(m.sender)) return;

    const text = m.body.trim();
    if (text.toLowerCase() === "alya") {
      return await king.reply("Yes, Master?");
    }

    if (!text.toLowerCase().startsWith("alya ")) return;

    let query = text.slice(5).trim();
    if (!query) return;

    const allCommands = await commands;
    let foundCommand = allCommands.find(cmd => {
      const pattern = cmd.pattern.toString().toLowerCase();
      return query.toLowerCase().startsWith(pattern);
    });

    if (foundCommand) {
      console.log(`Alya triggered command: ${foundCommand.pattern}`);
      const fakeMessage = { ...m, body: `${hand}${foundCommand.pattern}` };
      let whats = new (require("../lib/Base").King)(king.client, fakeMessage, fakeMessage);
      await foundCommand.function(whats, "", fakeMessage, king.client);
    } else {
      let mediaBase64 = null;
      let mimeType = null;

      if (king.reply_message) {
        if (king.reply_message.text) {
          query = king.reply_message.text;
        } else if (king.reply_message.mimetype) {
          const mediaBuffer = await downloadMediaMessage(king.reply_message, "buffer");
          if (!mediaBuffer) return await king.reply("*_Failed to download media._*");

          const fileSizeMB = mediaBuffer.length / (1024 * 1024);
          if (fileSizeMB > MAX_FILE_SIZE_MB) return await king.reply("*_File size exceeds 200MB limit._*");

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
  }
);