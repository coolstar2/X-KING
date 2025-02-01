const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers,
  makeInMemoryStore,
} = require("@whiskeysockets/baileys");
const fs = require("fs");
const { serialize } = require("./lib/serialize");
const { King } = require("./lib/Base");
const pino = require("pino");
const path = require("path");
const events = require("./lib/event");
const got = require("got");
const config = require("./config");
const { PluginDB } = require("./lib/database/plugins");
const Greetings = require("./lib/Greetings");
const saveCreds = require("./lib/session");
const { initializeStore } = require('./lib/sql_init');

const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});

require("events").EventEmitter.defaultMaxListeners = 50;

const { File } = require("megajs");

(async function () {
  var prefix = "Nikka-X";
  var output = "./lib/session/";
  var pth = output + "creds.json";

  try {
    if (!fs.existsSync(pth)) {
      if (!config.SESSION_ID.startsWith(prefix)) {
        throw new Error("Invalid session id.");
      }

      var url = "https://mega.nz/file/" + config.SESSION_ID.replace(prefix, "");
      var file = File.fromURL(url);
      await file.loadAttributes();

      if (!fs.existsSync(output)) {
        fs.mkdirSync(output, { recursive: true });
      }

      var data = await file.downloadBuffer();
      fs.writeFileSync(pth, data);
    }
  } catch (error) {
    console.error(error);
  }
})();

fs.readdirSync("./lib/database/").forEach((plugin) => {
  if (path.extname(plugin).toLowerCase() === ".js") {
    require("./lib/database/" + plugin);
  }
});

async function Abhiy() {
  console.log("Syncing Database");
  await config.DATABASE.sync();
  await initializeStore();

  const { state, saveCreds } = await useMultiFileAuthState(
    "./lib/session",
    pino({ level: "silent" })
  );

  let conn = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: true,
    browser: Browsers.macOS("Desktop"),
    downloadHistory: false,
    syncFullHistory: false,
  });

  store.bind(conn.ev);
  await global.store.bind(conn.ev);

  setInterval(() => {
    store.writeToFile("./lib/store_db.json");
    console.log("saved store");
  }, 30 * 60 * 1000);

  conn.ev.on("connection.update", async (s) => {
    const { connection, lastDisconnect } = s;

    if (connection === "connecting") {
      console.log("X-KING");
      console.log("ᴘʀᴏᴄᴇssɪɴɢ sᴇssɪᴏɴ ɪᴅ");
    }

    if (
      connection === "close" &&
      lastDisconnect &&
      lastDisconnect.error &&
      lastDisconnect.error.output.statusCode !== 401
    ) {
      if (conn?.state?.connection !== "open") {
        console.log(lastDisconnect.error.output.payload);
        Abhiy();
      }
    }

    if (connection === "open") {
      console.log("𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟𝗟𝗬 𝗟𝗢𝗚𝗜𝗡𝗘𝗗 𝗜𝗡𝗧𝗢 𝗪𝗛𝗔𝗧𝗦𝗔𝗣𝗣 ✅");
      console.log("𝗜𝗡𝗦𝗧𝗔𝗟𝗟𝗜𝗡𝗚 𝗣𝗟𝗨𝗚𝗜𝗡𝗦 📥");

      let plugins = await PluginDB.findAll();
      plugins.map(async (plugin) => {
        if (!fs.existsSync("./plugins/" + plugin.dataValues.name + ".js")) {
          console.log(plugin.dataValues.name);
          var response = await got(plugin.dataValues.url);
          if (response.statusCode === 200) {
            fs.writeFileSync(
              "./plugins/" + plugin.dataValues.name + ".js",
              response.body
            );
            require("./plugins/" + plugin.dataValues.name + ".js");
          }
        }
      });
      console.log("𝗣𝗟𝗨𝗚𝗜𝗡𝗦 𝗜𝗡𝗦𝗧𝗔𝗟𝗟𝗘𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟𝗟𝗬 ✅");

      fs.readdirSync("./plugins").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === ".js") {
          require("./plugins/" + plugin);
        }
      });

      console.log("𝗫-𝗞𝗜𝗡𝗚 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟𝗟𝗬✅");

      conn.ev.on("creds.update", saveCreds);
      conn.ev.on("group-participants.update", async (data) => {
        Greetings(data, conn);
      });

      conn.ev.removeAllListeners("messages.upsert");
      conn.ev.on("messages.upsert", async (m) => {
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

        // Status Saving Feature
        if (msg.chat === "status@broadcast" && text_msg.toLowerCase() === "save" && msg.quoted) {
          try {
            let media = await msg.quoted.download();
            let mimeType = msg.quoted.mimetype;

            if (!media) {
              return conn.sendMessage(msg.sender, { text: "❌ Failed to download the status." });
            }

            let options = {};
            if (mimeType.startsWith("image")) {
              options.image = media;
            } else if (mimeType.startsWith("video")) {
              options.video = media;
              options.caption = "Here is your saved status.";
            } else {
              return conn.sendMessage(msg.sender, { text: "❌ Unsupported media type." });
            }

            // Send the status media to the user's DM
            await conn.sendMessage(msg.sender, options);
            await conn.sendMessage(msg.chat, { text: "✅ Status saved and sent to your DM!" });

          } catch (error) {
            console.error(error);
            await conn.sendMessage(msg.chat, { text: "❌ Error saving the status." });
          }
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
      });
    }
  });

  process.on("uncaughtException", async (err) => {
    console.log(err);
    await conn.sendMessage(conn.user.id, { text: err.message });
  });
}

setTimeout(() => {
  Abhiy();
}, 3000);