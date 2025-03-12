const {
  command,
  webp2mp4,
  isPrivate,
  AddMp3Meta,
  getBuffer
} = require("../lib/");
const gis = require("g-i-s");
const X = require("../config");
const { CAPTION, AUDIO_DATA } = require("../config");
const config = require("../config");
const webpmux = require("node-webpmux");

command(
  {
    pattern: "caption",
    fromMe: isPrivate,
    desc: "change video and image caption",
    type: "media",
  },
  async (king, match, m) => {
    if (!king.reply_message || (!king.reply_message.video && !king.reply_message.image)) 
      return await king.reply('*_Reply at image/video!_*');
    
    let res = await m.quoted.download();
    if (king.reply_message.video) {
      await king.client.sendMessage(king.jid, { video: res, mimetype: "video/mp4", caption: match }, { quoted: king });
    } else if (king.reply_message.image) {
      await king.client.sendMessage(king.jid, { image: res, mimetype: "image/jpeg", caption: match }, { quoted: king });
    }
  }
);
command(
  {
    pattern: "photo",
    fromMe: isPrivate,
    desc: "Converts sticker to photo",
    type: "media",
  },
  async (king, match, m) => {
    if (!m.quoted) return await king.reply("*_Reply to a sticker_*");
    if (m.quoted.mtype !== "stickerMessage")
      return await king.reply("*_Not a sticker_*");

    try {
      let buff = await m.quoted.download();
      await king.client.sendMessage(king.jid, { 
        image: buff, 
        mimetype: "image/jpeg", 
        caption: X.CAPTION 
      }, { quoted: m });
    } catch (error) {
      console.error(error);
      await king.reply("*_Failed to convert sticker to photo_*");
    }
  }
);
command(
  {
    pattern: "sticker",
    fromMe: isPrivate,
    desc: "Converts Photo or video to sticker",
    type: "media",
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
    pattern: "mp4",
    fromMe: isPrivate,
    desc: "Changes sticker to Video",
    type: "media",
  },
  async (king, match, m) => {
    if (!king.reply_message)
      return await king.reply("*_Reply to a sticker_*");
    if (king.reply_message.mtype !== "stickerMessage")
      return await king.reply("*_Not a sticker_*");
    
    let buff = await m.quoted.download();
    let buffer = await webp2mp4(buff);
    return await king.client.sendMessage(buffer, { mimetype: 'video/mp4', caption: (X.CAPTION), quoted: king }, "video");
  }
);

const { toAudio } = require("../lib/media");

command(
  {
    pattern: "mp3",
    fromMe: isPrivate,
    desc: "converts video/audio/voice to mp3",
    type: "media",
  },
  async (king, match, m) => {
    if (!king.reply_message || (!king.reply_message.video && !king.reply_message.audio)) 
      return await king.reply('*_Reply at audio/voice/video!_*');  
    
    let buff = await toAudio(await m.quoted.download(), "mp3");
    let logo = X.AUDIO_DATA.split(/[;]/)[2];
    let imgbuff = await getBuffer(logo.trim());
    let NaMe = X.AUDIO_DATA.split(/[|,;]/)[0] ? X.AUDIO_DATA.split(/[|,;]/)[0] : X.AUDIO_DATA;
    
    const aud = await AddMp3Meta(buff, imgbuff, { title: NaMe, artist: "zeta" });
    return await king.client.sendMessage(king.jid, {
      audio: aud,
      mimetype: 'audio/mpeg',
    }, { quoted: king });
  }
);

command(
  {
    pattern: "gif",
    fromMe: isPrivate,
    desc: "animated sticker/video to gif",
    type: "media",
  },
  async (king, match, m) => {
    if (!king.reply_message)
      return await king.reply("*_Reply to a animated sticker/video_*");
    
    if (king.reply_message.mtype == "stickerMessage") {
      let buff = await m.quoted.download();
      let buffer = await webp2mp4(buff);
      await king.client.sendMessage(king.jid, { video: { url: buffer }, gifPlayback: true, caption: (X.CAPTION) }, { quoted: king });
    } else if (king.reply_message.video) {
      let buff = await m.quoted.download();
      await king.client.sendMessage(king.jid, { video: buff, gifPlayback: true, caption: (X.CAPTION) }, { quoted: king });
    }
  }
);
command(
  {
    pattern: "take",
    fromMe: isPrivate,
    desc: "change audio title,album/sticker author,packname",
    type: "media",
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
    desc: "Extracts and returns sticker metadata",
    type: "media",
  },
  async (king, match, m) => {
    if (!king.reply_message || !king.reply_message.sticker)
      return await king.reply("*_Reply to a sticker_*");

    try {
      // Download the sticker
      const stickerBuffer = await m.quoted.download();

      // Load the sticker into webpmux
      let img = new webpmux.Image();
      await img.load(stickerBuffer);

      // Extract EXIF metadata
      const exifBuffer = img.exif;
      let exifData = exifBuffer ? JSON.parse(exifBuffer.slice(22).toString()) : { error: "No metadata found" };

      // Send sticker metadata
      await king.reply(JSON.stringify(exifData, null, 2));
    } catch (error) {
      await king.reply(`Error extracting sticker metadata: ${error.message}`);
    }
  }
);