const { command, isPrivate, getJson } = require("../lib/");
command(
    {
        pattern: "gpt",
        fromMe: isPrivate,
        desc: "chat gpt",
        type: "Ai",
    },
    async (king, match) => {
        if (!match) return await king.reply(`*_Need Text_*\n*Eg:- .gpt Hi*`);
let {data} = await getJson(`https://nikka-api.us.kg/ai/gemini?apiKey=haki&q=${match}`);
await king.reply(data)
});
command(
    {
        pattern: "gemini",
        fromMe: isPrivate,
        desc: "chat gpt",
        type: "Ai",
    },
    async (king, match) => {
        if (!match) return await king.reply(`*_Need Text_*\n*Eg:- .gpt Hi*`);
let {data} = await getJson(`https://api.siputzx.my.id/api/ai/gemini-pro?content=${match}`);
await king.reply(data)
});
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
