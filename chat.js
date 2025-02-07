const plugins = require("../lib/event");
const {
    command,
    isPrivate,
    clockString,
    getUrl,
    parsedJid,
    isAdmin,
    isUrl   
} = require("../lib");
const {
    BOT_INFO
} = require("../config");
const config = require("../config");
const { tiny } = require("../lib/fancy_font/fancy");
const Jimp = require("jimp");
var { S_WHATSAPP_NET } = require('@whiskeysockets/baileys');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const got = require("got");
const fs = require("fs");
const { PluginDB, installPlugin } = require("../lib/database/plugins");
command(
  {
    pattern: "pp",
    fromMe: true,
    desc: "Update your profile picture by replying to an image.",
    type: "user",
  },
  async (king) => {
    try {
      // Ensure the message has a reply and that the reply is an image
      if (!king.reply_message || !king.reply_message.image) {
        return await king.reply("Please reply to an image to set it as your profile picture.");
      }

      // Download the media (image) from the reply
      const imageBuffer = await king.reply_message.downloadMediaMessage();
      
      // If the download failed, return an error message
      if (!imageBuffer) {
        return await king.reply("Failed to download the image. Please try again.");
      }

      // Get the bot's own JID (user's WhatsApp ID)
      const botJid = king.user;

      // Update the profile picture using the bot's JID and the image buffer
      await king.client.updateProfilePicture(botJid, { url: imageBuffer });
      await king.reply("Your profile picture has been updated successfully!");
    } catch (error) {
      console.error("Error updating profile picture:", error);
      await king.reply("An error occurred while updating your profile picture. Please try again later.");
    }
  }
);
command(
  {
    pattern: "sticker",
    fromMe: isPrivate,
    desc: "Converts Photo or video to sticker",
    type: "converter",
  },
  async (king, match, m) => {
    if (!(king.reply_message.video || king.reply_message.image))
      return await king.reply("*_Reply to photo or video!_*");
    let buff = await m.quoted.download();
    king.sendIphone(
      buff,
      { packname: config.STICKER_DATA.split(";")[0], author: config.STICKER_DATA.split(";")[1] },
      "sticker"
    );
  }
);

command(
  {
    pattern: "tgs",
    fromMe: isPrivate,
    desc: "Download Sticker From Telegram",
    type: "download",
  },
  async (king, match) => {
    if (!match)
      return king.reply(
        "*_Enter a tg sticker url_*\n*_Eg: https://t.me/addstickers/Oldboyfinal\nKeep in mind that there is a chance of ban if used frequently_*"
      );
    let packid = match.split("/addstickers/")[1];
    let { result } = await getJson(
      `https://api.telegram.org/bot891038791:AAHWB1dQd-vi0IbH2NjKYUk-hqQ8rQuzPD4/getStickerSet?name=${encodeURIComponent(
        packid
      )}`
    );
    if (result.is_animated)
      return king.reply("*_Animated stickers are not supported_*");
    king.reply(
      `*_Total stickers :_* ${result.stickers.length}\n*_Estimated complete in:_* ${
        result.stickers.length * 1.5
      } seconds`.trim()
    );
    for (let sticker of result.stickers) {
      let file_path = await getJson(
        `https://api.telegram.org/bot891038791:AAHWB1dQd-vi0IbH2NjKYUk-hqQ8rQuzPD4/getFile?file_id=${sticker.file_id}`
      );
      await king.sendIphone(
        `https://api.telegram.org/file/bot891038791:AAHWB1dQd-vi0IbH2NjKYUk-hqQ8rQuzPD4/${file_path.result.file_path}`,
        { packname: config.STICKER_DATA.split(";")[0], author: config.STICKER_DATA.split(";")[1] },
        "sticker"
      );
      sleep(1500);
    }
  }
);

command(
  {
    pattern: "take",
    fromMe: isPrivate,
    desc: "change audio title,album/sticker author,packname",
    type: "converter",
  },
  async (king, match, m) => {
    if (!king.reply_message || (!king.reply_message.video && !king.reply_message.audio && !king.reply_message.sticker)) return await king.reply('*_Reply at sticker/audio/voice/video!_*')  
    if(king.reply_message.audio || king.reply_message.video) {
    let buff = await toAudio(await m.quoted.download());
    let logo = match && match.split(/[,;]/)[2] ? match.split(/[,;]/)[2] : config.AUDIO_DATA.split(/[;]/)[2];
    let imgbuff = await getBuffer(logo.trim());
    let NaMe = match ? match.split(/[|,;]/) ? match.split(/[|,;]/)[0] : match : config.AUDIO_DATA.split(/[|,;]/)[0] ? config.AUDIO_DATA.split(/[|,;]/)[0] : config.AUDIO_DATA;
    const aud = await AddMp3Meta(buff, imgbuff, {title: NaMe, artist: "hi"});
    return await king.client.sendMessage(king.jid, {
        audio: aud,
        mimetype: 'audio/mpeg',
    }, { quoted: message });
    } else if(king.reply_message.sticker){
    let buff = await m.quoted.download();
    let [packname, author] = match.split(";");
    await king.sendIphone(
      buff,
      {
        packname: packname || config.STICKER_DATA.split(";")[0],
        author: author || config.STICKER_DATA.split(";")[1]
      },
      "sticker"
    );
    }
});

command(
  {
    pattern: "exif",
    fromMe: true,
    desc: "description",
    type: "converter",
  },
  async (king, match, m) => {
    if (!king.reply_message || !king.reply_message.sticker)
      return await king.reply("*_Reply to sticker_*");
    let img = new Image();
    await img.load(await m.quoted.download());
    const exif = JSON.parse(img.exif.slice(22).toString());
    await king.reply(exif);
  }
);
command(
  {
    pattern: "fullpp",
    fromMe: true,
    desc: "Set full-screen profile picture",
    type: "user",
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
    type: "user",
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
    type: "user",
  },
  async (king, match) => {
    return await king.reply( king.mention[0] || king.reply_message.jid || king.jid
    );
  }
);
command(
  {
    pattern: "gpp",
    fromMe: true,
    desc: "Set full-screen profile picture for groups",
    type: "group",
  },
  async (king, match, m) => {
    if (!king.reply_message || !king.reply_message.image) {
      return await king.reply("*_Reply to a photo_*");
    }

    // Check if the command is used in a group chat
    if (!m.isGroup) {
      return await king.reply("*_This command can only be used in a group_*");
    }

    let media = await m.quoted.download(); // Download the image from the quoted message
    try {
      await king.client.updateProfilePicture(king.jid, media); // Update group profile picture
      return await king.reply("*_Group Profile Picture Updated_*");
    } catch (error) {
      console.error(error);
      return await king.reply("*_Failed to update group profile picture_*");
    }
  }
);
command(
  {
    pattern: "block",
    fromMe: true,
    desc: "Block a user or group by tagging, replying, or providing a command",
    type: "user",
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
    type: "user",
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
    pattern: "getgpp",
    fromMe: true,
    desc: "Fetch the profile picture of the current group chat.",
    type: "group",
  },
  async (king) => {
    try {
      if (!king.isGroup) {
        return await king.reply("This command can only be used in group chats.");
      }

      // Fetch the group profile picture URL
      const groupPicUrl = await king.client.profilePictureUrl(king.jid, "image").catch(() => null);

      if (!groupPicUrl) {
        return await king.reply("No profile picture found for this group.");
      }

      // Send the group profile picture
      await king.client.sendMessage(king.jid, {
        image: { url: groupPicUrl },
        caption: "Here is the profile picture of this group chat.",
      });
    } catch (error) {
      console.error("Error fetching group profile picture:", error);
      await king.reply("An error occurred while fetching the group profile picture. Please try again later.");
    }
  }
);
command(
  {
    pattern: "getpp",
    fromMe: true,
    desc: "Fetch the profile picture of a tagged user or replied user.",
    type: "user",
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
let antilinkAction = "off"; // Default state
let warnCount = {}; // Track warnings per user

command(
  {
    pattern: "antilink",
    fromMe: true,
    desc: "Enable Antilink (warn/delete/kick) or turn off",
    type: "group",
  },
  async (king, match) => {
    if (!match) {
      return await king.reply(`*Current Antilink Action:* ${antilinkAction.toUpperCase()}\n\nUse *#antilink warn/delete/kick/off* to change it.`);
    }

    const action = match.toLowerCase();
    if (["warn", "delete", "kick", "off"].includes(action)) {
      antilinkAction = action;
      return await king.reply(`*Antilink action set to:* ${action.toUpperCase()}`);
    } else {
      return await king.reply("❌ *Invalid option!* Use *#antilink warn/delete/kick/off*.");
    }
  }
);

command(
  {
    on: "text",
    fromMe: false,
  },
  async (king, match) => {
    if (!king.isGroup || antilinkAction === "off") return;

    if (isUrl(match)) {
      let botAdmin = await isAdmin(king.jid, king.user, king.client);
      let senderAdmin = await isAdmin(king.jid, king.participant, king.client);

      if (!botAdmin || senderAdmin) return;

      // Send a warning message before deleting the link
      await king.reply(`⚠️ *Warning! Links are not allowed here.*`);

      // Delete the link
      await king.client.sendMessage(king.jid, { delete: king.key });

      switch (antilinkAction) {
        case "warn":
          warnCount[king.participant] = (warnCount[king.participant] || 0) + 1;
          if (warnCount[king.participant] >= 3) {
            delete warnCount[king.participant];
            return await king.client.groupParticipantsUpdate(king.jid, [king.participant], "remove");
          }
          break;

        case "kick":
          return await king.client.groupParticipantsUpdate(king.jid, [king.participant], "remove");

        case "delete":
          // Already deleted above
          break;
      }
    }
  }
);
let antibotAction = "off"; // Default action is off
let warnings = {}; // Store warning counts per user

command(
  {
    pattern: "antibot",
    fromMe: true,
    desc: "Enable Antibot and set action (off/warn/delete/kick)",
    type: "group",
  },
  async (king, match) => {
    if (!match) {
      return await king.reply(`*Current Antibot Action:* ${antibotAction}\n\nUse *#antibot off/warn/delete/kick* to change it.`);
    }

    const action = match.toLowerCase();
    if (["off", "warn", "delete", "kick"].includes(action)) {
      antibotAction = action;
      return await king.reply(`*Antibot action set to:* ${action.toUpperCase()}`);
    } else {
      return await king.reply("Invalid option! Use *#antibot off/warn/delete/kick*.");
    }
  }
);

command(
  {
    on: "text",
    fromMe: false,
  },
  async (king) => {
    if (!king.isGroup || antibotAction === "off") return; // Check if antibot is enabled

    const messageId = king.m.id;
    if (!messageId || !messageId.startsWith("3EB")) return;

    let botAdmin = await isAdmin(king.jid, king.user, king.client);
    let senderAdmin = await isAdmin(king.jid, king.participant, king.client);

    if (!botAdmin) {
      return await king.reply("*_I'm not an admin, so I can't take action!_*");
    }

    if (senderAdmin) {
      return; // Ignore admins
    }

    await king.client.sendMessage(king.jid, { delete: king.key }); // Delete the detected bot message

    switch (antibotAction) {
      case "kick":
        return await king.client.groupParticipantsUpdate(king.jid, [king.participant], "remove");

      case "warn":
        warnings[king.participant] = (warnings[king.participant] || 0) + 1;
        if (warnings[king.participant] >= 3) {
          delete warnings[king.participant]; // Reset warning count after kicking
          return await king.client.groupParticipantsUpdate(king.jid, [king.participant], "remove");
        } else {
          return await king.reply(`⚠️ @${king.participant.split("@")[0]}, warning ${warnings[king.participant]}/3! Bots are not allowed!`, { mentions: [king.participant] });
        }

      case "delete":
      default:
        return;
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
    pattern: ".*",
    on: "text",
    fromMe: false, // Trigger for all users
  },
  async (king, match, m) => {
    if (!match.startsWith("save")) return;
    if (!king.reply_message) return king.send("_Reply to a message to save it!_");

    await king.react("✅");

    await king.client.sendMessage(king.user, { forward: king.reply_message });
  }
);