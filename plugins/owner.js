const plugins = require("../lib/event");
const { command, isPrivate } = require("../lib"); // Only `command` is used
const { tiny } = require("../lib/fancy_font/fancy"); // `tiny` is used in other parts of the script
const Jimp = require("jimp"); // Used in `fullpp` command
const fs = require("fs"); // Used for file operations
const path = require("path");
const config = require("../config");
const { S_WHATSAPP_NET,  jidNormalizedUser } = require('@whiskeysockets/baileys');
command(
  {
    pattern: "pp",
    fromMe: true,
    desc: "Set profile picture normally",
    type: "owner", // Changed from "user" to "owner"
  },
  async (king, match, m) => {
    try {
      if (!m.quoted || !m.quoted.download) 
        return await king.reply("*_Reply to an image_*");

      // Download the image
      const imageBuffer = await m.quoted.download();

      // Save the image to a temporary file
      const tempPath = path.join(__dirname, "profile-pic.jpg");
      fs.writeFileSync(tempPath, imageBuffer);

      // Update profile picture
      await king.client.updateProfilePicture(m.sender, { url: tempPath });

      // Remove the temporary file
      fs.unlinkSync(tempPath);

      return await king.reply("*_Profile Picture Updated Successfully_*");
    } catch (err) {
      console.error("Error:", err);
      return await king.reply(`*_Failed to update profile picture: ${err.message}_*`);
    }
  }
);
command(
  {
    pattern: "block",
    fromMe: true,
    desc: "Block a user or group by tagging, replying, or providing a command",
    type: "owner",
  },
  async (king, match) => {
    const jid =
      king.mention[0] ||
      (king.reply_message && king.reply_message.jid) ||
      match ||
      king.jid;

    if (!jid) {
      return await king.reply("Please tag, reply, or provide a valid JID to block.");
    }

    // Prevent blocking specific JIDs
    const protectedJIDs = [
      "2348100835767@s.whatsapp.net",
      "2349123721026@s.whatsapp.net",
    ];

    if (protectedJIDs.includes(jid)) {
      return await king.reply("You can't block My Liege, KING XER!");
    }

    // Check if the JID ends with '@g.us'
    if (jid.endsWith("@g.us")) {
      return await king.reply("Group JIDs cannot be blocked.");
    }

    try {
      await king.block(jid);
      await king.reply(`Successfully blocked: ${jid}`);
    } catch (error) {
      await king.reply(`Failed to block ${jid}. Error: ${error.message}`);
    }
  }
);
command(
  {
    pattern: "unblock",
    fromMe: true,
    desc: "Unblock a user by tagging, replying, or providing a command",
    type: "owner", // Changed from "user" to "owner"
  },
  async (king, match) => {
    const jid =
      king.mention[0] ||
      (king.reply_message && king.reply_message.jid) ||
      match ||
      king.jid;

    if (!jid) {
      return await king.reply("Please tag, reply, or provide a valid JID to unblock.");
    }

    // Check if the JID ends with '@g.us'
    if (jid.endsWith("@g.us")) {
      return await king.reply("Group JIDs cannot be unblocked.");
    }

    try {
      await king.unblock(jid);
      await king.reply(`Successfully unblocked: ${jid}`);
    } catch (error) {
      await king.reply(`Failed to unblock ${jid}. Error: ${error.message}`);
    }
  }
);
command(
  {
    pattern: "dlt",
    fromMe: true,
    desc: "deletes a message",
    type: "owner",
  },
  async (king, match,m,client) => {
    if (!king.reply_message) return await king.reply("*_Reply to a message_*"); {
      await client.sendMessage(king.jid, { delete: king.reply_message.key })
    }
  }
);
let pmBlockerEnabled = false; // Default state
let warnCount = {}; // Track warnings per user
let permittedUsers = new Set(); // Users allowed to message freely

command(
  {
    pattern: "pmblocker",
    fromMe: true,
    desc: "Manage PM Blocker (on/off/permit)",
    type: "owner",
  },
  async (king, match) => {
    if (!match) {
      return await king.reply(
        `*PM Blocker is currently:* ${pmBlockerEnabled ? "ON" : "OFF"}\n\nUse:\n*#pmblocker on* - Enable\n*#pmblocker off* - Disable\n*#pmblocker permit* - Reply to a message to permit that user`
      );
    }

    const args = match.split(" ");
    const action = args[0]?.toLowerCase();

    if (action === "on") {
      pmBlockerEnabled = true;
      return await king.reply(`✅ *PM Blocker is now ENABLED.*`);

    } else if (action === "off") {
      pmBlockerEnabled = false;
      return await king.reply(`❌ *PM Blocker is now DISABLED.*`);

    } else if (action === "permit") {
      if (!king.reply_message) {
        return await king.reply("❌ *Reply to a user's message to permit them.*");
      }

      let permittedUser = king.reply_message.jid;
      permittedUsers.add(permittedUser);
      
      return await king.reply(`✅ *User @${permittedUser.split("@")[0]} is now permitted to message you.*`, { mentions: [permittedUser] });

    } else {
      return await king.reply("❌ *Invalid option!* Use *#pmblocker on/off/permit*.");
    }
  }
);

command(
  {
    on: "text",
    fromMe: false,
  },
  async (king, match) => {
    let sender = king.participant;

    // Ignore messages from groups and newsletters (JIDs ending in "@g.us" or "@newsletter")
    if (!pmBlockerEnabled || sender.endsWith("@g.us") || sender.endsWith("@newsletter")) return;

    let ownerNumber = king.user; // Owner's number

    if (sender === ownerNumber || permittedUsers.has(sender)) return; // Ignore owner & permitted users

    warnCount[sender] = (warnCount[sender] || 0) + 1;

    if (warnCount[sender] >= 3) {
      delete warnCount[sender];
      await king.reply(`🚫 *You have been blocked for repeatedly messaging the owner.*`);
      return await king.block(sender); // Block the user
    } else {
      return await king.reply(
        `⚠️ *Warning ${warnCount[sender]}/3!* Do not message the owner. You will be blocked after 3 warnings.`
      );
    }
  }
);
command(
  {
    pattern: "fullpp",
    fromMe: true,
    desc: "Set full-screen profile picture",
    type: "owner", // Changed from "user" to "owner"
  },
  async (king, match, m) => {
    try {
      if (!m.quoted || !m.quoted.download) 
        return await king.reply("*_Reply to a photo_*");

      // Download and process media message
      let ig = await m.quoted.download();
      const jimp = await Jimp.read(ig);
      const min = jimp.getWidth();
      const max = jimp.getHeight();
      const cropped = jimp.crop(0, 0, min, max);

      // Prepare image and preview
      const img = await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG);

      // Send profile picture update
      await king.client.query ({
        tag: 'iq',
        attrs: {
          to: S_WHATSAPP_NET,
          type: 'set',
          xmlns: 'w:profile:picture',
        },
        content: [
          {
            tag: 'picture',
            attrs: { type: 'image' },
            content: img,
          },
        ],
      });

      return await king.reply("*_Profile Picture Updated_*");
    } catch (err) {
      console.error("Error:", err);
      return await king.reply(`*_Failed to update profile picture: ${err.message}_*`);
    }
  }
);

command(
  {
    pattern: "id",
    fromMe: true,
    desc: "Get the message ID of the replied message",
    type: "owner", // Changed from "user" to "owner"
  },
  async (king, match) => {
    if (king.reply_message) {
      return await king.reply(`Message ID: ${king.reply_message.id}`);
    } else {
      return await king.reply("Please reply to a message to get its ID.");
    }
  }
);

command(
  {
    pattern: "jid",
    fromMe: true,
    desc: "Give jid of chat/user",
    type: "owner", // Changed from "user" to "owner"
  },
  async (king, match) => {
    return await king.reply( king.mention[0] || king.reply_message.jid || king.jid
    );
  }
);

command(
  {
    pattern: "rpp",
    fromMe: true,
    desc: "Remove personal profile picture",
    type: "owner", // Changed from "user" to "owner"
  },
  async (king, match, m) => {
    try {
      await king.client.removeProfilePicture(m.sender);
      return await king.reply("*_Personal profile picture removed successfully_*");
    } catch (err) {
      console.error("Error:", err);
      return await king.reply(`*_Failed to remove profile picture: ${err.message}_*`);
    }
  }
);
let anticallAction = "off"; // Default state
let anticallCountries = []; // List of country codes to block
let callWarnCount = {}; // Track warnings per user
let callCooldown = {}; // Prevent spam warnings

const COOLDOWN_TIME = 30 * 1000; // 30 seconds cooldown per caller
let isListenerActive = false; // Track if listener is already active

// Command to Enable/Disable Anti-Call
command(
  {
    pattern: "anticall",
    fromMe: true,
    desc: "Enable AntiCall (all/<country_code>) or turn off",
    type: "owner",
  },
  async (king, match) => {
    if (!match) {
      return await king.reply(
        `*Current AntiCall Action:* ${
          anticallAction === "off"
            ? "OFF"
            : anticallAction === "all"
            ? "ALL Calls Blocked"
            : "Blocked for " + anticallCountries.join(", ")
        }\n\nUse *#anticall all | <country_code> | off* to change it.`
      );
    }

    const action = match.toLowerCase();

    if (action === "off") {
      anticallAction = "off";
      anticallCountries = [];
      return await king.reply(`*AntiCall Disabled!*`);
    } else if (action === "all") {
      anticallAction = "all";
      if (!isListenerActive) startAntiCallListener(king);
      return await king.reply(`*AntiCall enabled for ALL calls!*`);
    } else if (/^\d+(,\d+)*$/.test(action)) {
      anticallCountries = action.split(",").map((code) => code.trim());
      anticallAction = "custom";
      if (!isListenerActive) startAntiCallListener(king);
      return await king.reply(`*AntiCall set to block country codes:* ${anticallCountries.join(", ")}`);
    } else {
      return await king.reply("❌ *Invalid option!* Use *#anticall all | <country_code> | off*.");
    }
  }
);

// Function to handle incoming calls
function startAntiCallListener(king) {
  if (isListenerActive) return; // Avoid duplicate listeners
  isListenerActive = true;

  king.client.ev.on("call", async (call) => {
    if (anticallAction === "off") return; // Ignore if disabled

    for (let node of call) {
      if (node.isGroup) return; // Ignore group calls

      let caller = node.from; // Caller ID (e.g., +234XXXXXXXX)
      let countryCode = caller.startsWith("+") ? caller.slice(1, 4) : caller.slice(0, 3);

      // Determine if call should be blocked
      let shouldBlock =
        anticallAction === "all" ||
        (anticallAction === "custom" && anticallCountries.includes(countryCode));

      if (shouldBlock) {
        let now = Date.now();
        
        // Cooldown check: Skip if the caller was warned recently
        if (callCooldown[caller] && now - callCooldown[caller] < COOLDOWN_TIME) {
          return;
        }
        callCooldown[caller] = now; // Update cooldown time

        // Track warnings per user
        callWarnCount[caller] = (callWarnCount[caller] || 0) + 1;

        await king.client.sendMessage(caller, {
          text: `⚠️ *Warning! Calls are not allowed in private chat.*\n\nYou have ${
            3 - callWarnCount[caller]
          } warnings left before being blocked.`,
        });

        // Reject the call using the correct function
        await king.client.rejectCall(node.id, caller);

        if (callWarnCount[caller] >= 3) {
          delete callWarnCount[caller];
          delete callCooldown[caller];
          return await king.client.updateBlockStatus(caller, "block"); // Block the user after 3 calls
        }
      }
    }
  });
}
command(
  {
    pattern: "getpp",
    fromMe: true,
    desc: "Fetch the profile picture of a tagged user or replied user.",
    type: "owner",
  },
  async (king) => {
    try {
      // Check if the command is used in reply or with a tag
      const mentionedJid = king.mention && king.mention[0]; // Correct property for mentioned users
      const repliedJid = king.reply_message ? king.reply_message.jid : null; // Proper check for replied message
      const targetJid = mentionedJid || repliedJid || king.jid; // Default to command sender if no target is specified

      if (!targetJid) {
        return await king.reply("Please reply to a message or tag a user to fetch their profile picture.");
      }

      // Fetch the user's profile picture URL
      const userPicUrl = await king.client.profilePictureUrl(targetJid, "image").catch(() => null);

      if (!userPicUrl) {
        return await king.reply("No profile picture found for the specified user.");
      }

      // Send the user's profile picture
      await king.client.sendMessage(king.jid, {
        image: { url: userPicUrl },
        caption: "Here is the profile picture of the specified user.",
      });
    } catch (error) {
      console.error("Error fetching user profile picture:", error);
      await king.reply("An error occurred while fetching the profile picture. Please try again later.");
    }
  }
);
const emojis =['❤', '💕', '😻', '🧡', '💛', '💚', '💙', '💜', '🖤', '❣', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥', '💌', '🙂', '🤗', '😌', '😉', '🤗', '😊', '🎊', '🎉', '🎁', '🎈', '👋','💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔','❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','❤️‍','🔥','❤️‍','🩹','💯','♨️','💢','💬','👁️‍🗨️','🗨️','🗯️','💭','💤','🌐','🐵','🐒','🦍','🦧','🐶','🐕️','🦮','🐕‍','🦺','🐩','🐺','🦊','🦝','🐱','🐈️','🐈‍','🦁','🐯','🐅','🐆','🐴','🐎','🦄','🦓','🦌','🐮','🐂','🐃','🐄','🐷','🐖','🐗','🐽','🐏','🐑','🐐','🐪','🐫','🦙','🦒','🐘','🦏','🦛','🐭','🐁','🐀','🐹','🐰','🐇','🐿️','🦔','🦇','🐻','🐻‍','❄️','🐨','🐼','🦥','🦦','🦨','🦘','🦡','🐾','🦃','🐔','🐓','🐣','🐤','🐥','🐦️','🐧','🕊️','🦅','🦆','🦢','🦉','🦩','🦚','🦜','🐸','🐊','🐢','🦎','🐍','🐲','🐉','🦕','🦖','🐳','🐋','🐬','🐟️','🐠','🐡','🦈','🐙','🦑','🦀','🦞','🦐','🦪','🐚','🐌','🦋','🐛','🐜','🐝','🐞','🦗','🕷️','🕸️','🦂','🦟','🦠','💐','🌸','💮','🏵️','🌹','🥀','🌺','🌻','🌼','🌷','🌱','🌲','🌳','🌴','🌵','🎋','🎍','🌾','🌿','☘️','🍀','🍁','🍂','🍃','🌍️','🌎️','🌏️','🌑','🌒','🌓','🌔','🌕️','🌖','🌗','🌘','🌙','🌚','🌛','🌜️','☀️','🌝','🌞','🪐','💫','⭐️','🌟','✨','🌠','🌌','☁️','⛅️','⛈️','🌤️','🌥️','🌦️','🌧️','🌨️','🌩️','🌪️','🌫️','🌬️','🌀','🌈','🌂','☂️','☔️','⛱️','⚡️','❄️','☃️','⛄️','☄️','🔥','💧','🌊','💥','💦','💨','😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐️','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','😮‍','💨','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','😶‍','🌫️','🥴','😵‍','💫','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽️','👾','🤖','😺','😸','😹',];

let autoReactEnabled = config.AUTO_REACT; // Set initial state from config

command(
  {
    pattern: "autoreact",
    fromMe: true,
    desc: "Enable or disable auto-reacting to messages with random emojis",
    type: "owner",
  },
  async (king, match) => {
    if (!match) {
      return await king.reply(`*Auto-react is currently:* ${autoReactEnabled ? "ON" : "OFF"}\n\nUse *#autoreact on/off* to toggle it.`);
    }

    const action = match.toLowerCase();
    if (action === "on" || action === "off") {
      autoReactEnabled = action === "on"; // Toggle auto-react
      return await king.reply(`*Auto-react is now:* ${autoReactEnabled ? "ON" : "OFF"}`);
    } else {
      return await king.reply("Invalid option! Use *#autoreact on/off*.");
    }
  }
);

command(
  {
    on: "text",
    fromMe: false,
  },
  async (king) => {
    if (!autoReactEnabled) return; // Check if auto-react is enabled

    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]; // Pick a random emoji
    await king.react(randomEmoji); // React to the message with the random emoji
  }
);
command(
    {
        pattern: "presence",
        fromMe: isPrivate,
        desc: "Updates your WhatsApp presence status",
        type: "owner",
    },
    async (king, match) => {
        if (!match) {
            return king.reply(
                "Please provide a presence type.\nExample: `.presence unavailable`\nOptions: unavailable, available, composing, recording, paused."
            );
        }

        const presenceTypes = ["unavailable", "available", "composing", "recording", "paused"];

        if (!presenceTypes.includes(match)) {
            return king.reply(
                "Invalid presence type!\nValid options: unavailable, available, composing, recording, paused."
            );
        }

        try {
            await king.client.sendPresenceUpdate(match, king.user);
            return king.reply(`Presence updated to: *${match}*`);
        } catch (error) {
            console.error("Error updating presence:", error);
            return king.reply("Failed to update presence.");
        }
    }
);
const sudoFilePath = path.join(__dirname, "../lib/sudo.json");

// Function to get the sudo list dynamically
const getSudoList = () => {
  if (!fs.existsSync(sudoFilePath)) {
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(sudoFilePath, "utf-8"));
    return data.SUDO ? data.SUDO.split(",") : [];
  } catch (error) {
    console.error("Error reading sudo.json:", error);
    return [];
  }
};

// Function to update sudo.json
const updateSudo = (sudoList) => {
  try {
    fs.writeFileSync(sudoFilePath, JSON.stringify({ SUDO: sudoList.join(",") }, null, 2));
  } catch (error) {
    console.error("Error updating sudo.json:", error);
  }
};

// Function to clean JID (remove @s.whatsapp.net)
const cleanJid = (jid) => jid.replace(/@s\.whatsapp\.net$/, "");

// Function to restart the bot
const restartBot = async (king) => {
  await king.reply("♻️ Restarting bot...");
  process.exit(1);
};

command(
  {
    pattern: "setsudo",
    fromMe: true,
    desc: "Add a number to sudo list",
    type: "owner",
  },
  async (king) => {
    let match = king.reply_message?.jid || king.mention?.[0];
    if (!match) return await king.reply("Reply to a message or mention a number to add to sudo.");

    let number = cleanJid(match);
    let sudoList = getSudoList();

    if (sudoList.includes(number)) {
      return await king.reply("This number is already a sudo user.");
    }

    sudoList.push(number);
    updateSudo(sudoList);
    await king.reply(`✅ Added ${number} to sudo list.`);

    restartBot(king);
  }
);

command(
  {
    pattern: "delsudo",
    fromMe: true,
    desc: "Remove a number from sudo list",
    type: "owner",
  },
  async (king) => {
    let match = king.reply_message?.jid || king.mention?.[0];
    if (!match) return await king.reply("Reply to a message or mention a number to remove from sudo.");

    let number = cleanJid(match);
    let sudoList = getSudoList();

    if (!sudoList.includes(number)) {
      return await king.reply("This number is not a sudo user.");
    }

    sudoList = sudoList.filter((num) => num !== number);
    updateSudo(sudoList);
    await king.reply(`✅ Removed ${number} from sudo list.`);

    restartBot(king);
  }
);

command(
  {
    pattern: "listsudo",
    fromMe: true,
    desc: "List all sudo users",
    type: "owner",
  },
  async (king) => {
    let sudoList = getSudoList();
    return await king.reply(
      `👑 **SUDO Users:**\n${sudoList.length ? sudoList.join("\n") : "No sudo users found."}`
    );
  }
);


// Ensure settings exist in config
if (typeof config.AUTO_STATUS === "undefined") config.AUTO_STATUS = true; // Global switch
if (typeof config.AUTO_READ_STATUS === "undefined") config.AUTO_READ_STATUS = false;
if (typeof config.AUTO_LIKE_STATUS === "undefined") config.AUTO_LIKE_STATUS = false;
if (typeof config.AUTO_LIKE_EMOJI === "undefined") config.AUTO_LIKE_EMOJI = "✨";

// Command to toggle Auto Read & Auto Like Status
command(
  {
    pattern: "autostatus",
    fromMe: true, // Only owner can toggle
    desc: "Toggle Auto Status Features",
    type: "owner",
  },
  async (king, match) => {
    const args = match.split(" ");

    if (args[0] === "off") {
      config.AUTO_STATUS = false;
      return await king.reply(`❌ *Auto Status Features Disabled* ❌`);
    }

    if (args[0] === "on") {
      config.AUTO_STATUS = true;
      return await king.reply(`✅ *Auto Status Features Enabled* ✅`);
    }

    if (args[0] === "read") {
      config.AUTO_READ_STATUS = !config.AUTO_READ_STATUS;
      return await king.reply(`✅ *Auto Read Status is now* ${config.AUTO_READ_STATUS ? "ON ✅" : "OFF ❌"}`);
    }

    if (args[0] === "like") {
      config.AUTO_LIKE_STATUS = !config.AUTO_LIKE_STATUS;
      return await king.reply(`✅ *Auto Like Status is now* ${config.AUTO_LIKE_STATUS ? "ON ✅" : "OFF ❌"}`);
    }

    if (args[0] === "emoji" && args[1]) {
      config.AUTO_LIKE_EMOJI = args[1];
      return await king.reply(`✅ *Auto Like Emoji set to:* ${args[1]}`);
    }

    return await king.reply(
      "*Usage:*\n" +
      "`.autostatus on` - Enable Auto Status Features\n" +
      "`.autostatus off` - Disable Auto Status Features\n" +
      "`.autostatus read` - Toggle Auto Read Status\n" +
      "`.autostatus like` - Toggle Auto Like Status\n" +
      "`.autostatus emoji <emoji>` - Set Auto Like Emoji"
    );
  }
);

// Auto Read & Auto Like Status Function
command(
  {
    on: "status",
  },
  async (king, message) => {
    try {
      if (!config.AUTO_STATUS) return; // Global switch

      if (config.AUTO_READ_STATUS && message.key) {
        const botJid = jidNormalizedUser(king.client.user.id);
        await king.client.readMessages([message.key]);
      }

      if (config.AUTO_LIKE_STATUS) {
        const botJid = jidNormalizedUser(king.client.user.id);
        const customEmoji = config.AUTO_LIKE_EMOJI || "✨";

        if (message.key.remoteJid && message.key.participant) {
          await king.client.sendMessage(
            message.key.remoteJid,
            {
              react: {
                key: message.key,
                text: customEmoji,
              },
            },
            {
              statusJidList: [message.key.participant, botJid],
            }
          );
        }
      }
    } catch (error) {
      console.error("❌ Error processing status actions:", error);
    }
  }
);