const { command } = require("../lib/");
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

command({
  pattern: 'eval',
  on: "text",
  fromMe: true,
  desc: 'Runs a server code'
}, async (king, match, m, client) => {
  if (match.startsWith(">")) {
    try {
      let evaled = await eval(`${match.replace(">", "")}`);
      if (typeof evaled !== "string") evaled = util.inspect(evaled);
      await king.reply(evaled);
    } catch (err) {
      await king.reply(util.format(err));
    }
  }
});
command(
  {
    pattern: ".*",
    on: "text",
    fromMe: false, // Trigger for all users
  },
  async (king, match, m) => {
    if (m.isGroup) return; // Ignore messages from groups
    if (!match.toLowerCase().startsWith("save")) return; // Case-insensitive check

    if (!king.reply_message) {
      return king.send("_Reply to a message to save it!_");
    }

    await king.react("✅");

    await king.client.sendMessage(king.user, { forward: king.reply_message });
  }
);