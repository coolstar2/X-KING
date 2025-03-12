const plugins = require("../lib/event");
const {
    command,
    isPrivate,
    getUrl,
    parsedJid,
    isAdmin
} = require("../lib");
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const FormData = require("form-data");
const fetch = require("node-fetch"); // Ensure node-fetch is installed
const fileType = require("file-type"); // Ensure file-type is installed

const MAX_FILE_SIZE_MB = 200; // Catbox limit

// Function to upload to Catbox
async function uploadToCatbox(buffer) {
    try {
        const type = await fileType.fromBuffer(buffer);
        const ext = type ? type.ext : 'bin';
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

        const data = await res.text();
        return data;
    } catch (error) {
        console.error("Error uploading to Catbox:", error);
        throw new Error("Failed to upload media to Catbox.");
    }
}

// Upload Command
command(
    {
        pattern: "url",
        fromMe: true,
        desc: "Reply to a media message (sticker, image, video, audio, or document) to upload it and get a URL.",
        type: "media",
    },
    async (king, match, m) => {
        if (!king.reply_message)
            return await king.reply("*_Reply to a media message to upload it_*");

        try {
            const quotedMessage = m.quoted.message;
            const mediaBuffer = await m.quoted.download();

            if (!mediaBuffer) {
                return await king.reply("*_Failed to download the media file._*");
            }

            const fileSizeMB = mediaBuffer.length / (1024 * 1024);
            if (fileSizeMB > MAX_FILE_SIZE_MB) {
                return await king.reply(`*_File size exceeds the 200MB limit._*`);
            }

            // Upload the media to Catbox
            const catboxUrl = await uploadToCatbox(mediaBuffer);

            // Respond with the Catbox URL
            await king.reply(`*_Media uploaded successfully! URL: ${catboxUrl}_*`);
        } catch (error) {
            console.error('[ERROR]', error);
            await king.reply("*_An error occurred while uploading the media._*");
        }
    }
);


// Function to send JSON to the API
async function sendJsonToApi(jsonPayload) {
    try {
        const res = await fetch("https://fastrestapis.fasturl.cloud/aillm/gemini/image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(jsonPayload),
        });

        if (!res.ok) {
            throw new Error(`API request failed with status ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Error sending JSON to API:", error);
        throw new Error("Failed to send JSON to API.");
    }
}

// Upload Command
command(
    {
        pattern: "imgai",
        fromMe: true,
        desc: "Reply to a media message (sticker, image) to upload it, and user's query to the API, and get a response.",
        type: "ai",
    },
    async (king, match, m) => {
        if (!king.reply_message)
            return await king.reply("*_Reply to a media message to upload it_*");

        try {
            const quotedMessage = m.quoted.message;
            const mediaBuffer = await m.quoted.download();

            if (!mediaBuffer) {
                return await king.reply("*_Failed to download the media file._*");
            }

            const fileSizeMB = mediaBuffer.length / (1024 * 1024);
            if (fileSizeMB > MAX_FILE_SIZE_MB) {
                return await king.reply(`*_File size exceeds the 200MB limit._*`);
            }

            // Upload the media to Catbox
            const catboxUrl = await uploadToCatbox(mediaBuffer);

            // Prepare JSON payload
            const jsonPayload = {
                ask: match, // User's query
                image: catboxUrl,
            };

            // Send JSON to the API
            const apiResponse = await sendJsonToApi(jsonPayload);

            // Check if the API response is successful
            if (apiResponse.status === 200) {
                // Respond with the API's result
                await king.send(`*_API Response: ${apiResponse.result}_*`);
            } else {
                await king.reply(`*_API Error: ${apiResponse.content}_*`);
            }
        } catch (error) {
            console.error('[ERROR]', error);
            await king.reply("*_An error occurred while processing your request._*");
        }
    }
);