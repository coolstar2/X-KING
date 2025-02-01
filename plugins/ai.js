const { command, isPrivate, getJson } = require("../lib/");
const acrcloud = require("acrcloud");

const acr = new acrcloud({
    host: "identify-ap-southeast-1.acrcloud.com",
    access_key: "ee1b81b47cf98cd73a0072a761558ab1",
    access_secret: "ya9OPe8onFAnNkyf9xMTK8qRyMGmsghfuHrIMmUI",
});

async function Shazam(buffer) {
    let data = (await acr.identify(buffer)).metadata;
    if (!data || !data.music || data.music.length === 0) return null;

    const song = data.music[0]; // Get only the first result
    return {
        title: song.title,
        artist: song.artists?.[0]?.name || "Unknown",
        score: song.score,
        release: song.release_date ? new Date(song.release_date).toLocaleDateString("id-ID") : "N/A",
        duration: toTime(song.duration_ms),
        youtubeUrl: song.external_metadata?.youtube
            ? "https://youtu.be/" + song.external_metadata.youtube.vid
            : null,
    };
}

function toTime(ms) {
    let m = Math.floor(ms / 60000);
    let s = Math.floor(ms / 1000) % 60;
    return [m, s].map((v) => v.toString().padStart(2, "0")).join(":");
}

command(
    {
        pattern: "gpt",
        fromMe: isPrivate,
        desc: "chat gpt",
        type: "Ai",
    },
    async (king, match) => {
        if (!match) return await king.reply(`*_Need Text_*\n*Eg:- .gpt Hi*`);
let {data} = await getJson(`https://nikka-api.us.kg/ai/gemini?apiKey=haki&q=${match}`);
await king.reply(data)
});
command(
    {
        pattern: "gemini",
        fromMe: isPrivate,
        desc: "chat gpt",
        type: "Ai",
    },
    async (king, match) => {
        if (!match) return await king.reply(`*_Need Text_*\n*Eg:- .gpt Hi*`);
let {data} = await getJson(`https://api.siputzx.my.id/api/ai/gemini-pro?content=${match}`);
await king.reply(data)
});
command(
    {
        pattern: "ss",
        fromMe: isPrivate,
        desc: "ai screenshot",
        type: "Ai",
    },
    async (king, match, m) => {
match = match || m?.quoted?.text?.trim();
	if(!match) return await king.reply(`*_Need A Url_*\n*eg:- .ss https://google.com*`);
await king.sendFromUrl(`https://ssweb-livid.vercel.app/ss?url=${match}`, {caption: "> © X-KING"})
});
command(
    {
        pattern: "carbon",
        fromMe: isPrivate,
        desc: "ai carbon effect",
        type: "Ai",
    },
    async (king, match, m) => {
match = match || m?.quoted?.text?.trim();
	if(!match) return await king.reply(`*_Need A Input_*\n*eg:- .carbon X-king rules*`);
await king.sendFromUrl(`https://api.siputzx.my.id/api/m/carbonify?input=${match}`, {caption: "> © X-KING"})
});

// **Shazam Command**
command(
    {
        pattern: "shazam",
        fromMe: true,
        desc: "Identify a song from an audio or video message.",
        type: "ai",
    },
    async (king, match, m) => {
        if (!m.quoted || !m.quoted.message) {
            return await king.reply("*_Reply to an audio or video message to identify it_*");
        }

        try {
            // Download the media buffer
            const buffer = await m.quoted.download();
            if (!buffer) return await king.reply("*_Failed to download the file._*");

            // Identify the song (only one result)
            const song = await Shazam(buffer);
            if (!song) {
                return await king.reply("*_No song was identified._*");
            }

            const songInfo = 
                `🎵 *Title:* ${song.title}\n` +
                `👨‍🎤 *Artist:* ${song.artist}\n` +
                `⏱ *Duration:* ${song.duration}\n` +
                `📅 *Release:* ${song.release}\n`;

            if (song.youtubeUrl) {
                await king.client.sendMessage(m.chat, {
                    text: songInfo,
                    contextInfo: {
                        externalAdReply: {
                            title: song.title,
                            body: `By: ${song.artist}`,
                            thumbnailUrl: `https://i.ytimg.com/vi/${song.youtubeUrl.split("youtu.be/")[1]}/hqdefault.jpg`,
                            mediaType: 1,
                            renderLargerThumbnail: true,
                            mediaUrl: song.youtubeUrl,
                            sourceUrl: song.youtubeUrl,
                        },
                    },
                });
            } else {
                await king.reply(songInfo);
            }

        } catch (error) {
            console.error("[ERROR]", error);
            await king.reply("*_An error occurred while identifying the song._*");
        }
    }
);