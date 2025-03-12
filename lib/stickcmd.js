const fs = require("fs");
const path = require("path");
const { King } = require("./Base");
const events = require("./event");
const config = require("../config");

// File to store sticker-command mappings
const STICKER_COMMANDS_FILE = path.join(__dirname, "sticker_commands.json");

// Load existing sticker-command mappings
let stickerCommands = {};
if (fs.existsSync(STICKER_COMMANDS_FILE)) {
    stickerCommands = JSON.parse(fs.readFileSync(STICKER_COMMANDS_FILE, "utf-8"));
}

// Function to save sticker-command mappings
function saveStickerCommands() {
    fs.writeFileSync(STICKER_COMMANDS_FILE, JSON.stringify(stickerCommands, null, 2));
}

// Function to add a sticker-command mapping
async function addStickerCommand(stickerMessage, command) {
    try {
        // Ensure the stickerMessage object is properly structured
        if (!stickerMessage || !stickerMessage.message?.stickerMessage?.fileSha256) {
            throw new Error("Invalid sticker message: fileSha256 is missing");
        }

        // Extract the sticker hash
        const stickerHash = stickerMessage.message.stickerMessage.fileSha256.toString("base64");

        // Store the command in the stickerCommands object
        stickerCommands[stickerHash] = command;

        // Save the updated mappings to the file
        saveStickerCommands();

        console.log(`Sticker hash: ${stickerHash}, Command: ${command}`);
    } catch (error) {
        throw new Error("Failed to bind command to sticker: " + error.message);
    }
}

// Function to handle sticker commands
async function handleStickerCommands(msg, conn) {
    try {
        const stickerMessage = msg.message?.stickerMessage;
        if (!stickerMessage || !stickerMessage.fileSha256) {
            console.log("Invalid sticker message: fileSha256 is missing");
            return;
        }

        // Extract the sticker hash
        const stickerHash = stickerMessage.fileSha256.toString("base64");

        // Check if the sticker hash is already mapped to a command
        if (stickerCommands[stickerHash]) {
            const commandName = stickerCommands[stickerHash].trim(); // Get the command name
            const commandFunction = events.commands.find(cmd => cmd.pattern.test(commandName))?.function;

            if (commandFunction) {
                // Execute the command
                const whats = new King(conn, msg, msg);
                commandFunction(whats, "", msg, conn); // Pass empty match since we're only executing the command
            } else {
                console.log("Command not found for sticker hash:", stickerHash);
            }
        }
    } catch (error) {
        console.log("Error in handleStickerCommands:", error);
    }
}

module.exports = {
    addStickerCommand,
    handleStickerCommands
};