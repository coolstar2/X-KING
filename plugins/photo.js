const plugins = require("../lib/event");
const {
    command,
    isPrivate,
    getUrl,
    parsedJid,
    isAdmin
} = require("../lib");
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const FormData = require("form-data");
const fetch = require("node-fetch"); // Ensure node-fetch is installed
const fileType = require("file-type"); // Ensure file-type is installed

const MAX_FILE_SIZE_MB = 200; // Catbox limit

// Function to upload to Catbox
async function uploadToCatbox(buffer) {
    try {
        const type = await fileType.fromBuffer(buffer);
        const ext = type ? type.ext : 'bin';
        const bodyForm = new FormData();
        bodyForm.append("fileToUpload", buffer, `file.${ext}`);
        bodyForm.append("reqtype", "fileupload");

        const res = await fetch("https://catbox.moe/user/api.php", {
            method: "POST",
            body: bodyForm,
        });

        if (!res.ok) {
            throw new Error(`Upload to Catbox failed with status ${res.status}: ${res.statusText}`);
        }

        const data = await res.text();
        return data;
    } catch (error) {
        console.error("Error uploading to Catbox:", error);
        throw new Error("Failed to upload media to Catbox.");
    }
}

// Function to process the image with the API
async function processImage(apiUrl) {
    try {
        const res = await fetch(apiUrl, { method: "GET" });

        if (!res.ok) {
            throw new Error(`Processing API failed with status ${res.status}: ${res.statusText}`);
        }

        const data = await res.buffer();
        return data;
    } catch (error) {
        console.error("Error processing the image:", error);
        throw new Error("Failed to process the image.");
    }
}
let storedReffUrl = null; // Stores reference image URL

async function processImage(imageUrl, reffUrl) {
  try {
    const apiUrl = `https://fastrestapis.fasturl.cloud/imgedit/aifilter?imageUrl=${encodeURIComponent(imageUrl)}&reffUrl=${encodeURIComponent(reffUrl)}&creativity=0.5`;
    const res = await fetch(apiUrl);

    if (!res.ok) {
      throw new Error(`Processing failed: ${res.status} ${res.statusText}`);
    }

    return await res.buffer();
  } catch (error) {
    console.error("Error processing the image:", error);
    throw new Error("Failed to process the image.");
  }
}

// Afilter command
command(
  {
    pattern: "Afilter",
    fromMe: true,
    desc: "Set reference or apply AI filter.",
    type: "photo",
  },
  async (king, match, m) => {
    if (!m.quoted || !m.quoted.mtype.includes("image")) {
      return await king.reply("Reply to an image to use this command.");
    }

    const action = match?.trim()?.toLowerCase();
    if (!action || (action !== "reff" && action !== "apply")) {
      return await king.reply("*Usage:*\n- `Afilter reff` to set reference\n- `Afilter apply` to apply filter");
    }

    try {
      const mediaBuffer = await m.quoted.download();
      if (!mediaBuffer) return await king.reply("Failed to download the image.");

      const fileSizeMB = mediaBuffer.length / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        return await king.reply(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      }

      if (action === "reff") {
        storedReffUrl = await uploadToCatbox(mediaBuffer);
      
      }

      if (action === "apply") {
        if (!storedReffUrl) {
          return await king.reply("No reference image found! Use `Afilter reff` first.");
        }

        const imageUrl = await uploadToCatbox(mediaBuffer);
        const processedImageBuffer = await processImage(imageUrl, storedReffUrl);

        await king.client.sendMessage(king.jid, {
          image: processedImageBuffer,
          caption: "Here is your AI-filtered image!",
        });
      }
    } catch (error) {
      console.error("[ERROR]", error);
      await king.reply("An error occurred while processing the image.");
    }
  }
);
command(
  {
    pattern: "upscale",
    fromMe: true,
    desc: "Reply to an image to upscale it using AI.",
    type: "photo",
  },
  async (king, match, m) => {
    if (!king.reply_message)
      return await king.reply("Reply to an image to upscale it");

    try {
      const mediaBuffer = await m.quoted.download();

      if (!mediaBuffer) {
        return await king.reply("*_Failed to download the media file._*");
      }

      const fileSizeMB = mediaBuffer.length / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        return await king.reply(`*_File size exceeds the 200MB limit._*`);
      }

      // Upload the media to Catbox
      const catboxUrl = await uploadToCatbox(mediaBuffer);

      // Process the image with the upscale API
      const apiUrl = `https://fastrestapis.fasturl.cloud/aiimage/upscale?imageUrl=${encodeURIComponent(catboxUrl)}&resize=4`;
      const processedImageBuffer = await processImage(apiUrl);

      // Send back the upscaled image
      await king.client.sendMessage(king.jid, {
        image: processedImageBuffer,
        caption: "*_Here is your upscaled image!_*",
      });
    } catch (error) {
      console.error('[ERROR]', error);
      await king.reply("*_An error occurred while upscaling the image._*");
    }
  }
);
command(
  {
    pattern: "toanime",
    fromMe: true,
    desc: "Convert an image to an anime-style version (male/female).",
    type: "photo",
  },
  async (king, match, m) => {
    if (!king.reply_message) {
      return await king.reply("Reply to an image to convert it to anime style.");
    }

    match = match || m?.quoted?.text?.trim(); // Extract gender from command or quoted text
    const gender = match?.toLowerCase();

    if (!gender || (gender !== "male" && gender !== "female")) {
      return await king.reply("*Please specify the gender:*\n`toanime male` or `toanime female`");
    }

    try {
      const mediaBuffer = await m.quoted.download();

      if (!mediaBuffer) {
        return await king.reply("*_Failed to download the media file._*");
      }

      const fileSizeMB = mediaBuffer.length / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        return await king.reply(`*_File size exceeds the 200MB limit._*`);
      }

      // Upload the media to Catbox
      const catboxUrl = await uploadToCatbox(mediaBuffer);

      // Process the image with the anime-style API
      const apiUrl = `https://fastrestapis.fasturl.cloud/aiimage/toanime?imageUrl=${encodeURIComponent(catboxUrl)}&gender=${gender}&specificPrompt=Elegant%20and%20majestic`;
      const processedImageBuffer = await processImage(apiUrl);

      // Send back the anime-style image
      await king.client.sendMessage(king.jid, {
        image: processedImageBuffer,
        caption: `*_Here is your anime-style (${gender}) image!_*`,
      });
    } catch (error) {
      console.error('[ERROR]', error);
      await king.reply("*_An error occurred while processing the image._*");
    }
  }
);
command(
    {
        pattern: "wasted",
        fromMe: true,
        desc: "Reply to an image to upload it, process it, and get the processed image.",
        type: "photo",
    },
    async (king, match, m) => {
        if (!king.reply_message)
            return await king.reply("*_Reply to an image to process it_*");

        try {
            const mediaBuffer = await m.quoted.download();

            if (!mediaBuffer) {
                return await king.reply("*_Failed to download the media file._*");
            }

            const fileSizeMB = mediaBuffer.length / (1024 * 1024);
            if (fileSizeMB > MAX_FILE_SIZE_MB) {
                return await king.reply(`*_File size exceeds the 200MB limit._*`);
            }

            // Upload the media to Catbox
            const catboxUrl = await uploadToCatbox(mediaBuffer);

            // Process the image with the API
            const apiUrl = `https://api.nexoracle.com/image-processing/wasted?apikey=free_key@maher_apis&img=${encodeURIComponent(catboxUrl)}`;
            const processedImageBuffer = await processImage(apiUrl);

            // Send back the processed image
            await king.client.sendMessage(king.jid, {
                image: processedImageBuffer,
                caption: "*_Here is your processed image!_*",
            });
        } catch (error) {
            console.error('[ERROR]', error);
            await king.reply("*_An error occurred while processing the image._*");
        }
    }
);
command(
    {
        pattern: "ad",
        fromMe: true,
        desc: "Reply to an image to upload it, process it, and get the processed image.",
        type: "photo",
    },
    async (king, match, m) => {
        if (!king.reply_message)
            return await king.reply("*_Reply to an image to process it_*");

        try {
            const mediaBuffer = await m.quoted.download();

            if (!mediaBuffer) {
                return await king.reply("*_Failed to download the media file._*");
            }

            const fileSizeMB = mediaBuffer.length / (1024 * 1024);
            if (fileSizeMB > MAX_FILE_SIZE_MB) {
                return await king.reply(`*_File size exceeds the 200MB limit._*`);
            }

            // Upload the media to Catbox
            const catboxUrl = await uploadToCatbox(mediaBuffer);

            // Process the image with the API
            const apiUrl = `https://api.nexoracle.com/image-processing/ad?apikey=free_key@maher_apis&img=${encodeURIComponent(catboxUrl)}`;
            const processedImageBuffer = await processImage(apiUrl);

            // Send back the processed image
            await king.client.sendMessage(king.jid, {
                image: processedImageBuffer,
                caption: "*_Here is your processed image!_*",
            });
        } catch (error) {
            console.error('[ERROR]', error);
            await king.reply("*_An error occurred while processing the image._*");
        }
    }
);
command(
    {
        pattern: "blur",
        fromMe: true,
        desc: "Reply to an image to upload it, process it, and get the processed image.",
        type: "photo",
    },
    async (king, match, m) => {
        if (!king.reply_message)
            return await king.reply("*_Reply to an image to process it_*");

        try {
            const mediaBuffer = await m.quoted.download();

            if (!mediaBuffer) {
                return await king.reply("*_Failed to download the media file._*");
            }

            const fileSizeMB = mediaBuffer.length / (1024 * 1024);
            if (fileSizeMB > MAX_FILE_SIZE_MB) {
                return await king.reply(`*_File size exceeds the 200MB limit._*`);
            }

            // Upload the media to Catbox
            const catboxUrl = await uploadToCatbox(mediaBuffer);

            // Process the image with the API
            const apiUrl = `https://api.nexoracle.com/image-processing/blur?apikey=free_key@maher_apis&img=${encodeURIComponent(catboxUrl)}`;
            const processedImageBuffer = await processImage(apiUrl);

            // Send back the processed image
            await king.client.sendMessage(king.jid, {
                image: processedImageBuffer,
                caption: "*_Here is your processed image!_*",
            });
        } catch (error) {
            console.error('[ERROR]', error);
            await king.reply("*_An error occurred while processing the image._*");
        }
    }
);
command(
  {
    pattern: "vv",
    fromMe: isPrivate,
    desc: "Forwards the View Once message",
    type: "photo",
  },
  async (king, match, m) => {
    if (!m.quoted) {
      return await king.reply("Reply to a View Once message.");
    }

    const quotedMsg = m.quoted.message;
    const mediaMessage =
      quotedMsg.imageMessage ||
      quotedMsg.videoMessage ||
      quotedMsg.audioMessage;

    if (!mediaMessage?.viewOnce) {
      return await king.reply("The replied message is not a view-once message.");
    }

    try {
      // Download the media
      let buff = await downloadMediaMessage(m.quoted, "buffer");

      // Determine media type
      let type = quotedMsg.imageMessage
        ? "image"
        : quotedMsg.videoMessage
        ? "video"
        : "audio";

      // Send the file back
      await king.client.sendMessage(
        king.jid,
        { [type]: buff, caption: "Here is your view-once media." },
        { quoted: m }
      );
    } catch (err) {
      console.error(err);
      return await king.reply("Failed to download media.");
    }
  }
);
command(
  {
    pattern: "vv2",
    fromMe: isPrivate,
    desc: "Forwards the View Once message to your DM",
    type: "photo",
  },
  async (king, match, m) => {
    if (!m.quoted) {
      return await king.reply("Reply to a View Once message.");
    }

    const quotedMsg = m.quoted.message;
    const mediaMessage =
      quotedMsg.imageMessage ||
      quotedMsg.videoMessage ||
      quotedMsg.audioMessage;

    if (!mediaMessage?.viewOnce) {
      return await king.reply("The replied message is not a view-once message.");
    }

    try {
      // Download the media
      let buff = await downloadMediaMessage(m.quoted, "buffer");

      // Determine media type
      let type = quotedMsg.imageMessage
        ? "image"
        : quotedMsg.videoMessage
        ? "video"
        : "audio";

      // Send the file to user's DM
      await king.client.sendMessage(
        king.user, // Send to user's JID
        { [type]: buff, caption: "Here is your view-once media." }
      );
    } catch (err) {
      console.error(err);
      return await king.reply("Failed to download media.");
    }
  }
);