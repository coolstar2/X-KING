const { command, webp2mp4, isPrivate } = require("../lib/");
const fetch = require("node-fetch");

const cmdnames = [
  "bite", "bully", "bonk", "blush", "cringe", "cry", "cuddle", "dance",
  "glomp", "hug", "happy", "handhold", "highfive", "kill", "kick", "kiss",
  "lick", "nom", "poke", "pat", "smug", "slap", "smile", "wink", "wave", "yeet"
];

cmdnames.forEach(cmd => {
  command(
    {
      pattern: cmd,
      fromMe: isPrivate,
      desc: `Sends ${cmd} reaction as GIF`,
      type: "reaction",
    },
    async (king, match) => {
      let url = `https://api.nexoracle.com/reactions-pack/${cmd}?apikey=free_key@maher_apis`;

      try {
        let response = await fetch(url);
        if (!response.ok) throw new Error("API fetch failed");

        let buff = await response.arrayBuffer();
        let gifBuffer = await webp2mp4(Buffer.from(buff));

        let mentionedUser = king.mention && king.mention.length
          ? `@${king.mention[0].split("@")[0]}`
          : null;

        let caption;
        let mentions = [];

        if (mentionedUser) {
          caption = `You ${cmd} ${mentionedUser}`;
          mentions.push(king.mention[0]);
        } else if (king.isGroup) {
          const { participants } = await king.client.groupMetadata(king.jid);
          caption = `You ${cmd} *everyone*!`;
          mentions = participants.map(p => p.id);
        } else {
          caption = `You performed *${cmd}*!`;
        }

        await king.client.sendMessage(
          king.jid,
          { video: { url: gifBuffer }, gifPlayback: true, caption, mentions },
          { quoted: king }
        );
      } catch (error) {
        await king.reply("*_Failed to fetch or convert sticker!_*");
      }
    }
  );
});