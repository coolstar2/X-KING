const fs = require("fs");
const path = require("path");
const JsConfuser = require("js-confuser");
const PDFDocument = require("pdfkit");
const got = require("got");
const config = require("../config");
const axios = require("axios");
const { BOT_INFO } = require("../config");
const {
  command,
  isPrivate,
  styletext,
  listall,
  getBuffer,
  clockString,
  getUrl,
  parsedJid,
  isAdmin,
} = require("../lib/");
const { installPlugin, PluginDB } = require("../lib/database/plugins");
const plugins = require("../lib/event");
const { tiny } = require("../lib/fancy_font/fancy");
let tempImages = [];
const defaultFont = "Helvetica";
const availableFonts = ["Helvetica", "Times-Roman", "Courier", "ZapfDingbats"];
command(
    {
        pattern: "pdf",
        fromMe: true,
        desc: "PDF utilities: save images, send PDF, or convert text to PDF with a custom font.",
        type: "utility",
    },
    async (king, match, m) => {
        const [action, ...textParts] = match.split(" ");
        const fullText = textParts.join(" ");

        if (action === "fonts") {
            return await king.reply(
                `*_Available Fonts:_*\n• ${availableFonts.join("\n• ")}`
            );
        } else if (action === "save") {
            if (!m.quoted || !m.quoted.message.imageMessage) {
                return await king.reply("*_Reply to an image to save it._*");
            }

            try {
                const mediaBuffer = await m.quoted.download();
                if (!mediaBuffer) {
                    return await king.reply("*_Failed to download the image._*");
                }

                tempImages.push(mediaBuffer);
                await king.reply("*_Image saved successfully! Use #pdf send to get all images in a PDF._*");
            } catch (error) {
                console.error("[ERROR]", error);
                await king.reply("*_An error occurred while saving the image._*");
            }
        } else if (action === "send") {
            if (tempImages.length === 0) {
                return await king.reply("*_No images saved. Use #pdf save to add images._*");
            }

            try {
                const pdfPath = path.join(__dirname, "saved_images.pdf");
                const doc = new PDFDocument({ autoFirstPage: false });
                const writeStream = fs.createWriteStream(pdfPath);
                doc.pipe(writeStream);

                tempImages.forEach((imageBuffer) => {
                    const img = doc.openImage(imageBuffer);
                    doc.addPage({ size: [img.width, img.height] });
                    doc.image(img, 0, 0);
                });

                doc.end();

                writeStream.on("finish", async () => {
                    await king.client.sendMessage(king.jid, {
                        document: fs.readFileSync(pdfPath),
                        mimetype: "application/pdf",
                        fileName: "saved_images.pdf",
                    });
                    fs.unlinkSync(pdfPath); // Delete the PDF after sending
                    tempImages = []; // Clear saved images
                });
            } catch (error) {
                console.error("[ERROR]", error);
                await king.reply("*_An error occurred while creating the PDF._*");
            }
        } else if (action === "text") {
            if (!fullText) {
                return await king.reply("*_Provide text to convert into a PDF: #pdf text Your Text Here=Font_*");
            }

            // Extract text and font
            let [text, font] = fullText.split("=");
            text = text.trim();
            font = font ? font.trim() : defaultFont;

            if (!availableFonts.includes(font)) {
                await king.reply(`*_Font '${font}' not found, using default font (${defaultFont})._*`);
                font = defaultFont;
            }

            try {
                const pdfPath = path.join(__dirname, "text.pdf");
                const doc = new PDFDocument();
                const writeStream = fs.createWriteStream(pdfPath);
                doc.pipe(writeStream);

                doc.font(font).fontSize(14).text(text, { align: "left" });
                doc.end();

                writeStream.on("finish", async () => {
                    await king.client.sendMessage(king.jid, {
                        document: fs.readFileSync(pdfPath),
                        mimetype: "application/pdf",
                        fileName: "text.pdf",
                    });
                    fs.unlinkSync(pdfPath); // Delete the PDF after sending
                });
            } catch (error) {
                console.error("[ERROR]", error);
                await king.reply("*_An error occurred while creating the PDF._*");
            }
        } else {
            await king.reply(
                "*_Invalid command. Use:_*\n" +
                "• `#pdf save` (save image)\n" +
                "• `#pdf send` (send PDF with saved images)\n" +
                "• `#pdf text <query>=<font>` (convert text to PDF with custom font)\n" +
                "• `#pdf fonts` (list available fonts)"
            );
        }
    }
);

command(
  {
    pattern: "encrypt",
    fromMe: true,
    desc: "Encrypt JavaScript file",
    type: "utility",
  },
  async (king, match, m) => {
    if (!m.quoted || m.quoted.mtype !== "documentMessage") {
      return king.reply("*Reply to a JavaScript file to encrypt it.*");
    }

    const docMsg = m.quoted.message.documentMessage;
    if (!docMsg || docMsg.mimetype !== "application/javascript") {
      return king.reply("*The attached file is not a JavaScript file.*");
    }

    // Send "Encrypting..." message
    await king.reply("Encrypting......🌀");

    try {
      // Download the quoted JavaScript file
      const buffer = await m.quoted.download();
      const jsCode = buffer.toString("utf-8");

      // Encrypt the JavaScript code
      const result = await JsConfuser.obfuscate(jsCode, {
        target: "node",
        preset: "high",
        calculator: true,
        compact: true,
        hexadecimalNumbers: true,
        controlFlowFlattening: 0.75,
        deadCode: 0.2,
        dispatcher: true,
        duplicateLiteralsRemoval: 0.75,
        flatten: true,
        globalConcealing: true,
        identifierGenerator: "randomized",
        minify: true,
        movedDeclarations: true,
        objectExtraction: true,
        opaquePredicates: 0.75,
        renameVariables: true,
        renameGlobals: true,
        shuffle: { hash: 0.5, true: 0.5 },
        stringConcealing: true,
        stringCompression: true,
        stringEncoding: true,
        stringSplitting: 0.75,
        rgf: false,
      });

      // Ensure the result is a string
      const obfuscatedCode = typeof result === "string" ? result : result?.code;
      if (!obfuscatedCode) {
        throw new Error("Encryption failed: No output generated.");
      }

      // Save the encrypted file
      const encryptedFileName = `encrypted_${docMsg.fileName || "file.js"}`;
      const encryptedFilePath = path.join(__dirname, encryptedFileName);
      fs.writeFileSync(encryptedFilePath, obfuscatedCode, "utf-8");

      // Send back the encrypted file
      await king.client.sendMessage(
        king.jid, // Corrected to send to the correct chat
        {
          document: fs.readFileSync(encryptedFilePath),
          mimetype: "application/javascript",
          fileName: encryptedFileName,
        },
        { quoted: m }
      );

      // Cleanup temporary file
      fs.unlinkSync(encryptedFilePath);
    } catch (err) {
      king.reply("*Error during encryption:*\n" + err.message);
    }
  }
);

command(
  {
    pattern: "forward",
    fromMe: true,
    desc: "Send a custom message to a user (number|message|amount)",
    type: "utility",
  },
  async (king, match) => {
    if (!match || !match.includes('|') || match.split('|').length !== 3) {
      return await king.reply(`*_Need Text_*\n*Eg:- 234810033333333|Your message here|5*`);
    }

    const [phone, message, amount] = match.split('|'); // Split the match string into phone, message, and amount
    const jid = `${phone.trim()}@s.whatsapp.net`; // Construct the full JID using the phone number

    if (isNaN(amount) || Number(amount) <= 0) {
      return await king.reply("Please provide a valid amount greater than zero.");
    }

    try {
      // Send the custom message multiple times based on the amount
      const repeatCount = Number(amount.trim());
      for (let i = 0; i < repeatCount; i++) {
        await king.client.sendMessage(jid, { text: message.trim() });
      }
      await king.reply(`Message sent ${repeatCount} times to ${phone}.`);
    } catch (error) {
      console.error("Error sending message:", error);
      await king.reply("Sorry, there was an error sending the message.");
    }
  }
);

command(
  {
    pattern: "install ?(.*)",
    fromMe: true,
    desc: "Install External plugins",
    type: "utility",
  },
  async (king, match) => {
    if (!match) return await king.client.sendMessage(king.jid, "*_Plugin URL not found_*", { quoted: king });

    for (let Url of getUrl(match)) {
      try {
        var url = new URL(Url);
      } catch {
        return await king.client.sendMessage(king.jid, "*_Invalid URL_*", { quoted: king });
      }

      if (url.host === "gist.github.com") {
        url.host = "gist.githubusercontent.com";
        url = url.toString() + "/raw";
      } else {
        url = url.toString();
      }

      var plugin_name;
      try {
        var response = await got(url);
      } catch (e) {
        return await king.client.sendMessage(king.jid, `*_Failed to fetch plugin_* \n\`\`\`${e.message}\`\`\``, { quoted: king });
      }

      if (response.statusCode === 200) {
        var commands = response.body
          .match(/(?<=pattern:)(.*)(?=\?(.*))/g)
          ?.map((a) => a.trim().replace(/"|'|`/, "")) || [];

        plugin_name = commands[0] || "__" + Math.random().toString(36).substring(8);

        fs.writeFileSync(`./plugins/${plugin_name}.js`, response.body);
        try {
          require(`../plugins/${plugin_name}`);
        } catch (e) {
          fs.unlinkSync(`./plugins/${plugin_name}.js`);
          return await king.client.sendMessage(king.jid, `*_Invalid Plugin_* \n\`\`\`${e}\`\`\``, { quoted: king });
        }

        await installPlugin(url, plugin_name);
        await king.client.sendMessage(king.jid, `*_Plugin installed: ${commands.join(", ") || plugin_name}_*`, { quoted: king });
      }
    }
  }
);
command(
  {
    pattern: "cmdlist",
    fromMe: isPrivate,
    desc: "Show All Commands",
    type: "utility",
    dontAddCommandList: true,
  },
  async (king, match, { prefix }) => {
    let menu = `╭━━━┅┅┄┄「 *Command List* 」┄┄┅┅━━━╮\n`;

    let cmnd = [];
    
    plugins.commands.forEach((command) => {
      if (command.pattern) {
        let cmd = command.pattern.toString().split(/\W+/)[1];
        let desc = command.desc || "No description available.";
        
        if (!command.dontAddCommandList && cmd) {
          cmnd.push({ cmd, desc });
        }
      }
    });

    cmnd.sort((a, b) => a.cmd.localeCompare(b.cmd));

    cmnd.forEach(({ cmd, desc }, index) => {
      menu += `┃ ✦ ${(index + 1).toString().padStart(2, "0")}. *${cmd.trim()}*\n`;
      menu += `┃   ⤷ _${desc}_\n`;
    });

    menu += `╰━━━┅┅┄┄「 *X-King* 」┄┄┅┅━━━╯`;

    return await king.client.sendMessage(king.jid, { text: tiny(menu) }, { quoted: king });
  }
);
command(
  {
    pattern: "fancy",
    fromMe: isPrivate,
    desc: "Converts text to fancy text",
    type: "utility",
  },
  async (king, match) => {
    if (!king.reply_message || !king.reply_message.text || !match || isNaN(match)) {
      let text = `╭───────────◆\n`;
      text += `│  *𝗙𝗔𝗡𝗖𝗬 𝗧𝗘𝗫𝗧 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗢𝗥*\n`;
      text += `│\n`;
      text += `│  _Reply to a message_\n`;
      text += `│  _Example: .fancy 32_\n`;
      text += `│\n`;
      text += `├── 𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐅𝐨𝐧𝐭𝐬 ──◆\n`;

      listall("X-king").forEach((txt, num) => {
        text += `│  ${(num += 1)}. ${txt}\n`;
      });

      text += `╰───────────◆\n`;

      return await king.client.sendMessage(king.jid, { text }, { quoted: king });
    } else {
      king.client.sendMessage(king.jid, { text: styletext(king.reply_message.text, parseInt(match)) }, { quoted: king });
    }
  }
);

command(
  {
    pattern: "repo",
    fromMe: isPrivate,
    desc: "Get the latest stats on X-KING",
    type: "utility",
  },
  async (king) => {
    try {
      const imageUrl = "https://files.catbox.moe/y7memr.jpg";
      const imageBuffer = await getBuffer(imageUrl);

      // Fetch repo details from GitHub API
      const response = await axios.get("https://api.github.com/repos/KING-DAVIDX/X-KING");
      const { stargazers_count, forks_count, watchers_count } = response.data;

      const message = `👑 *X-KING Repository*\n\n` +
                      `🔥 *Bot Name:* X-KING\n` +
                      `🛠 *Developer:* 𝙆𝙄𝙉𝙂 𝙓𝙀𝙍\n` +
                      `💻 *Language:* JavaScript (Node.js)\n` +
                      `⚡ *Purpose:* A powerful, feature-packed WhatsApp bot.\n\n` +
                      `📊 *GitHub Stats:*\n` +
                      `⭐ Stars: *${stargazers_count}*\n` +
                      `🍴 Forks: *${forks_count}*\n` +
                      `👀 Watchers: *${watchers_count}*\n\n` +
                      `🚀 Want to explore? Check it out here:\n` +
                      `🔗 [GitHub Repo](https://github.com/KING-DAVIDX/X-KING)`;

      await king.client.sendMessage(king.jid, {
        image: imageBuffer,
        caption: message,
      });
    } catch (error) {
      await king.reply("⚠️ *Error fetching repo details:* " + error.message);
    }
  }
);