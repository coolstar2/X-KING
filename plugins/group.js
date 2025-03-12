const {
    command,
    isPrivate,
    isAdmin,
    isUrl,
    parsedJid
} = require("../lib");
const config = require("../config");
const Jimp = require("jimp");
const fs = require("fs");
command(
  {
    pattern: "add",
    fromMe: true,
    desc: "Adds a person to the group",
    type: "group",
  },
  async (king, match) => {
    if (!king.isGroup) return await king.reply("*_This command only works in group chats_*")
    let num = match || king.reply_king.jid
    if (!num) return await king.reply("*_Need a number/reply/mention!_*");
    let user = num.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
    let admin = await isAdmin(king.jid, king.user, king.client);
    if (!admin) return await king.reply("*_I'm not admin_*");
    await king.client.groupParticipantsUpdate(king.jid, [user], "add")
    return await king.client.sendMessage(king.jid, { text: `*_@${user.split("@")[0]}, Added to The Group!_*`, mentions: [user] })
  }
);
command(
  {
    pattern: "kik ?(.*)",
    fromMe: true,
    desc: "kick a person from the group",
    type: "group",
  },
  async (king, match) => {
    if (!king.isGroup) return await king.reply("*_This command only works in group chats_*")
    let num = match || king.reply_message.jid
    if (!num) return await king.reply("*_Need a number/reply/mention!_*");
    let user = num.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
    let admin = await isAdmin(king.jid, king.user, king.client);
    if (!admin) return await king.reply("*_I'm not admin_*");
    await king.client.groupParticipantsUpdate(king.jid, [user], "remove")
    return await king.client.sendMessage(king.jid, { text: `*_@${user.split("@")[0]}, Kicked from The Group!_*`, mentions: [user] })
  }
);
command(
  {
    pattern: "promote",
    fromMe: true,
    desc: "promote a member",
    type: "group",
  },
  async (king, match) => {
    if (!king.isGroup) return await king.reply("*_This command only works in group chats_*")
    let user = king.mention[0] || king.reply_king.jid
    if (!user) return await king.reply("*_Need a number/reply/mention!_*");
    var admin = await isAdmin(king.jid, king.user, king.client);
    if (!admin) return await king.reply("*_I'm not admin_*");
    await king.client.groupParticipantsUpdate(king.jid, [user], "promote")
    return await king.client.sendMessage(king.jid, { text: `*_@${user.split("@")[0]}, Is Promoted as Admin!_*`, mentions: [user] })
  }
);

command(
  {
    pattern: "demote ?(.*)",
    fromMe: true,
    desc: "demote a member",
    type: "group",
  },
  async (king, match) => {
    if (!king.isGroup) return await king.reply("*_This command only works in group chats_*")
    let user = king.mention[0] || king.reply_king.jid
    if (!user) return await king.reply("*_Need a number/reply/mention!_*");
    var admin = await isAdmin(king.jid, king.user, king.client);
    if (!admin) return await king.reply("*_I'm not admin_*");
    await king.client.groupParticipantsUpdate(king.jid, [user], "demote")
    return await king.client.sendMessage(king.jid, { text: `*_@${user.split("@")[0]}, Is no longer an Admin!_*`, mentions: [user] })
  }
);

command(
  {
    pattern: "mute",
    fromMe: true,
    desc: "mute group",
    type: "group",
  },
  async (king, match, client) => {
    if (!king.isGroup)
      return await king.reply("*_This command work only in group chats_*");
    if (!isAdmin(king.jid, king.user, king.client))
      return await king.reply("*_I'm not admin_*");
    await king.reply("*_Muted!_*");
    return await client.groupSettingUpdate(king.jid, "announcement");
  }
);

command(
  {
    pattern: "unmute",
    fromMe: true,
    desc: "unmute group",
    type: "group",
  },
  async (king, match, client) => {
    if (!king.isGroup)
      return await king.reply("*_This command work only in groups_*");
    if (!isAdmin(king.jid, king.user, king.client))
      return await king.reply("*_I'm not admin_*");
    await king.reply("*_Unmuted!_*");
    return await client.groupSettingUpdate(king.jid, "not_announcement");
  }
);

command(
  {
    pattern: "gjid",
    fromMe: true,
    desc: "gets jid of all group members",
    type: "group",
  },
  async (king, match, client) => {
    if (!king.isGroup)
      return await king.reply("_This command work only in  group chats_");
    let { participants } = await client.groupMetadata(king.jid);
    let participant = participants.map((u) => u.id);
    let str = "╭──〔 *Group Jids* 〕\n";
    participant.forEach((result) => {
      str += `├ *${result}*\n`;
    });
    str += `╰──────────────`;
    king.reply(str);
  }
);

command(
  {
    pattern: "tagall?(.*)",
    fromMe: true,
    desc: "mention all users in group",
    type: "group",
  },
  async (king, match) => {
    if (!king.isGroup) return;
    const { participants } = await king.client.groupMetadata(king.jid);
    let teks = "";
    for (let mem of participants) {
      teks += `彡 @${mem.id.split("@")[0]}\n`;
    }
    king.sendIphone(teks.trim(), {
      mentions: participants.map((a) => a.id),
    });
  }
);

command(
  {
    pattern: "tag",
    fromMe: true,
    desc: "mention all users in group",
    type: "group",
  },
  async (king, match, m) => {
    match = match || m?.quoted?.text?.trim();
    if (!match) return king.reply("*_Enter or reply to a text to tag_*");
    if (!king.isGroup) return;
    const { participants } = await king.client.groupMetadata(king.jid);
    king.sendIphone(match, {
      mentions: participants.map((a) => a.id),
    });
  }
);

command(
  {
    pattern: "invite ?(.*)",
    fromMe: true,
    desc: "Provides the group's invitation link.",
    type: "group",
  },
  async (king, match) => {
    if (!king.isGroup) return await king.reply("*_This command only works in group chats_*")
    var admin = await isAdmin(king.jid, king.user, king.client);
    if (!admin) return await king.reply("*_I'm not admin_*");
    const response = await king.client.groupInviteCode(king.jid)
    await king.reply(`_https://chat.whatsapp.com/${response}_`)
  }
);

command(
  {
    pattern: "revoke ?(.*)",
    fromMe: true,
    desc: "Revoke Group invite link.",
    type: "group",
  },
  async (king, match) => {
    if (!king.isGroup) return await king.reply("*_This command only works in group chats_*");
    var admin = await isAdmin(king.jid, king.user, king.client);
    if (!admin) return await king.reply("*_I'm not admin_*");
    await king.client.groupRevokeInvite(king.jid);
    await king.reply("*_Revoked!_*");
  }
);

command(
  {
    pattern: "join ?(.*)",
    fromMe: true,
    desc: "Join in the group",
    type: "group",
  },
  async (king, match) => {
    var rgx = /^(https?:\/\/)?chat\.whatsapp\.com\/(?:invite\/)?([a-zA-Z0-9_-]{22})$/;
    if (!match || !rgx.test(match)) return await king.reply("*_Need group link_*");
    var res = await king.client.groupAcceptInvite(match.split("/")[3]);
    if (!res) return await king.reply("*_Invalid Group Link!_*");
    if (res) return await king.reply("*_Joined!_*");
  }
);

command(
  {
    pattern: "newgc",
    fromMe: true,
    desc: "Create a new group",
    type: "group",
  },
  async (king, match, m) => {
    try {
      if (!match) return await king.reply("*_Please provide a group name and tag members_*");

      const args = match.split(" ");
      const groupName = args[0];
      const mentionedUsers = king.mention && king.mention.length ? king.mention : [];

      if (!groupName || mentionedUsers.length === 0) {
        return await king.reply("*_Usage: newgc <group name> @user1 @user2_*");
      }

      const group = await king.client.groupCreate(groupName, mentionedUsers);
      console.log("Created group with ID:", group.id);

      await king.client.sendMessage(group.id, { text: `*Hello everyone! Welcome to ${groupName} 🎉*` });

      return await king.reply(`*_Group '${groupName}' created successfully!_*`);
    } catch (err) {
      console.error("Error:", err);
      return await king.reply(`*_Failed to create group: ${err.message}_*`);
    }
  }
);

command(
  {
    pattern: "gcname",
    fromMe: true,
    desc: "Change group name",
    type: "group",
  },
  async (king, match) => {
    try {
      if (!match) return await king.reply("*_Please provide a new group name_*");

      const newGroupName = match.trim();
      const jid = king.jid;

      const groupMetadata = await king.client.groupMetadata(jid);
      if (!groupMetadata) return await king.reply("*_This command can only be used in groups_*");

      const isAdmin = groupMetadata.participants.some(
        (participant) => participant.id === m.sender && participant.admin
      );
      if (!isAdmin) return await king.reply("*_You must be a group admin to change the group name_*");

      await king.client.groupUpdateSubject(jid, newGroupName);
      return await king.reply(`*_Group name changed to: ${newGroupName}_*`);
    } catch (err) {
      console.error("Error:", err);
      return await king.reply(`*_Failed to change group name: ${err.message}_*`);
    }
  }
);

command(
  {
    pattern: "leave",
    fromMe: true,
    desc: "Leave the current group",
    type: "group",
  },
  async (king) => {
    try {
      const jid = king.jid;
      await king.client.groupLeave(jid);
      return await king.reply("*_Left the group successfully_*");
    } catch (err) {
      console.error("Error:", err);
      return await king.reply("*_Failed to leave the group_*");
    }
  }
);

command(
  {
    pattern: "gcdesc",
    fromMe: true,
    desc: "Change group description",
    type: "group",
  },
  async (king, match) => {
    try {
      if (!match) return await king.reply("*_Please provide a new group description_*");

      const newDescription = match.trim();
      const jid = king.jid;

      const groupMetadata = await king.client.groupMetadata(jid);
      if (!groupMetadata) return await king.reply("*_This command can only be used in groups_*");

      const admins = groupMetadata.participants.filter((p) => p.admin);
      const isAdmin = admins.some((admin) => admin.id === king.sender);
      if (!isAdmin) return await king.reply("*_You must be a group admin to change the group description_*");

      await king.client.groupUpdateDescription(jid, newDescription);
      return await king.reply(`*_Group description updated successfully!_*`);
    } catch (err) {
      console.error("Error:", err);
      return await king.reply(`*_Failed to change group description: ${err.message}_*`);
    }
  }
);

command(
  {
    pattern: "rgpp",
    fromMe: true,
    desc: "Remove group profile picture",
    type: "group",
  },
  async (king, match, m) => {
    try {
      if (!m.isGroup) 
        return await king.reply("*_This command can only be used in groups_*");

      const groupJid = king.jid;

      const groupMetadata = await king.client.groupMetadata(groupJid);
      const isAdmin = groupMetadata.participants.some(
        (participant) => participant.id === m.sender && participant.admin
      );

      if (!isAdmin)
        return await king.reply("*_You must be a group admin to remove the profile picture_*");

      await king.client.removeProfilePicture(groupJid);
      return await king.reply("*_Group profile picture removed successfully_*");
    } catch (err) {
      console.error("Error:", err);
      return await king.reply(`*_Failed to remove group profile picture: ${err.message}_*`);
    }
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

    if (!m.isGroup) {
      return await king.reply("*_This command can only be used in a group_*");
    }

    let media = await m.quoted.download();
    try {
      await king.client.updateProfilePicture(king.jid, media);
      return await king.reply("*_Group Profile Picture Updated_*");
    } catch (error) {
      console.error(error);
      return await king.reply("*_Failed to update group profile picture_*");
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

      const groupPicUrl = await king.client.profilePictureUrl(king.jid, "image").catch(() => null);

      if (!groupPicUrl) {
        return await king.reply("No profile picture found for this group.");
      }

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
    pattern: "ginfo",
    fromMe: true,
    desc: "Fetch the group profile picture and information.",
    type: "group",
  },
  async (king) => {
    try {
      if (!king.isGroup) {
        return await king.reply("❌ This command can only be used in group chats.");
      }

      const jid = king.jid;
      const groupMetadata = await king.client.groupMetadata(jid);
      if (!groupMetadata) {
        return await king.reply("❌ Failed to retrieve group metadata.");
      }

      // Fetch group profile picture
      const groupPicUrl = await king.client
        .profilePictureUrl(jid, "image")
        .catch(() => null);

      // Count admins
      const adminCount = groupMetadata.participants.filter((member) => member.admin).length;

      // Format group information
      const groupInfo = `*Group Information*\n\n` +
        `*Group Name:* ${groupMetadata.subject}\n` +
        `*Total Members:* ${groupMetadata.participants.length}\n` +
        `*Admins:* ${adminCount}\n` +
        `*Created On:* ${new Date(groupMetadata.creation * 1000).toLocaleString()}\n\n` +
        `*Description:*\n${groupMetadata.desc || "No description available."}`;

      // Send group info with profile picture (if available)
      if (groupPicUrl) {
        await king.client.sendMessage(jid, {
          image: { url: groupPicUrl },
          caption: groupInfo,
        });
      } else {
        await king.reply(groupInfo);
      }
    } catch (error) {
      console.error("Error fetching group info:", error);
      await king.reply("⚠️ An error occurred while fetching group information. Please try again later.");
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
let antiWordAction = "off"; 
let forbiddenWords = new Set(); // Store forbidden words

command(
  {
    pattern: "antiword",
    fromMe: true,
    desc: "Enable AntiWord (warn/delete/kick/off), manage words",
    type: "group",
  },
  async (king, match) => {
    let args = match.split(" ");
    let subCommand = args[0]?.toLowerCase();
    let word = args.slice(1).join(" ").toLowerCase();

    if (!subCommand) {
      return await king.reply(`*Current AntiWord Action:* ${antiWordAction.toUpperCase()}\n\nUse:\n- *#antiword warn/delete/kick/off* (Set action)\n- *#antiword add [word]* (Add word)\n- *#antiword remove [word]* (Remove word)\n- *#antiword list* (Show words)`);
    }

    if (["warn", "delete", "kick", "off"].includes(subCommand)) {
      antiWordAction = subCommand;
      return await king.reply(`*AntiWord action set to:* ${subCommand.toUpperCase()}`);
    } 
    
    if (subCommand === "add" && word) {
      forbiddenWords.add(word);
      return await king.reply(`✅ *Added to forbidden words:* ${word}`);
    } 
    
    if (subCommand === "remove" && word) {
      if (forbiddenWords.has(word)) {
        forbiddenWords.delete(word);
        return await king.reply(`✅ *Removed from forbidden words:* ${word}`);
      }
      return await king.reply(`❌ *Word not found:* ${word}`);
    } 
    
    if (subCommand === "list") {
      let list = [...forbiddenWords].join(", ") || "No forbidden words set.";
      return await king.reply(`🚫 *Forbidden Words:*\n${list}`);
    }

    return await king.reply("❌ *Invalid command!* Use *#antiword add/remove/list/warn/delete/kick/off*.");
  }
);

command(
  {
    on: "text",
    fromMe: false,
  },
  async (king, match) => {
    if (!king.isGroup || antiWordAction === "off" || forbiddenWords.size === 0) return;

    let botAdmin = await isAdmin(king.jid, king.user, king.client);
    let senderAdmin = await isAdmin(king.jid, king.participant, king.client);
    if (!botAdmin || senderAdmin) return;

    let messageText = match.toLowerCase();
    if ([...forbiddenWords].some((word) => messageText.includes(word))) {
      await king.reply(`⚠️ *Warning! Forbidden words are not allowed here.*`);
      await king.client.sendMessage(king.jid, { delete: king.key });

      switch (antiWordAction) {
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

let deleteMsgUsers = {}; // Store users & their deletion expiration time

// Command to enable or disable message deletion for a user
command(
  {
    pattern: "deletemsg",
    fromMe: true,
    desc: "Enable/Disable auto message deletion for a participant",
    type: "group",
  },
  async (king, match, m, client) => {
    if (!king.isGroup)
      return await king.reply("*_This command works only in groups_*");
    if (!isAdmin(king.jid, king.user, king.client))
      return await king.reply("*_I'm not an admin_*");

    let user, duration;

    if (m.quoted) {
      user = m.quoted.sender; // If replied to a message
      duration = parseInt(match.trim());
    } else if (king.mention.length > 0) {
      user = king.mention[0]; // If a user is mentioned
      duration = parseInt(match.split(" ")[1]);
    } else {
      let [mentionedUser, time] = match.split(" ");
      if (mentionedUser.startsWith("@")) {
        user = mentionedUser.replace("@", "") + "@s.whatsapp.net";
      } else {
        return await king.reply("*_Tag a user or reply to their message with the time in seconds_*");
      }
      duration = parseInt(time);
    }

    if (!user) return await king.reply("*_You must tag or reply to a user_*");

    if (match.toLowerCase().includes("off")) {
      if (deleteMsgUsers[user]) {
        delete deleteMsgUsers[user];
        return await king.reply(`*_${user.split("@")[0]}'s messages will no longer be deleted!_*`);
      } else {
        return await king.reply("*_User is not being auto-deleted!_*");
      }
    }

    if (isNaN(duration) || duration <= 0) {
      return await king.reply("*_Please enter a valid time in seconds_*");
    }

    deleteMsgUsers[user] = Date.now() + duration * 1000; // Set expiration time
    return await king.reply(`*_${user.split("@")[0]}'s messages will be deleted for ${duration} seconds!_*`);
  }
);

// Real-time message detection and deletion
command(
  {
    on: "text",
    fromMe: false,
  },
  async (king) => {
    if (!king.isGroup) return;

    let sender = king.participant;

    // Check if user is in delete list and if time has not expired
    if (deleteMsgUsers[sender] && Date.now() < deleteMsgUsers[sender]) {
      await king.client.sendMessage(king.jid, { delete: king.key });
    } else {
      delete deleteMsgUsers[sender]; // Remove user if time expired
    }
  }
);