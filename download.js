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
    pattern: "yts",
    fromMe: true,
    desc: "Search YouTube and fetch video details",
    type: "search",
  },
  async (king, match) => {
    try {
      if (!match) {
        await king.react("❌️");
        return await king.reply("Please provide a search term.");
      }

      await king.react("⏳️");

      // Extract query and optional result count
      const args = match.split(" ");
      const query = args.slice(0, -1).join(" ") || args[0];
      const limit = args.length > 1 && !isNaN(args[args.length - 1]) ? parseInt(args[args.length - 1]) : null;

      const response = await getJson(`https://nikka-api.us.kg/search/yts?apiKey=nikka&q=${query}`);

      if (!response || !response.data || response.data.length === 0) {
        await king.react("❌️");
        return await king.reply("No results found for your query.");
      }

      // Apply limit if provided
      const results = response.data.slice(0, limit || response.data.length).map((res, index) => {
        return `
🎥 *Result ${index + 1}:*  
📌 *Title:* ${res.title || "N/A"}  
📜 *Description:* ${res.description || "N/A"}  
⏳ *Duration:* ${res.timestamp || "N/A"}  
👁️ *Views:* ${res.views.toLocaleString() || "N/A"}  
📅 *Uploaded:* ${res.ago || "N/A"}  
🔗 *URL:* ${res.url || "N/A"}  
👤 *Channel:* [${res.author?.name || "N/A"}](${res.author?.url || "#"})  
        `;
      }).join("\n\n");

      await king.client.sendMessage(
        king.jid,
        {
          text: `🔎 *YouTube Search Results:*\n\n${results}`,
        }
      );

      await king.react("✅️");
    } catch (error) {
      console.error("Error in yts command:", error);
      await king.react("❌️");
      await king.reply("An error occurred while fetching YouTube search results.");
    }
  }
);