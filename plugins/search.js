const { command, isPrivate } = require("../lib/");
const gis = require("g-i-s");
const fetch = require("node-fetch");
const yts = require("yt-search");

command(
  {
    pattern: "img",
    fromMe: isPrivate,
    desc: "Google Image search",
    type: "search",
  },
  async (king, match) => {
    if (!match) return await king.reply("*_Enter Search Term,number_*");
    let [query, amount] = match.split(",");
    let result = await gimage(query, amount);
    await king.reply(
      `*_Downloading ${amount || 5} images for ${query}_*`
    );
    for (let i of result) {
      await king.sendFromUrl(i);
    }
  }
);

async function gimage(query, amount = 5) {
  return new Promise((resolve, reject) => {
    gis(query, async (error, result) => {
      if (error) return reject(error);
      const list = result.slice(0, amount).map(item => item.url);
      resolve(list);
    });
  });
}

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

      const args = match.split(" ");
      const query = args.slice(0, -1).join(" ") || args[0];
      const limit = args.length > 1 && !isNaN(args[args.length - 1]) ? parseInt(args[args.length - 1]) : null;

      const response = await yts(query);

      if (!response?.videos?.length) {
        await king.react("❌️");
        return await king.reply("No results found for your query.");
      }

      const results = response.videos.slice(0, limit || response.videos.length).map((res, index) => `
🎥 *Result ${index + 1}:*  
📌 *Title:* ${res.title || "N/A"}  
📜 *Description:* ${res.description || "N/A"}  
⏳ *Duration:* ${res.timestamp || "N/A"}  
👁️ *Views:* ${res.views.toLocaleString() || "N/A"}  
📅 *Uploaded:* ${res.ago || "N/A"}  
🔗 *URL:* ${res.url || "N/A"}  
👤 *Channel:* [${res.author.name || "N/A"}](${res.author.url || "#"})  
      `).join("\n\n");

      await king.client.sendMessage(
        king.jid,
        { text: `🔎 *YouTube Search Results:*\n\n${results}` }
      );

      await king.react("✅️");
    } catch (error) {
      console.error("Error in yts command:", error);
      await king.react("❌️");
      await king.reply("An error occurred while fetching YouTube search results.");
    }
  }
);

command(
  {
    pattern: "spsearch",
    fromMe: true,
    desc: "Search Spotify and fetch song details",
    type: "search",
  },
  async (king, match) => {
    try {
      if (!match) {
        await king.react("❌️");
        return await king.reply("Please provide a song name.");
      }

      await king.react("⏳️");

      const apiUrl = `https://fastrestapis.fasturl.cloud/music/spotify?name=${encodeURIComponent(match)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data || data.status !== 200 || !data.result?.length) {
        await king.react("❌️");
        return await king.reply("No results found for your query.");
      }

      const results = data.result.map((res, index) => `
🎵 *Result ${index + 1}:*  
📌 *Title:* ${res.title || "N/A"}  
🎤 *Artist:* ${res.artist || "N/A"}  
⏳ *Duration:* ${res.duration || "N/A"}  
🔗 *URL:* ${res.url || "N/A"}  
      `).join("\n\n");

      await king.client.sendMessage(
        king.jid,
        { text: `🎶 *Spotify Search Results:*\n\n${results}` }
      );

      await king.react("✅️");
    } catch (error) {
      console.error("Error in spotify command:", error);
      await king.react("❌️");
      await king.reply("An error occurred while fetching Spotify search results.");
    }
  }
);