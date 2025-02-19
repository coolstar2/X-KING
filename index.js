const fs = require("fs");
const readline = require("readline");
const pino = require("pino");
const path = require("path");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers,
  makeInMemoryStore,
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
const { generatePairingCode } = require("./lib/terminal"); // Import pairing function

require("events").EventEmitter.defaultMaxListeners = 50;

const sessionFolder = "./lib/session/";
const sessionFile = sessionFolder + "creds.json";
const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});

let conn; // Define connection globally to avoid duplicate instances

async function checkAndStartPairing() {
  if (!fs.existsSync(sessionFolder) || fs.readdirSync(sessionFolder).length === 0) {
    console.log("Session folder is empty. Entering pairing mode...");

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

          // Wait 1 minute (60 seconds) before checking session
          setTimeout(() => {
            const waitForCreds = setInterval(() => {
              if (fs.existsSync(sessionFile)) {
                console.log("✅ Session successfully created.");
                clearInterval(waitForCreds);
                resolve(); // Continue to startBot()
              }
            }, 1000);
          }, 60000); // 60 seconds (1 minute)
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

  store.bind(conn.ev);

  conn.ev.on("connection.update", async (s) => {
    const { connection, lastDisconnect } = s;

    if (connection === "connecting") {
        console.log("🔄 Processing session...");
    }

    if (connection === "close") {
        console.log("⚠️ Connection closed. Reconnecting...");
        if (lastDisconnect?.error?.output?.statusCode !== 401) {
            setTimeout(startBot, 5000); // Delay before retry
        } else {
            console.log("❌ Session expired. Restarting pairing process.");
            fs.rmSync(sessionFolder, { recursive: true, force: true });
            await checkAndStartPairing();
            startBot();
        }
    }

    if (connection === "open") {
        console.log("✅ Successfully logged into WhatsApp!");
        console.log("📥 Installing plugins...");

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

        // Bind store only after successful connection
        if (!global.store) {
            global.store = store;
            global.store.bind(conn.ev);
        }

        // **Move status message here after all plugins are loaded**
        const packageVersion = require("./package.json").version;
        const totalPlugins = events.commands.length; // Now correctly counts loaded commands
        const workType = config.WORK_TYPE;
        const preeq = config.HANDLERS;
        const uptime = formatUptime(process.uptime());

        const statusMessage = `✨ *X-KING CONNECTED ✅* ✨\n\n📌 *Version:* ${packageVersion}\n⚡ *Total Plugins:* ${totalPlugins}\n🔹 *Prefix:* ${preeq}\n🛠 *Worktype:* ${workType}\n⏳ *Uptime:* ${uptime}`;
        await conn.sendMessage(conn.user.id, { text: statusMessage });
    }
});
  conn.ev.on("creds.update", saveCreds);

  conn.ev.on("group-participants.update", async (data) => {
    Greetings(data, conn);
  });

  conn.ev.on("messages.update", async (updates) => {
    try {
      const antideleteModule = await setupAntidelete(conn, global.store);
      for (const update of updates) {
        if (update.update.message === null || update.update.messageStubType === 2) {
          await antideleteModule.execute(conn, update, { store: global.store });
        }
      }
    } catch (error) {
      console.log("Error in message update handling:", error);
    }
  });

  conn.ev.removeAllListeners("messages.upsert");
  conn.ev.on("messages.upsert", async (m) => {
    try {
      if (m.type !== "notify") return;
      let ms = m.messages[0];
      let msg = await serialize(JSON.parse(JSON.stringify(ms)), conn);

      if (!msg.message) return;

      let text_msg = msg.body;
      if (text_msg && config.LOGS) {
        console.log(
          `At : ${
            msg.from.endsWith("@g.us")
              ? (await conn.groupMetadata(msg.from)).subject
              : msg.from
          }\nFrom : ${msg.sender}\nKing:${text_msg}`
        );
      }

      events.commands.map(async (command) => {
        if (
          command.fromMe &&
          !config.SUDO?.split(",").includes(
            msg.sender?.split("@")[0] || !msg.isSelf
          )
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
          var match;
          try {
            match = text_msg.replace(new RegExp(comman, "i"), "").trim();
          } catch {
            match = false;
          }

          whats = new King(conn, msg, ms);
          command.function(whats, match, msg, conn);
        } else if (text_msg && command.on === "text") {
          whats = new King(conn, msg, ms);
          command.function(whats, text_msg, msg, conn, m);
        }
      });
    } catch (e) {
      console.log("Error processing messages.upsert:", e.stack);
    }
  });
}

// **Ensures pairing completes before bot starts**
(async () => {
  await checkAndStartPairing();
  await startBot();
})();