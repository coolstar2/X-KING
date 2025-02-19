"use strict";
const fileType = require("file-type");
const config = require("../config");
const {
  isUrl,
  getBuffer,
  writeExifImg,
  writeExifVid,
  writeExifWebp,
  tiny,
  parseJid,
  getRandom,
  isNumber,
  decodeJid,
} = require(".");
const fs = require("fs");
const { connected } = require("process");
const {
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateWAMessage,
  generateWAMessageContent,
  prepareWAMessageMedia,
  proto,
} = require("@whiskeysockets/baileys");
class Base {
  constructor(client, msg) {
    Object.defineProperty(this, "client", { value: client });
    Object.defineProperty(this, "m", { value: msg });
  }

  _clone() {
    return Object.assign(Object.create(this), this);
  }

  _patch(data) {
    return data;
  }
}

class Video extends Base {
  constructor(client, data, msg) {
    super(client);
    if (data) this._patch(data, msg);
  }

  _patch(data, msg) {
    this.isGroup = data.isGroup;
    this.id = data.key.id === undefined ? undefined : data.key.id;
    this.jid = data.key.remoteJid;
    this.pushName = data.pushName;
    this.participant = data.sender;
    this.sudo = config.SUDO.split(",").includes(this.participant.split("@")[0]);
    this.caption = data.body;
    this.fromMe = data.key.fromMe;
    this.timestamp =
      typeof data.messageTimestamp === "object"
        ? data.messageTimestamp.low
        : data.messageTimestamp;
    this.key = data.key;
    this.message = data.message.videoMessage;
    if (data.quoted) {
      this.reply_message = data.quoted;
    } else {
      this.reply_message = false;
    }

    return super._patch(data);
  }
}

class Image extends Base {
  constructor(client, data, msg) {
    super(client);
    if (data) this._patch(data, msg);
  }

  _patch(data, msg) {
    this.isGroup = data.isGroup;
    this.id = data.key.id === undefined ? undefined : data.key.id;
    this.jid = data.key.remoteJid;
    this.pushName = data.pushName;
    this.participant = data.sender;
    this.sudo = config.SUDO.split(",").includes(this.participant.split("@")[0]);
    this.caption = data.body;
    this.fromMe = data.key.fromMe;
    this.timestamp =
      typeof data.messageTimestamp === "object"
        ? data.messageTimestamp.low
        : data.messageTimestamp;
    this.key = data.key;
    this.message = data.message.imageMessage;
    if (data.quoted) {
      this.reply_message = data.quoted;
    } else {
      this.reply_message = false;
    }

    return super._patch(data);
  }
  async reply(text, opt = { withTag: true }) {
    const nikk = {
        key: {
                remoteJid: 'status@broadcast',
                fromMe: false,
                participant: '0@s.whatsapp.net'
        },
        message: {
            listResponseMessage: {
            title: `Hey ${this.pushName}👋\n𝚇-𝙺𝙸𝙽𝙶`
        }
    }
    }
    return this.client.sendMessage(
      this.jid,
      {
        text: require("util").format(text),
        ...opt,
      },
      { ...opt, quoted: nikk }
    );
  }
}
class King extends Base {
  constructor(client, data, msg) {
    super(client, data);
    if (data) this._patch(data, msg);
  }
  _patch(data, msg) {
    this.user = decodeJid(this.client.user.id);
    this.key = data.key;
    this.isGroup = data.isGroup;
    this.prefix = data.prefix;
    this.id = data.key.id === undefined ? undefined : data.key.id;
    this.jid = data.key.remoteJid;
    this.message = { key: data.key, message: data.message };
    this.pushName = data.pushName;
    this.participant = data.sender;
    this.sudo = config.SUDO?.split(",").includes(this.participant?.split("@")[0]);
    this.text = data.body;
    this.fromMe = data.key.fromMe;
    this.message = msg.message;
    this.timestamp =
      typeof data.messageTimestamp === "object"
        ? data.messageTimestamp.low
        : data.messageTimestamp;

    if (
      data.message.hasOwnProperty("extendedTextMessage") &&
      data.message.extendedTextMessage.hasOwnProperty("contextInfo") === true &&
      data.message.extendedTextMessage.contextInfo.hasOwnProperty(
        "mentionedJid"
      )
    ) {
      this.mention = data.message.extendedTextMessage.contextInfo.mentionedJid;
    } else {
      this.mention = false;
    }

    if (
      data.message.hasOwnProperty("extendedTextMessage") &&
      data.message.extendedTextMessage.hasOwnProperty("contextInfo") === true &&
      data.message.extendedTextMessage.contextInfo.hasOwnProperty(
        "quotedMessage"
      )
    ) {
      this.reply_message = new ReplyMessage(
        this.client,
        data.message.extendedTextMessage.contextInfo,
        data
      );
      this.reply_message.type = data.quoted.type || "extendedTextMessage";
      this.reply_message.mtype = data.quoted.mtype;
      this.reply_message.mimetype = data.quoted.text.mimetype || "text/plain";
      this.reply_message.key = data.quoted.key;
      this.reply_message.message = data.quoted.message;
    } else {
      this.reply_message = false;
    }

    return super._patch(data);
  }
  async log() {
    console.log(this.data);
  }
  async sendFile(content, options = {}) {
    let { data } = await this.client.getFile(content);
    let type = await fileType.fromBuffer(data);
    return this.client.sendMessage(
      this.jid,
      { [type.mime.split("/")[0]]: data, ...options },
      { ...options }
    );
  }
  async downloadMediaMessage() {
    let buff = await this.m.download();
    let type = await fileType.fromBuffer(buff);
    await fs.promises.writeFile(new Date() + type.ext, buff);
    return new Date() + type.ext;
  }
  async reply(text, opt = {}) {
      const nik = {
        key: {
                remoteJid: 'status@broadcast',
                fromMe: false,
                participant: '0@s.whatsapp.net'
        },
        message: {
            listResponseMessage: {
            title: `Hey ${this.pushName}👋\n𝚇-𝙺𝙸𝙽𝙶`
        }
    }
   }
    return this.client.sendMessage(
      this.jid,
      {
        text: require("util").format(text),
        ...opt,
      },
      { ...opt, quoted: nik }
    );
  }
  async react(emoji) {
        return this.client.sendMessage(this.jid, { 
            react: { text: emoji, key: this.m.key }
        });
    }
  async sendPollMessage(jid, options) {
        if (!options || !options.name || !options.values || options.values.length === 0) {
            throw new Error("Invalid poll options. `name` and `values` are required.");
        }

        const pollContent = {
            poll: {
                name: options.name,
                selectableCount: options.selectableCount || 1,
                values: options.values,
            },
            messageSecret: options.messageSecret || new Uint8Array(0),
        };

        return this.client.sendMessage(jid, pollContent, {
            ...options,
            quoted: this.msg,
        });
    }

    async sendCarouselMessage(jid, title, message, footer, slides) {
        const cards = await Promise.all(
            slides.map(async (slide) => {
                const [image, titMess, boMessage, fooMess, textCommand, command, buttonType, url] = slide;

                let buttonParamsJson = {};
                if (buttonType === "cta_url") {
                    buttonParamsJson = {
                        display_text: textCommand,
                        url: url,
                        merchant_url: url,
                    };
                } else {
                    throw new Error("Unsupported button type");
                }

                const buttonParamsJsonString = JSON.stringify(buttonParamsJson);

                return {
                    body: { text: boMessage },
                    footer: { text: fooMess },
                    header: {
                        title: titMess,
                        hasMediaAttachment: true,
                        ...(await prepareWAMessageMedia(
                            { image: { url: image } },
                            { upload: this.client.waUploadToServer }
                        )),
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: buttonType,
                                buttonParamsJson: buttonParamsJsonString,
                            },
                        ],
                    },
                };
            })
        );

        const carouselMessage = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: message },
                        footer: { text: footer },
                        header: { title, subtitle: title, hasMediaAttachment: false },
                        carouselMessage: { cards },
                    },
                },
            },
        };

        const msg = generateWAMessageFromContent(jid, carouselMessage, { quoted: this.msg });
        return this.client.relayMessage(jid, msg.message, { messageId: m.key.id });
    }

    // Add the new `button` function
    async sendButton(jid, title, message, footer, slides) {
        const cards = slides.map(async (slide) => {
            const { image, title: slideTitle, body: slideBody, footer: slideFooter, buttons } = slide;

            const buttonsData = await Promise.all(
                buttons.map(async ({ buttonType, buttonText, buttonCommand, url }) => {
                    const buttonParams = this.getButtonParams(buttonType, buttonText, buttonCommand, url);
                    return JSON.stringify(buttonParams);
                })
            );

            return {
                body: proto.Message.InteractiveMessage.Body.fromObject({ text: slideBody }),
                footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: slideFooter }),
                header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: slideTitle,
                    hasMediaAttachment: true,
                    ...(await prepareWAMessageMedia({ image: { url: image } }, { upload: this.client.waUploadToServer })),
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: buttonsData.map((btn) => ({
                        name: 'quick_reply',
                        buttonParamsJson: btn,
                    })),
                }),
            };
        });

        const msg = generateWAMessageFromContent(
            jid,
            {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            body: proto.Message.InteractiveMessage.Body.fromObject({ text: message }),
                            footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: footer }),
                            header: proto.Message.InteractiveMessage.Header.fromObject({
                                title,
                                subtitle: title,
                                hasMediaAttachment: false,
                            }),
                            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                cards: await Promise.all(cards),
                            }),
                        }),
                    },
                },
            },
            { quoted: this.msg }
        );

        return this.client.relayMessage(jid, msg.message, { messageId: m.key.id });
    }

    getButtonParams(buttonType, buttonText, buttonCommand, url) {
        switch (buttonType) {
            case 'cta_url':
                return { display_text: buttonText, url, merchant_url: url };
            case 'cta_call':
                return { display_text: buttonText, id: buttonCommand };
            case 'cta_copy':
                return { display_text: buttonText, copy_code: buttonCommand };
            case 'quick_reply':
                return { display_text: buttonText, id: buttonCommand };
            default:
                return {};
        }
    }
      async sendIphone(
    content,
    opt = { packname: "X-KING", author: "King David" },
    type = "text"
  ) {
    switch (type.toLowerCase()) {
      case "text":
        {
          return this.client.sendMessage(
            this.jid,
            {
              text: content,
              ...opt,
            },
            { ...opt }
          );
        }
        break;
      case "image":
        {
          if (Buffer.isBuffer(content)) {
            return this.client.sendMessage(
              this.jid,
              { image: content, ...opt },
              { ...opt }
            );
          } else if (isUrl(content)) {
            return this.client.sendMessage(
              this.jid,
              { image: { url: content }, ...opt },
              { ...opt }
            );
          }
        }
        break;
      case "video": {
        if (Buffer.isBuffer(content)) {
          return this.client.sendMessage(
            this.jid,
            { video: content, ...opt },
            { ...opt }
          );
        } else if (isUrl(content)) {
          return this.client.sendMessage(
            this.jid,
            { video: { url: content }, ...opt },
            { ...opt }
          );
        }
      }
      case "audio":
        {
          if (Buffer.isBuffer(content)) {
            return this.client.sendMessage(
              this.jid,
              { audio: content, ...opt },
              { ...opt }
            );
          } else if (isUrl(content)) {
            return this.client.sendMessage(
              this.jid,
              { audio: { url: content }, ...opt },
              { ...opt }
            );
          }
        }
        break;
      case "template":
        let optional = await generateWAMessage(this.jid, content, opt);
        let message = {
          viewOnceMessage: {
            message: {
              ...optional.message,
            },
          },
        };
        await this.client.relayMessage(this.jid, message, {
          messageId: optional.key.id,
        });

        break;
      case "sticker":
        {
          let { data, mime } = await this.client.getFile(content);
          if (mime == "image/webp") {
            let buff = await writeExifWebp(data, opt);
            await this.client.sendMessage(
              this.jid,
              { sticker: { url: buff }, ...opt },
              opt
            );
          } else {
            mime = await mime.split("/")[0];

            if (mime === "video") {
              await this.client.sendImageAsSticker(this.jid, content, opt);
            } else if (mime === "image") {
              await this.client.sendImageAsSticker(this.jid, content, opt);
            }
          }
        }
        break;
    }
  }
async send(content, opt = { packname: "X-KING", author: "KING-DAVID" }, type = "text") {
  const quoted = {
    key: {
      fromMe: false,
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
    },
    message: {
      contactMessage: {
        displayName: "𝗞𝗜𝗡𝗚 𝗗𝗔𝗩𝗜𝗗",
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;𝗞𝗜𝗡𝗚 𝗗𝗔𝗩𝗜𝗗;;;\nFN:𝗞𝗜𝗡𝗚 𝗗𝗔𝗩𝗜𝗗\nitem1.TEL;waid=2349123721026:2349123721026\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
      },
    },
  };

  switch (type.toLowerCase()) {
    case "text": {
      // Using the desired contextInfo for the text message
      const contextInfo = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363379718023410@newsletter",
          newsletterName: "king ᴍᴅ",
        },
      };
      return this.client.sendMessage(
        this.jid,
        {
          text: content,
          contextInfo,
          ...opt,
        },
        { quoted }
      );
    }
    case "react": {
      return await this.client.sendMessage(
        this.jid,
        {
          react: {
            text: opt.reactionText || "😄",
            key: opt.messageKey || this.messageId(),
          },
        },
        { quoted }
      );
    }
    case "image": {
      if (Buffer.isBuffer(content)) {
        return this.client.sendMessage(
          this.jid,
          { image: content, ...opt },
          { quoted }
        );
      } else if (isUrl(content)) {
        return this.client.sendMessage(
          this.jid,
          { image: { url: content }, ...opt },
          { quoted }
        );
      }
      break;
    }
    case "video": {
      if (Buffer.isBuffer(content)) {
        return this.client.sendMessage(
          this.jid,
          { video: content, ...opt },
          { quoted }
        );
      } else if (isUrl(content)) {
        return this.client.sendMessage(
          this.jid,
          { video: { url: content }, ...opt },
          { quoted }
        );
      }
      break;
    }
    case "audio": {
      if (Buffer.isBuffer(content)) {
        return this.client.sendMessage(
          this.jid,
          { audio: content, ...opt },
          { quoted }
        );
      } else if (isUrl(content)) {
        return this.client.sendMessage(
          this.jid,
          { audio: { url: content }, ...opt },
          { quoted }
        );
      }
      break;
    }
    case "template": {
      let optional = await generateWAMessage(this.jid, content, opt);
      let message = {
        viewOnceMessage: {
          message: {
            ...optional.message,
          },
        },
      };
      await this.client.relayMessage(this.jid, message, {
        messageId: optional.key.id,
      });
      break;
    }
    case "sticker": {
      let { data, mime } = await this.client.getFile(content);
      if (mime == "image/webp") {
        let buff = await writeExifWebp(data, opt);
        await this.client.sendMessage(
          this.jid,
          { sticker: { url: buff }, ...opt },
          { quoted }
        );
      } else {
        mime = await mime.split("/")[0];
        if (mime === "video" || mime === "image") {
          await this.client.sendImageAsSticker(this.jid, content, opt, { quoted });
        }
      }
      break;
    }
  }
}

  async forward(jid, message, options = {}) {
    let m = generateWAMessageFromContent(jid, message, {
      ...options,
      userJid: this.client.user.id,
    });
    await this.client.relayMessage(jid, m.message, {
      messageId: m.key.id,
      ...options,
    });
    return m;
  }
  async sendFromUrl(url, options = {}) {
    let buff = await getBuffer(url);
    let mime = await fileType.fromBuffer(buff);
    let type = mime.mime.split("/")[0];
    if (type === "audio") {
      options.mimetype = "audio/mpeg";
    }
    if (type === "application") type = "document";
    return this.client.sendMessage(
      this.jid,
      { [type]: buff, ...options },
      { ...options }
    );
  }

  async PresenceUpdate(status) {
    await sock.sendPresenceUpdate(status, this.jid);
  }
  async delete(key) {
    await this.client.sendMessage(this.jid, { delete: key });
  }
  async updateName(name) {
    await this.client.updateProfileName(name);
  }
  async getPP(jid) {
    return await this.client.profilePictureUrl(jid, "image");
  }
  async setPP(jid, pp) {
    if (Buffer.isBuffer(pp)) {
      await this.client.updateProfilePicture(jid, pp);
    } else {
      await this.client.updateProfilePicture(jid, { url: pp });
    }
  }
  /**
   *
   * @param {string} jid
   * @returns
   */
  async block(jid) {
    await this.client.updateBlockStatus(jid, "block");
  }
  /**
   *
   * @param {string} jid
   * @returns
   */
  async unblock(jid) {
    await this.client.updateBlockStatus(jid, "unblock");
  }
  /**
   *
   * @param {array} jid
   * @returns
   */
  async add(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "add");
  }
  /**
   *
   * @param {array} jid
   * @returns
   */
  async kick(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "remove");
  }

  /**
   *
   * @param {array} jid
   * @returns
   */
  async promote(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "promote");
  }
  /**
   *
   * @param {array} jid
   * @returns
   */
  async demote(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "demote");
  }
}

class ReplyMessage extends Base {
  constructor(client, data, msg) {
    super(client, msg);
    if ((data, msg)) this._patch(data, msg);
  }

  _patch(data, msg) {
    this.key = data.key;
    this.id = data.stanzaId;
    this.jid = data.participant;
    this.sudo = config.SUDO.split(",").includes(data.participant.split("@")[0]);
    this.fromMe = data.fromMe;

    if (data.quotedMessage && data.quotedMessage.imageMessage) {
      this.message =
        data.quotedMessage.imageMessage.caption === null
          ? data.message.imageMessage.caption
          : "";
      this.caption =
        data.quotedMessage.imageMessage.caption === null
          ? data.message.imageMessage.caption
          : "";
      this.url = data.quotedMessage.imageMessage.url;
      this.mimetype = data.quotedMessage.imageMessage.mimetype;
      this.height = data.quotedMessage.imageMessage.height;
      this.width = data.quotedMessage.imageMessage.width;
      this.mediaKey = data.quotedMessage.imageMessage.mediaKey;
      this.image = true;
      this.video = false;
      this.sticker = false;
    } else if (data.quotedMessage && data.quotedMessage.videoMessage) {
      this.message =
        data.quotedMessage.videoMessage.caption === null
          ? data.message.videoMessage.caption
          : "";
      this.caption =
        data.quotedMessage.videoMessage.caption === null
          ? data.message.videoMessage.caption
          : "";
      this.url = data.quotedMessage.videoMessage.url;
      this.mimetype = data.quotedMessage.videoMessage.mimetype;
      this.height = data.quotedMessage.videoMessage.height;
      this.width = data.quotedMessage.videoMessage.width;
      this.mediaKey = data.quotedMessage.videoMessage.mediaKey;
      this.video = true;
    } else if (data.quotedMessage && data.quotedMessage.conversation) {
      this.message = data.quotedMessage.conversation;
      this.text = data.quotedMessage.conversation;
      this.image = false;
      this.video = false;
      this.sticker = false;
    } else if (data.quotedMessage && data.quotedMessage.stickerMessage) {
      this.sticker = { animated: data.quotedMessage.stickerMessage.isAnimated };
      this.mimetype = data.quotedMessage.stickerMessage.mimetype;
      this.message = data.quotedMessage.stickerMessage;
      this.image = false;
      this.video = false;
    } else if (data.quotedMessage && data.quotedMessage.audioMessage) {
      this.audio = data.quotedMessage.audioMessage;
      this.mimetype = data.quotedMessage.audioMessage.mimetype;
    }

    return super._patch(data);
  }
  async downloadMediaMessage() {
    let buff = await this.m.quoted.download();
    let type = await fileType.fromBuffer(buff);
    await fs.promises.writeFile("./media" + type.ext, buff);
    return "./media" + type.ext;
  }
}

class Sticker extends Base {
  constructor(client, data, msg) {
    super(client, msg);
    if ((data, msg)) this._patch(data, msg);
  }
  _patch(data, msg) {
    this.key = data.key;
    this.id = data.key.id;
    this.jid = data.key.remoteJid;
    this.isGroup = data.isGroup;
    this.participant = data.sender;
    this.message = data.message.stickerMessage;
    this.pushName = data.pushName;
    this.sudo = config.SUDO.split(",").includes(data.sender.split("@")[0]);
    this.timestamp =
      typeof data.messageTimestamp === "object"
        ? data.messageTimestamp.low
        : data.messageTimestamp;
    this.sticker = true;
    return super._patch(data);
  }
  async downloadMediaMessage() {
    let buff = await this.m.download();
    let name = new Date();
    await fs.promises.writeFile(name, buff);
    return name;
  }
}

module.exports = { Base, Image, King, ReplyMessage, Video, Sticker };