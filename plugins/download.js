const { command, isPrivate } = require("../lib/");
const fetch = require("node-fetch");

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

    const searchApiUrl = `https://nikka-api.us.kg/search/yts?apiKey=nikka&q=${encodeURIComponent(match)}`;

    try {
      const searchResponse = await fetch(searchApiUrl);
      const searchData = await searchResponse.json();

      if (!searchData || !searchData.data || searchData.data.length === 0) {
        await king.react("❌");
        return king.send("_*No results found for your query!*_");
      }

      const firstResult = searchData.data[0];
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
      const downloadApiUrl = `https://fastrestapis.fasturl.cloud/downup/ytmp3?url=${encodeURIComponent(videoUrl)}&quality=128kbps`;

      try {
        const downloadResponse = await fetch(downloadApiUrl);
        const downloadData = await downloadResponse.json();

        if (downloadData.status === 200 && downloadData.content === "Success") {
          const { title, metadata: { thumbnail }, url, media, quality } = downloadData.result;

          const audioResponse = await fetch(media);
          const audioBuffer = await audioResponse.arrayBuffer();

          const caption = `*X-KING MUSIC DOWNLOADER*\n> 🎵 *Title:* ${title}\n> 🎧 *Quality:* ${quality}`;

          await king.client.sendMessage(king.jid, {
            image: { url: thumbnail },
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
          await king.send("_*Failed to fetch the audio. Please try again later!*_");
        }
      } catch (error) {
        console.error("Error:", error);
        await king.send("_*An error occurred while downloading the audio. Please try again later!*_");
      }

    } else if (userChoice === "2") {
      await king.react("📽️");

      const downloadApiUrl = `https://fastrestapis.fasturl.cloud/downup/ytmp4?url=${encodeURIComponent(videoUrl)}&quality=720`;

      try {
        const downloadResponse = await fetch(downloadApiUrl);
        const downloadData = await downloadResponse.json();

        if (downloadData.status === 200 && downloadData.content === "Success") {
          const { title, metadata: { thumbnail, duration, views, uploadDate }, url, media, quality } = downloadData.result;

          const videoResponse = await fetch(media);
          const videoBuffer = await videoResponse.arrayBuffer();

          const caption = `*X-KING VIDEO DOWNLOADER*\n> 🎬 *Title:* ${title}\n> ⏳ *Duration:* ${duration}\n> 👀 *Views:* ${views}\n> 📅 *Uploaded:* ${uploadDate}\n> 📽 *Quality:* ${quality}`;

          await king.client.sendMessage(king.jid, {
            image: { url: thumbnail },
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
    desc: "Fetches details for a direct video link.",
    type: "Download",
  },
  async (king, match, m) => {
    match = match || m.quoted?.text?.trim();
    
    if (!match) {
      return king.send("_*Provide a valid YouTube link!*_");
    }

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    if (!youtubeRegex.test(match)) {
      return king.send("_*Invalid link! Please provide a valid YouTube video link.*_");
    }

    await king.react("🔍");

    const searchApiUrl = `https://nikka-api.us.kg/search/yts?apiKey=nikka&q=${encodeURIComponent(match)}`;

    try {
      const searchResponse = await fetch(searchApiUrl);
      const searchData = await searchResponse.json();

      if (!searchData || !searchData.data || searchData.data.length === 0) {
        await king.react("❌");
        return king.send("_*No results found for your query!*_");
      }

      const firstResult = searchData.data[0];
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
      const downloadApiUrl = `https://fastrestapis.fasturl.cloud/downup/ytmp3?url=${encodeURIComponent(videoUrl)}&quality=128kbps`;
      
      try {
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

          const audioResponse = await fetch(media);
          const audioBuffer = await audioResponse.arrayBuffer();

          const caption = `*X-KING MUSIC DOWNLOADER*\n> 🎵 *Title:* ${title}\n> 🎧 *Quality:* ${quality}`;

          await king.client.sendMessage(king.jid, {
            image: { url: thumbnail },
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
          await king.send("_*Failed to fetch the audio. Please try again later!*_");
        }
      } catch (error) {
        console.error("Error:", error);
        await king.send("_*An error occurred while downloading the audio. Please try again later!*_");
      }

    } else if (userChoice === "2") {
      await king.react("📽️");

      const downloadApiUrl = `https://fastrestapis.fasturl.cloud/downup/ytmp4?url=${encodeURIComponent(videoUrl)}&quality=720`;

      try {
        // Fetch the download details
        const downloadResponse = await fetch(downloadApiUrl);
        const downloadData = await downloadResponse.json();

        if (downloadData.status === 200 && downloadData.content === "Success") {
          const {
            title,
            metadata: { thumbnail, duration, views, uploadDate },
            url,
            media,
            quality,
          } = downloadData.result;

          // Fetch the video file
          const videoResponse = await fetch(media);
          const videoBuffer = await videoResponse.arrayBuffer();

          const caption = `*X-KING VIDEO DOWNLOADER*\n> 🎬 *Title:* ${title}\n> ⏳ *Duration:* ${duration}\n> 👀 *Views:* ${views}\n> 📅 *Uploaded:* ${uploadDate}\n> 📽 *Quality:* ${quality}`;

          // Send the thumbnail and caption
          await king.client.sendMessage(king.jid, {
            image: { url: thumbnail },
            caption: caption,
            mimetype: "image/jpeg",
          });

          // Send the video file
          await king.client.sendMessage(king.jid, {
            video: Buffer.from(videoBuffer),
            mimetype: "video/mp4",
            fileLength: videoBuffer.byteLength,
            caption: title,
            contextInfo: {
              externalAdReply: {
                title: "▶️ Watch on YouTube",
                body: "Click to watch the original video",
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
          await king.send("_*Failed to fetch the video. Please try again later!*_");
        }
      } catch (error) {
        console.error("Error occurred:", error);
        await king.send("_*An error occurred while processing the request. Please try again later!*_");
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

      // Parse query and optional limit
      const [query, limit] = match.split(",").map((item) => item.trim());
      const maxResults = limit && !isNaN(limit) ? parseInt(limit) : null;

      const response = await getJson(`https://nikka-api.us.kg/search/yts?apiKey=nikka&q=${query}`);

      if (!response || !response.data || response.data.length === 0) {
        await king.react("❌️");
        return await king.reply("No results found for your query.");
      }

      // Limit results if a valid limit is provided
      const results = response.data.slice(0, maxResults || response.data.length).map((res, index) => {
        return `
📌 **Result ${index + 1}:**
> **Title:** ${res.title || "N/A"}
> **Description:** ${res.description || "N/A"}
> **URL:** ${res.url || "N/A"}
        `;
      }).join("\n\n");

      await king.client.sendMessage(
        king.jid,
        {
          text: `🎥 **YouTube Search Results:**\n\n${results}`,
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