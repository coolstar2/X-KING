const plugins = require("../lib/event");
const {
    command,
    isPrivate,
    clockString,
    getUrl,
    parsedJid,
    isAdmin,
    getBuffer
    
} = require("../lib");
const obfuscator = require("javascript-obfuscator");

command(
  {
    pattern: "encrypt",
    fromMe: true,
    desc: "Encrypt JavaScript code",
    type: "utility",
  },
  async (king, match, m) => {
    const text = m?.quoted?.text?.trim();
    if (!text) return king.reply("*_Reply to a JavaScript code snippet to encrypt_*");

    // Send "Encrypting..." message
    await king.reply("Encrypting......🌀");

    // Enhanced obfuscation (50% stronger, but not over the top)
    const obfuscatedResult = obfuscator.obfuscate(text, {
      compact: true,                // Keep the code compact
      controlFlowFlattening: true,  // Enable control flow flattening
      numbersToExpressions: true,   // Convert numbers to expressions
      stringArrayShuffle: true,     // Shuffle the string array for added complexity
      stringArray: true,            // Enable string array encoding
      unicodeEscapeSequence: true, // Keep Unicode escape sequence for characters
      deadCodeInjection: false,    // Optional: disabled dead code injection for less complexity
      debugProtection: false,      // Optional: disabled debug protection
      disableConsoleOutput: false, // Optional: disabled console output restriction
    });

    // Get the obfuscated code string
    const obfuscatedCode = obfuscatedResult.getObfuscatedCode();

    // Send the obfuscated code in a code block
    king.reply(obfuscatedCode);
  }
);