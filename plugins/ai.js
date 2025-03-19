const { command, isPrivate, getJson } = require("../lib/");
const axios = require("axios");
const fetch = require('node-fetch');
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fileType = require("file-type");
const Tesseract = require("tesseract.js");
const { 
    encodeFileToBase64,
    performOCR,
    sendToGemini,
    sendToGPT,
    fetchGroqResponse,
    fetchLlamaResponse,
    fetchTTSResponse,
    fetchScreenshotResponse,
    fetchAnimatedScreenshotResponse,
    fetchCarbonResponse,
    fetchFluxResponse,
    fetchDiffusionResponse,
    fetchMetaResponse,
    fetchQwenResponse,
    fetchTranslationResponse 
} = require("../lib/aiModule");

const MAX_FILE_SIZE_MB = 200;

command(
    {
        pattern: "gemini",
        fromMe: true,
        desc: "Send a query with or without an image/video, or reply to a message.",
        type: "ai",
    },
    async (king, match, m) => {
        try {
            let mediaBase64 = null;
            let mimeType = null;
            let userQuery = match;

            // Check if the user replied to a message
            if (king.reply_message) {
                if (king.reply_message.text) {
                    userQuery = king.reply_message.text; // Extract text from replied message
                } else if (king.reply_message.mimetype) {
                    const mediaBuffer = await downloadMediaMessage(king.reply_message, "buffer");
                    if (!mediaBuffer) {
                        return await king.reply("*_Failed to download media._*");
                    }

                    const fileSizeMB = mediaBuffer.length / (1024 * 1024);
                    if (fileSizeMB > MAX_FILE_SIZE_MB) {
                        return await king.reply("*_File size exceeds 200MB limit._*");
                    }

                    // Detect media type
                    mimeType = king.reply_message.mimetype;
                    if (mimeType.startsWith("image/") || mimeType.startsWith("video/")) {
                        mediaBase64 = await encodeFileToBase64(mediaBuffer);
                        userQuery = userQuery || "Describe this media";
                    } else {
                        return await king.reply("*_Unsupported media format. Use an image or video._*");
                    }
                }
            }

            if (!userQuery && !mediaBase64) {
                return await king.reply("*_Send a query or reply to a message/media with your question._*");
            }

            // Send query to Gemini
            const responseText = await sendToGemini(userQuery, mediaBase64, mimeType);

            await king.reply(responseText);
        } catch (error) {
            console.error("[ERROR]", error);
            await king.reply("*_An error occurred while processing your request._*");
        }
    }
);

command(
    {
        pattern: "gpt",
        fromMe: true,
        desc: "Send a query to AI or reply to a message.",
        type: "ai",
    },
    async (king, match, m) => {
        try {
            let userQuery = match;

            // Check if the user replied to a message
            if (king.reply_message && king.reply_message.text) {
                userQuery = king.reply_message.text;
            }

            if (!userQuery) {
                return await king.reply("*_Provide a query or reply to a message._*");
            }

            const responseText = await sendToGPT(userQuery);

            await king.reply(responseText);
        } catch (error) {
            console.error("[ERROR]", error);
            await king.reply("*_An error occurred while processing your request._*");
        }
    }
);

command(
    {
        pattern: "groq",
        fromMe: true,
        desc: "Send a text-based query to the AI or reply to a message.",
        type: "ai",
    },
    async (king, match, m) => {
        try {
            let userQuery = match;

            // Check if the user replied to a message
            if (king.reply_message && king.reply_message.text) {
                userQuery = king.reply_message.text;
            }

            if (!userQuery) {
                return await king.reply("*_Please provide a prompt or reply to a message._*");
            }

            const responseText = await fetchGroqResponse(userQuery);

            await king.reply(responseText);
        } catch (error) {
            console.error("[ERROR]", error);
            await king.reply("*_An error occurred while processing your request._*");
        }
    }
);

command(
    {
        pattern: "llama",
        fromMe: true,
        desc: "Send a text-based query to the AI or reply to a message.",
        type: "ai",
    },
    async (king, match, m) => {
        try {
            let userQuery = match;

            // Check if the user replied to a message
            if (king.reply_message && king.reply_message.text) {
                userQuery = king.reply_message.text;
            }

            if (!userQuery) {
                return await king.reply("*_Please provide a prompt or reply to a message._*");
            }

            const responseText = await fetchLlamaResponse(userQuery);

            await king.reply(responseText);
        } catch (error) {
            console.error("[ERROR]", error);
            await king.reply("*_An error occurred while processing your request._*");
        }
    }
);

command(
    {
        pattern: "tts",
        fromMe: isPrivate,
        desc: "AI-generated Audio with text",
        type: "Ai",
    },
    async (king, match, m) => {
        match = match || m?.quoted?.text?.trim();
        if (!match) return await king.reply(`*_Need an input_*\n*eg:- .tts your speech*`);

        const responseText = await fetchTTSResponse(match);

        await king.sendFromUrl(responseText);
    }
);

command(
    {
        pattern: "ss",
        fromMe: isPrivate,
        desc: "ai screenshot",
        type: "Ai",
    },
    async (king, match, m) => {
        match = match || m?.quoted?.text?.trim();
        if (!match) return await king.reply(`*_Need A Url_*\n*eg:- .ss https://google.com*`);

        const responseText = await fetchScreenshotResponse(match);

        await king.sendFromUrl(responseText, { caption: "> © X-KING" });
    }
);

command(
    {
        pattern: "svid",
        fromMe: isPrivate,
        desc: "ai screenshot",
        type: "Ai",
    },
    async (king, match, m) => {
        match = match || m?.quoted?.text?.trim();
        if (!match) return await king.reply(`*_Need A Url_*\n*eg:- .ssvid https://google.com*`);

        const responseText = await fetchAnimatedScreenshotResponse(match);

        await king.sendFromUrl(responseText, { caption: "> © X-KING" });
    }
);

command(
    {
        pattern: "carbon",
        fromMe: isPrivate,
        desc: "ai carbon effect",
        type: "Ai",
    },
    async (king, match, m) => {
        match = match || m?.quoted?.text?.trim();
        if (!match) return await king.reply(`*_Need A Input_*\n*eg:- .carbon X-king rules*`);

        const responseText = await fetchCarbonResponse(match);

        await king.sendFromUrl(responseText, { caption: "> © X-KING" });
    }
);

command(
    {
        pattern: "flux",
        fromMe: isPrivate,
        desc: "AI-generated image with flux style",
        type: "Ai",
    },
    async (king, match, m) => {
        match = match || m?.quoted?.text?.trim();
        if (!match) return await king.reply(`*_Need an input_*\n*eg:- .flux A cyberpunk warrior*`);

        const responseText = await fetchFluxResponse(match);

        await king.sendFromUrl(responseText, { caption: "> © X-KING" });
    }
);

command(
    {
        pattern: "diffusion",
        fromMe: isPrivate,
        desc: "AI-generated image with flux diffusion",
        type: "Ai",
    },
    async (king, match, m) => {
        match = match || m?.quoted?.text?.trim();
        if (!match) return await king.reply(`*_Need an input_*\n*eg:- .diffusion A futuristic cityscape*`);

        const responseText = await fetchDiffusionResponse(match);

        await king.sendFromUrl(responseText, { caption: "> © X-KING" });
    }
);

command(
    {
        pattern: "meta",
        fromMe: isPrivate,
        desc: "Fetches data from AI API and responds accordingly",
        type: "Ai",
    },
    async (king, match) => {
        if (!match) {
            return king.reply("Please provide a query.\nExample: `.meta what is a virus`");
        }

        try {
            const responseText = await fetchMetaResponse(match);

            await king.reply(responseText);
        } catch (error) {
            console.error("Error fetching API data:", error);
            return king.reply("An error occurred while fetching data.");
        }
    }
);

command(
    {
        pattern: "qwen",
        fromMe: isPrivate,
        desc: "Fetches data from AI API and responds accordingly",
        type: "Ai",
    },
    async (king, match) => {
        if (!match) {
            return king.reply("Please provide a query.\nExample: `.qwen what is a virus`");
        }

        try {
            const responseText = await fetchQwenResponse(match);

            await king.reply(responseText);
        } catch (error) {
            console.error("Error fetching API data:", error);
            return king.reply("An error occurred while fetching data.");
        }
    }
);

command(
    {
        pattern: "trt",
        fromMe: isPrivate,
        desc: "Translates text using the API",
        type: "Ai",
    },
    async (king, match, m) => {
        let textToTranslate = match;

        // If the command is used as a reply, get the quoted message
        if (!textToTranslate && m.quoted) {
            textToTranslate = m.quoted.text;
        }

        if (!textToTranslate) {
            return king.reply("Please provide a text to translate or reply to a message.\nExample: `.trt Kontol`");
        }

        try {
            const responseText = await fetchTranslationResponse(textToTranslate);

            await king.reply(`Translated Text: *${responseText}*`);
        } catch (error) {
            console.error("Error fetching translation:", error);
            return king.reply("An error occurred while fetching translation.");
        }
    }
);

// OCR Command
command(
    {
        pattern: "ocr",
        fromMe: true,
        desc: "Extract text from an image using OCR.",
        type: "Ai",
    },
    async (king, match, m) => {
        if (!king.reply_message)
            return await king.reply("*_Reply to an image to extract text_*");

        try {
            const mediaBuffer = await m.quoted.download();
            if (!mediaBuffer) {
                return await king.reply("*_Failed to download the image._*");
            }

            // Check if the file is an image
            const type = await fileType.fromBuffer(mediaBuffer);
            if (!type || !type.mime.startsWith("image/")) {
                return await king.reply("*_This is not a valid image file._*");
            }

            await king.reply("*_Processing OCR..._*");
            const extractedText = await performOCR(mediaBuffer);

            // Respond with extracted text
            await king.reply(`*_Extracted Text:_*\n\`\`\`${extractedText}\`\`\``);
        } catch (error) {
            console.error('[ERROR]', error);
            await king.reply("*_An error occurred while processing the image._*");
        }
    }
);