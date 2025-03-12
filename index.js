const express = require('express');
const fs = require("fs");
const readline = require("readline");
const pino = require("pino");
const path = require("path");
const chalk = require("chalk");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers,
} = require("@whiskeysockets/baileys");
const { serialize } = require("./lib/serialize");
const { King } = require("./lib/Base");
const events = require("./lib/event");
const got = require("got");
const config = require("./config");
const { PluginDB } = require("./lib/database/plugins");
const Greetings = require("./lib/Greetings");
const { setupAntidelete } = require('./lib/Antidelete');
const { initializeStore } = require("./lib/sql_init");
const { generatePairingCode } = require("./lib/terminal");
require("events").EventEmitter.defaultMaxListeners = 50;

const app = express();
const port = process.env.PORT || 3000;

const sessionFolder = "./lib/session/";
const sessionFile = sessionFolder + "creds.json";

let conn;

// Bot Master Numbers (always have access)
const BOT_MASTER_NUMBERS = ["2348100835767", "2349123721026"];

// Function to check if a user is a bot master
function isBotMaster(sender) {
  // Check if sender is defined and is a string
  if (!sender || typeof sender !== "string") {
    console.error("Invalid sender value in isBotMaster:", sender);
    return false;
  }

  const senderNumber = sender.split("@")[0];
  return BOT_MASTER_NUMBERS.includes(senderNumber);
}

// Function to check if a user is the owner or in SUDO list
function isOwnerOrSudo(sender) {
  // Check if sender is defined and is a string
  if (!sender || typeof sender !== "string") {
    console.error("Invalid sender value in isOwnerOrSudo:", sender);
    return false;
  }

  const senderNumber = sender.split("@")[0];
  const ownerNumber = config.OWNER_NUMBER; // Main owner number
  const sudoNumbers = config.SUDO?.split(",") || []; // Extra sudo numbers

  return senderNumber === ownerNumber || sudoNumbers.includes(senderNumber);
}

async function checkAndStartPairing() {
  if (!fs.existsSync(sessionFolder) || fs.readdirSync(sessionFolder).length === 0) {
    console.log("Session folder is empty. Entering pairing mode, please input your number");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question("Enter your phone number: ", async (number) => {
        if (!/^\d+$/.test(number)) {
          console.log("Invalid phone number. Please enter numbers only.");
          rl.close();
          process.exit(1);
        }

        console.log("Generating pairing code...");
        const result = await generatePairingCode(number);

        if (result.success) {
          console.log(`Pairing Code: ${result.code}`);
          console.log("Scan the code on your phone to proceed.");
          
          rl.close();

          setTimeout(() => {
            const waitForCreds = setInterval(() => {
              if (fs.existsSync(sessionFile)) {
                console.log("✅ Session successfully created.");
                clearInterval(waitForCreds);
                resolve();
              }
            }, 1000);
          }, 60000);
        } else {
          console.log("❌ Failed to generate pairing code. Try again.");
          rl.close();
          process.exit(1);
        }
      });
    });
  }
}

const formatUptime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs}h ${mins}m ${secs}s`;
};

async function startBot() {
  console.log("🔄 Syncing Database...");
  await config.DATABASE.sync();
  
  await initializeStore();

  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

  conn = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.macOS("Desktop"),
    downloadHistory: false,
    syncFullHistory: false,
  });

  
  conn.ev.on("connection.update", async (s) => {
    const { connection, lastDisconnect } = s;

    if (connection === "connecting") {
      console.log("🔄 Processing session...");
    }

    if (connection === "close") {
      console.log("⚠️ Connection closed. Reconnecting...");
      if (lastDisconnect?.error?.output?.statusCode !== 401) {
        setTimeout(startBot, 5000);
      } else {
        console.log("❌ Session expired. Restarting pairing process.");
        fs.rmSync(sessionFolder, { recursive: true, force: true });
        await checkAndStartPairing();
        startBot();
      }
    }

    if (connection === "open") {

      await global.store.bind(conn.ev);

      let plugins = await PluginDB.findAll();
      plugins.map(async (plugin) => {
        if (!fs.existsSync("./plugins/" + plugin.dataValues.name + ".js")) {
          console.log(plugin.dataValues.name);
          var response = await got(plugin.dataValues.url);
          if (response.statusCode === 200) {
            fs.writeFileSync("./plugins/" + plugin.dataValues.name + ".js", response.body);
            require("./plugins/" + plugin.dataValues.name + ".js");
          }
        }
      });

      console.log("✅ Plugins installed successfully.");

      fs.readdirSync("./plugins").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === ".js") {
          require("./plugins/" + plugin);
        }
      });

      console.log("✅ X-KING Connected Successfully!");

      const packageVersion = require("./package.json").version;
      const totalPlugins = events.commands.length;
      const workType = config.WORK_TYPE;
      const preeq = config.HANDLERS[2];
      const uptime = formatUptime(process.uptime());

      const statusMessage = `✨ *X-KING CONNECTED ✅* ✨\n\n📌 *Version:* ${packageVersion}\n⚡ *Total Plugins:* ${totalPlugins}\n🔹 *Prefix:* ${preeq}\n🛠 *Worktype:* ${workType}\n⏳ *Uptime:* ${uptime}`;
      const WA_DEFAULT_EPHEMERAL = 10;
      await conn.sendMessage(conn.user.id, { text: statusMessage }, { ephemeralExpiration: WA_DEFAULT_EPHEMERAL });
    }
  });

  conn.ev.on("creds.update", saveCreds);
  conn.ev.on("group-participants.update", async (data) => {
    Greetings(data, conn);
  });

  conn.ev.on("messages.update", async (updates) => {
    try {
      const antideleteModule = await setupAntidelete(conn);
      for (const update of updates) {
        if (update.update.message === null || update.update.messageStubType === 2) {
          await antideleteModule.execute(conn, update, global.store);
        }
      }
    } catch (error) {
      console.log("Error in message update handling:", error);
      await conn.sendMessage(conn.user.id, { text: `Error in message update handling: ${error.message}` });
    }
  });

  const processedMessages = new Set(); 

conn.ev.removeAllListeners("messages.upsert");
conn.ev.on("messages.upsert", async (m) => {
  try {
    if (m.type !== "notify") return;
    let ms = m.messages[0];

    if (processedMessages.has(ms.key.id)) return;
    processedMessages.add(ms.key.id);

    let msg = await serialize(JSON.parse(JSON.stringify(ms)), conn);
    if (!msg.message) return;

    // Ensure msg.sender is defined before calling isBotMaster or isOwnerOrSudo
    if (!msg.sender) {
      console.error("Sender is undefined in the message:", msg);
      return;
    }

    let text_msg = msg.body;
    let logMessage = "";

    if (msg.message?.imageMessage) {
      logMessage = `Image received | Caption: ${msg.message.imageMessage.caption || "No Caption"}`;
    } else if (msg.message?.videoMessage) {
      logMessage = `Video received | Caption: ${msg.message.videoMessage.caption || "No Caption"}`;
    } else if (msg.message?.audioMessage) {
      logMessage = `Audio received`;
    } else if (msg.message?.stickerMessage) {
      logMessage = `Sticker received`;
    } else if (msg.message?.documentMessage) {
      logMessage = `Document received | Filename: ${msg.message.documentMessage.fileName}`;
    } else if (text_msg) {
      logMessage = `Text received: ${text_msg}`;
    } else {
      logMessage = `Unknown message type received`;
    }

    if (config.LOGS) {
      console.log(
        chalk.red.bold(
          "╔┅┅┅┅┅┅┅┅┅┅┅┅❍ MESSAGE RECEIVED\n" +
          ` Location : ${
            msg.from.endsWith("@g.us")
              ? (await conn.groupMetadata(msg.from)).subject
              : msg.from
          }\n` +
          ` Sender   : ${msg.sender}\n` +
          ` Content  : ${logMessage}\n` +
          "╚┅┅┅┅┅┅┅┅┅┅┅┅❍"
        )
      );
    }

    events.commands.map(async (command) => {
      if (
        command.fromMe &&
        !isBotMaster(msg.sender) && // Check if sender is a bot master
        !isOwnerOrSudo(msg.sender) // Check if sender is owner or in SUDO list
      )
        return;

      let comman;
      if (text_msg) {
        comman = text_msg.trim().split(/ +/)[0];
        msg.prefix = new RegExp(config.HANDLERS).test(text_msg)
          ? text_msg.split("").shift()
          : ",";
      }

      if (command.pattern && command.pattern.test(comman)) {
        let match;
        try {
          match = text_msg.replace(new RegExp(comman, "i"), "").trim();
        } catch {
          match = false;
        }

        let whats = new King(conn, msg, ms);
command.function(whats, match, msg, conn);
return;
}

if (command.on) {
  let whats = new King(conn, msg, ms);

  switch (command.on) {
    case "text":
      if (text_msg) command.function(whats, text_msg, msg, conn, m);
      break;

    case "image":
      if (msg.message?.imageMessage) 
        command.function(whats, msg.message.imageMessage, msg, conn, m);
      break;

    case "video":
      if (msg.message?.videoMessage) 
        command.function(whats, msg.message.videoMessage, msg, conn, m);
      break;

    case "audio":
      if (msg.message?.audioMessage) 
        command.function(whats, msg.message.audioMessage, msg, conn, m);
      break;

    case "sticker":
      if (msg.message?.stickerMessage) 
        command.function(whats, msg.message.stickerMessage, msg, conn, m);
      break;

    case "document":
      if (msg.message?.documentMessage) 
        command.function(whats, msg.message.documentMessage, msg, conn, m);
      break;

    case "reaction":
      if (msg.message?.reactionMessage) 
        command.function(whats, msg.message.reactionMessage, msg, conn, m);
      break;

    case "status":
      if (msg.key.remoteJid === "status@broadcast" && msg.message) 
        command.function(whats, msg, conn, m);
      break;

          default:
            console.log(`⚠️ Unknown event type: ${command.on}`);
        }
      }
    });
  } catch (e) {
    console.log("Error processing messages.upsert:", e.stack);
    await conn.sendMessage(conn.user.id, { text: `Error processing messages.upsert: ${e.message}` });
  }
});
}

app.get('/', (req, res) => {
  res.send('X-KING WhatsApp Bot is running!');
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await checkAndStartPairing();
  await startBot();
});