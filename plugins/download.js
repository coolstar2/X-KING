const { command, isPrivate } = require("../lib/");
const fetch = require("node-fetch");
const yts = require("yt-search");

let testCommandTracker = null;

command(
  {
    pattern: "play",
    fromMe: isPrivate,
    desc: "Searches for a song/video and prompts user to choose between audio or video.",
    type: "download",
  },
  async (king, match, m) => {
    match = match || m.quoted?.text?.trim();
    if (!match) {
      return king.send("_*Provide a valid search query!*_");
    }

    await king.react("🔍");

    try {
      const searchResults = await yts(match);
      if (!searchResults.videos.length) {
        await king.react("❌");
        return king.send("_*No results found for your query!*_");
      }

      const firstResult = searchResults.videos[0];
      const videoUrl = firstResult.url;

      const caption = `*X-KING MEDIA DOWNLOADER*\n> 📌 *Title:* ${firstResult.title}\n> 🔗 *Link:* ${firstResult.url}\n> 👀 *Views:* ${firstResult.views}\n> ⏳ *Duration:* ${firstResult.timestamp}\n\n⚡ *Choose an option:*\n1️⃣ Download as *Audio*\n2️⃣ Download as *Video*`;

      const sent = await king.client.sendMessage(king.jid, {
        image: { url: firstResult.thumbnail },
        caption: caption,
        mimetype: "image/jpeg",
      });

      testCommandTracker = { id: sent?.key?.id, videoUrl };

    } catch (error) {
      console.error("Error occurred:", error);
      await king.send("_*An error occurred while processing the request. Please try again later!*_");
    }
  }
);

command(
  {
    pattern: ".*",
    on: "text",
    fromMe: isPrivate,
  },
  async (king) => {
    if (!testCommandTracker) return;
    if (!king.reply_message) return;
    if (king.reply_message.key.id !== testCommandTracker.id) return;

    const userChoice = king.text.trim();
    if (userChoice !== "1" && userChoice !== "2") {
      return king.send("❌ Invalid choice! Reply with *1* for Audio or *2* for Video.");
    }

    const videoUrl = testCommandTracker.videoUrl;
    testCommandTracker = null; // Reset tracker after selection

    if (userChoice === "1") {
      await king.react("🎵");
      const downloadApiUrl = `https://ditzdevs-ytdl-api.hf.space/api/ytmp3?url=${encodeURIComponent(videoUrl)}`;

      try {
        const downloadResponse = await fetch(downloadApiUrl);
        const downloadData = await downloadResponse.json();

        if (downloadData.status) {
          const { title, downloadUrl } = downloadData.download;
          const image = downloadData.result.thumbnail[0].url;

          const audioResponse = await fetch(downloadUrl);
          const audioBuffer = await audioResponse.arrayBuffer();

          const caption = `*X-KING MUSIC DOWNLOADER*\n> 🎵 *Title:* ${title}`;

          await king.client.sendMessage(king.jid, {
            image: { url: image },
            caption: caption,
            mimetype: "image/jpeg",
          });

          await king.client.sendMessage(king.jid, {
            audio: Buffer.from(audioBuffer),
            mimetype: "audio/mpeg",
            ptt: false,
            fileLength: audioBuffer.byteLength,
            contextInfo: {
              externalAdReply: {
                title: "⇆ㅤ ||◁ㅤ❚❚ㅤ▷ㅤ ⇆",
                body: "01:43 ━━━━●───── 03:50",
                sourceUrl: downloadUrl,
                mediaUrl: downloadUrl,
                mediaType: 1,
                showAdAttribution: true,
                renderLargerThumbnail: true,
                thumbnailUrl: image,
              },
            },
          });

          await king.react("✅");
        } else {
          await king.send("_*Failed to fetch the audio. Please try again later!*_");
        }
      } catch (error) {
        console.error("Error:", error);
        await king.send("_*An error occurred while downloading the audio. Please try again later!*_");
      }

    } else if (userChoice === "2") {
      await king.react("📽️");

      const downloadApiUrl = `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(videoUrl)}`;

      try {
        const downloadResponse = await fetch(downloadApiUrl);
        const downloadData = await downloadResponse.json();

        if (downloadData.status && downloadData.data) {
          const { title, dl, image } = downloadData.data;

          const videoResponse = await fetch(dl);
          const videoBuffer = await videoResponse.arrayBuffer();

          const caption = `*X-KING VIDEO DOWNLOADER*\n> 🎬 *Title:* ${title}`;

          await king.client.sendMessage(king.jid, {
            image: { url: image },
            caption: caption,
            mimetype: "image/jpeg",
          });

          await king.client.sendMessage(king.jid, {
            video: Buffer.from(videoBuffer),
            mimetype: "video/mp4",
            fileLength: videoBuffer.byteLength,
            caption: title,
            contextInfo: {
              externalAdReply: {
                title: "▶️ Watch on YouTube",
                body: "Click to watch the original video",
                sourceUrl: dl,
                mediaUrl: dl,
                mediaType: 1,
                showAdAttribution: true,
                renderLargerThumbnail: true,
                thumbnailUrl: image,
              },
            },
          });

          await king.react("✅");
        } else {
          await king.reply("_*Failed to fetch the video. Please try again later!*_");
        }
      } catch (error) {
        console.error("Error occurred:", error);
        await king.reply("_*An error occurred while processing the request. Please try again later!*_");
      }
    }
  }
);
command(
  {
    pattern: "youtube",
    fromMe: isPrivate,
    desc: "Downloads audio or video from the provided link.",
    type: "download",
  },
  async (king, match, m) => {
    match = match || m.quoted?.text?.trim();
    if (!match) {
      return king.send("_*Provide a valid link!*_");
    }

    await king.react("🔗");

    const videoUrl = match;

    const caption = `*X-KING MEDIA DOWNLOADER*\n> 📌 *Link:* ${videoUrl}\n\n⚡ *Choose an option:*\n1️⃣ Download as *Audio*\n2️⃣ Download as *Video*`;

    const sent = await king.client.sendMessage(king.jid, {
      image: { url: "https://files.catbox.moe/y7memr.jpg" },
      caption: caption,
      mimetype: "image/jpeg",
    });

    testCommandTracker = { id: sent?.key?.id, videoUrl };
  }
);

command(
  {
    pattern: ".*",
    on: "text",
    fromMe: isPrivate,
  },
  async (king) => {
    if (!testCommandTracker) return;
    if (!king.reply_message) return;
    if (king.reply_message.key.id !== testCommandTracker.id) return;

    const userChoice = king.text.trim();
    if (userChoice !== "1" && userChoice !== "2") {
      return king.send("❌ Invalid choice! Reply with *1* for Audio or *2* for Video.");
    }

    const videoUrl = testCommandTracker.videoUrl;
    testCommandTracker = null; // Reset tracker after selection

    if (userChoice === "1") {
      await king.react("🎵");
      const downloadApiUrl = `https://api.ahmmikun.live/api/downloader/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp3`;

      try {
        const downloadResponse = await fetch(downloadApiUrl);
        const downloadData = await downloadResponse.json();

        if (downloadData.data && downloadData.data.status) {
          const { title, image, downloadUrl } = downloadData.data.mediaInfo;

          const audioResponse = await fetch(downloadUrl);
          const audioBuffer = await audioResponse.arrayBuffer();

          const caption = `*X-KING MUSIC DOWNLOADER*\n> 🎵 *Title:* ${title}`;

          await king.client.sendMessage(king.jid, {
            image: { url: image },
            caption: caption,
            mimetype: "image/jpeg",
          });

          await king.client.sendMessage(king.jid, {
            audio: Buffer.from(audioBuffer),
            mimetype: "audio/mpeg",
            ptt: false,
            fileLength: audioBuffer.byteLength,
            contextInfo: {
              externalAdReply: {
                title: "⇆ㅤ ||◁ㅤ❚❚ㅤ▷ㅤ ⇆",
                body: "01:43 ━━━━●───── 03:50",
                sourceUrl: downloadUrl,
                mediaUrl: downloadUrl,
                mediaType: 1,
                showAdAttribution: true,
                renderLargerThumbnail: true,
                thumbnailUrl: image || "https://files.catbox.moe/y7memr.jpg",
              },
            },
          });

          await king.react("✅");
        } else {
          await king.send("_*Failed to fetch the audio. Please try again later!*_");
        }
      } catch (error) {
        console.error("Error:", error);
        await king.send("_*An error occurred while downloading the audio. Please try again later!*_");
      }

    } else if (userChoice === "2") {
      await king.react("📽️");

      const downloadApiUrl = `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(videoUrl)}`;

      try {
        const downloadResponse = await fetch(downloadApiUrl);
        const downloadData = await downloadResponse.json();

        if (downloadData.status && downloadData.data) {
          const { title, dl, image } = downloadData.data;

          const videoResponse = await fetch(dl);
          const videoBuffer = await videoResponse.arrayBuffer();

          const caption = `*X-KING VIDEO DOWNLOADER*\n> 🎬 *Title:* ${title}`;

          await king.client.sendMessage(king.jid, {
            image: { url: image || "https://files.catbox.moe/y7memr.jpg" },
            caption: caption,
            mimetype: "image/jpeg",
          });

          await king.client.sendMessage(king.jid, {
            video: Buffer.from(videoBuffer),
            mimetype: "video/mp4",
            fileLength: videoBuffer.byteLength,
            caption: title,
            contextInfo: {
              externalAdReply: {
                title: "▶️ Watch on YouTube",
                body: "Click to watch the original video",
                sourceUrl: dl,
                mediaUrl: dl,
                mediaType: 1,
                showAdAttribution: true,
                renderLargerThumbnail: true,
                thumbnailUrl: image || "https://files.catbox.moe/y7memr.jpg",
              },
            },
          });

          await king.react("✅");
        } else {
          await king.reply("_*Failed to fetch the video. Please try again later!*_");
        }
      } catch (error) {
        console.error("Error occurred:", error);
        await king.reply("_*An error occurred while processing the request. Please try again later!*_");
      }
    }
  }
);


command(
  {
    pattern: "spotify",
    fromMe: true,
    desc: "Search and download the first Spotify track",
    type: "download",
  },
  async (king, match) => {
    try {
      if (!match) {
        await king.react("❌️");
        return await king.reply("Please provide a song name.");
      }

      await king.react("⏳️");

      // Search for the song on Spotify
      const searchUrl = `https://fastrestapis.fasturl.cloud/music/spotify?name=${encodeURIComponent(match)}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (!searchData || searchData.status !== 200 || !searchData.result || searchData.result.length === 0) {
        await king.react("❌️");
        return await king.reply("No results found for your query.");
      }

      // Get the first result
      const firstResult = searchData.result[0];

      if (!firstResult.url) {
        await king.react("❌️");
        return await king.reply("Could not find a valid Spotify link for the song.");
      }

      // Download the song
      const downloadUrl = `https://ironman.koyeb.app/ironman/dl/v1/aio?url=${encodeURIComponent(firstResult.url)}`;
      const downloadResponse = await fetch(downloadUrl);
      const downloadData = await downloadResponse.json();

      if (!downloadData || !downloadData.videoData || !downloadData.videoData.medias || downloadData.videoData.medias.length === 0) {
        await king.react("❌️");
        return await king.reply("Failed to retrieve the track. Try again later.");
      }

      const track = downloadData.videoData;
      const media = track.medias.find(m => m.audioAvailable && m.extension === "mp3");

      if (!media || !media.url) {
        await king.react("❌️");
        return await king.reply("No downloadable audio found for this track.");
      }

      // Send track details
      const caption = `🎶 *Spotify Track Downloaded*\n\n📌 *Title:* ${track.title || "N/A"}\n🕒 *Duration:* ${track.duration || "N/A"}\n🔗 *Spotify Link:* ${track.url || "N/A"}\n🎧 *Quality:* ${media.quality || "N/A"}\n💾 *Size:* ${media.formattedSize || "N/A"}`;

      await king.client.sendMessage(king.jid, {
        image: { url: track.thumbnail },
        caption: caption,
        mimetype: "image/jpeg",
      });

      // Send the audio file
      await king.client.sendMessage(
        king.jid,
        {
          audio: { url: media.url },
          mimetype: "audio/mpeg",
          fileName: `${track.title.replace(/[^a-zA-Z0-9]/g, "_")}.mp3`,
          ptt: false,
        }
      );

      await king.react("✅️");
    } catch (error) {
      console.error("Error in spotify command:", error);
      await king.react("❌️");
      await king.reply("An error occurred while processing your request.");
    }
  }
);

command(
  {
    pattern: "spdl",
    fromMe: true,
    desc: "Download Spotify tracks",
    type: "download",
  },
  async (king, match, m) => {
    try {
      match = match || m.quoted?.text?.trim();
      if (!match || !match.includes("open.spotify.com/track/")) {
        return king.send("_*Provide a valid Spotify track link!*_");
      }

      await king.react("⏳️");

      // Construct API request URL
      const apiUrl = `https://ironman.koyeb.app/ironman/dl/v1/aio?url=${encodeURIComponent(match)}`;

      // Fetch data from the API
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data || !data.videoData || !data.videoData.medias || data.videoData.medias.length === 0) {
        await king.react("❌️");
        return await king.reply("Failed to retrieve the track. Try again later.");
      }

      const track = data.videoData;
      const media = track.medias.find(m => m.audioAvailable && m.extension === "mp3");

      if (!media || !media.url) {
        await king.react("❌️");
        return await king.reply("No downloadable audio found for this track.");
      }

      // Send the track details
      const caption = `🎶 *Spotify Track Downloaded*\n\n📌 *Title:* ${track.title || "N/A"}\n🕒 *Duration:* ${track.duration || "N/A"}\n🔗 *Spotify Link:* ${track.url || "N/A"}\n🎧 *Quality:* ${media.quality || "N/A"}\n💾 *Size:* ${media.formattedSize || "N/A"}`;

      await king.client.sendMessage(king.jid, {
        image: { url: track.thumbnail },
        caption: caption,
        mimetype: "image/jpeg",
      });

      // Send the audio file properly
      await king.client.sendMessage(
        king.jid,
        {
          audio: { url: media.url },
          mimetype: "audio/mpeg", // Correct MIME type for MP3
          fileName: `${track.title.replace(/[^a-zA-Z0-9]/g, "_")}.mp3`,
          ptt: false, // Set to false to send as a normal audio file, not a voice note
        },
        { quoted: m }
      );

      await king.react("✅️");
    } catch (error) {
      console.error("Error in spotifydl command:", error);
      await king.react("❌️");
      await king.reply("An error occurred while downloading the Spotify track.");
    }
  }
);
command(
  {
    pattern: "igdl",
    fromMe: true,
    desc: "Download Instagram Reels/Videos",
    type: "download",
  },
  async (king, match, m) => {
    try {
      match = match || m.quoted?.text?.trim();
      if (!match || !match.includes("instagram.com/")) {
        return king.send("_*Provide a valid Instagram video/reel link!*_");
      }

      await king.react("⏳️");

      // Construct API request URL
      const apiUrl = `https://fastrestapis.fasturl.cloud/downup/igdown?url=${encodeURIComponent(match)}`;

      // Fetch data from the API
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data || data.status !== 200 || !data.result || !data.result.data || data.result.data.length === 0) {
        await king.react("❌️");
        return await king.reply("Failed to retrieve the Instagram video. Try again later.");
      }

      const video = data.result.data[0];

      // Send video details
      const caption = `🎥 *Instagram Video Downloaded*\n\n📌 *Source:* [Instagram](${match})\n📷 *Thumbnail:* [View Image](${video.thumbnail})`;

      await king.client.sendMessage(king.jid, {
        image: { url: video.thumbnail },
        caption: caption,
        mimetype: "image/jpeg",
      });

      // Send the video file
      await king.client.sendMessage(
        king.jid,
        {
          video: { url: video.url },
          mimetype: "video/mp4",
          fileName: "instagram_video.mp4",
          caption: "Here is your Instagram video! 🎬",
        },
        { quoted: m }
      );

      await king.react("✅️");
    } catch (error) {
      console.error("Error in igdl command:", error);
      await king.react("❌️");
      await king.reply("An error occurred while downloading the Instagram video.");
    }
  }
);
command(
  {
    pattern: "fbdl",
    fromMe: true,
    desc: "Download Facebook Videos",
    type: "download",
  },
  async (king, match, m) => {
    try {
      match = match || m.quoted?.text?.trim();
      if (!match || !match.includes("facebook.com/")) {
        return king.send("_*Provide a valid Facebook video link!*_");
      }

      await king.react("⏳️");

      // Construct API request URL
      const apiUrl = `https://ironman.koyeb.app/ironman/dl/v1/aio?url=${encodeURIComponent(match)}`;

      // Fetch data from the API
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data || !data.videoData || !data.videoData.medias || data.videoData.medias.length === 0) {
        await king.react("❌️");
        return await king.reply("Failed to retrieve the Facebook video. Try again later.");
      }

      const video = data.videoData.medias[0];

      // Send video details
      const caption = `🎥 *Facebook Video Downloaded*\n\n📌 *Title:* ${data.videoData.title || "Untitled"}\n🔗 *Source:* [Facebook](${match})\n📷 *Thumbnail:* [View Image](${data.videoData.thumbnail})\n💾 *Quality:* ${video.quality}\n📦 *Size:* ${video.formattedSize}`;

      await king.client.sendMessage(king.jid, {
        image: { url: data.videoData.thumbnail },
        caption: caption,
        mimetype: "image/jpeg",
      });

      // Send the video file
      await king.client.sendMessage(
        king.jid,
        {
          video: { url: video.url },
          mimetype: "video/mp4",
          fileName: "facebook_video.mp4",
          caption: "Here is your Facebook video! 🎬",
        },
        { quoted: m }
      );

      await king.react("✅️");
    } catch (error) {
      console.error("Error in fbdl command:", error);
      await king.react("❌️");
      await king.reply("An error occurred while downloading the Facebook video.");
    }
  }
);
command(
  {
    pattern: "tiktok",
    fromMe: isPrivate,
    desc: "Downloads audio or video from the provided TikTok link.",
    type: "download",
  },
  async (king, match, m) => {
    match = match || m.quoted?.text?.trim();
    if (!match) {
      return king.send("_*Provide a valid TikTok link!*_");
    }

    await king.react("🔗");

    const videoUrl = match;

    const caption = `*X-KING TIKTOK DOWNLOADER*\n> 📌 *Link:* ${videoUrl}\n\n⚡ *Choose an option:*\n1️⃣ Download as *Audio*\n2️⃣ Download as *Video*`;

    const sent = await king.client.sendMessage(king.jid, {
      image: { url: "https://files.catbox.moe/y7memr.jpg" },
      caption: caption,
      mimetype: "image/jpeg",
    });

    testCommandTracker = { id: sent?.key?.id, videoUrl };
  }
);

command(
  {
    pattern: ".*",
    on: "text",
    fromMe: isPrivate,
  },
  async (king) => {
    if (!testCommandTracker) return;
    if (!king.reply_message) return;
    if (king.reply_message.key.id !== testCommandTracker.id) return;

    const userChoice = king.text.trim();
    if (userChoice !== "1" && userChoice !== "2") {
      return king.send("❌ Invalid choice! Reply with *1* for Audio or *2* for Video.");
    }

    const videoUrl = testCommandTracker.videoUrl;
    testCommandTracker = null; // Reset tracker

    await king.react("⏳");

    const apiUrl = `https://fastrestapis.fasturl.cloud/downup/ttdown?url=${encodeURIComponent(videoUrl)}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status !== 200 || !data.result) {
        return king.send("_*Failed to fetch TikTok media. Please try again later!*_");
      }

      const { title, author, media } = data.result;

      if (userChoice === "1") {
        // Audio Download
        await king.react("🎵");

        const caption = `*X-KING MUSIC DOWNLOADER*\n> 🎵 *Title:* ${title}\n> 👤 *Author:* ${author}`;

        await king.client.sendMessage(king.jid, {
          image: { url: media.coverUrl },
          caption: caption,
          mimetype: "image/jpeg",
        });

        const audioResponse = await fetch(media.musicUrl);
        const audioBuffer = await audioResponse.arrayBuffer();

        await king.client.sendMessage(king.jid, {
          audio: Buffer.from(audioBuffer),
          mimetype: "audio/mpeg",
          ptt: false,
          fileLength: audioBuffer.byteLength,
          contextInfo: {
            externalAdReply: {
              title: "🎶 Play Music",
              body: title,
              sourceUrl: media.musicUrl,
              mediaUrl: media.musicUrl,
              mediaType: 1,
              showAdAttribution: true,
              renderLargerThumbnail: true,
              thumbnailUrl: media.coverUrl,
            },
          },
        });

        await king.react("✅");
      } else {
        // Video Download
        await king.react("📽️");

        const caption = `*X-KING VIDEO DOWNLOADER*\n> 🎬 *Title:* ${title}\n> 👤 *Author:* ${author}`;

        await king.client.sendMessage(king.jid, {
          image: { url: media.coverUrl },
          caption: caption,
          mimetype: "image/jpeg",
        });

        const videoResponse = await fetch(media.videoUrl);
        const videoBuffer = await videoResponse.arrayBuffer();

        await king.client.sendMessage(king.jid, {
          video: Buffer.from(videoBuffer),
          mimetype: "video/mp4",
          fileLength: videoBuffer.byteLength,
          caption: title,
          contextInfo: {
            externalAdReply: {
              title: "▶️ Watch Video",
              body: title,
              sourceUrl: videoUrl,
              mediaUrl: media.videoUrl,
              mediaType: 1,
              showAdAttribution: true,
              renderLargerThumbnail: true,
              thumbnailUrl: media.coverUrl,
            },
          },
        });

        await king.react("✅");
      }
    } catch (error) {
      console.error("Error:", error);
      await king.send("_*An error occurred while processing your request. Please try again later!*_");
    }
  }
);
command(
  {
    pattern: "mfdl",
    fromMe: true,
    desc: "Download MediaFire files",
    type: "download",
  },
  async (king, match, m) => {
    try {
      match = match || m.quoted?.text?.trim();
      if (!match || !match.includes("mediafire.com/")) {
        return king.send("_*Provide a valid MediaFire link!*_");
      }

      await king.react("⏳️");

      // Construct API request URL
      const apiUrl = `https://fastrestapis.fasturl.cloud/downup/mediafiredown?url=${encodeURIComponent(match)}`;

      // Fetch data from the API
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data || data.status !== 200 || !data.result || !data.result.download) {
        await king.react("❌️");
        return await king.reply("Failed to retrieve the MediaFire file. Try again later.");
      }

      const file = data.result;

      // Send file details
      const caption = `📂 *MediaFire File Downloaded*\n\n📌 *Filename:* ${file.filename || "Unknown"}\n🔗 *Source:* [MediaFire](${match})\n📏 *Size:* ${file.size || "Unknown"}\n📄 *Type:* ${file.filetype || "Unknown"}\n🔒 *Password Protected:* ${file.password || "No"}`;

      await king.client.sendMessage(king.jid, {
        document: { url: file.download },
        mimetype: file.mimetype || "application/octet-stream",
        fileName: file.filename || "downloaded_file",
        caption: caption,
      });

      await king.react("✅️");
    } catch (error) {
      console.error("Error in mfdl command:", error);
      await king.react("❌️");
      await king.reply("An error occurred while downloading the MediaFire file.");
    }
  }
);
command(
  {
    pattern: "tgs",
    fromMe: isPrivate,
    desc: "Download Sticker From Telegram",
    type: "download",
  },
  async (king, match) => {
    if (!match)
      return king.reply(
        "*_Enter a tg sticker url_*\n*_Eg: https://t.me/addstickers/Oldboyfinal\nKeep in mind that there is a chance of ban if used frequently_*"
      );
    let packid = match.split("/addstickers/")[1];
    let { result } = await getJson(
      `https://api.telegram.org/bot891038791:AAHWB1dQd-vi0IbH2NjKYUk-hqQ8rQuzPD4/getStickerSet?name=${encodeURIComponent(
        packid
      )}`
    );
    if (result.is_animated)
      return king.reply("*_Animated stickers are not supported_*");
    king.reply(
      `*_Total stickers :_* ${result.stickers.length}\n*_Estimated complete in:_* ${
        result.stickers.length * 1.5
      } seconds`.trim()
    );
    for (let sticker of result.stickers) {
      let file_path = await getJson(
        `https://api.telegram.org/bot891038791:AAHWB1dQd-vi0IbH2NjKYUk-hqQ8rQuzPD4/getFile?file_id=${sticker.file_id}`
      );
      await king.sendIphone(
        `https://api.telegram.org/file/bot891038791:AAHWB1dQd-vi0IbH2NjKYUk-hqQ8rQuzPD4/${file_path.result.file_path}`,
        { packname: config.STICKER_DATA.split(";")[0], author: config.STICKER_DATA.split(";")[1] },
        "sticker"
      );
      sleep(1500);
    }
  }
);