const { command, getJson } = require("../lib/");
const axios = require("axios");
const fetch = require("node-fetch");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { encodeFileToBase64, sendToGemini } = require("../lib/aiModule");

let geminiStatus = "off";

const MAX_FILE_SIZE_MB = 200;

command(
  {
    pattern: "chatbot",
    fromMe: true,
    desc: "Enable or disable Chat Bot response",
    type: "ai",
  },
  async (king, match) => {
    if (!match) {
      return await king.reply(`*Current Chat Bot Status:* ${geminiStatus.toUpperCase()}\n\nUse *#gemini on/off* to toggle.`);
    }

    const action = match.toLowerCase();
    if (["on", "off"].includes(action)) {
      geminiStatus = action;
      return await king.reply(`*Chat Bot is now:* ${geminiStatus.toUpperCase()}`);
    } else {
      return await king.reply("❌ *Invalid option!* Use *#gemini on/off*.");
    }
  }
);

command(
  {
    on: "text",
    fromMe: false,
  },
  async (king, match) => {
    if (geminiStatus === "off") return;

    try {
      let mediaBase64 = null;
      let mimeType = null;

      if (king.reply_message) {
        const mediaBuffer = await downloadMediaMessage(king.reply_message, "buffer");
        if (!mediaBuffer) return;

        const fileSizeMB = mediaBuffer.length / (1024 * 1024);
        if (fileSizeMB > MAX_FILE_SIZE_MB) return;

        mimeType = king.reply_message.mimetype || "";
        if (mimeType.startsWith("image/") || mimeType.startsWith("video/")) {
          mediaBase64 = await encodeFileToBase64(mediaBuffer);
        }
      }

      const responseText = await sendToGemini(match || "Describe this media", mediaBase64, mimeType);

      await king.reply(responseText);
    } catch (error) {
      console.error("[ERROR]", error);
      await king.reply("*_An error occurred while processing your request._*");
    }
  }
);