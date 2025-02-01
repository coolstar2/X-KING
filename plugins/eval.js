const {
  Function,
  isPrivate,
  getUrl,
  fromBuffer,
  Imgur,
  getBuffer,
  getJson,
  Fancy,
  AddMp3Meta,
  createMap,
  formatBytes,
  parseJid,
  isUrl,
  parsedJid,
  pinterest,
  wallpaper,
  wikimedia,
  quotesAnime,
  aiovideodl,
  umma,
  ringtone,
  styletext,
  FileSize,
  h2k,
  textpro,
  yt,
  ytIdRegex,
  yta,
  ytv,
  runtime,
  clockString,
  sleep,
  jsonformat,
  Serialize,
  processTime,
  command,
} = require("../lib/");
const util = require("util");
const config = require("../config");
const { exec } = require("child_process");

command({
  pattern: 'sh',
  on: "text",
  fromMe: true,
  desc: 'Runs shell commands'
}, async (king, match, m, client) => {
  if (!match.startsWith("$")) return;
  
  exec(match.replace("$", ""), (error, stdout, stderr) => {
    if (error) return king.reply(`Error: ${error.message}`);
    if (stderr) return king.reply(`Stderr: ${stderr}`);
    king.reply(stdout);
  });
});
command({pattern:'eval', on: "text", fromMe: true,desc :'Runs a server code'}, async (king, match, m, client) => {
  if (match.startsWith(">")) {
    try {
      let evaled = await eval(`${match.replace(">", "")}`);
      if (typeof evaled !== "string") evaled = require("util").inspect(evaled);
      await king.reply(evaled);
    } catch (err) {
      await king.reply(util.format(err));
    }
  }
});