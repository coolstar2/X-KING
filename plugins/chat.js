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
const Baileys = require('@whiskeysockets/baileys');
const got = require("got");
const fs = require("fs");
const { PluginDB, installPlugin } = require("../lib/database/plugins");
command(
  {
    pattern: "pp",
    fromMe: true,
    desc: "Set full screen profile picture",
    type: "user",
  },
  async (king, match,m) => {
    if (!king.reply_message.image)
      return await king.reply("*_Reply to a photo_*");
    let media = await m.quoted.download();
    await client.updateProfilePicture(king.user, media, king);
    return await king.reply("*_Profile Picture Updated_*");
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
    type: "utility",
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