const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

let tempImages = []; // Temporary storage for images
const defaultFont = "Helvetica"; // Default font
const availableFonts = ["Helvetica", "Times-Roman", "Courier", "ZapfDingbats"]; // Built-in PDFKit fonts

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