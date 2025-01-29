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

// Function to process the image with the API
async function processImage(apiUrl) {
    try {
        const res = await fetch(apiUrl, { method: "GET" });

        if (!res.ok) {
            throw new Error(`Processing API failed with status ${res.status}: ${res.statusText}`);
        }

        const data = await res.buffer();
        return data;
    } catch (error) {
        console.error("Error processing the image:", error);
        throw new Error("Failed to process the image.");
    }
}

// Command for uploading and processing the image
command(
    {
        pattern: "wasted",
        fromMe: true,
        desc: "Reply to an image to upload it, process it, and get the processed image.",
        type: "photo",
    },
    async (king, match, m) => {
        if (!king.reply_message)
            return await king.reply("*_Reply to an image to process it_*");

        try {
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

            // Process the image with the API
            const apiUrl = `https://api.nexoracle.com/image-processing/wasted?apikey=free_key@maher_apis&img=${encodeURIComponent(catboxUrl)}`;
            const processedImageBuffer = await processImage(apiUrl);

            // Send back the processed image
            await king.client.sendMessage(king.jid, {
                image: processedImageBuffer,
                caption: "*_Here is your processed image!_*",
            });
        } catch (error) {
            console.error('[ERROR]', error);
            await king.reply("*_An error occurred while processing the image._*");
        }
    }
);
command(
    {
        pattern: "ad",
        fromMe: true,
        desc: "Reply to an image to upload it, process it, and get the processed image.",
        type: "photo",
    },
    async (king, match, m) => {
        if (!king.reply_message)
            return await king.reply("*_Reply to an image to process it_*");

        try {
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

            // Process the image with the API
            const apiUrl = `https://api.nexoracle.com/image-processing/ad?apikey=free_key@maher_apis&img=${encodeURIComponent(catboxUrl)}`;
            const processedImageBuffer = await processImage(apiUrl);

            // Send back the processed image
            await king.client.sendMessage(king.jid, {
                image: processedImageBuffer,
                caption: "*_Here is your processed image!_*",
            });
        } catch (error) {
            console.error('[ERROR]', error);
            await king.reply("*_An error occurred while processing the image._*");
        }
    }
);
command(
    {
        pattern: "blur",
        fromMe: true,
        desc: "Reply to an image to upload it, process it, and get the processed image.",
        type: "photo",
    },
    async (king, match, m) => {
        if (!king.reply_message)
            return await king.reply("*_Reply to an image to process it_*");

        try {
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

            // Process the image with the API
            const apiUrl = `https://api.nexoracle.com/image-processing/blur?apikey=free_key@maher_apis&img=${encodeURIComponent(catboxUrl)}`;
            const processedImageBuffer = await processImage(apiUrl);

            // Send back the processed image
            await king.client.sendMessage(king.jid, {
                image: processedImageBuffer,
                caption: "*_Here is your processed image!_*",
            });
        } catch (error) {
            console.error('[ERROR]', error);
            await king.reply("*_An error occurred while processing the image._*");
        }
    }
);