>const { command, isPrivate } = require("../lib/");
const fetch = require("node-fetch");

command(
    {
        pattern: "song",
        fromMe: isPrivate,
        desc: "Download songs from YouTube",
        type: "music",
    },
    async (king, match, m) => {
        match = match || m?.quoted?.text?.trim();
        if (!match) {
            return king.reply("_*Provide a valid search query!*_");
        }

        await king.react("🎵");

        const searchApiUrl = `https://nikka-api.us.kg/search/yts?apiKey=nikka&q=${encodeURIComponent(match)}`;

        try {
            // Search for the song
            const searchResponse = await fetch(searchApiUrl);
            const searchData = await searchResponse.json();

            if (!searchData || !searchData.data || searchData.data.length === 0) {
                await king.react("❌");
                return king.reply("_*No results found for your query!*_");
            }

            const firstResult = searchData.data[0];
            const videoUrl = firstResult.url;

            const downloadApiUrl = `https://fastrestapis.fasturl.cloud/downup/ytmp3?url=${encodeURIComponent(videoUrl)}&quality=128kbps`;

            // Fetch the download details
            const downloadResponse = await fetch(downloadApiUrl);
            const downloadData = await downloadResponse.json();

            if (downloadData.status === 200 && downloadData.content === "Success") {
                const {
                    title,
                    metadata: { thumbnail },
                    url,
                    media,
                    quality,
                } = downloadData.result;

                // Fetch the audio file
                const audioResponse = await fetch(media);
                const audioBuffer = await audioResponse.arrayBuffer();

                const caption = `*X-KING MUSIC DOWNLOADER*\n🎵 *Title:* ${title}\n🎧 *Quality:* ${quality}`;

                // Send the thumbnail and caption
               await king.client.sendMessage(king.jid, {
                image: { url: thumbnail }, // Directly using resdl
                caption: caption,
                mimetype: "image/jpeg",
            });

                // Send the audio file
                await king.client.sendMessage(king.jid, {
                    audio: Buffer.from(audioBuffer),
                    mimetype: "audio/mpeg",
                    ptt: false,
                    fileLength: audioBuffer.byteLength,
                    contextInfo: {
                        externalAdReply: {
                            title: "⇆ㅤ ||◁ㅤ❚❚ㅤ▷ㅤ ⇆",
                            body: "01:43 ━━━━●───── 03:50",
                            sourceUrl: url,
                            mediaUrl: url,
                            mediaType: 1,
                            showAdAttribution: true,
                            renderLargerThumbnail: true,
                            thumbnailUrl: thumbnail || "https://files.catbox.moe/y7memr.jpg",
                        },
                    },
                });

                await king.react("✅");
            } else {
                await king.reply("_*Failed to fetch the audio. Please try again later!*_");
            }
        } catch (error) {
            console.error("Error occurred:", error);
            await king.reply("_*An error occurred while processing the request. Please try again later!*_");
        }
    }
);