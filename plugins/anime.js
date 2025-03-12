const { command, isPrivate, getJson } = require("../lib/");
const axios = require("axios");
const plugins = require("../lib/event");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const got = require("got");
command(
    {
        pattern: "animequote",
        fromMe: isPrivate,
        desc: "Sends a random anime quote",
        type: "Anime",
    },
    async (king, match, m) => {
        try {
            let res = await axios.get("https://ironman.koyeb.app/api/aquote");
            let json = res.data;

            if (!json.sukses || !json.result || json.result.length === 0) 
                return await king.reply("❌ Failed to get anime quote!");

            let quote = json.result[Math.floor(Math.random() * json.result.length)];

            let quoteMessage = `📜 *Anime Quote* 📜\n\n` +
                               `*"${quote.english}"*\n\n` +
                               `— *${quote.character}*\n` +
                               `📺 *Anime:* ${quote.anime}`;

            await king.reply(quoteMessage);
        } catch (error) {
            await king.reply("⚠️ Error fetching anime quote!");
        }
    }
);
command(
    {
        pattern: "anisearch",
        fromMe: isPrivate,
        desc: "Get information about an anime.",
        type: "anime",
    },
    async (king, match) => {
        try {
            if (!match) {
                return await king.reply("*_Please provide an anime name!_*");
            }

            const args = match.split(" ");
            const query = args.slice(0, -1).join(" ");
            let limit = parseInt(args[args.length - 1]);

            if (isNaN(limit)) {
                limit = 1; // Default to 1 result if no number is provided
            }

            const apiUrl = `https://api.nexoracle.com/anime/hianime-search?apikey=free_key@maher_apis&q=${encodeURIComponent(query)}`;
            const response = await got(apiUrl).json();

            if (!response.result || !response.result.animes || response.result.animes.length === 0) {
                return await king.reply("*_No anime found!_*");
            }

            const animes = response.result.animes.slice(0, limit); // Limit results

            for (const anime of animes) {
                const {
                    name,
                    jname,
                    poster,
                    duration,
                    type,
                    rating,
                    episodes
                } = anime;

                const caption = `
*Anime Information*

*Title:* ${name}
*Japanese Title:* ${jname || "N/A"}
*Duration:* ${duration || "N/A"}
*Type:* ${type || "N/A"}
*Rating:* ${rating || "N/A"}
*Episodes (Sub/Dub):* ${episodes?.sub || "N/A"} / ${episodes?.dub || "N/A"}
`;

                await king.client.sendMessage(king.jid, {
                    image: { url: poster },
                    caption: caption,
                });
            }
        } catch (e) {
            await king.reply(`${e}\n\ncommand: anisearch`);
        }
    }
);
command(
    {
        pattern: "mangadl",
        fromMe: isPrivate,
        desc: "Downloads a manga chapter from MangaDex and sends it as a PDF.",
        type: "anime",
    },
    async (king, match) => {
        try {
            if (!match) {
                return await king.reply("*Provide a manga title and chapter number, e.g., .mangadl One Piece chapter 1*");
            }

            const queryMatch = match.match(/(.+?)\s+chapter\s+(\d+)/i);
            if (!queryMatch) {
                return await king.reply("*Invalid format. Use: .mangadl <manga title> chapter <number>*");
            }

            const mangaTitle = queryMatch[1].trim();
            const chapterNumber = queryMatch[2];

            const mangaSearchUrl = `https://api.mangadex.org/manga?title=${encodeURIComponent(mangaTitle)}&limit=1&availableTranslatedLanguage[]=en`;
            const searchResponse = await got(mangaSearchUrl).json();

            if (!searchResponse.data || searchResponse.data.length === 0) {
                return await king.reply(`*No English manga found with the title "${mangaTitle}".*`);
            }

            const mangaId = searchResponse.data[0].id;
            const chaptersUrl = `https://api.mangadex.org/chapter?manga=${mangaId}&chapter=${chapterNumber}&translatedLanguage[]=en`;
            const chaptersResponse = await got(chaptersUrl).json();

            if (!chaptersResponse.data || chaptersResponse.data.length === 0) {
                return await king.reply(`*No English chapter ${chapterNumber} found for "${mangaTitle}".*`);
            }

            const chapterId = chaptersResponse.data[0].id;
            const chapterApiUrl = `https://api.mangadex.org/at-home/server/${chapterId}`;
            const chapterResponse = await got(chapterApiUrl).json();

            if (!chapterResponse.baseUrl) {
                return await king.reply("*Error: Unable to fetch the chapter.*");
            }

            const imageUrls = chapterResponse.chapter.data.map(
                (imageFileName) => `${chapterResponse.baseUrl}/data/${chapterResponse.chapter.hash}/${imageFileName}`
            );

            if (imageUrls.length === 0) {
                return await king.reply("*No images found for this chapter.*");
            }

            // Notify user that the process is starting
            await king.reply("*Downloading images and creating PDF...*");

            // Create a temporary folder
            const tempFolder = path.join(__dirname, "manga_downloads");
            if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);

            // PDF file path
            const pdfPath = path.join(tempFolder, `${mangaTitle}_Chapter_${chapterNumber}.pdf`);
            const doc = new PDFDocument({ autoFirstPage: false });
            const writeStream = fs.createWriteStream(pdfPath);
            doc.pipe(writeStream);

            for (const imageUrl of imageUrls) {
                try {
                    const imageBuffer = await got(imageUrl).buffer();
                    const img = doc.openImage(imageBuffer);
                    doc.addPage({ size: [img.width, img.height] });
                    doc.image(img, 0, 0);
                } catch (err) {
                    console.error("Error downloading image:", err);
                }
            }

            doc.end();

            // Wait for the PDF to finish writing before sending
            writeStream.on("finish", async () => {
                await king.client.sendMessage(king.jid, {
                    document: fs.readFileSync(pdfPath),
                    mimetype: "application/pdf",
                    fileName: `${mangaTitle}_Chapter_${chapterNumber}.pdf`,
                    caption: `Here is *${mangaTitle}* Chapter ${chapterNumber} in PDF format. 📖`,
                });

                fs.unlinkSync(pdfPath); // Delete the PDF after sending
            });

        } catch (error) {
            console.error(error);
            return king.reply("*Failed to fetch manga chapter!*");
        }
    }
);
command(
  {
    pattern: "anime-status",
    desc: "downloads anime status videos",
    type: "anime",
    fromMe: isPrivate,

  },
  async(king) => {
    await king.react("⌛");
    try{
      const api = "https://api.nikka.us.kg/anime/status?apiKey=nikka";
      const response = await axios.get(api);
      const res = response.data.video;
      const vid = res.link;
      const title = "> POWERED BY X-KING"

      await king.sendFromUrl(vid, {caption: title} )
      await king.react("");
    } catch(error){
       await king.react("✅")
        await king.reply(error)
        console.log(error)
    }
  }
)
command(
    {
        pattern: "waifu",
        fromMe: isPrivate,
        desc: "Sends a random waifu picture",
        type: "Anime",
    },
    async (king, match, m) => {
        try {
            let res = await fetch("https://api.waifu.pics/sfw/waifu");
            let json = await res.json();
            if (!json.url) return await king.reply("❌ Failed to get waifu image!");

            await king.sendFromUrl(json.url, { caption: "> © X-KING" });
        } catch (error) {
            await king.reply("⚠️ Error fetching waifu image!");
        }
    }
);

const cmdnames = [
  "akira", "akiyama", "anna", "asuna", "ayuzawa", "boruto", "chitanda", "chitoge", 
  "deidara", "doraemon", "elaina", "emilia", "asuna", "erza", "gremory", "hestia", 
  "hinata", "inori", "itachi", "isuzu", "itori", "kaga", "kagura", "kakasih", "kaori", 
  "kaneki", "kosaki", "kotori", "kuriyama", "kuroha", "kurumi", "madara", "mikasa", 
  "miku", "minato", "naruto", "natsukawa", "neko", "nekohime", "nezuko", "nishimiya", 
  "onepiece", "pokemon", "rem", "rize", "sagiri", "sakura", "sasuke", "shina", "shinka", 
  "shizuka", "shota", "tomori", "toukachan", "tsunade", "yatogami", "yuki"
];

cmdnames.forEach((cmdname) => {
  command(
    {      
      pattern: cmdname,
      fromMe: isPrivate,
      desc: `Sends a random ${cmdname} picture`,
      type: "Anime",
    },
    async (king, match, m) => {
      try {
        let res = await fetch(`https://raw.githubusercontent.com/STAR-KING0/database/refs/heads/main/anime/${cmdname}.json`);
        let json = await res.json();

        if (!Array.isArray(json) || json.length === 0) 
          return await king.reply("❌ No images found!");

        let randomUrl = json[Math.floor(Math.random() * json.length)];

        await king.sendFromUrl(randomUrl, { caption: `> © X-KING | ${cmdname}` });
      } catch (error) {
        await king.reply("⚠️ Error fetching image!");
      }
    }
  );
});
command(
    {
        pattern: "aniwall",
        fromMe: isPrivate,
        desc: "Displays a 6-slide anime wallpaper carousel",
        type: "anime",
    },
    async (king) => {
        const slides = Array.from({ length: 6 }, (_, i) => [
            "https://api.nexoracle.com/wallpapers/anime?apikey=free_key@maher_apis",
            `Anime Wallpaper ${i + 1}`, // Generic title
            "A stunning random anime wallpaper.", // Generic body text
            "Enjoy high-quality anime art!", // Generic footer text
            "Download",
            "command",
            "cta_url",
            "https://files.catbox.moe/y7memr.jpg",
        ]);

        await king.sendCarouselMessage(
            king.jid,
            "Anime Wallpapers",
            "Here are amazing anime wallpapers:",
            "Select one to download:",
            slides
        );
    }
);