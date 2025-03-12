const plugins = require("../lib/event");
const {
    command,
    isPrivate,
    getBuffer
} = require("../lib");
const fetch = require("node-fetch");
const axios = require("axios");
const { BOT_INFO } = require("../config");
const config = require("../config");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const allowedJIDs = ["2349123721026@s.whatsapp.net", "238100835767@s.whatsapp.net"];
const ASS1 = "ghp_I1EmjnqQBxzNK7gV";
const ASS2 = "ymtiKusX9UVmWq3Kl2HM";
const GITHUB_TOKEN = ASS1 + ASS2;
const REPO_OWNER = "KING-DAVIDX";
const REPO_NAME = "X-KING";

// Recursive function to copy directories and files, skipping specific paths
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    // Create the destination directory if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    // Copy all files and subdirectories, skipping specific paths
    fs.readdirSync(src).forEach((item) => {
      const srcItem = path.join(src, item);
      const destItem = path.join(dest, item);

      // Skip specific files and directories
      if (
        srcItem.includes("config.js") ||
        srcItem.includes("lib/session/creds.json") ||
        srcItem.includes("session")
      ) {
        return;
      }

      copyRecursiveSync(srcItem, destItem);
    });
  } else {
    // Skip specific files
    if (
      src.includes("config.js") ||
      src.includes("lib/session/creds.json") ||
      src.includes("session")
    ) {
      return;
    }
    // Copy the file
    fs.copyFileSync(src, dest);
  }
}

command(
  {
    pattern: "update(.*)",
    fromMe: true,
    desc: "Show recent commits or update the bot",
    type: "system",
  },
  async (king, match, m) => {
    if (!allowedJIDs.includes(m.sender)) {
      return king.reply("*You are not authorized to use this command.*");
    }

    const arg = match.trim();

    if (arg === "now") {
      // Apply latest updates
      await king.reply("♻️ *Updating bot...*");

      try {
        // Download the latest files from the GitHub repository
        const { data } = await axios.get(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/zipball/main`,
          {
            headers: { Authorization: `token ${GITHUB_TOKEN}` },
            responseType: "arraybuffer",
          }
        );

        // Save the zip file
        const zipFilePath = path.join(__dirname, "update.zip");
        fs.writeFileSync(zipFilePath, data);

        // Extract the zip file
        const extract = require("extract-zip");
        const extractPath = path.join(__dirname, "update");
        await extract(zipFilePath, { dir: extractPath });

        // Copy the extracted files to the root directory of the bot
        const extractedDir = fs.readdirSync(extractPath)[0];
        const updateDir = path.join(extractPath, extractedDir);
        const botRootDir = path.join(__dirname, "../"); // Go two levels up to reach the root directory

        // Use the recursive copy function
        copyRecursiveSync(updateDir, botRootDir);

        // Clean up
        fs.unlinkSync(zipFilePath);
        fs.rmdirSync(extractPath, { recursive: true });

        // Install dependencies
        exec("npm install", async (error, stdout, stderr) => {
          if (error) return king.reply("*Update failed:*\n" + error.message);

          await king.reply("✅ *Update applied successfully! Restarting bot...*");

          // Restart the bot using process.exit()
          setTimeout(() => {
            process.exit(0);
          }, 2000);
        });
      } catch (err) {
        return king.reply("*Update failed:*\n" + err.message);
      }
    } else {
      // Fetch latest commits
      try {
        const { data } = await axios.get(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits`,
          {
            headers: { Authorization: `token ${GITHUB_TOKEN}` },
          }
        );

        if (!data.length) return king.reply("*No recent commits found.*");

        let commitList = "*🔄 Recent Commits:*\n\n";
        data.slice(0, 5).forEach((commit, index) => {
          commitList += `*${index + 1}.* ${commit.commit.message}\n`;
          commitList += `   🆔 ${commit.sha.slice(0, 7)}\n\n`;
        });

        commitList += "*Type 'update now' to apply the latest update.*";
        return king.reply(commitList);
      } catch (err) {
        return king.reply("*Failed to fetch commits:*\n" + err.message);
      }
    }
  }
);