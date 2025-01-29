const { command, isPrivate, getJson } = require("../lib/");
command(
  {
    pattern: "forward",
    fromMe: true,
    desc: "Send a custom message to a user (number|message|amount)",
    type: "user",
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