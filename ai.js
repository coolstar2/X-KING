const { command, isPrivate, getJson } = require("../lib/");
const axios = require("axios");
const fetch = require('node-fetch');
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

const API_KEY_PART1 = "AIzaSyDRZO_Vwcn";
const API_KEY_PART2 = "HRbFTOoxHsg7e7nkvT4VGn1k";
const GEMINI_API_KEY = API_KEY_PART1 + API_KEY_PART2;
const MAX_FILE_SIZE_MB = 200;

async function encodeFileToBase64(fileBuffer) {
    return fileBuffer.toString("base64"); // Convert buffer to base64
}

async function sendToGemini(userQuery, mediaBase64 = null, mimeType = null) {
    try {
        let payload = {
            contents: [{ parts: [{ text: userQuery }] }],
        };

        if (mediaBase64 && mimeType) {
            payload.contents[0].parts.push({
                inline_data: { mime_type: mimeType, data: mediaBase64 },
            });
        }

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            payload,
            { headers: { "Content-Type": "application/json" } }
        );

        return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";
    } catch (error) {
        console.error("[GEMINI API ERROR]", error.response?.data || error.message);
        return "An error occurred while fetching the response.";
    }
}

command(
    {
        pattern: "ddf",
        fromMe: true,
        desc: "Send a query with or without an image/video.",
        type: "ai",
    },
    async (king, match, m) => {
        try {
            let mediaBase64 = null;
            let mimeType = null;

            // Check if the user replied to media
            if (king.reply_message) {
                const mediaBuffer = await downloadMediaMessage(king.reply_message, "buffer");
                if (!mediaBuffer) {
                    return await king.reply("*_Failed to download media._*");
                }

                const fileSizeMB = mediaBuffer.length / (1024 * 1024);
                if (fileSizeMB > MAX_FILE_SIZE_MB) {
                    return await king.reply("*_File size exceeds 200MB limit._*");
                }

                // Detect media type
                mimeType = king.reply_message.mimetype || "";
                if (mimeType.startsWith("image/") || mimeType.startsWith("video/")) {
                    mediaBase64 = await encodeFileToBase64(mediaBuffer);
                } else {
                    return await king.reply("*_Unsupported media format. Use an image or video._*");
                }
            }

            if (!match && !mediaBase64) {
                return await king.reply("*_Send a query or reply to a media file with your question._*");
            }

            // Send query to Gemini
            const responseText = await sendToGemini(match || "Describe this media", mediaBase64, mimeType);

            await king.reply(`*AI Response:*\n${responseText}`);
        } catch (error) {
            console.error("[ERROR]", error);
            await king.reply("*_An error occurred while processing your request._*");
        }
    }
);
function _0x4aee(_0x71f10f,_0x223081){const _0x476a30=_0x4a9e();return _0x4aee=function(_0x4bcc90,_0x52b1fb){_0x4bcc90=_0x4bcc90-(0xa7*-0x9+0x3*-0x2d+0x1*0x82f);let _0x592a78=_0x476a30[_0x4bcc90];return _0x592a78;},_0x4aee(_0x71f10f,_0x223081);}const _0x2ba0a1=_0x4aee;(function(_0x13f877,_0x56fe62){const _0x56dbc0=_0x4aee,_0x4c85a5=_0x13f877();while(!![]){try{const _0x21dbc9=parseInt(_0x56dbc0(0x1cb))/(-0xa6*-0x7+-0x2*-0x88f+0x15a7*-0x1)*(-parseInt(_0x56dbc0(0x1c9))/(0x17fa+0xa93+0xef*-0x25))+parseInt(_0x56dbc0(0x1dc))/(0x25ab*0x1+0x1f84*-0x1+-0x624)+-parseInt(_0x56dbc0(0x1de))/(-0x1*-0x80f+0x1cd*-0x2+-0x471)+-parseInt(_0x56dbc0(0x1d7))/(0x1f*0x12f+0x121d*-0x1+-0x128f)+parseInt(_0x56dbc0(0x1d3))/(0x308+-0x25*-0x14+0x5*-0x12e)+-parseInt(_0x56dbc0(0x1d0))/(0x1*0x1cf1+0x531+-0x221b)+parseInt(_0x56dbc0(0x1d6))/(0xbbe+-0x24cf+0x1919);if(_0x21dbc9===_0x56fe62)break;else _0x4c85a5['push'](_0x4c85a5['shift']());}catch(_0x1857a8){_0x4c85a5['push'](_0x4c85a5['shift']());}}}(_0x4a9e,-0x82394+-0x4b8e6+0x1*0x1357c1));const OpenAI=require(_0x2ba0a1(0x1e3)),openai=new OpenAI({'\x61\x70\x69\x4b\x65\x79':'\x73\x6b\x2d\x70\x72\x6f\x6a\x2d\x42\x72\x43\x41\x30\x5a\x78\x46\x77\x61\x65\x61\x41\x64\x5f\x5a\x65\x46\x51\x4d\x56\x79\x79\x4d\x54\x77\x71\x72\x72\x79\x39\x68\x55\x79\x47\x58\x45\x32\x32\x76\x6d\x5a\x76\x63\x4f\x68\x49\x4f\x77\x31\x77\x66\x56\x5a\x65\x6f\x38\x5f\x67\x4b\x30\x43\x63\x4c\x6e\x68\x63\x4c\x64\x56\x68\x52\x6c\x78\x54\x33\x42\x6c\x62\x6b\x46\x4a\x6f\x66\x33\x49\x46\x79\x64\x68\x71\x55\x79\x36\x73\x6e\x71\x42\x77\x37\x67\x37\x46\x31\x73\x43\x39\x48\x31\x4b\x6a\x63\x76\x48\x49\x57\x63\x2d\x62\x5a\x63\x58\x6b\x64\x6b\x55\x69\x30\x44\x6e\x36\x50\x71\x5a\x65\x71\x75\x44\x67\x75\x70\x48\x62\x66\x72\x6e\x58\x50\x75\x77\x30\x36\x32\x67\x41\x41'});function _0x4a9e(){const _0x3e5702=['\x6f\x70\x65\x6e\x61\x69','\x63\x6f\x6e\x74\x65\x6e\x74','\x31\x38\x38\x6b\x74\x4a\x5a\x6f\x45','\x6a\x69\x64','\x38\x34\x39\x39\x6f\x70\x57\x69\x50\x55','\x53\x74\x47\x55\x6f','\x48\x74\x53\x57\x43','\x67\x70\x74','\x53\x4c\x47\x61\x65','\x34\x32\x35\x35\x39\x35\x38\x53\x66\x67\x4f\x79\x51','\x73\x65\x6e\x64\x65\x72','\x65\x72\x72\x6f\x72','\x31\x39\x30\x38\x31\x32\x30\x7a\x6c\x55\x68\x71\x56','\x63\x72\x65\x61\x74\x65','\x49\x4e\x52','\x32\x32\x32\x38\x39\x31\x35\x32\x65\x4f\x68\x42\x78\x53','\x33\x35\x31\x36\x31\x35\x30\x7a\x59\x57\x53\x79\x41','\x64\x6a\x62\x50\x53','\x75\x73\x65\x72','\x67\x70\x74\x2d\x34\x6f\x2d\x6d\x69\x6e\x69','\x79\x48\x4e\x75\x5a','\x37\x37\x34\x34\x37\x34\x49\x61\x69\x67\x54\x75','\x63\x6c\x69\x65\x6e\x74','\x33\x33\x30\x39\x36\x36\x38\x65\x44\x54\x76\x76\x71','\x72\x65\x6c\x61\x79\x4d\x65\x73\x73\x61\x67\x65','\x4e\x6f\x20\x72\x65\x73\x70\x6f\x6e\x73\x65\x20\x66\x72\x6f\x6d\x20\x41\x49\x2e','\x72\x65\x70\x6c\x79','\x63\x6f\x6d\x70\x6c\x65\x74\x69\x6f\x6e\x73'];_0x4a9e=function(){return _0x3e5702;};return _0x4a9e();}async function sendToGPT(_0x325b6e){const _0x179ea9=_0x2ba0a1,_0x34a6b0={'\x75\x4b\x61\x51\x4a':_0x179ea9(0x1da),'\x79\x67\x59\x58\x72':_0x179ea9(0x1d9),'\x53\x4c\x47\x61\x65':_0x179ea9(0x1e0),'\x6a\x4b\x49\x64\x78':'\x5b\x47\x50\x54\x20\x41\x50\x49\x20\x45\x52\x52\x4f\x52\x5d'};try{const _0x2d1125=await openai['\x63\x68\x61\x74'][_0x179ea9(0x1e2)][_0x179ea9(0x1d4)]({'\x6d\x6f\x64\x65\x6c':_0x34a6b0['\x75\x4b\x61\x51\x4a'],'\x73\x74\x6f\x72\x65':!![],'\x6d\x65\x73\x73\x61\x67\x65\x73':[{'\x72\x6f\x6c\x65':_0x34a6b0['\x79\x67\x59\x58\x72'],'\x63\x6f\x6e\x74\x65\x6e\x74':_0x325b6e}]});return _0x2d1125['\x63\x68\x6f\x69\x63\x65\x73']?.[-0x1*-0x1ad5+0x107a*0x1+-0x1*0x2b4f]?.['\x6d\x65\x73\x73\x61\x67\x65']?.[_0x179ea9(0x1e4)]||_0x34a6b0[_0x179ea9(0x1cf)];}catch(_0x4b0213){return console[_0x179ea9(0x1d2)](_0x34a6b0['\x6a\x4b\x49\x64\x78'],_0x4b0213),'\x41\x6e\x20\x65\x72\x72\x6f\x72\x20\x6f\x63\x63\x75\x72\x72\x65\x64\x20\x77\x68\x69\x6c\x65\x20\x66\x65\x74\x63\x68\x69\x6e\x67\x20\x74\x68\x65\x20\x72\x65\x73\x70\x6f\x6e\x73\x65\x2e';}}command({'\x70\x61\x74\x74\x65\x72\x6e':_0x2ba0a1(0x1ce),'\x66\x72\x6f\x6d\x4d\x65':!![],'\x64\x65\x73\x63':'\x53\x65\x6e\x64\x20\x61\x20\x71\x75\x65\x72\x79\x20\x74\x6f\x20\x41\x49\x2e','\x74\x79\x70\x65':'\x61\x69'},async(_0x20d11a,_0x3593ef,_0xaae200)=>{const _0x24e1cb=_0x2ba0a1,_0x31e762={'\x79\x48\x4e\x75\x5a':'\x2a\x5f\x50\x72\x6f\x76\x69\x64\x65\x20\x61\x20\x71\x75\x65\x72\x79\x2e\x5f\x2a','\x48\x74\x53\x57\x43':function(_0x1a2fb7,_0x99c552){return _0x1a2fb7(_0x99c552);},'\x64\x6a\x62\x50\x53':_0x24e1cb(0x1d5),'\x53\x74\x47\x55\x6f':'\x5b\x45\x52\x52\x4f\x52\x5d'};try{if(!_0x3593ef)return await _0x20d11a[_0x24e1cb(0x1e1)](_0x31e762[_0x24e1cb(0x1db)]);const _0x5e68e5=await _0x31e762[_0x24e1cb(0x1cd)](sendToGPT,_0x3593ef);await _0x20d11a[_0x24e1cb(0x1dd)][_0x24e1cb(0x1df)](_0x20d11a[_0x24e1cb(0x1ca)],{'\x72\x65\x71\x75\x65\x73\x74\x50\x61\x79\x6d\x65\x6e\x74\x4d\x65\x73\x73\x61\x67\x65':{'\x63\x75\x72\x72\x65\x6e\x63\x79\x43\x6f\x64\x65\x49\x73\x6f\x34\x32\x31\x37':_0x31e762[_0x24e1cb(0x1d8)],'\x61\x6d\x6f\x75\x6e\x74\x31\x30\x30\x30':0x10d88,'\x72\x65\x71\x75\x65\x73\x74\x46\x72\x6f\x6d':_0xaae200[_0x24e1cb(0x1d1)],'\x6e\x6f\x74\x65\x4d\x65\x73\x73\x61\x67\x65':{'\x65\x78\x74\x65\x6e\x64\x65\x64\x54\x65\x78\x74\x4d\x65\x73\x73\x61\x67\x65':{'\x74\x65\x78\x74':_0x5e68e5,'\x63\x6f\x6e\x74\x65\x78\x74\x49\x6e\x66\x6f':{'\x65\x78\x74\x65\x72\x6e\x61\x6c\x41\x64\x52\x65\x70\x6c\x79':{'\x73\x68\x6f\x77\x41\x64\x41\x74\x74\x72\x69\x62\x75\x74\x69\x6f\x6e':!![]}}}}}},{});}catch(_0x464558){console[_0x24e1cb(0x1d2)](_0x31e762[_0x24e1cb(0x1cc)],_0x464558),await _0x20d11a[_0x24e1cb(0x1e1)]('\x2a\x5f\x41\x6e\x20\x65\x72\x72\x6f\x72\x20\x6f\x63\x63\x75\x72\x72\x65\x64\x20\x77\x68\x69\x6c\x65\x20\x70\x72\x6f\x63\x65\x73\x73\x69\x6e\x67\x20\x79\x6f\x75\x72\x20\x72\x65\x71\x75\x65\x73\x74\x2e\x5f\x2a');}});
command(
    {
        pattern: "groq",
        fromMe: true,
        desc: "Send a text-based query to the AI.",
        type: "ai",
    },
    async (king, match, m) => {
        try {
            if (!match) {
                return await king.reply("*_Please provide a prompt for the AI._*");
            }

            // Construct the URL for the API request with the provided query
            const apiUrl = `https://nikka-api.us.kg/ai/groq?q=${encodeURIComponent(match)}&apiKey=nikka`;

            // Fetch the AI response
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.data) {
                const aiResponse = data.data;  // Extract the response text

                // Prepare the payment message using the AI response
                const paymentMessage = {
                    currencyCodeIso4217: 'INR',
                    amount1000: 69000,
                    requestFrom: m.sender,
                    noteMessage: {
                        extendedTextMessage: {
                            text: aiResponse,  // Use the AI response text as the payment note
                            contextInfo: {
                                externalAdReply: {
                                    showAdAttribution: true,
                                },
                            },
                        },
                    },
                };

                // Send the payment request with the AI response as the note
                await client.relayMessage(king.jid, { requestPaymentMessage: paymentMessage }, {});
            } else {
                await king.reply("*_Failed to get a valid response from the AI._*");
            }
        } catch (error) {
            console.error("[ERROR]", error);
            await king.reply("*_An error occurred while processing your request._*");
        }
    }
);
command(
    {
        pattern: "llama",
        fromMe: true,
        desc: "Send a text-based query to the AI.",
        type: "ai",
    },
    async (king, match, m) => {
        try {
            if (!match) {
                return await king.reply("*_Please provide a prompt for the AI._*");
            }

            // Construct the URL for the new API request
            const apiUrl = `https://bk9.fun/ai/llama?q=${encodeURIComponent(match)}`;

            // Fetch the AI response
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Check if the API response is valid
            if (data.status) {
                const aiResponse = data.BK9;  // Extract the AI response from the "BK9" field

                // Prepare the payment message using the AI response
                const paymentMessage = {
                    currencyCodeIso4217: 'INR',
                    amount1000: 69000,
                    requestFrom: m.sender,
                    noteMessage: {
                        extendedTextMessage: {
                            text: aiResponse,  // Use the AI response text as the payment note
                            contextInfo: {
                                externalAdReply: {
                                    showAdAttribution: true,
                                },
                            },
                        },
                    },
                };

                // Send the payment request with the AI response as the note
                await client.relayMessage(king.jid, { requestPaymentMessage: paymentMessage }, {});
            } else {
                await king.reply("*_Failed to get a valid response from the AI._*");
            }
        } catch (error) {
            console.error("[ERROR]", error);
            await king.reply("*_An error occurred while processing your request._*");
        }
    }
);
command(
    {
        pattern: "claude",
        fromMe: true,
        desc: "Send a text-based query to the AI.",
        type: "ai",
    },
    async (king, match, m) => {
        try {
            if (!match) {
                return await king.reply("*_Please provide a prompt for the AI._*");
            }

            // Construct the URL for the new API request
            const apiUrl = `https://bk9.fun/ai/Claude-Opus?q=${encodeURIComponent(match)}`;

            // Fetch the AI response
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Check if the API response is valid
            if (data.status) {
                const aiResponse = data.BK9;  // Extract the AI response from the "BK9" field

                // Prepare the payment message using the AI response
                const paymentMessage = {
                    currencyCodeIso4217: 'INR',
                    amount1000: 69000,
                    requestFrom: m.sender,
                    noteMessage: {
                        extendedTextMessage: {
                            text: aiResponse,  // Use the AI response text as the payment note
                            contextInfo: {
                                externalAdReply: {
                                    showAdAttribution: true,
                                },
                            },
                        },
                    },
                };

                // Send the payment request with the AI response as the note
                await client.relayMessage(king.jid, { requestPaymentMessage: paymentMessage }, {});
            } else {
                await king.reply("*_Failed to get a valid response from the AI._*");
            }
        } catch (error) {
            console.error("[ERROR]", error);
            await king.reply("*_An error occurred while processing your request._*");
        }
    }
);
command(
    {
        pattern: "ss",
        fromMe: isPrivate,
        desc: "ai screenshot",
        type: "Ai",
    },
    async (king, match, m) => {
match = match || m?.quoted?.text?.trim();
	if(!match) return await king.reply(`*_Need A Url_*\n*eg:- .ss https://google.com*`);
await king.sendFromUrl(`https://ssweb-livid.vercel.app/ss?url=${match}`, {caption: "> © X-KING"})
});
command(
    {
        pattern: "carbon",
        fromMe: isPrivate,
        desc: "ai carbon effect",
        type: "Ai",
    },
    async (king, match, m) => {
match = match || m?.quoted?.text?.trim();
	if(!match) return await king.reply(`*_Need A Input_*\n*eg:- .carbon X-king rules*`);
await king.sendFromUrl(`https://api.siputzx.my.id/api/m/carbonify?input=${match}`, {caption: "> © X-KING"})
});