const { command } = require("../lib");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const FormData = require("form-data");
const fetch = require("node-fetch");
const fileType = require("file-type");
const config = require("../config"); // Ensure config has STICKER_DATA and OWNER_NUMBER

// Derive mentionJid from config.OWNER_NUMBER or use king.user/king.participant
function getMentionJid(king) {
    if (config.OWNER_NUMBER) {
        return `${config.OWNER_NUMBER}@s.whatsapp.net`;
    }
    return king.user?.jid || king.participant;
}

const mentionActions = {};
const MAX_FILE_SIZE_MB = 200;

// Function to upload files to Catbox
async function uploadToCatbox(buffer) {
    try {
        const type = await fileType.fromBuffer(buffer);
        const ext = type ? type.ext : "bin";
        const bodyForm = new FormData();
        bodyForm.append("fileToUpload", buffer, `file.${ext}`);
        bodyForm.append("reqtype", "fileupload");

        const res = await fetch("https://catbox.moe/user/api.php", {
            method: "POST",
            body: bodyForm,
        });

        if (!res.ok) {
            throw new Error(`Upload to Catbox failed with status ${res.status}: ${res.statusText}`);
        }

        return await res.text();
    } catch (error) {
        console.error("Error uploading to Catbox:", error);
        throw new Error("Failed to upload media to Catbox.");
    }
}

command(
    {
        pattern: "mention",
        fromMe: true,
        desc: "Set an action when you are tagged or turn it off.",
        type: "owner",
    },
    async (king, match, m) => {
        const mentionJid = getMentionJid(king); // Get mentionJid dynamically
        const args = match.split(" ");
        const action = args[0]?.toLowerCase();
        const value = args.slice(1).join(" ");

        if (!action) {
            return await king.reply("*Usage:* Reply to a file/sticker or use #mention [send/react/text/sticker/off] [value]");
        }

        if (action === "off") {
            delete mentionActions[mentionJid];
            return await king.reply("*Mention actions have been turned off.*");
        }

        switch (action) {
            case "send":
                if (!m.quoted) return await king.reply("*Reply to a media file to set it for mention sending.*");
                try {
                    const buffer = await m.quoted.download();
                    const fileSizeMB = buffer.length / (1024 * 1024);
                    if (fileSizeMB > MAX_FILE_SIZE_MB) return await king.reply("*File size exceeds 200MB limit.*");

                    const catboxUrl = await uploadToCatbox(buffer);
                    mentionActions[mentionJid] = { type: "send", url: catboxUrl };
                    return await king.reply("*File set! It will be sent when you are tagged.*");
                } catch (e) {
                    return await king.reply("*Failed to save the file.*");
                }

            case "react":
                if (!value) return await king.reply("*Provide an emoji for reaction.*");
                mentionActions[mentionJid] = { type: "react", emoji: value };
                return await king.reply(`*Reaction set! Will react with ${value} when tagged.*`);

            case "text":
                if (!value) return await king.reply("*Provide a text message to send when tagged.*");
                mentionActions[mentionJid] = { type: "text", message: value };
                return await king.reply(`*Message set! Will send "${value}" when tagged.*`);

            case "sticker":
                if (!m.quoted || !m.quoted.message.stickerMessage) {
                    return await king.reply("*Reply to a sticker to set it for mention sending.*");
                }
                try {
                    const buffer = await m.quoted.download();
                    mentionActions[mentionJid] = { type: "sticker", data: buffer };
                    return await king.reply("*Sticker set! It will be sent when you are tagged.*");
                } catch (e) {
                    return await king.reply("*Failed to save the sticker.*");
                }

            default:
                return await king.reply("*Invalid action. Use send, react, text, sticker, or off.*");
        }
    }
);

// Listen for messages where the user is tagged
command(
    {
        on: "text",
    },
    async (king, match, m) => {
        if (!m.message || !m.message.extendedTextMessage) return;

        const mentionedJids = m.message.extendedTextMessage.contextInfo?.mentionedJid || [];
        const mentionJid = getMentionJid(king); // Get mentionJid dynamically
        if (!mentionedJids.includes(mentionJid)) return;

        const action = mentionActions[mentionJid];
        if (!action) return;

        switch (action.type) {
            case "send":
                await king.sendFile(action.url);
                break;

            case "react":
                await king.react(action.emoji);
                break;

            case "text":
                await king.reply(action.message);
                break;

            case "sticker":
                await king.client.sendMessage(king.jid, {
                    sticker: action.data,
                    packname: config.STICKER_DATA.split(";")[0],
                    author: config.STICKER_DATA.split(";")[1],
                });
                break;
        }
    }
);