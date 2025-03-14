const { Sequelize } = require("sequelize");
const fs = require("fs");

// Load sudo numbers as a string (not an array)
const loadSudo = () => {
  try {
    if (!fs.existsSync("./lib/sudo.json")) {
      fs.writeFileSync("./lib/sudo.json", JSON.stringify({ SUDO: "2349123721026" }, null, 2));
    }
    const data = fs.readFileSync("./lib/sudo.json", "utf-8");
    return JSON.parse(data).SUDO || "2349123721026";
  } catch (error) {
    console.error("Error loading sudo.json:", error);
    return "2349123721026";
  }
};

if (fs.existsSync("config.env")) {
  require("dotenv").config({ path: "./config.env" });
}

const toBool = (x) => x == "true";

DATABASE_URL = process.env.DATABASE_URL || "./lib/database.db";
let HANDLER = "false";

module.exports = {
  OWNER_NUMBER: "2349123721026",
  LOGS: toBool(process.env.LOGS) || true,
  LANG: process.env.LANG || "EN",
  HANDLERS: process.env.PREFIX || "^[#]",
  BRANCH: "main",
  ANTI_DELETE_ENABLED: false,
  ANTIDELETE_IN_CHAT: false,
  PRIME: false,
  STICKER_DATA: process.env.STICKER_DATA || "X;𝙺𝙸𝙽𝙶",
  BOT_INFO: process.env.BOT_INFO || "X-KING;𝙺𝙸𝙽𝙶;https://files.catbox.moe/jesek7.jpg",
  AUDIO_DATA: process.env.AUDIO_DATA || "𝙺𝙸𝙽𝙶;X-KING;https://files.catbox.moe/jesek7.jpg",
  ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "false",
  AUTO_REACT: process.env.AUTO_REACT || false,
  CAPTION: process.env.CAPTION || "> powered by X Team",
  WORK_TYPE: process.env.WORK_TYPE || "private",
  AUTO_READ_STATUS: toBool(process.env.AUTO_READ_STATUS) || false,
  AUTO_LIKE_STATUS: toBool(process.env.AUTO_LIKE_STATUS) || false,
  SESSION_ID: process.env.SESSION_ID || "",
  AUTO_LIKE_EMOJI: process.env.AUTO_LIKE_EMOJI || "✨",
  DATABASE_URL: DATABASE_URL,
  DATABASE:
    DATABASE_URL === "./lib/database.db"
      ? new Sequelize({
          dialect: "sqlite",
          storage: DATABASE_URL,
          logging: false,
        })
      : new Sequelize(DATABASE_URL, {
          dialect: "postgres",
          ssl: true,
          protocol: "postgres",
          dialectOptions: {
            native: true,
            ssl: { require: true, rejectUnauthorized: false },
          },
          logging: false,
        }),

  HEROKU_APP_NAME: process.env.HEROKU_APP_NAME || " ",
  HEROKU_API_KEY: process.env.HEROKU_API_KEY || " ",
  SUDO: loadSudo(),
};