const { command, isPrivate, getJson } = require("../lib");
const axios = require("axios");
const fetch = require("node-fetch");

async function randomFunFacts(type) {
  try {
    switch (type) {
      case "question":
        const questionResponse = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
        const questionData = await questionResponse.json();
        return `*Random Question:* ${questionData.results[0].question}`;
      case "truth":
        const truthResponse = await fetch('https://api.truthordarebot.xyz/v1/truth');
        const truthData = await truthResponse.json();
        return `*Truth:* ${truthData.question}`;
      case "dare":
        const dareResponse = await fetch('https://api.truthordarebot.xyz/v1/dare');
        const dareData = await dareResponse.json();
        return `*Dare:* ${dareData.question}`;
      case "joke":
        const jokeResponse = await fetch('https://official-joke-api.appspot.com/random_joke');
        const jokeData = await jokeResponse.json();
        return `*Joke:* ${jokeData.setup}\n*Punchline:* ${jokeData.punchline}`;
      case "joke2":
        const joke2Response = await fetch('https://v2.jokeapi.dev/joke/Any?type=single');
        const joke2Data = await joke2Response.json();
        return `*Joke:* ${joke2Data.joke}`;
      case "fact":
        const { data: factData } = await axios.get('https://nekos.life/api/v2/fact');
        return `*Fact:* ${factData.fact}`;
      case "quotes":
        const { data: quotesData } = await axios.get('https://favqs.com/api/qotd');
        return `*Quote:* "${quotesData.quote.body}"\n*Author:* ${quotesData.quote.author}`;
    }
  } catch (error) {
    console.error("Error fetching fun fact:", error);
    return "_Failed to fetch data._";
  }
}

command({ pattern: "joke", desc: "Get a random joke.", type: "fun", fromMe: isPrivate }, async (king) => {
  await king.reply(await randomFunFacts("joke"));
});

command({ pattern: "rizz", desc: "Get a random pickup line.", type: "fun", fromMe: isPrivate }, async (king) => {
  try {
    const response = await fetch("https://api.popcat.xyz/pickuplines");
    const data = await response.json();
    await king.reply(data.pickupline);
  } catch (error) {
    console.error("Error fetching pickup line:", error);
    await king.reply("_Failed to fetch pickup line._");
  }
});

command({ pattern: "question", desc: "Get a random question.", type: "fun", fromMe: isPrivate }, async (king) => {
  await king.reply(await randomFunFacts("question"));
});

command({ pattern: "truth", desc: "Get a truth question.", type: "fun", fromMe: isPrivate }, async (king) => {
  await king.reply(await randomFunFacts("truth"));
});

command({ pattern: "dare", desc: "Get a dare challenge.", type: "fun", fromMe: isPrivate }, async (king) => {
  await king.reply(await randomFunFacts("dare"));
});

command({ pattern: "bible", desc: "Get a specific Bible verse.", type: "fun", fromMe: isPrivate }, async (king) => {
  try {
    const query = king.text.split(' ').slice(1).join(' ');
    if (!query) return await king.reply("Please provide a Bible verse reference, e.g., `.bible psalm 37:4`.");
    const response = await fetch(`https://bible-api.com/${encodeURIComponent(query)}`);
    const data = await response.json();
    const message = `📖 *Bible Verse:*\n${data.text.trim()}\n\n✨ *Reference:* ${query}`;
    await king.reply(message);
  } catch (error) {
    console.error("Error fetching Bible verse:", error);
    await king.reply("_Failed to fetch Bible verse._");
  }
});

command({ pattern: "fact", desc: "Get a random fact.", type: "fun", fromMe: isPrivate }, async (king) => {
  await king.reply(await randomFunFacts("fact"));
});

command({ pattern: "quotes", desc: "Get an inspirational quote.", type: "fun", fromMe: isPrivate }, async (king) => {
  await king.reply(await randomFunFacts("quotes"));
});

command({ pattern: "define", desc: "Get a definition from Urban Dictionary.", type: "fun", fromMe: isPrivate }, async (king) => {
  try {
    const word = king.text.split(" ").slice(1).join(" ");
    if (!word) return await king.reply("Please provide a word to define.");
    const { data } = await axios.get(`http://api.urbandictionary.com/v0/define?term=${word}`);
    if (!data.list.length) return await king.reply(`No results found for "${word}".`);
    const definition = `📖 *Word:* ${word}\n💬 *Definition:* ${data.list[0].definition.replace(//g, "").replace(//g, "")}\n📝 *Example:* ${data.list[0].example.replace(//g, "").replace(//g, "")}`;
    await king.reply(definition);
  } catch (error) {
    console.error("Error fetching definition:", error);
    await king.reply("_Failed to fetch definition._");
  }
});

command({ pattern: "fakeinfo", desc: "Generate random fake information.", type: "fun", fromMe: isPrivate }, async (king) => {
  try {
    const response = await fetch("https://randomuser.me/api/");
    const data = (await response.json()).results[0];
    const fakeInfo = `👤 *Name:* ${data.name.title} ${data.name.first} ${data.name.last}\n📅 *DOB:* ${new Date(data.dob.date).toLocaleDateString()}\n📞 *Phone:* ${data.phone}\n📧 *Email:* ${data.email}\n🌍 *Location:* ${data.location.city}, ${data.location.state}, ${data.location.country}\n🔑 *Username:* ${data.login.username}\n📷 *Profile Picture:* [View Image](${data.picture.large})`;
    await king.reply(fakeInfo);
  } catch (error) {
    console.error("Error fetching fake info:", error);
    await king.reply("_Failed to generate fake info._");
  }
});

command({ pattern: "insult2", desc: "Get a random insult.", type: "fun", fromMe: isPrivate }, async (king) => {
  try {
    const response = await fetch("https://evilinsult.com/generate_insult.php?lang=en&type=json");
    const data = await response.json();
    await king.reply(data.insult);
  } catch (error) {
    console.error("Error fetching insult:", error);
    await king.reply("_Failed to fetch insult._");
  }
});

command({ pattern: "lines", desc: "Get a motivational message.", type: "fun", fromMe: isPrivate }, async (king) => {
  try {
    const response = await fetch("https://zenquotes.io/api/random");
    const data = await response.json();
    await king.reply(`${data[0].q} — ${data[0].a}`);
  } catch (error) {
    console.error("Error fetching quote:", error);
    await king.reply("_Failed to fetch quote._");
  }
});