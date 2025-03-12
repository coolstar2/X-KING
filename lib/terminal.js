const fs = require("fs");
const path = require("path");
const pino = require("pino");
const {
default: Maher_Zubair,
useMultiFileAuthState,
delay,
makeCacheableSignalKeyStore,
} = require("maher-zubair-baileys");

const sessionPath = path.join(__dirname, "session");

// Ensure session folder exists
if (!fs.existsSync(sessionPath)) {
fs.mkdirSync(sessionPath, { recursive: true });
}

async function generatePairingCode(number) {
const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

try {
const sock = Maher_Zubair({
auth: {
creds: state.creds,
keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
},
printQRInTerminal: false,
logger: pino({ level: "fatal" }).child({ level: "fatal" }),
browser: ["Chrome (Linux)", "", ""],
});

sock.ev.on("creds.update", saveCreds);  

sock.ev.on("connection.update", async (update) => {  
  const { connection, lastDisconnect } = update;  

  if (connection === "open") {  
    console.log("✅ Successfully connected to WhatsApp!");  

    // Ensure creds.json is saved  
    await saveCreds();  

    // Prevent reconnect spam by stopping here  
    sock.ev.removeAllListeners("connection.update");  
    sock.ws.close();  
  } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {  
    console.log("⚠️ Disconnected. Restarting session...");  
    await delay(5000); // Avoid instant reconnect spam  
    await generatePairingCode(number);  
  }  
});  

if (!sock.authState.creds.registered) {  
  await delay(1500);  
  number = number.replace(/[^0-9]/g, ""); // Ensure only numbers  
  const code = await sock.requestPairingCode(number);  
  console.log(`📌 Pairing code generated: ${code}`);  
  return { success: true, code };  
} else {  
  console.log("🟢 Already authenticated. No pairing needed.");  
  return { success: true, message: "Already connected." };  
}

} catch (err) {
console.error("❌ Pairing failed:", err);
return { success: false, error: err.message };
}
}

module.exports = { generatePairingCode };