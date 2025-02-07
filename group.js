const { command, isPrivate, tiny, isAdmin, parsedJid, isUrl } = require("../lib");
const Jimp = require("jimp");
const config = require("../config");
const fs = require("fs");
command(
  {
    pattern: "add ?(.*)",
    fromMe: true,
    desc: "Adds a person to the group",
    type: "group",
  },
  async (king, match, m) => {
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
    pattern: "kick ?(.*)",
    fromMe: true,
    desc: "kick a person from the group",
    type: "group",
  },
  async (king, match, m) => {
    if (!king.isGroup) return await king.reply("*_This command only works in group chats_*")
    let num = match || king.reply_king.jid
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
    pattern: "promote ?(.*)",
    fromMe: true,
    desc: "promote a member",
    type: "group",
  },
  async (king, match, m) => {
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
  async (king, match, m) => {
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
    desc: "nute group",
    type: "group",
  },
  async (king, match, m, client) => {
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
  async (king, match, m, client) => {
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
  async (king, match, m, client) => {
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
  async (king, match, m) => {
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
    if (!match) return King.reply("*_Enter or reply to a text to tag_*");
    if (!king.isGroup) return;
    const { participants } = await king.client.groupMetadata(king.jid);
    king.sendIphone(match, {
      mentions: participants.map((a) => a.id),
    });
  }
);