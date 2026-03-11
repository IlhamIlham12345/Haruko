const axios = require("axios");
const fetch = require("node-fetch");
const fs = require("fs");
const {
    loadJsonData,
    saveJsonData,
    checkCooldown } = require('../lib/function');

const settings = require("../settings/config.js");
const OWNER_ID = settings.ownerId;
const ALLOWED_GROUP_ID = settings.groupId;

const {
    domain,
    plta,
    pltc,
    domainV2,
    pltaV2,
    pltcV2,
    domainV3,
    pltaV3,
    pltcV3,
    domainV4,
    pltaV4,
    pltcV4,
    domainV5,
    pltaV5,
    pltcV5,
    eggs,
    loc,
    dev,
    panel
} = settings;

const CADP_FILE = "./db/cadp.json";

const ADP_FILE = "./db/adp.json";

// file database
const OWNER_FILE = './db/users/adminID.json';

const OWNER_FILES = './db/akses_owner.json';

//anti ddos Jan di hapus
let antiddos = false
let monitor = null
let alertSent = false

// =========Setting AUTOSHOLAT ========
const TARGET_GROUP_ID = -1003588118874; // GANTI ID GROUP
const OWNER_USERNAME = "t.me/harukolagibobo"; // tanpa @
const GROUP_LINK = "https://t.me/+0tZUjCi9-bUwMmE1";
///==========selesai 🗿=========

//========limit=========================
const PANEL_LIMIT_FILE = "./db/panel_limit.json";
const PANEL_RESET = 24 * 60 * 60 * 1000; // 24 jam
//=========gausah di apa apain==========

const PANEL_PHOTO = "https://files.catbox.moe/e5mo5a.jpg"; 
const PANEL_BUTTON = "https://t.me/namabot"; 
//bagian otomatis buat panel

const PANEL_FILE = "./db/panel.json";

const OWNERP_FILE = './db/users/ownerID.json';
const PREMIUM_FILE = './db/users/premiumUsers.json';
const PREMV2_FILE = './db/users/version/premiumV2.json';
const PREMV3_FILE = './db/users/version/premiumV3.json';
const PREMV4_FILE = './db/users/version/premiumV4.json';
const PREMV5_FILE = './db/users/version/premiumV5.json';

const RESS_FILE = './db/users/resellerUsers.json';
const RESSV2_FILE = './db/users/version/resellerV2.json';
const RESSV3_FILE = './db/users/version/resellerV3.json';
const RESSV4_FILE = './db/users/version/resellerV4.json';
const RESSV5_FILE = './db/users/version/resellerV5.json';

module.exports = (bot) => {
  const isMember = async (userId) => {
    try {
      const member = await bot.getChatMember(`${settings.chUsn}`, userId);
      return ['creator','administrator','member'].includes(member.status);
    } catch {
      return false;
    }
  };

  const sendJoinChannel = async (msg) => {
    const chatId = msg.chat.id;
    const opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [
          [{ text: "Sudah Join", callback_data: "verify_join_channel", style: "Primary" }]
        ]
      }
    };
    await bot.sendMessage(chatId, `❌ Kamu belum join channel\n${settings.chUsn}`, opts);
  };

  bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const userId = callbackQuery.from.id;
    const chatId = msg.chat.id;

    if (callbackQuery.data === "verify_join_channel") {
      try {
        const joined = await isMember(userId);
        
       // ===== TAMBAHAN FITUR (TANPA UBAH LOGIC) =====
      if (joined) {
        await bot.sendMessage(
          chatId,
          "✅ Terima kasih, kamu sudah join channel kami 🙏\nSilakan gunakan command kembali."
        );
      } else {
        await bot.sendMessage(
          chatId,
          "❌ Kamu belum join channel kami.\nSilakan join terlebih dahulu."
        );
      }
      // ===========================================
        await bot.answerCallbackQuery(callbackQuery.id);
      } catch (err) {
        await bot.sendMessage(chatId, `❌ Gagal mengecek status join, coba lagi nanti.`);
        await bot.answerCallbackQuery(callbackQuery.id);
      }
    }
  });

  const command = (regex, callback) => {
    bot.onText(regex, async (msg, match) => {
      const userId = msg.from.id;
      const joined = await isMember(userId);

      if (!joined) return sendJoinChannel(msg);

      callback(msg, match);
    });
  };
    
    // log command
function notifyOwner(commandName, msg) {
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;
    const chatId = msg.chat.id;
    const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    const logMessage = `<blockquote>💬 Command: /${commandName}
User: @${username}
ID: ${userId}
Waktu: ${now}
</blockquote>
    `;
    bot.sendMessage(OWNER_ID, logMessage, { parse_mode: 'HTML' });
}

//list 
const serverOnPages = new Map();

command(/^\/listsrvon$/, async (msg) => {
  const chatId = msg.chat.id;

  // ===== AKSES =====
  if (chatId.toString() !== settings.exGroupId) {
    const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
    const isOwner = ownerUsers.includes(String(msg.from.id));
    if (!isOwner) {
      return bot.sendMessage(chatId, "ᴋʜᴜꜱᴜꜱ ᴅɪ ᴘᴀɴᴇʟ ᴘᴜʙʟɪᴄ");
    }
  }

  // ⏳ LOADING
  const wait = await bot.sendMessage(chatId, "⏳");

  try {
    let page = 1;
    let allServers = [];
    let totalPages = 1;

    // ===== AMBIL SEMUA SERVER =====
    do {
      const res = await fetch(`${domain}/api/application/servers?page=${page}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${plta}`,
        },
      });

      const json = await res.json();
      if (!json.data) break;

      allServers = allServers.concat(json.data);
      totalPages = json.meta.pagination.total_pages;
      page++;
    } while (page <= totalPages);

    // ===== FILTER ONLINE =====
    const onlineServers = [];

    for (const server of allServers) {
      const s = server.attributes;

      try {
        const r = await fetch(
          `${domain}/api/client/servers/${s.uuid.split("-")[0]}/resources`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${pltc}`,
            },
          }
        );

        const d = await r.json();
        const state = d?.attributes?.current_state;

        if (state === "running") {
          onlineServers.push({
            attributes: s,
            resources: d.attributes.resources
          });
        }
      } catch {}
    }

    if (!onlineServers.length) {
      return bot.editMessageText(
`🟢 *TIDAK ADA SERVER ONLINE*

Semua server sedang OFF.`,
        {
          chat_id: chatId,
          message_id: wait.message_id,
          parse_mode: "Markdown"
        }
      );
    }

    const pageSize = 10;
    const totalPage = Math.ceil(onlineServers.length / pageSize);
    serverOnPages.set(chatId, { onlineServers, totalPage });

    // ===== TAMPILAN (SAMA SEPERTI LISTSRV) =====
    const getPageText = (p) => {
      const start = (p - 1) * pageSize;
      const end = Math.min(start + pageSize, onlineServers.length);

      let totalCpu = 0;
      let totalRam = 0;
      let body = "";

      for (let i = start; i < end; i++) {
        const s = onlineServers[i].attributes;
        const r = onlineServers[i].resources;

        const cpu = r?.cpu_absolute || 0;
        const ram = r?.memory_bytes || 0;

        totalCpu += cpu;
        totalRam += ram;

        body +=
`🖥️ *ID ${s.id}*
📛 Nama   : ${s.name}
⚙️ Status : 🟢 ONLINE
🧠 CPU    : ${cpu.toFixed(1)} %
💾 RAM    : ${(ram / 1024 / 1024).toFixed(1)} MB

`;
      }

      const header =
`🟢 *DAFTAR SERVER ONLINE*

📄 Halaman : *${p}/${totalPage}*
📦 Total   : *${onlineServers.length} Server*
🧠 CPU     : *${totalCpu.toFixed(1)} %*
💾 RAM     : *${(totalRam / 1024 / 1024).toFixed(1)} MB*

`;

      return (header + body).trim();
    };

    await bot.editMessageText(getPageText(1), {
      chat_id: chatId,
      message_id: wait.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: `(1/${totalPage})`, callback_data: "none" },
            ...(totalPage > 1 ? [{ text: "➡️", callback_data: "srvon_next_1" }] : [])
          ],
          [
            { text: "❌ Close", callback_data: "srvon_close" }
          ]
        ]
      }
    });

  } catch (err) {
    console.error(err);
    bot.editMessageText("❌ Gagal mengambil data server online.", {
      chat_id: chatId,
      message_id: wait.message_id,
    });
  }
});

/*
================================
 DEOBFUSCATE JS (ENC → NON ENC)
 Trigger: dec
 Reply file .js
================================
*/

bot.onText(/^dec$/i, async (msg) => {
  const chatId = msg.chat.id;

  // WAJIB reply file
  if (!msg.reply_to_message || !msg.reply_to_message.document) {
    return bot.sendMessage(
      chatId,
      "❌ Reply file *.js* lalu ketik `dec`",
      { parse_mode: "Markdown" }
    );
  }

  const doc = msg.reply_to_message.document;

  if (!doc.file_name.endsWith(".js")) {
    return bot.sendMessage(chatId, "❌ File harus .js");
  }

  try {
    // ambil file path telegram
    const file = await bot.getFile(doc.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${settings.token}/${file.file_path}`;

    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error("Gagal download file");

    let code = await res.text();

    // =========================
    // DECODE HEX STRING \xhh
    // =========================
    code = code.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    );

    // =========================
    // GANTI VARIABLE RANDOM
    // =========================
    let i = 0;
    code = code.replace(/\bnael_[a-z0-9]+\b/gi, () => {
      i++;
      return `var_${i}`;
    });

    // =========================
    // HAPUS ANTI DEBUG
    // =========================
    code = code.replace(/\bdebugger;?/g, "");

    // =========================
    // FORMAT SEDERHANA
    // =========================
    code = code
      .replace(/;{2,}/g, ";")
      .replace(/\}\s*\{/g, "}\n{")
      .replace(/\n{3,}/g, "\n\n");

    // =========================
    // SIMPAN FILE
    // =========================
    const outPath = path.join(__dirname, "dec_result.js");
    fs.writeFileSync(outPath, code);

    await bot.sendDocument(chatId, outPath, {
      caption: "✅ *DECODE BERHASIL*\nENC → NON ENC",
      parse_mode: "Markdown"
    });

    fs.unlinkSync(outPath);

  } catch (err) {
    console.error("DEC ERROR:", err);
    bot.sendMessage(chatId, `❌ Error:\n${err.message}`);
  }
});

// ===============================
// RESET ADMIN 1 PANEL (FULL FIX)
// PASSWORD + EMAIL SEKALIGUS
// DEV ONLY
// ===============================

const fs = require("fs");
const fetch = require("node-fetch");

// ===== CEK DEV =====
const isDev = (userId) => {
  try {
    if (!fs.existsSync(OWNER_FILE)) return false;
    const devs = JSON.parse(fs.readFileSync(OWNER_FILE, "utf8"));
    return devs.includes(String(userId));
  } catch {
    return false;
  }
};

// ===== SESSION =====
const resetAdmSession = {};

// ================= START RESET =================
bot.onText(/^\/resetadm1$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isDev(userId)) {
    return bot.sendMessage(chatId, "❌ KHUSUS DEV");
  }

  resetAdmSession[userId] = { step: "domain" };

  bot.sendMessage(
    chatId,
`🔁 *RESET ADMIN 1 PANEL*

🌐 Kirim *DOMAIN PANEL*
Contoh:
https://panel.domain.com

❌ /batalresetadm1 untuk membatalkan`,
    { parse_mode: "Markdown" }
  );
});

// ================= BATAL =================
bot.onText(/^\/batalresetadm1$/, (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  if (!resetAdmSession[userId]) {
    return bot.sendMessage(chatId, "ℹ️ Tidak ada proses reset");
  }

  delete resetAdmSession[userId];
  bot.sendMessage(chatId, "❌ Reset Admin 1 dibatalkan");
});

// ================= HANDLER =================
bot.on("message", async (msg) => {
  if (!msg.text) return;

  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  if (!resetAdmSession[userId]) return;
  if (!isDev(userId)) {
    delete resetAdmSession[userId];
    return;
  }

  const s = resetAdmSession[userId];

  // ===== STEP 1 DOMAIN =====
  if (s.step === "domain") {
    if (!text.startsWith("http")) {
      return bot.sendMessage(chatId, "❌ Domain tidak valid");
    }

    s.domain = text.replace(/\/$/, "");
    s.step = "ptla";

    return bot.sendMessage(chatId, "🔑 Kirim *PTLA PANEL*", {
      parse_mode: "Markdown",
    });
  }

  // ===== STEP 2 PTLA =====
  if (s.step === "ptla") {
    if (!text.startsWith("ptla_")) {
      return bot.sendMessage(chatId, "❌ PTLA tidak valid");
    }

    s.ptla = text;
    s.step = "password";

    return bot.sendMessage(chatId, "🔐 Kirim *PASSWORD BARU*", {
      parse_mode: "Markdown",
    });
  }

  // ===== STEP 3 PASSWORD =====
  if (s.step === "password") {
    if (text.length < 6) {
      return bot.sendMessage(chatId, "❌ Password minimal 6 karakter");
    }

    s.password = text;
    s.step = "email";

    return bot.sendMessage(chatId, "📧 Kirim *EMAIL BARU*", {
      parse_mode: "Markdown",
    });
  }

  // ===== STEP 4 EMAIL + EXECUTE =====
  if (s.step === "email") {
    if (!text.includes("@")) {
      return bot.sendMessage(chatId, "❌ Format email tidak valid");
    }

    const wait = await bot.sendMessage(chatId, "⏳ Mereset Admin 1...");

    try {
      // GET ADMIN 1
      const adminRes = await fetch(`${s.domain}/api/application/users/1`, {
        headers: {
          Accept: "Application/vnd.pterodactyl.v1+json",
          Authorization: `Bearer ${s.ptla}`,
        },
      });

      const adminJson = await adminRes.json();
      if (!adminJson.attributes) throw new Error("Gagal ambil data admin");

      const admin = adminJson.attributes;

      // UPDATE ADMIN
      await fetch(`${s.domain}/api/application/users/1`, {
        method: "PATCH",
        headers: {
          Accept: "Application/vnd.pterodactyl.v1+json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${s.ptla}`,
        },
        body: JSON.stringify({
          email: text,
          username: admin.username,
          first_name: admin.first_name,
          last_name: admin.last_name,
          password: s.password,
        }),
      });

      // HITUNG SERVER
      const srvRes = await fetch(`${s.domain}/api/application/servers`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${s.ptla}`,
        },
      });

      const srvJson = await srvRes.json();
      const totalServer = srvJson.meta?.pagination?.total || 0;

      delete resetAdmSession[userId];

      await bot.editMessageText(
`✅ *RESET ADMIN 1 BERHASIL*

👤 Username : \`${admin.username}\`
📧 Email    : \`${text}\`
🔐 Password : \`${s.password}\`
🆔 Admin ID : 1
🖥 Total Server : ${totalServer}
🌐 Domain   : ${s.domain}

⚠️ Simpan data ini dengan aman`,
        {
          chat_id: chatId,
          message_id: wait.message_id,
          parse_mode: "Markdown",
        }
      );

    } catch (err) {
      delete resetAdmSession[userId];
      bot.sendMessage(chatId, "❌ Gagal reset Admin\n" + err.message);
    }
  }
});

command(/^\/top$/, async (msg) => {
  const chatId = msg.chat.id;

  // ⏳ LOADING PASIR
  const wait = await bot.sendMessage(chatId, "⏳ Mengecek beban server...");

  let hasil = "🔥 *TOP SERVER BEBAN TERTINGGI*\n\n";
  let page = 1;
  let totalPages = 1;
  let ditemukan = false;

  try {
    do {
      const res = await fetch(`${domain}/api/application/servers?page=${page}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${plta}`,
        },
      });

      const json = await res.json();
      totalPages = json.meta.pagination.total_pages;

      for (const srv of json.data) {
        const s = srv.attributes;
        const uuid = s.uuid.split("-")[0];

        try {
          const r = await fetch(
            `${domain}/api/client/servers/${uuid}/resources`,
            {
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${pltc}`,
              },
            }
          );

          const d = await r.json();
          const cpu = d.attributes.resources.cpu_absolute;
          const ram = d.attributes.resources.memory_bytes / 1024 / 1024;

          // ⚠️ SYARAT TOP
          if (cpu >= 100 || ram >= 100) {
            ditemukan = true;
            hasil +=
`⚠️ ${s.name}
🧠 CPU : ${cpu.toFixed(1)} %
💾 RAM : ${ram.toFixed(1)} MB

`;
          }
        } catch {}
      }

      page++;
    } while (page <= totalPages);

    if (!ditemukan) {
      hasil += "✅ Tidak ada server dengan beban tinggi";
    }

    // ✅ EDIT LOADING → HASIL
    await bot.editMessageText(hasil, {
      chat_id: chatId,
      message_id: wait.message_id,
      parse_mode: "Markdown",
    });

  } catch (err) {
    await bot.editMessageText(
      "❌ Gagal mengecek top server",
      {
        chat_id: chatId,
        message_id: wait.message_id,
      }
    );
  }
});

command(/\/antiddos (on|off)/, async (msg, match) => {

    const chatId = msg.chat.id
    const userId = msg.from.id.toString()

    if (!settings.ownerId.includes(userId)) {
        return bot.sendMessage(chatId, "❌ owner only")
    }

    const mode = match[1]

    if (mode === "on") {

        if (antiddos) {
            return bot.sendMessage(chatId, "⚠️ antiddos already active")
        }

        antiddos = true

        bot.sendMessage(chatId, "✅ antiddos monitoring enabled")

        startMonitor()

    }

    if (mode === "off") {

        antiddos = false

        if (monitor) {
            clearInterval(monitor)
            monitor = null
        }

        bot.sendMessage(chatId, "❌ antiddos monitoring disabled")

    }

})



async function getServers() {

    try {

        const res = await axios.get(`${domain}/api/application/servers`, {
            headers: {
                Authorization: `Bearer ${plta}`,
                Accept: "application/json"
            }
        })

        return res.data.data

    } catch {
        return []
    }

}



async function getResources(id) {

    try {

        const res = await axios.get(`${domain}/api/client/servers/${s.id}/resources`, {
            headers: {
                Authorization: `Bearer ${pltc}`,
                Accept: "application/json"
            }
        })

        return res.data.attributes.resources

    } catch {
        return null
    }

}



function startMonitor() {

    if (monitor) return

    monitor = setInterval(async () => {

        if (!antiddos) return

        const servers = await getServers()

        for (const srv of servers) {

            const id = srv.attributes.identifier
            const name = srv.attributes.name

            const resources = await getResources(id)
            if (!resources) continue

            const cpu = resources.cpu_absolute
            const ram = (resources.memory_bytes / 1024 / 1024).toFixed(0)

            if (cpu > 90 && !alertSent) {

                const text = `
<b>⚠️ ANTI DDOS ALERT</b>

Server menggunakan resource tinggi
Kemungkinan aktivitas <b>DDOS / overload</b>

<b>Server name</b> : <code>${name}</code>
<b>CPU</b> : <code>${cpu}%</code>
<b>RAM</b> : <code>${ram} MB</code>
`

                bot.sendMessage(settings.exPGroupId, text, {
                    parse_mode: "HTML"
                })

                alertSent = true
            }

            if (cpu < 70) {
                alertSent = false
            }

        }

    }, 20000)

}


bot.on("message", async (msg) => {
if (!msg.text) return
if (msg.text.toLowerCase() !== "add") return

const id = String(msg.from.id)
const username = msg.from.username ? "@" + msg.from.username : "-"
const nama = msg.from.first_name

let premiumUsers = JSON.parse(fs.readFileSync("./db/users/premiumUsers.json"))
let resellerUsers = JSON.parse(fs.readFileSync("./db/users/resellerUsers.json"))

let premiumUsersStatus = "❌"
let resellerUsersStatus = "❌"

// Cek Premium
if (premiumUsers.includes(id)) {
premiumUsersStatus = "❌ Already"
} else {
premiumUsers.push(id)
premiumUsersStatus = "✅"
}

// Cek Reseller
if (resellerUsers.includes(id)) {
resellerUsersStatus = "❌ Already"
} else {
resellerUsers.push(id)
resellerUsersStatus = "✅"
}


fs.writeFileSync("./db/users/premiumUsers.json", JSON.stringify(premiumUsers, null, 2))
fs.writeFileSync("./db/users/resellerUsers.json", JSON.stringify(resellerUsers, null, 2))

// Buat pesan tambahan
let additionalMessage = ""
if (resellerUsers.includes(id)) {
additionalMessage = "⚠️ Anda sudah pernah add sebelumnya!"
} else if (premiumUsers.includes(id) || resellerUsers.includes(id)) {
additionalMessage = "⚠️ Beberapa status sudah pernah diadd!"
} else {
additionalMessage = "✅ Berhasil ditambahkan!"
}

const teks = `
<blockquote>
<b>▰▰▰▰▰▰▰▰▰▰▰▰▰
   📋 DETAIL PENGGUNA  
▰▰▰▰▰▰▰▰▰▰▰▰</b>

┏━━ 🆔 <b>ID</b> ━━━━━━━━━
┃ <code>${id}</code>
┗━━━━━━━━━━━━━━━━

┏━━ 👤 <b>USERNAME</b> ━━━━━
┃ ${username}
┗━━━━━━━━━━━━━━━━

┏━━ 📛 <b>NAMA</b> ━━━━━━━━
┃ ${nama}
┗━━━━━━━━━━━━━━━━

<b>▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰
   ⭐ STATUS AKSES  
▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰</b>

┃ 🌟 <b>Premium</b> : ${premiumUsersStatus}
┃ 🔄 <b>Reseller</b>  : ${resellerUsersStatus}

<b>▰▰▰▰▰▰▰▰▰▰▰▰
   📢 INFORMASI  
▰▰▰▰▰▰▰▰▰▰▰▰▰</b>

✅ <b>${nama}</b> sudah start bot!
🚀 Silahkan create panel sekarang juga
💬 Jika ada kendala hubungi admin

━━━━━━━━━━━━━━━━━━━━━
📌 <i>${additionalMessage}</i>
▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰

⏰ <i>${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</i>
</blockquote>
`

bot.sendMessage(msg.chat.id, teks, {
parse_mode: "HTML"
})

})

//callback 
command(/^\/carisrv(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const keyword = match[1];

  if (!keyword) {
    return bot.sendMessage(
      chatId,
      "❌ Format salah\nGunakan:\n/carisrv nama_server"
    );
  }

  const wait = await bot.sendMessage(chatId, "⏳ Mencari server...");

  try {
    let page = 1;
    let totalPages = 1;
    let hasil = "";
    let ditemukan = false;

    do {
      const res = await fetch(`${domain}/api/application/servers?page=${page}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${plta}`,
        },
      });

      const json = await res.json();
      totalPages = json.meta.pagination.total_pages;

      for (const srv of json.data) {
        const s = srv.attributes;

        if (!s.name.toLowerCase().includes(keyword.toLowerCase())) continue;
        ditemukan = true;

        // ===== DEFAULT =====
        let statusText = "🔴 OFFLINE";
        let cpu = 0;
        let ram = 0;

        // ===== RESOURCE =====
        try {
          const uuid = s.uuid.split("-")[0];
          const r = await fetch(
            `${domain}/api/client/servers/${uuid}/resources`,
            {
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${pltc}`,
              },
            }
          );

          const d = await r.json();
          if (d.attributes.current_state === "running") {
            statusText = "🟢 ONLINE";
          }

          cpu = d.attributes.resources.cpu_absolute || 0;
          ram = d.attributes.resources.memory_bytes || 0;
        } catch {}

        // ===== OWNER INFO =====
        let email = "-";
        let role = "USER";

        try {
          const ur = await fetch(
            `${domain}/api/application/users/${s.user}`,
            {
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${plta}`,
              },
            }
          );

          const uj = await ur.json();
          email = uj.attributes.email;
          role = uj.attributes.root_admin ? "👑 ADMIN" : "👤 USER";
        } catch {}

        hasil +=
`🖥️ Nama Server : ${s.name}
🆔 ID Server   : ${s.id}
⚙️ Status      : ${statusText}

🧠 CPU         : ${cpu.toFixed(1)} %
💾 RAM         : ${(ram / 1024 / 1024).toFixed(1)} MB

📧 Email Owner : ${email}
👤 Role Owner  : ${role}
🕒 Dibuat      : ${new Date(s.created_at).toLocaleString("id-ID")}

━━━━━━━━━━━━━━━━━━

`;
      }

      page++;
    } while (page <= totalPages);

    if (!ditemukan) {
      hasil = `❌ Server dengan nama *${keyword}* tidak ditemukan`;
    }

    await bot.editMessageText(hasil.trim(), {
      chat_id: chatId,
      message_id: wait.message_id,
      parse_mode: "Markdown",
    });

  } catch (err) {
    await bot.editMessageText(
      "❌ Terjadi kesalahan saat mencari server",
      {
        chat_id: chatId,
        message_id: wait.message_id,
      }
    );
  }
});

// ===== JADWAL SHOLAT =====
const CITIES = {
  jakarta: {
    timezone: "Asia/Jakarta",
    times: {
      subuh: "04:30",
      dzuhur: "12:00",
      ashar: "15:15",
      maghrib: "18:00",
      isya: "19:10"
    }
  },
  samarinda: {
    timezone: "Asia/Makassar",
    times: {
      subuh: "04:55",
      dzuhur: "12:10",
      ashar: "15:35",
      maghrib: "18:20",
      isya: "19:30"
    }
  }
};

// ===== PILIH 1 KOTA SAJA =====
const ACTIVE_CITY = "samarinda"; // ganti ke "samarinda" kalau perlu

let lastTriggered = {};
let autoSholatInterval = null;

// ===== KIRIM PENGINGAT (TEXT ONLY) =====
function sendReminder(sholat) {
  const caption =
`🕌 *PENGINGAT SHOLAT*

⏰ Telah masuk waktu sholat *${sholat.toUpperCase()}*

📍 ${ACTIVE_CITY.toUpperCase()}
🤲 Mari tunaikan sholat tepat pada waktunya`;

  bot.sendMessage(TARGET_GROUP_ID, caption, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "👤 Owner", url: `https://t.me/${OWNER_USERNAME}` },
          { text: "🔗 Group", url: GROUP_LINK }
        ]
      ]
    }
  }).catch(err => console.log("Autosholat Error:", err.message));
}

// ===== CEK WAKTU SETIAP 1 MENIT =====
function startAutoSholat() {
  if (autoSholatInterval) return;

  autoSholatInterval = setInterval(() => {
    const city = CITIES[ACTIVE_CITY];

    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: city.timezone })
    );

    const timeNow =
      String(now.getHours()).padStart(2, "0") + ":" +
      String(now.getMinutes()).padStart(2, "0");

    for (const sholat in city.times) {
      if (
        timeNow === city.times[sholat] &&
        lastTriggered[sholat] !== timeNow
      ) {
        lastTriggered[sholat] = timeNow;
        sendReminder(sholat);
      }
    }
  }, 60000); // ✅ cek tiap 1 menit
}

// ===== JALANKAN =====
startAutoSholat();

// ===================== START SEMUA SERVER (KECUALI ADMIN ID 1) =====================
bot.onText(/^\/startall$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // ===== DEV ONLY =====
  let ownerUsers = [];
  try {
    ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE, "utf8"));
  } catch {
    return bot.sendMessage(chatId, "❌ File DEV tidak ditemukan");
  }

  if (!ownerUsers.includes(String(userId))) {
    return bot.sendMessage(chatId, "❌ KHUSUS DEV");
  }

  // ⏳ LOADING
  const wait = await bot.sendMessage(
    chatId,
    "⏳ Menyalakan semua server (kecuali admin)..."
  );

  let success = 0;
  let skipped = 0;
  let failed = 0;

  let page = 1;
  let totalPages = 1;

  try {
    do {
      const res = await fetch(`${domain}/api/application/servers?page=${page}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${plta}`,
        },
      });

      const json = await res.json();
      totalPages = json.meta.pagination.total_pages;

      for (const srv of json.data) {
        const s = srv.attributes;

        // 🚫 LEWATI SERVER ADMIN ID 1
        if (s.id === 1) {
          skipped++;
          continue;
        }

        const uuid = s.uuid.split("-")[0];

        try {
          await fetch(`
            ${domain}/api/client/servers/${uuid}/power`,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${pltc}`,
              },
              body: JSON.stringify({ signal: "start" }),
            }
          );

          success++;
        } catch {
          failed++;
        }
      }

      page++;
    } while (page <= totalPages);

    const result = `
▶️ *START SEMUA SERVER SELESAI*

✅ Berhasil dinyalakan : ${success}
⏭️ Dilewati (Admin)   : ${skipped}
❌ Gagal              : ${failed}

📅 Waktu : ${new Date().toLocaleString("id-ID")}
`;

    await bot.editMessageText(result, {
      chat_id: chatId,
      message_id: wait.message_id,
      parse_mode: "Markdown",
    });
  } catch (err) {
    await bot.editMessageText(
      "❌ Gagal menyalakan semua server",
      {
        chat_id: chatId,
        message_id: wait.message_id,
      }
    );
  }
});

// ===================== STOP SEMUA SERVER (KECUALI ADMIN ID 1) =====================
bot.onText(/^\/stopall$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // ===== DEV ONLY =====
  let ownerUsers = [];
  try {
    ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE, "utf8"));
  } catch {
    return bot.sendMessage(chatId, "❌ File DEV tidak ditemukan");
  }

  if (!ownerUsers.includes(String(userId))) {
    return bot.sendMessage(chatId, "❌ KHUSUS DEV");
  }

  const wait = await bot.sendMessage(
    chatId,
    "⏳ Menghentikan semua server (kecuali admin)..."
  );

  let success = 0;
  let skipped = 0;
  let failed = 0;

  let page = 1;
  let totalPages = 1;

  try {
    do {
      const res = await fetch (`${domain}/api/application/servers?page=${page}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${plta}`,
        },
      });

      const json = await res.json();
      totalPages = json.meta.pagination.total_pages;

      for (const srv of json.data) {
        const s = srv.attributes;

        // 🚫 LEWATI SERVER ADMIN ID 1
        if (s.id === 1) {
          skipped++;
          continue;
        }

        const uuid = s.uuid.split("-")[0];

        try {
          await fetch(`${domain}/api/client/servers/${uuid}/power`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${pltc}`,
            },
            body: JSON.stringify({ signal: "stop" }),
          });

          success++;
        } catch {
          failed++;
        }
      }

      page++;
    } while (page <= totalPages);

    const result = `
🛑 *STOP SEMUA SERVER SELESAI*

✅ Berhasil dihentikan : ${success}
⏭️ Dilewati (Admin)   : ${skipped}
❌ Gagal              : ${failed}

📅 Waktu : ${new Date().toLocaleString("id-ID")}
`;

    await bot.editMessageText(result, {
      chat_id: chatId,
      message_id: wait.message_id,
      parse_mode: "Markdown",
    });
  } catch (err) {
    await bot.editMessageText("❌ Gagal menghentikan semua server", {
      chat_id: chatId,
      message_id: wait.message_id,
    });
  }
});

//no way
function getPanelState() {
  if (!fs.existsSync(PANEL_FILE)) {
    fs.writeFileSync(PANEL_FILE, JSON.stringify({ panel: true }, null, 2));
  }
  return JSON.parse(fs.readFileSync(PANEL_FILE));
}

function savePanelState(data) {
  fs.writeFileSync(PANEL_FILE, JSON.stringify(data, null, 2));
}

command(/^\/open$/, async (msg) => {
  const chatId = msg.chat.id;

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILES));
  if (!ownerUsers.includes(String(msg.from.id))) {
    return bot.sendMessage(chatId, "❌ Khusus Owner");
  }

  const panelState = getPanelState();
  panelState.panel = true;
  savePanelState(panelState);

  bot.sendMessage(chatId, "✅ PANEL BERHASIL DI BUKA");
});

command(/^\/close$/, async (msg) => {
  const chatId = msg.chat.id;

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILES));
  if (!ownerUsers.includes(String(msg.from.id))) {
    return bot.sendMessage(chatId, "❌ Khusus Owner");
  }

  const panelState = getPanelState();
  panelState.panel = false;
  savePanelState(panelState);

  bot.sendMessage(chatId, "🔒 PANEL BERHASIL DI TUTUP");
});

// ================= TAGALL FEATURE =================
const tagallChats = new Set();

const emojiCategories = {
  smileys: ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😍","🥰","😘","😎","🥳","😇","🙃","😋","😛","🤪"],
  animals: ["🐶","🐱","🐰","🐻","🐼","🦁","🐸","🦊","🦄","🐢","🐠","🐦","🦜","🦢","🦚","🦓","🐅"],
  food: ["🍎","🍕","🍔","🍟","🍩","🍦","🍓","🥪","🍣","🍝","🍤","🥗","🥐","🍪","🍰","🍫"],
  nature: ["🌲","🌺","🌞","🌈","🌊","🌍","🍁","🌻","🌸","🌴","🌵","🍃","🍂","🌼","🌱"],
  travel: ["✈️","🚀","🚗","⛵","🏔️","🚁","🚂","🏍️","🚢","🚆","🛴"],
  sports: ["⚽","🏀","🎾","🏈","🎱","🏓","🥊","⛳","🏋️","🏄","🤸","🏆"],
  music: ["🎵","🎶","🎤","🎧","🎼","🎸","🥁","🎷","🎺","🎹"],
  celebration: ["🎉","🎊","🥳","🎈","🎁","🍰","🎆"],
};

function randomEmoji() {
  const cats = Object.keys(emojiCategories);
  const cat = cats[Math.floor(Math.random() * cats.length)];
  const arr = emojiCategories[cat];
  return arr[Math.floor(Math.random() * arr.length)];
}

// ================= /tagall =================
command(/\/tagall(?:\s+(.+))?/i, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const customText = match[1] || "";

    if (userId !== OWNER_ID.toString()) {
      return bot.sendMessage(chatId, "❌ Khusus OWNER");
    }

    if (msg.chat.type === "private") {
      return bot.sendMessage(chatId, "⚠️ Command ini hanya bisa digunakan di grup!");
    }

    if (tagallChats.has(chatId)) {
      return bot.sendMessage(chatId, "⚠️ Tagall sedang berjalan di grup ini.");
    }

    tagallChats.add(chatId);

    const admins = await bot.getChatAdministrators(chatId);
    const participants = admins.map(a => a.user);

    const users = participants
      .filter(u => !u.is_bot)
      .map(u => `<a href="tg://user?id=${u.id}">${randomEmoji()}</a>`);

    // shuffle
    for (let i = users.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [users[i], users[j]] = [users[j], users[i]];
    }

    let index = 0;
    const batchSize = 5;

    const sendBatch = async () => {
      if (!tagallChats.has(chatId)) return;

      const batch = users.slice(index, index + batchSize);
      if (batch.length === 0) {
        tagallChats.delete(chatId);
        return;
      }

      await bot.sendMessage(
        chatId,
        `${customText}\n\n${batch.join(" ")}`,
        { parse_mode: "HTML" }
      );

      index += batchSize;
      setTimeout(sendBatch, 2000);
    };

    sendBatch();
  } catch (err) {
    console.error("TAGALL ERROR:", err);
    tagallChats.delete(msg.chat.id);
  }
});

// ================= /batal =================
command(/\/batal/i, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  if (userId !== OWNER_ID.toString()) {
    return bot.sendMessage(chatId, "❌ Khusus OWNER");
  }

  if (msg.chat.type === "private") {
    return bot.sendMessage(chatId, "⚠️ Command ini hanya bisa digunakan di grup!");
  }

  if (!tagallChats.has(chatId)) {
    return bot.sendMessage(chatId, "❌ Tidak ada tagall yang berjalan.");
  }

  tagallChats.delete(chatId);
  bot.sendMessage(chatId, "✅ Tagall berhasil dibatalkan.");
});

// ================= CEK SERVER PANEL =================
command(/\/cekserver/, async (msg) => {

  const chatId = msg.chat.id;

  // kirim pesan awal
  const checkingMsg = await bot.sendMessage(chatId, "⏳ Mengecek server...");

  const panels = [
    { name: "SERVER V1", domain: settings.domain, key: settings.plta },
    { name: "SERVER V2", domain: settings.domainV2, key: settings.pltaV2 },
    { name: "SERVER V3", domain: settings.domainV3, key: settings.pltaV3 },
    { name: "SERVER V4", domain: settings.domainV4, key: settings.pltaV4 },
    { name: "SERVER V5", domain: settings.domainV5, key: settings.pltaV5 }
  ];

  let text = "📊 STATUS SEMUA PANEL\n";
  text += "━━━━━━━━━━━━━━━━━━━\n\n";

  let totalUserGlobal = 0;
  let totalServerGlobal = 0;

  for (const panel of panels) {

    try {

      const start = Date.now();

      const users = await axios.get(panel.domain + "/api/application/users", {
        headers: {
          Authorization: "Bearer " + panel.key,
          Accept: "application/json"
        },
        timeout: 10000
      });

      const servers = await axios.get(panel.domain + "/api/application/servers", {
        headers: {
          Authorization: "Bearer " + panel.key,
          Accept: "application/json"
        },
        timeout: 10000
      });

      const latency = Date.now() - start;

      const totalUser = users.data.meta.pagination.total;
      const totalServer = servers.data.meta.pagination.total;

      totalUserGlobal += totalUser;
      totalServerGlobal += totalServer;

      text += `🟢 ${panel.name}\n`;
      text += `├ Status       : ONLINE\n`;
      text += `├ Latency      : ${latency} ms\n`;
      text += `├ Total User   : ${totalUser}\n`;
      text += `└ Total Server : ${totalServer}\n\n`;

    } catch (err) {

      const code = err.response?.status || "Connection Failed";

      text += `🔴 ${panel.name}\n`;
      text += `├ Status : OFFLINE\n`;
      text += `└ Error  : HTTP ${code}\n\n`;

    }

  }

  text += "━━━━━━━━━━━━━━━━━━━\n";
  text += "📈 RINGKASAN GLOBAL\n";
  text += `├ Total User   : ${totalUserGlobal}\n`;
  text += `└ Total Server : ${totalServerGlobal}`;

  // edit pesan "Mengecek server..." jadi hasil
  bot.editMessageText(text, {
    chat_id: chatId,
    message_id: checkingMsg.message_id
  });

});

// buat file jika belum ada
if (!fs.existsSync(ADP_FILE)) {
  fs.writeFileSync(ADP_FILE, JSON.stringify({ open: false }, null, 2));
}

// function cek owner
function isOwner(userId) {
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  return ownerUsers.includes(String(userId));
}

// function cek status adp
function isAdpOpen() {
  const data = JSON.parse(fs.readFileSync(ADP_FILE));
  return data.open === true;
}

// function set status
function setAdp(status) {
  fs.writeFileSync(ADP_FILE, JSON.stringify({ open: status }, null, 2));
}

command(/^\/openadp$/, (msg) => {

  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isOwner(userId)) {
    return bot.sendMessage(chatId, "❌ Khusus OWNER");
  }

  setAdp(true);

  bot.sendMessage(chatId, "✅ Sukses membuka akses Cadp");
});

command(/^\/closeadp$/, (msg) => {

  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isOwner(userId)) {
    return bot.sendMessage(chatId, "❌ Khusus OWNER");
  }

  setAdp(false);

  bot.sendMessage(chatId, "✅ Sukses menutup cadp");
});
    
    // info
command(/^\/info$/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (chatId.toString() !== settings.exGroupId) {
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));

  if (!isOwner) {
    return bot.sendMessage(chatId, "ᴋʜᴜꜱᴜꜱ ᴅɪ ᴘᴀɴᴇʟ ᴘᴜʙʟɪᴄ", {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: "ʙᴜʏ ᴘᴜʙʟɪᴄ", url: `https://t.me/${dev}` }]],
      },
    });
  }
}
  
  let targetUser = null; 

  if (msg.reply_to_message) {
    targetUser = msg.reply_to_message.from;
  }

  else {
    targetUser = msg.from;
  }

  const userId = targetUser.id.toString();
  const username = targetUser.username || "-";
  const firstName = targetUser.first_name || "User";

  let ownerUsers = [];
  let premiumUsers = [];
  let ressUsers = [];
  if (fs.existsSync(OWNERP_FILE)) ownerUsers = JSON.parse(fs.readFileSync(OWNERP_FILE));
  if (fs.existsSync(PREMIUM_FILE)) premiumUsers = JSON.parse(fs.readFileSync(PREMIUM_FILE));
  if (fs.existsSync(RESS_FILE)) ressUsers = JSON.parse(fs.readFileSync(RESS_FILE));

  let statusStart = `❌ ${firstName} belum start bot di private chat. dilarang create!`;

  try {
    await bot.sendMessage(userId, "Start untuk cek bot!");
    statusStart = `✅ ${firstName} sudah start bot! silahkan create.`;

    let users = [];
    if (fs.existsSync(usersFile)) users = JSON.parse(fs.readFileSync(usersFile));
    if (!users.includes(userId)) {
      users.push(userId);
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    }
  } catch (err) {
  }

  const txtInfo = `
ID: <code>${userId}</code>
Username: @${username}
Nama: ${firstName}
<blockquote>- Public Owner? ${ownerUsers.includes(userId) ? "✅" : "❌"}
- Public Premium? ${premiumUsers.includes(userId) ? "✅" : "❌"}
- Public Reseller? ${ressUsers.includes(userId) ? "✅" : "❌"}
</blockquote>
${statusStart}
`;

  bot.sendMessage(chatId, txtInfo, {
    parse_mode: "HTML",
    reply_to_message_id: msg.message_id
  });
});
    
    // scpu
command(/\/scpu (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1].split(",");

  if (input.length !== 3) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh:\n`/scpu domain,ptla,ptlc`", { parse_mode: "Markdown" });
  }

  const [domain, plta, pltc] = input.map(x => x.trim());

  bot.sendMessage(chatId, "⏳ Sedang cek CPU server...");
  try {
    let page = 1;
    let totalPages = 1;
    let hasil = "📊 *Monitoring CPU Server*\n\n";

    do {
      const serversRes = await axios.get(`${domain}/api/application/servers?page=${page}`, {
        headers: { Authorization: `Bearer ${plta}`, Accept: "application/json" },
      });

      const servers = serversRes.data.data;
      totalPages = serversRes.data.meta.pagination.total_pages;

      for (const s of servers) {
        const name = s.attributes.name;
        const uuidShort = s.attributes.uuid.split("-")[0];

        try {
          const utilRes = await axios.get(
            `${domain}/api/client/servers/${uuidShort}/resources`,
            { headers: { Authorization: `Bearer ${pltc}`, Accept: "application/json" } }
          );

          const cpu = utilRes.data.attributes.resources.cpu_absolute;

          if (cpu >= 80) {
            hasil += `⚠️ *${name}* - CPU: ${cpu}%\n`;
          }
        } catch (err) {
          console.error(`Utilization error ${name}:`, err.message);
        }
      }

      page++;
    } while (page <= totalPages);

    if (hasil === "📊 *Monitoring CPU Server*\n\n") {
      hasil += "Status Server:\n✅ Semua server normal (CPU < 80%)";
    }

    bot.sendMessage(chatId, hasil, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
  } catch (error) {
    console.error(error.message);
    bot.sendMessage(chatId, "❌ Gagal mengambil data server!");
  }
});
    
    // monitoring
command(/\/servercpu/, async (msg) => {
  const chatId = msg.chat.id;
  if (chatId.toString() !== settings.exGroupId) {
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));

  if (!isOwner) {
    return bot.sendMessage(chatId, "ᴋʜᴜꜱᴜꜱ ᴅɪ ᴘᴀɴᴇʟ ᴘᴜʙʟɪᴄ", {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: "ʙᴜʏ ᴘᴜʙʟɪᴄ", url: `https://t.me/${dev}` }]],
      },
    });
  }
}

  bot.sendMessage(chatId, "⏳");
  try {
    let page = 1;
    let totalPages = 1;
    let hasil = "📊 *Monitoring CPU Server*\n\n";

    do {
      const serversRes = await axios.get(`${domain}/api/application/servers?page=${page}`, {
        headers: { Authorization: `Bearer ${plta}`, Accept: "application/json" },
      });

      const servers = serversRes.data.data;
      totalPages = serversRes.data.meta.pagination.total_pages;

      for (const s of servers) {
        const name = s.attributes.name;
        const idServer = s.attributes.id; // ambil ID server
        const uuidShort = s.attributes.uuid.split("-")[0]; // uuidShort buat client API

        try {
          const utilRes = await axios.get(
            `${domain}/api/client/servers/${uuidShort}/resources`,
            { headers: { Authorization: `Bearer ${pltc}`, Accept: "application/json" } }
          );

          const cpu = utilRes.data.attributes.resources.cpu_absolute;

          if (cpu >= 80) {
            hasil += `⚠️ *${name}* (ID: \`${idServer}\`) - CPU: ${cpu}%\n`;
          }
        } catch (err) {
          console.error(`Utilization error ${name}:`, err.message);
        }
      }

      page++;
    } while (page <= totalPages);

    if (hasil === "📊 *Monitoring CPU Server*\n\n") {
      hasil += "Status Server:\n✅ Semua server normal (CPU < 80%)";
    }

    bot.sendMessage(chatId, hasil, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
  } catch (error) {
    console.error(error.message);
    bot.sendMessage(chatId, "❌ Gagal mengambil data server!");
  }
});

    // cadp
command(/^\/cadp(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
 const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
 const isOwnerUser = ownerUsers.includes(String(userId));

 if (!isOwnerUser && !isAdpOpen()) {
  return bot.sendMessage(chatId, "🚫 CADP TIDAK ADA MEMENUHI SYARAT MU");
}

  if (chatId.toString() !== settings.exGroupId) {
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));

  if (!isOwner) {
    return bot.sendMessage(chatId, "ᴋʜᴜꜱᴜꜱ ᴅɪ ᴘᴀɴᴇʟ ᴘᴜʙʟɪᴄ", {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: "ʙᴜʏ ᴘᴜʙʟɪᴄ", url: `https://t.me/${dev}` }]],
      },
    });
  }
}

  let premiumUsers = [];
  try {
    premiumUsers = JSON.parse(fs.readFileSync(PREMIUM_FILE));
  } catch (e) {
    premiumUsers = [];
  }

  const isPremium = premiumUsers.includes(String(userId));
  if (!isPremium) {
    bot.sendMessage(chatId,"❌ ᴋʜᴜꜱᴜꜱ ᴘʀᴇᴍɪᴜᴍ!",{
      reply_markup:{
        inline_keyboard:[[{
          text:"ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ",url:`https://t.me/${dev}`
        }]]
      }
    });
    return;
  }

  const waktu = checkCooldown(userId);
  if (waktu > 0) {
    return bot.sendMessage(chatId,`⏳ Tunggu ${waktu} detik sebelum bisa pakai command /cadp lagi!`,{ reply_to_message_id: msg.message_id });
  }

  // --- Handling aman params ---
  const rawParams = (match && match[1]) ? match[1].trim() : "";
  if (!rawParams) {
    return bot.sendMessage(chatId,"❌ Format Salah!\nPenggunaan: /cadp nama,idtele");
  }

  const commandParams = rawParams.split(",").map(x => x.trim()).filter(Boolean);
  if (commandParams.length < 2) {
    return bot.sendMessage(chatId,"❌ Format Salah!\nPenggunaan: /cadp nama,idtele");
  }

  const panelName = commandParams[0];
  const telegramId = commandParams[1];
  const password = panelName + Math.random().toString(36).slice(2,5);

  try {
    const response = await fetch(`${domain}/api/application/users`,{
      method:"POST",
      headers:{
        Accept:"application/json",
        "Content-Type":"application/json",
        Authorization:`Bearer ${plta}`,
      },
      body:JSON.stringify({
        email:`${panelName}@admin.nael`,
        username:panelName,
        first_name:panelName,
        last_name:"admin",
        language:"en",
        root_admin:true,
        password:password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      bot.sendMessage(chatId,JSON.stringify(data.errors[0],null,2));
      return;
    }

    const user = data.attributes;
    const userInfo = `
TYPE: ADMIN PANEL
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ LANGUAGE: ${user.language}
➟ ADMIN: ${user.root_admin}
➟ CREATED AT: ${user.created_at}
    `;
    bot.sendMessage(chatId,userInfo);

    const caption = `🔐 Sukses Created Admin Panel!

👤 Username: <code>${user.username}</code>
🔑 Password: <code>${password}</code>
🌐 Login: ${domain}

<blockquote>📌 Catatan :
Simpan informasi data ini dengan aman
dan jangan bagikan ke orang lain!
</blockquote>
`;

    await bot.sendPhoto(telegramId,panel,{ caption,parse_mode:"HTML" });

  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId,"❌ Terjadi kesalahan dalam pembuatan admin. Silakan coba lagi nanti.");
  }
});

    // cadpv2
command(/\/cadpv2(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1];
    
  if (msg.chat.type !== "group" && msg.chat.type !== "supergroup") {
  bot.sendMessage(msg.chat.id, "❌ ᴋʜᴜꜱᴜꜱ ɢʀᴜᴘ!");
  return;
  }
    
  const premV2Users = JSON.parse(fs.readFileSync(PREMV2_FILE));
  const isPremiumV2 = premV2Users.includes(String(msg.from.id));   
      if (!isPremiumV2) {
    bot.sendMessage(chatId, "❌ ᴋʜᴜꜱᴜꜱ ᴘʀᴇᴍɪᴜᴍ ᴠ2!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }
    
  const waktu = checkCooldown(msg.from.id);
    if (waktu > 0) return bot.sendMessage(chatId, `⏳ Tunggu ${waktu} detik sebelum bisa pakai command /cadpv2 lagi!`, { reply_to_message_id: msg.message_id });
  
  const commandParams = match[1].split(",");
if (commandParams.length < 2) {
  bot.sendMessage(
    chatId,
    "❌ Format Salah! Penggunaan: /cadpv2 nama,idtele"
  );
  return;
}

  const panelName = commandParams[0].trim();
  const telegramId = commandParams[1].trim();

  const password = panelName + Math.random().toString(36).slice(2, 5);
    
  try {
    const response = await fetch(`${domainV2}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV2}`,
      },
      body: JSON.stringify({
        email: `${panelName}@admin.nael`,
        username: panelName,
        first_name: panelName,
        last_name: "admin",
        language: "en",
        root_admin: true,
        password: password,
      }),
    });
    const data = await response.json();
    if (data.errors) {
      bot.sendMessage(chatId, JSON.stringify(data.errors[0], null, 2));
      return;
    }
    const user = data.attributes;
    const userInfo = `
TYPE: ADMIN PANEL V2
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ LANGUAGE: ${user.language}
➟ ADMIN: ${user.root_admin}
➟ CREATED AT: ${user.created_at}
    `;
    bot.sendMessage(chatId, userInfo);
     
    const caption = `🔐 Sukses Created Admin Panel V2!

👤 Username: <code>${user.username}</code>
🔑 Password: <code>${password}</code>
🌐 Login: ${domainV2}

<blockquote>📌 Catatan :
Simpan informasi data ini dengan aman
dan jangan bagikan ke orang lain!
</blockquote>
`;

bot.sendPhoto(telegramId, panel, { caption, parse_mode: "HTML" });
   
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan dalam pembuatan admin. Silakan coba lagi nanti."
    );
  }
});
 
    // cadpv3
command(/\/cadpv3(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1];
    
  if (msg.chat.type !== "group" && msg.chat.type !== "supergroup") {
  bot.sendMessage(msg.chat.id, "❌ ᴋʜᴜꜱᴜꜱ ɢʀᴜᴘ!");
  return;
}
    
  const premV3Users = JSON.parse(fs.readFileSync(PREMV3_FILE));
  const isPremiumV3 = premV3Users.includes(String(msg.from.id));   
      if (!isPremiumV3) {
    bot.sendMessage(chatId, "❌ ᴋʜᴜꜱᴜꜱ ᴘʀᴇᴍɪᴜᴍ ᴠ3!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }
  
  const commandParams = match[1].split(",");
if (commandParams.length < 2) {
  bot.sendMessage(
    chatId,
    "❌ Format Salah! Penggunaan: /cadpv3 nama,idtele"
  );
  return;
}
    
  const waktu = checkCooldown(msg.from.id);
    if (waktu > 0) return bot.sendMessage(chatId, `⏳ Tunggu ${waktu} detik sebelum bisa pakai command /cadpv3 lagi!`, { reply_to_message_id: msg.message_id });

  const panelName = commandParams[0].trim();
  const telegramId = commandParams[1].trim();

  const password = panelName + Math.random().toString(36).slice(2, 5);
    
  try {
    const response = await fetch(`${domainV3}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV3}`,
      },
      body: JSON.stringify({
        email: `${panelName}@admin.nael`,
        username: panelName,
        first_name: panelName,
        last_name: "admin",
        language: "en",
        root_admin: true,
        password: password,
      }),
    });
    const data = await response.json();
    if (data.errors) {
      bot.sendMessage(chatId, JSON.stringify(data.errors[0], null, 2));
      return;
    }
    const user = data.attributes;
    const userInfo = `
TYPE: ADMIN PANEL V3
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ LANGUAGE: ${user.language}
➟ ADMIN: ${user.root_admin}
➟ CREATED AT: ${user.created_at}
    `;
    bot.sendMessage(chatId, userInfo);
     
    const caption = `🔐 Sukses Created Admin Panel V3!

👤 Username: <code>${user.username}</code>
🔑 Password: <code>${password}</code>
🌐 Login: ${domainV3}

<blockquote>📌 Catatan :
Simpan informasi data ini dengan aman
dan jangan bagikan ke orang lain!
</blockquote>
`;

bot.sendPhoto(telegramId, panel, { caption, parse_mode: "HTML" });
   
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan dalam pembuatan admin. Silakan coba lagi nanti."
    );
  }
});
    
    // cadpv4
command(/\/cadpv4(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1];
    
  if (msg.chat.type !== "group" && msg.chat.type !== "supergroup") {
  bot.sendMessage(msg.chat.id, "❌ ᴋʜᴜꜱᴜꜱ ɢʀᴜᴘ!");
  return;
}
    
  const premV4Users = JSON.parse(fs.readFileSync(PREMV4_FILE));
  const isPremiumV4 = premV4Users.includes(String(msg.from.id));   
      if (!isPremiumV4) {
    bot.sendMessage(chatId, "❌ ᴋʜᴜꜱᴜꜱ ᴘʀᴇᴍɪᴜᴍ ᴠ4!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }
  
  const commandParams = match[1].split(",");
if (commandParams.length < 2) {
  bot.sendMessage(
    chatId,
    "❌ Format Salah! Penggunaan: /cadpv4 nama,idtele"
  );
  return;
}
    
  const waktu = checkCooldown(msg.from.id);
    if (waktu > 0) return bot.sendMessage(chatId, `⏳ Tunggu ${waktu} detik sebelum bisa pakai command /cadpv4 lagi!`, { reply_to_message_id: msg.message_id });

  const panelName = commandParams[0].trim();
  const telegramId = commandParams[1].trim();

  const password = panelName + Math.random().toString(36).slice(2, 5);
    
  try {
    const response = await fetch(`${domainV4}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV4}`,
      },
      body: JSON.stringify({
        email: `${panelName}@admin.nael`,
        username: panelName,
        first_name: panelName,
        last_name: "admin",
        language: "en",
        root_admin: true,
        password: password,
      }),
    });
    const data = await response.json();
    if (data.errors) {
      bot.sendMessage(chatId, JSON.stringify(data.errors[0], null, 2));
      return;
    }
    const user = data.attributes;
    const userInfo = `
TYPE: ADMIN PANEL V4
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ LANGUAGE: ${user.language}
➟ ADMIN: ${user.root_admin}
➟ CREATED AT: ${user.created_at}
    `;
    bot.sendMessage(chatId, userInfo);
     
    const caption = `🔐 Sukses Created Admin Panel V4!

👤 Username: <code>${user.username}</code>
🔑 Password: <code>${password}</code>
🌐 Login: ${domainV4}

<blockquote>📌 Catatan :
Simpan informasi data ini dengan aman
dan jangan bagikan ke orang lain!
</blockquote>
`;

bot.sendPhoto(telegramId, panel, { caption, parse_mode: "HTML" });
   
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan dalam pembuatan admin. Silakan coba lagi nanti."
    );
  }
});
    
    // cadpv5
command(/\/cadpv5(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1];
    
  if (msg.chat.type !== "group" && msg.chat.type !== "supergroup") {
  bot.sendMessage(msg.chat.id, "❌ ᴋʜᴜꜱᴜꜱ ɢʀᴜᴘ!");
  return;
}
    
  const premV5Users = JSON.parse(fs.readFileSync(PREMV5_FILE));
  const isPremiumV5 = premV5Users.includes(String(msg.from.id));   
      if (!isPremiumV5) {
    bot.sendMessage(chatId, "❌ ᴋʜᴜꜱᴜꜱ ᴘʀᴇᴍɪᴜᴍ ᴠ5!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }
    
  const waktu = checkCooldown(msg.from.id);
    if (waktu > 0) return bot.sendMessage(chatId, `⏳ Tunggu ${waktu} detik sebelum bisa pakai command /cadpv5 lagi!`, { reply_to_message_id: msg.message_id });
  
  const commandParams = match[1].split(",");
if (commandParams.length < 2) {
  bot.sendMessage(
    chatId,
    "❌ Format Salah! Penggunaan: /cadpv5 nama,idtele"
  );
  return;
}

  const panelName = commandParams[0].trim();
  const telegramId = commandParams[1].trim();

  const password = panelName + Math.random().toString(36).slice(2, 5);
    
  try {
    const response = await fetch(`${domainV5}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV5}`,
      },
      body: JSON.stringify({
        email: `${panelName}@admin.nael`,
        username: panelName,
        first_name: panelName,
        last_name: "admin",
        language: "en",
        root_admin: true,
        password: password,
      }),
    });
    const data = await response.json();
    if (data.errors) {
      bot.sendMessage(chatId, JSON.stringify(data.errors[0], null, 2));
      return;
    }
    const user = data.attributes;
    const userInfo = `
TYPE: ADMIN PANEL V5
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ LANGUAGE: ${user.language}
➟ ADMIN: ${user.root_admin}
➟ CREATED AT: ${user.created_at}
    `;
    bot.sendMessage(chatId, userInfo);
     
    const caption = `🔐 Sukses Created Admin Panel V5!

👤 Username: <code>${user.username}</code>
🔑 Password: <code>${password}</code>
🌐 Login: ${domainV5}

<blockquote>📌 Catatan :
Simpan informasi data ini dengan aman
dan jangan bagikan ke orang lain!
</blockquote>
`;

bot.sendPhoto(telegramId, panel, { caption, parse_mode: "HTML" });
   
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan dalam pembuatan admin. Silakan coba lagi nanti."
    );
  }
});
    
command(/\/listcadp/, (msg) => {
  const chatId = msg.chat.id;

  if (!fs.existsSync(CADP_FILE)) {
    return bot.sendMessage(chatId, "❌ Tidak ada data user tersimpan.");
  }

  const db = JSON.parse(fs.readFileSync(CADP_FILE));

  if (db.length === 0) {
    return bot.sendMessage(chatId, "❌ Belum ada user yang tercatat.");
  }

  let text = "<b>📋 User yang /cadp:</b>\n\n";
  db.forEach((id, index) => {
    text += `${index + 1}. <code>${id}</code>\n`;
  });

  bot.sendMessage(chatId, text, { parse_mode: "HTML" });
});
    
    // unli ke whatsapp
command(/\/unliwa (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  
  if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
    return bot.sendMessage(chatId, "❌ ᴋʜᴜꜱᴜꜱ ɢʀᴜᴘ!");
  }
    
  const text = match[1];

  const isCooldown = checkCooldown(msg);
  if (isCooldown) return bot.sendMessage(chatId, isCooldown);

  const ressUsers = JSON.parse(fs.readFileSync(RESS_FILE));
  const isReseller = ressUsers.includes(String(msg.from.id));

  if (!isReseller) {
    return bot.sendMessage(chatId, "❌ Khusus Reseller!", {
      reply_markup: {
        inline_keyboard: [[{ text: `LAPORAN", url: "https://t.me/${dev}` }]],
      },
    });
  }

  const t = text.split(",");
  if (t.length < 2) {
    return bot.sendMessage(chatId, "⚠️ Format: /unli namapanel,nomorwa");
  }

  const username = t[0].trim();
  const waNumber = t[1].replace(/[^0-9]/g, ""); // nomor WA tujuan
  const jid = waNumber + "@s.whatsapp.net"; // jid WA
  const name = username + "unli";
  const egg = settings.eggs;
  const loc = settings.loc;
  const memo = "0";
  const cpu = "0";
  const disk = "0";
  const email = `${username}@unli.nael`;
  const spc =
    'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const password = username + Math.random().toString(36).slice(2, 5);
    
  let user;
  let server;

  try {
    // CREATE USER
    const response = await fetch(`${domain}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: "en",
        password: password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      return bot.sendMessage(
        chatId,
        `❌ Error: ${JSON.stringify(data.errors[0], null, 2)}`
      );
    }
    user = data.attributes;

    // CREATE SERVER
    const response2 = await fetch(`${domain}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
      body: JSON.stringify({
        name: name,
        description: "",
        user: user.id,
        egg: parseInt(egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: spc,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu,
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1,
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      return bot.sendMessage(
        chatId,
        `❌ Error saat buat server: ${JSON.stringify(data2.errors[0], null, 2)}`
      );
    }
    server = data2.attributes;
  } catch (error) {
    return bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }

  if (user && server) {
    // kirim ke WA
    await sock.sendMessage(jid, {
  image: { url: panel },
  caption: `*🔐 Sukses Created Panel!*
▸ Name: ${username}
▸ Email: ${email}
▸ ID: ${user.id}

*🌐 Domain Panel*
▸ Username: ${user.username}
▸ Password: ${password}
▸ Login: ${domain}

*⚠️ Rules Panel*
▸ Sensor domain
▸ Simpan data akun
▸ Garansi 15 hari`
  });

    // notif di Telegram
    bot.sendMessage(
      chatId,
      `✅ Sukses kirim panel ke Nomer WhatsApp: ${waNumber}`
    );
  } else {
    bot.sendMessage(
      chatId,
      `❌ Akun panel tidak ada! Laporkan ke @${dev}.`
    );
  }
});
    
    // unli
command(/^\/unli(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const ownerId = msg.from.id;
  
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILES));
  const isOwner = ownerUsers.includes(String(msg.from.id));

  const panelState = getPanelState();

  // jika panel ditutup dan bukan owner
  if (!panelState.panel && !isOwner) {
  return bot.sendMessage(chatId,
  `🔐 PANEL CLOSE 🔐\n\nADMIN SEDANG MENUTUP PANEL KARENA TIDAK MEMPUNYAI ADMIN PANEL ATAU LAINNYA KETIK /cekserver`);
}

  if (chatId.toString() !== settings.exGroupId) {
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));

  if (!isOwner) {
    return bot.sendMessage(chatId, "ᴋʜᴜꜱᴜꜱ ᴅɪ ᴘᴀɴᴇʟ ᴘᴜʙʟɪᴄ", {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: "ʙᴜʏ ᴘᴜʙʟɪᴄ", url: `https://t.me/${dev}` }]],
      },
    });
  }
}

  const text = match[1];
  if (!text) return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /unli nama,id");

  const ressUsers = JSON.parse(fs.readFileSync(RESS_FILE));
  if (!ressUsers.includes(String(msg.from.id))) {
    return bot.sendMessage(chatId, "❌ ᴋʜᴜꜱᴜꜱ ʀᴇꜱᴇʟʟᴇʀ!", {
      reply_markup: { inline_keyboard: [[{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }]] },
    });
  }

  const waktu = checkCooldown(msg.from.id);
  if (waktu > 0)
    return bot.sendMessage(chatId, `⏳ Tunggu ${waktu} detik sebelum bisa pakai command /unli lagi!`, { reply_to_message_id: msg.message_id });

  const t = text.split(",");
  if (t.length < 2) return bot.sendMessage(chatId, "⚠️ Format: /unli namapanel,idtele");

  const username = t[0].trim();
  const u = parseInt(t[1].trim());

  // ✅ Cek apakah user ID valid
  try {
    await bot.getChat(u);
  } catch (err) {
    if (err.response && err.response.statusCode === 400) {
      return bot.sendMessage(chatId, `❌ User dengan ID ${u} tidak ditemukan atau belum pernah start bot!`, {
        reply_to_message_id: msg.message_id
      });
    } else {
      return bot.sendMessage(chatId, `⚠️ Gagal memeriksa user ID ${u}: ${err.message}`, {
        reply_to_message_id: msg.message_id
      });
    }
  }

  await bot.sendMessage(chatId, "⏳");

  // Bungkus seluruh proses di try/catch besar biar kalau ada error langsung batal
  try {
    const name = username + "unli";
    const egg = eggs;
    const loc = settings.loc;
    const memo = "10240";
    const cpu = "240";
    const disk = "11000";
    const email = `${username}@unli.nael`;
    const password = username + Math.random().toString(36).slice(2, 5);
    const spc =
      'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';

    // CREATE USER
    const resUser = await fetch(`${domain}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: "en",
        password: password,
      }),
    });

    const dataUser = await resUser.json();
    if (dataUser.errors) throw new Error(`Gagal buat user: ${dataUser.errors[0].detail || dataUser.errors[0].code}`);

    const user = dataUser.attributes;

    // CREATE SERVER
    const resServer = await fetch(`${domain}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
      body: JSON.stringify({
        name: name,
        user: user.id,
        egg: parseInt(egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: spc,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: { memory: memo, swap: 0, disk: disk, io: 500, cpu: cpu },
        feature_limits: { databases: 5, backups: 5, allocations: 1 },
        deploy: { locations: [parseInt(loc)], dedicated_ip: false, port_range: [] },
      }),
    });

    const dataServer = await resServer.json();
    if (dataServer.errors) throw new Error(`Gagal buat server: ${dataServer.errors[0].detail || dataServer.errors[0].code}`);

    const server = dataServer.attributes;
      
    bot.sendMessage(
      chatId,
      `Type: Panel Unli
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB
`
    );

    // Kirim ke user
    await bot.sendPhoto(u, panel, {
      caption: `🔐 *berhasil kirim panel kamu*
▸ Name: ${username}
▸ Email: ${email}
▸ ID: ${user.id}
▸ RAM: Unlimited

🌐 *Akun Panel*
▸ Username: \`${username}\`
▸ Password: \`${password}\`
▸ Login: ${domain}

⚠️ *Rules Panel*
▸ Sensor domain
▸ No DDOS/Share Free
▸ Garansi 15 hari
▸ jangan kasih domain ini ke orang lain`,
      parse_mode: "Markdown",
    });

    await bot.sendMessage(chatId, `✅ Berhasil kirim panel ke @${msg.from.username}\n(ID: ${u})`, {
      reply_to_message_id: msg.message_id,
    });
    
 // =================================================
    // 🔥 TAMBAHKAN KODE INI TEPAT DI SINI 🔥
    // =================================================
    try {
      const usnUser = msg.from.username
        ? `@${msg.from.username}`
        : `ID:${msg.from.id}`;

      await bot.sendPhoto(settings.chUsn, panel, {
        caption: `👩‍💻 *SUKSES MEMBUAT PANEL*
━━━━━━━━━━━━━━━━━━
Nama Panel : *${username}*
spek : *unlimited*
Dibuat : ${usnUser}
User : \`${user.id}\`
Status : *Aktif*
━━━━━━━━━━━━━━━━━━`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "BUAT PANEL", url: PANEL_BUTTON }]
          ]
        }
      });
    } catch (e) {
      console.log("⚠️ Gagal kirim notif panel ke channel:", e.message);
    }
    
  } catch (err) {
    // Gagal di mana pun = gagalkan semua
    bot.sendMessage(chatId, `❌ Gagal membuat panel\n${err.message}`, {
      reply_to_message_id: msg.message_id,
    });
    return;
  }
});
    
   // unli v2
command(/\/unliv2(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
    
  if (msg.chat.type !== "group" && msg.chat.type !== "supergroup") {
  bot.sendMessage(msg.chat.id, "❌ ᴋʜᴜꜱᴜꜱ ɢʀᴜᴘ!");
  return;
  }

  const waktu = checkCooldown(msg.from.id);
    if (waktu > 0) return bot.sendMessage(chatId, `⏳ Tunggu ${waktu} detik sebelum bisa pakai command /unliv2 lagi!`, { reply_to_message_id: msg.message_id });
    
  const ressV2Users = JSON.parse(fs.readFileSync(RESSV2_FILE));
  const isResellerV2 = ressV2Users.includes(String(msg.from.id));   
      if (!isResellerV2) {
    bot.sendMessage(chatId, "❌ ᴋʜᴜꜱᴜꜱ ʀᴇꜱᴇʟʟᴇʀ ᴠ2!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }

  const t = text.split(",");
  if (t.length < 2) {
    bot.sendMessage(chatId, "⚠️ Format: /unliv2 namapanel,idtele");
    return;
  }

  const username = t[0].trim();
  const u = parseInt(t[1].trim());
  const name = username + "unli";
  const egg = eggs;
  const loc = settings.loc;
  const memo = "0";
  const cpu = "0";
  const disk = "0";
  const email = `${username}@unli.nael`;
  const spc =
    'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const password = username + Math.random().toString(36).slice(2, 5);
    
  let user;
  let server;

  try {
    // CREATE USER
    const response = await fetch(`${domainV2}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV2}`,
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: "en",
        password: password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      if (
        data.errors[0].meta.rule === "unique" &&
        data.errors[0].meta.source_field === "email"
      ) {
        bot.sendMessage(chatId, "⚠️ Email & Username sudah ada di panel! Coba lagi.");
      } else {
        bot.sendMessage(chatId, `❌ Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;

    // CREATE SERVER
    const response2 = await fetch(`${domainV2}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV2}`,
      },
      body: JSON.stringify({
        name: name,
        description: "",
        user: user.id,
        egg: parseInt(egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: spc,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu,
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1,
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      bot.sendMessage(chatId, `❌ Error saat buat server: ${JSON.stringify(data2.errors[0], null, 2)}`);
      return;
    }
    server = data2.attributes;

  } catch (error) {
    bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    return;
  }

  if (user && server) {
    bot.sendMessage(
      chatId,
      `Type: Panel Unli V2
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB
`
    );

function esc(text) {
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

const safeName = esc(username);
const safeEmail = esc(email);
const safeId = esc(user.id);
const safeUser = esc(user.username);
const safePass = esc(password);
const safeDomain = esc(domainV2);

// copy
const copyUser = `\`${safeUser}\``;
const copyPass = `\`${safePass}\``;
    
// spoiler
const spoilerDomain = `||${safeDomain}||`;

bot.sendPhoto(u, panel, {
  caption: `🔐 *Sukses Created Panel V2\\!*
▸ Name: ${safeName}
▸ Email: ${safeEmail}
▸ ID: ${safeId}
▸ RAM: Unlimited

🌐 *Akun Panel V2*
▸ Username: ${copyUser}
▸ Password: ${copyPass}
▸ Login: ${spoilerDomain}

⚠️ *Rules Panel*
▸ Sensor domain
▸ Simpan data akun
▸ Garansi 15 hari`,
  parse_mode: "MarkdownV2",
  reply_markup: {
    inline_keyboard: [
      [
        { text: "🌐 Domain", url: domainV2 },
        { text: "🔑 Salin Password", switch_inline_query_current_chat: password }
      ],
    ],
  },
});

    bot.sendMessage(
      chatId,
      `✅ Berhasil kirim panel V2 ke @${msg.from.username}\n(ID: ${u})`
    );
  } else {
    bot.sendMessage(chatId, `❌ Akun panel tidak ada! Laporkan ke @${dev}.`);
  }
});
    
  // unli v3
command(/\/unliv3(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
    
  if (msg.chat.type !== "group" && msg.chat.type !== "supergroup") {
  bot.sendMessage(msg.chat.id, "❌ ᴋʜᴜꜱᴜꜱ ɢʀᴜᴘ!");
  return;
  }

  const waktu = checkCooldown(msg.from.id);
    if (waktu > 0) return bot.sendMessage(chatId, `⏳ Tunggu ${waktu} detik sebelum bisa pakai command /unliv3 lagi!`, { reply_to_message_id: msg.message_id });
    
  const ressV3Users = JSON.parse(fs.readFileSync(RESSV3_FILE));
  const isResellerV3 = ressV3Users.includes(String(msg.from.id));   
      if (!isResellerV3) {
    bot.sendMessage(chatId, "❌ ᴋʜᴜꜱᴜꜱ ʀᴇꜱᴇʟʟᴇʀ ᴠ3!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }

  const t = text.split(",");
  if (t.length < 2) {
    bot.sendMessage(chatId, "⚠️ Format: /unliv3 namapanel,idtele");
    return;
  }

  const username = t[0].trim();
  const u = parseInt(t[1].trim());
  const name = username + "unli";
  const egg = eggs;
  const loc = settings.loc;
  const memo = "0";
  const cpu = "0";
  const disk = "0";
  const email = `${username}@unli.nael`;
  const spc =
    'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const password = username + Math.random().toString(36).slice(2, 5);
    
  let user;
  let server;

  try {
    // CREATE USER
    const response = await fetch(`${domainV3}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV3}`,
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: "en",
        password: password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      if (
        data.errors[0].meta.rule === "unique" &&
        data.errors[0].meta.source_field === "email"
      ) {
        bot.sendMessage(chatId, "⚠️ Email & Username sudah ada di panel! Coba lagi.");
      } else {
        bot.sendMessage(chatId, `❌ Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;

    // CREATE SERVER
    const response2 = await fetch(`${domainV3}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV3}`,
      },
      body: JSON.stringify({
        name: name,
        description: "",
        user: user.id,
        egg: parseInt(egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: spc,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu,
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1,
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      bot.sendMessage(chatId, `❌ Error saat buat server: ${JSON.stringify(data2.errors[0], null, 2)}`);
      return;
    }
    server = data2.attributes;

  } catch (error) {
    bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    return;
  }

  if (user && server) {
    bot.sendMessage(
      chatId,
      `Type: Panel Unli V3
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB
`
    );

function esc(text) {
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

const safeName = esc(username);
const safeEmail = esc(email);
const safeId = esc(user.id);
const safeUser = esc(user.username);
const safePass = esc(password);
const safeDomain = esc(domainV3);

// copy
const copyUser = `\`${safeUser}\``;
const copyPass = `\`${safePass}\``;
    
// spoiler
const spoilerDomain = `||${safeDomain}||`;

bot.sendPhoto(u, panel, {
  caption: `🔐 *Sukses Created Panel V3\\!*
▸ Name: ${safeName}
▸ Email: ${safeEmail}
▸ ID: ${safeId}
▸ RAM: Unlimited

🌐 *Akun Panel V3*
▸ Username: ${copyUser}
▸ Password: ${copyPass}
▸ Login: ${spoilerDomain}

⚠️ *Rules Panel*
▸ Sensor domain
▸ Simpan data akun
▸ Garansi 15 hari`,
  parse_mode: "MarkdownV2",
  reply_markup: {
    inline_keyboard: [
      [
        { text: "🌐 Domain", url: domainV3 },
        { text: "🔑 Salin Password", switch_inline_query_current_chat: password }
      ],
    ],
  },
});

    bot.sendMessage(
      chatId,
      `✅ Berhasil kirim panel V3 ke @${msg.from.username}\n(ID: ${u})`
    );
  } else {
    bot.sendMessage(chatId, `❌ Akun panel tidak ada! Laporkan ke @${dev}.`);
  }
});
   
  // unli v4
command(/\/unliv4(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
    
  if (msg.chat.type !== "group" && msg.chat.type !== "supergroup") {
  bot.sendMessage(msg.chat.id, "❌ ᴋʜᴜꜱᴜꜱ ɢʀᴜᴘ!");
  return;
  }

  const waktu = checkCooldown(msg.from.id);
    if (waktu > 0) return bot.sendMessage(chatId, `⏳ Tunggu ${waktu} detik sebelum bisa pakai command /unliv4 lagi!`, { reply_to_message_id: msg.message_id });
    
  const ressV4Users = JSON.parse(fs.readFileSync(RESSV4_FILE));
  const isResellerV4 = ressV4Users.includes(String(msg.from.id));   
      if (!isResellerV4) {
    bot.sendMessage(chatId, "❌ ᴋʜᴜꜱᴜꜱ ʀᴇꜱᴇʟʟᴇʀ ᴠ4!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }

  const t = text.split(",");
  if (t.length < 2) {
    bot.sendMessage(chatId, "⚠️ Format: /unliv4 namapanel,idtele");
    return;
  }

  const username = t[0].trim();
  const u = parseInt(t[1].trim());
  const name = username + "unli";
  const egg = eggs;
  const loc = settings.loc;
  const memo = "0";
  const cpu = "0";
  const disk = "0";
  const email = `${username}@unli.nael`;
  const spc =
    'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const password = username + Math.random().toString(36).slice(2, 5);
    
  let user;
  let server;

  try {
    // CREATE USER
    const response = await fetch(`${domainV4}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV4}`,
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: "en",
        password: password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      if (
        data.errors[0].meta.rule === "unique" &&
        data.errors[0].meta.source_field === "email"
      ) {
        bot.sendMessage(chatId, "⚠️ Email & Username sudah ada di panel! Coba lagi.");
      } else {
        bot.sendMessage(chatId, `❌ Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;

    // CREATE SERVER
    const response2 = await fetch(`${domainV4}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV4}`,
      },
      body: JSON.stringify({
        name: name,
        description: "",
        user: user.id,
        egg: parseInt(egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: spc,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu,
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1,
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      bot.sendMessage(chatId, `❌ Error saat buat server: ${JSON.stringify(data2.errors[0], null, 2)}`);
      return;
    }
    server = data2.attributes;

  } catch (error) {
    bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    return;
  }

  if (user && server) {
    bot.sendMessage(
      chatId,
      `Type: Panel Unli V4
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB
`
    );

function esc(text) {
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

const safeName = esc(username);
const safeEmail = esc(email);
const safeId = esc(user.id);
const safeUser = esc(user.username);
const safePass = esc(password);
const safeDomain = esc(domainV4);

// copy
const copyUser = `\`${safeUser}\``;
const copyPass = `\`${safePass}\``;
    
// spoiler
const spoilerDomain = `||${safeDomain}||`;

bot.sendPhoto(u, panel, {
  caption: `🔐 *Sukses Created Panel V4\\!*
▸ Name: ${safeName}
▸ Email: ${safeEmail}
▸ ID: ${safeId}
▸ RAM: Unlimited

🌐 *Akun Panel V4*
▸ Username: ${copyUser}
▸ Password: ${copyPass}
▸ Login: ${spoilerDomain}

⚠️ *Rules Panel*
▸ Sensor domain
▸ Simpan data akun
▸ Garansi 15 hari`,
  parse_mode: "MarkdownV2",
  reply_markup: {
    inline_keyboard: [
      [
        { text: "🌐 Domain", url: domainV4 },
        { text: "🔑 Salin Password", switch_inline_query_current_chat: password }
      ],
    ],
  },
});

    bot.sendMessage(
      chatId,
      `✅ Berhasil kirim panel V4 ke @${msg.from.username}\n(ID: ${u})`
    );
  } else {
    bot.sendMessage(chatId, `❌ Akun panel tidak ada! Laporkan ke @${dev}.`);
  }
});
    
  // unli v5
command(/\/unliv5(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
    
  if (msg.chat.type !== "group" && msg.chat.type !== "supergroup") {
  bot.sendMessage(msg.chat.id, "❌ ᴋʜᴜꜱᴜꜱ ɢʀᴜᴘ!");
  return;
  }

  const waktu = checkCooldown(msg.from.id);
    if (waktu > 0) return bot.sendMessage(chatId, `⏳ Tunggu ${waktu} detik sebelum bisa pakai command /unliv5 lagi!`, { reply_to_message_id: msg.message_id });
    
  const ressV5Users = JSON.parse(fs.readFileSync(RESSV5_FILE));
  const isResellerV5 = ressV5Users.includes(String(msg.from.id));   
      if (!isResellerV5) {
    bot.sendMessage(chatId, "❌ ᴋʜᴜꜱᴜꜱ ʀᴇꜱᴇʟʟᴇʀ ᴠ5!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }

  const t = text.split(",");
  if (t.length < 2) {
    bot.sendMessage(chatId, "⚠️ Format: /unliv5 namapanel,idtele");
    return;
  }

  const username = t[0].trim();
  const u = parseInt(t[1].trim());
  const name = username + "unli";
  const egg = eggs;
  const loc = settings.loc;
  const memo = "0";
  const cpu = "0";
  const disk = "0";
  const email = `${username}@unli.nael`;
  const spc =
    'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const password = username + Math.random().toString(36).slice(2, 5);
    
  let user;
  let server;

  try {
    // CREATE USER
    const response = await fetch(`${domainV5}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV5}`,
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: "en",
        password: password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      if (
        data.errors[0].meta.rule === "unique" &&
        data.errors[0].meta.source_field === "email"
      ) {
        bot.sendMessage(chatId, "⚠️ Email & Username sudah ada di panel! Coba lagi.");
      } else {
        bot.sendMessage(chatId, `❌ Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;

    // CREATE SERVER
    const response2 = await fetch(`${domainV5}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV5}`,
      },
      body: JSON.stringify({
        name: name,
        description: "",
        user: user.id,
        egg: parseInt(egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: spc,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu,
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1,
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      bot.sendMessage(chatId, `❌ Error saat buat server: ${JSON.stringify(data2.errors[0], null, 2)}`);
      return;
    }
    server = data2.attributes;

  } catch (error) {
    bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    return;
  }

  if (user && server) {
    bot.sendMessage(
      chatId,
      `Type: Panel Unli V5
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB
`
    );

function esc(text) {
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

const safeName = esc(username);
const safeEmail = esc(email);
const safeId = esc(user.id);
const safeUser = esc(user.username);
const safePass = esc(password);
const safeDomain = esc(domainV5);

// copy
const copyUser = `\`${safeUser}\``;
const copyPass = `\`${safePass}\``;
    
// spoiler
const spoilerDomain = `||${safeDomain}||`;

bot.sendPhoto(u, panel, {
  caption: `🔐 *Sukses Created Panel V5\\!*
▸ Name: ${safeName}
▸ Email: ${safeEmail}
▸ ID: ${safeId}
▸ RAM: Unlimited

🌐 *Akun Panel V5*
▸ Username: ${copyUser}
▸ Password: ${copyPass}
▸ Login: ${spoilerDomain}

⚠️ *Rules Panel*
▸ Sensor domain
▸ Simpan data akun
▸ Garansi 15 hari`,
  parse_mode: "MarkdownV2",
  reply_markup: {
    inline_keyboard: [
      [
        { text: "🌐 Domain", url: domainV5 },
        { text: "🔑 Salin Password", switch_inline_query_current_chat: password }
      ],
    ],
  },
});

    bot.sendMessage(
      chatId,
      `✅ Berhasil kirim panel V5 ke @${msg.from.username}\n(ID: ${u})`
    );
  } else {
    bot.sendMessage(chatId, `❌ Akun panel tidak ada! Laporkan ke @${dev}.`);
  }
});
    
    // specs ram
const specs = {
  "1gbv2": { memo: 1024,  cpu: 30,  disk: 1024 },
  "2gbv2": { memo: 2048,  cpu: 60,  disk: 2048 },
  "3gbv2": { memo: 3072,  cpu: 90,  disk: 3072 },
  "4gbv2": { memo: 4096,  cpu: 120, disk: 4096 },
  "5gbv2": { memo: 5120,  cpu: 150, disk: 5120 },
  "6gbv2": { memo: 6144,  cpu: 180, disk: 6144 },
  "7gbv2": { memo: 7168,  cpu: 210, disk: 7168 },
  "8gbv2": { memo: 8192,  cpu: 240, disk: 8192 },
  "9gbv2": { memo: 9216,  cpu: 270, disk: 9216 },
  "10gbv2":{ memo: 10240, cpu: 300, disk: 10240 },

  "1gbv3": { memo: 1024,  cpu: 30,  disk: 1024 },
  "2gbv3": { memo: 2048,  cpu: 60,  disk: 2048 },
  "3gbv3": { memo: 3072,  cpu: 90,  disk: 3072 },
  "4gbv3": { memo: 4096,  cpu: 120, disk: 4096 },
  "5gbv3": { memo: 5120,  cpu: 150, disk: 5120 },
  "6gbv3": { memo: 6144,  cpu: 180, disk: 6144 },
  "7gbv3": { memo: 7168,  cpu: 210, disk: 7168 },
  "8gbv3": { memo: 8192,  cpu: 240, disk: 8192 },
  "9gbv3": { memo: 9216,  cpu: 270, disk: 9216 },
  "10gbv3":{ memo: 10240, cpu: 300, disk: 10240 },

  "1gbv4": { memo: 1024,  cpu: 30,  disk: 1024 },
  "2gbv4": { memo: 2048,  cpu: 60,  disk: 2048 },
  "3gbv4": { memo: 3072,  cpu: 90,  disk: 3072 },
  "4gbv4": { memo: 4096,  cpu: 120, disk: 4096 },
  "5gbv4": { memo: 5120,  cpu: 150, disk: 5120 },
  "6gbv4": { memo: 6144,  cpu: 180, disk: 6144 },
  "7gbv4": { memo: 7168,  cpu: 210, disk: 7168 },
  "8gbv4": { memo: 8192,  cpu: 240, disk: 8192 },
  "9gbv4": { memo: 9216,  cpu: 270, disk: 9216 },
  "10gbv4":{ memo: 10240, cpu: 300, disk: 10240 },

  "1gbv5": { memo: 1024,  cpu: 30,  disk: 1024 },
  "2gbv5": { memo: 2048,  cpu: 60,  disk: 2048 },
  "3gbv5": { memo: 3072,  cpu: 90,  disk: 3072 },
  "4gbv5": { memo: 4096,  cpu: 120, disk: 4096 },
  "5gbv5": { memo: 5120,  cpu: 150, disk: 5120 },
  "6gbv5": { memo: 6144,  cpu: 180, disk: 6144 },
  "7gbv5": { memo: 7168,  cpu: 210, disk: 7168 },
  "8gbv5": { memo: 8192,  cpu: 240, disk: 8192 },
  "9gbv5": { memo: 9216,  cpu: 270, disk: 9216 },
  "10gbv5":{ memo: 10240, cpu: 300, disk: 10240 }
};

    // 1gb-10gb
command(/^\/(1gb|2gb|3gb|4gb|5gb|6gb|7gb|8gb|9gb|10gb)(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const plan = match[1];
  const text = match[2];
  
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILES));
  const isOwner = ownerUsers.includes(String(msg.from.id));

  const panelState = getPanelState();

  // jika panel ditutup dan bukan owner
  if (!panelState.panel && !isOwner) {
  return bot.sendMessage(chatId,
  `🔐 PANEL CLOSE 🔐\n\nADMIN SEDANG MENUTUP PANEL KARENA TIDAK MEMPUNYAI ADMIN PANEL ATAU LAINNYA KETIK /cekserver`);
}

  if (chatId.toString() !== settings.exGroupId) {
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));

  if (!isOwner) {
    return bot.sendMessage(chatId, "ᴋʜᴜꜱᴜꜱ ᴅɪ ᴘᴀɴᴇʟ ᴘᴜʙʟɪᴄ", {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: "ʙᴜʏ ᴘᴜʙʟɪᴄ", url: `https://t.me/${dev}` }]],
      },
    });
  }
}

  const ressUsers = JSON.parse(fs.readFileSync(RESS_FILE));
  const isReseller = ressUsers.includes(String(msg.from.id));
  if (!isReseller) {
    return bot.sendMessage(chatId, "❌ ᴋʜᴜꜱᴜꜱ ʀᴇꜱᴇʟʟᴇʀ!", {
      reply_markup: {
        inline_keyboard: [[{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }]],
      },
    });
  }

  const waktu = checkCooldown(msg.from.id);
  if (waktu > 0)
    return bot.sendMessage(
      chatId,
      `⏳ Tunggu ${waktu} detik sebelum bisa pakai command /${plan} lagi!`,
      { reply_to_message_id: msg.message_id }
    );

  if (!text) return bot.sendMessage(chatId, `Usage: /${plan} namapanel,idtele`);

  const [username, u] = text.split(",");
  if (!username || !u)
    return bot.sendMessage(chatId, `Usage: /${plan} namapanel,idtele`);

  const specs = {
    "1gb": { memo: 1024, cpu: 60, disk: 2000 },
    "2gb": { memo: 2048, cpu: 80, disk: 3000 },
    "3gb": { memo: 3072, cpu: 100, disk: 4000 },
    "4gb": { memo: 4096, cpu: 120, disk: 5000 },
    "5gb": { memo: 5120, cpu: 140, disk: 6000 },
    "6gb": { memo: 6144, cpu: 160, disk: 7000 },
    "7gb": { memo: 7168, cpu: 180, disk: 8000 },
    "8gb": { memo: 8192, cpu: 200, disk: 9000 },
    "9gb": { memo: 9216, cpu: 220, disk: 10000 },
    "10gb": { memo: 10240, cpu: 240, disk: 11000 },
  }[plan];

  const { memo, cpu, disk } = specs;
  const name = username + plan;
  const email = `${username}@buyer.haruko`;
  const password = username + Math.random().toString(36).slice(2, 5);
  const spc =
    'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';

  let user, server;
  try {
    // 🧩 Pastikan selalu akses API dengan /api/
    const res1 = await fetch(`${domain}/api/application/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
      body: JSON.stringify({
        email,
        username,
        first_name: username,
        last_name: username,
        language: "en",
        password,
      }),
    });

    // 🧠 Tambah validasi jika bukan JSON (biasanya karena HTML error page)
    const textRes1 = await res1.text();
    if (!textRes1.startsWith("{")) {
      return bot.sendMessage(
        chatId,
        `⚠️ Terjadi kesalahan:\nRespon bukan JSON dari ${domain}:\n${textRes1.slice(
          0,
          300
        )}...`
      );
    }

    const data1 = JSON.parse(textRes1);
    if (data1.errors)
      return bot.sendMessage(chatId, `Error user: ${JSON.stringify(data1.errors[0])}`);
    user = data1.attributes;

    const res2 = await fetch(`${domain}/api/application/servers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
      body: JSON.stringify({
        name,
        user: user.id,
        egg: parseInt(eggs),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
        startup: spc,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: { memory: memo, swap: 0, disk, io: 500, cpu },
        feature_limits: { databases: 5, backups: 5, allocations: 1 },
        deploy: {
          locations: [parseInt(settings.loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const textRes2 = await res2.text();
    if (!textRes2.startsWith("{")) {
      return bot.sendMessage(
        chatId,
        `⚠️ Terjadi kesalahan:\nRespon bukan JSON dari ${domain}:\n${textRes2.slice(
          0,
          300
        )}...`
      );
    }

    const data2 = JSON.parse(textRes2);
    if (data2.errors)
      return bot.sendMessage(chatId, `Error server: ${JSON.stringify(data2.errors[0])}`);
    server = data2.attributes;
  } catch (e) {
    return bot.sendMessage(chatId, `Error: ${e.message}`);
  }

  if (!user || !server)
    return bot.sendMessage(chatId, "⚠️ Gagal membuat data panel.");

  bot.sendMessage(
    chatId,
    `*- BERIKUT DATA PANEL ${plan} -*\n` +
      `NAMA: ${username}\n` +
      `EMAIL: ${email}\n` +
      `ID: ${user.id}\n` +
      `MEMORY: ${server.limits.memory} MB\n` +
      `DISK: ${server.limits.disk} MB\n` +
      `CPU: ${server.limits.cpu}%`,
    { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
  );

  bot.sendPhoto(u, panel, {
    caption:
      `*🔐 Sukses Created Panel ${plan}!*\n` +
      `▸ Name: ${username}\n` +
      `▸ Email: ${email}\n` +
      `▸ ID: ${user.id}\n` +
      `▸ RAM: ${plan}\n\n` +
      `*🌐 Akun Panel*\n` +
      `▸ Username: \`${user.username}\`\n` +
      `▸ Password: \`${password}\`\n\n` +
      `*⚠️ Rules Panel*\n` +
      `▸ Sensor domain\n` +
      `▸ Simpan data akun\n` +
      `▸ Garansi 15 hari`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🌐 Domain", url: domain },
          { text: "🔑 Salin Password", switch_inline_query_current_chat: password },
        ],
      ],
    },
  });
});
    
    // 1gb-10gb v2-v5
command(/\/(\d+gbv[2-5])(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const plan = match[1];
  const text = match[2];

  if (msg.chat.type !== "group" && msg.chat.type !== "supergroup") {
    bot.sendMessage(msg.chat.id, "❌ ᴋʜᴜꜱᴜꜱ ɢʀᴜᴘ!");
    return;
  }
    
  const waktu = checkCooldown(msg.from.id);
    if (waktu > 0) return bot.sendMessage(chatId, `⏳ Tunggu ${waktu} detik sebelum bisa pakai command /${plan} lagi!`, { reply_to_message_id: msg.message_id });

  const verMatch = plan.match(/v([2-5])$/i);
  const version = verMatch ? verMatch[1] : "2";

  const domainMap = {
    "2": domainV2,
    "3": domainV3,
    "4": domainV4,
    "5": domainV5
  };
  const pltaMap = {
    "2": pltaV2,
    "3": pltaV3,
    "4": pltaV4,
    "5": pltaV5
  };
  const specsMap = {
    "2": specs,
    "3": specs,
    "4": specs,
    "5": specs
  };
  const ressFileMap = {
    "2": RESSV2_FILE,
    "3": RESSV3_FILE,
    "4": RESSV4_FILE,
    "5": RESSV5_FILE
  };

  const domain = domainMap[version];
  const plta = pltaMap[version];
  const specsUsed = specsMap[version];
  const RESS_FILE = ressFileMap[version];

  if (!domain || !plta || !specsUsed || !RESS_FILE) {
    return bot.sendMessage(chatId, `❌ ᴀᴋᴜɴ ᴀᴅᴘ V${version} ᴍᴀꜱɪʜ ᴋᴏꜱᴏɴɢ!`);
  }

  const ressUsers = JSON.parse(fs.readFileSync(RESS_FILE));
  const isReseller = ressUsers.includes(String(msg.from.id));

  if (!isReseller) {
    bot.sendMessage(chatId, `❌ ᴋʜᴜꜱᴜꜱ ʀᴇꜱᴇʟʟᴇʀ ᴠ${version}!`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }

  const [username,u] = (text||"").split(",");
  if (!username || !u) return bot.sendMessage(chatId, `⚠️ Usage: /${plan} namapanel,idtele`);

  const { memo,cpu,disk } = specsUsed[plan] || {};
  if (typeof memo === "undefined") return bot.sendMessage(chatId, `⚠️ Spesifikasi untuk ${plan} V${version} tidak ditemukan di specs.`);

  const name = username+plan;
  const email = `${username}@buyer.nael`;
  const password = username+Math.random().toString(36).slice(2,5);
  const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';

  let user,server;
  try {
    const res1 = await fetch(`${domain}/api/application/users`, {
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${plta}` },
      body:JSON.stringify({ email, username, first_name:username, last_name:username, language:"en", password })
    });
    const data1 = await res1.json();
    if (data1.errors) return bot.sendMessage(chatId, `Error user: ${JSON.stringify(data1.errors[0])}`);
    user = data1.attributes;

    const res2 = await fetch(`${domain}/api/application/servers`, {
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${plta}` },
      body:JSON.stringify({
        name, user:user.id, egg:parseInt(eggs),
        docker_image:"ghcr.io/parkervcp/yolks:nodejs_18", startup:spc,
        environment:{ INST:"npm",USER_UPLOAD:"0",AUTO_UPDATE:"0",CMD_RUN:"npm start" },
        limits:{ memory:memo,swap:0,disk,io:500,cpu },
        feature_limits:{ databases:5,backups:5,allocations:1 },
        deploy:{ locations:[parseInt(settings.loc)],dedicated_ip:false,port_range:[] }
      })
    });
    const data2 = await res2.json();
    server = data2.attributes;
  } catch(e) {
    return bot.sendMessage(chatId, `Error: ${e.message}`);
  }

  if (!user || !server) return bot.sendMessage(chatId,"Gagal membuat data panel.");

  bot.sendMessage(chatId, `*- BERIKUT DATA PANEL ${plan} -*
NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory} MB
DISK: ${server.limits.disk} MB
CPU: ${server.limits.cpu}%`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });

  bot.sendPhoto(u, panel, {
    caption: `*🔐 Sukses Created Panel ${plan} V${version}!*
▸ Name: ${username}
▸ Email: ${email}
▸ ID: ${user.id}
▸ RAM: ${plan}

*🌐 Akun Panel V${version}*
▸ Username: \`${user.username}\`
▸ Password: \`${password}\`

*⚠️ Rules Panel*
▸ Sensor domain
▸ Simpan data akun
▸ Garansi 15 hari
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🌐 Domain", url: domain },
          { text: "🔑 Salin Password", switch_inline_query_current_chat: password }
        ],
      ],
    },
  });
});
    
// delsrv
command(/\/delsrv (.+)/, async (msg, match) => {
  notifyOwner('delsrv', msg);
  const chatId = msg.chat.id;
    
  if (chatId.toString() !== settings.exGroupId) {
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));

  if (!isOwner) {
    return bot.sendMessage(chatId, "ᴋʜᴜꜱᴜꜱ ᴅɪ ᴘᴀɴᴇʟ ᴘᴜʙʟɪᴄ", {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: "ʙᴜʏ ᴘᴜʙʟɪᴄ", url: `https://t.me/${dev}` }]],
      },
    });
  }
}
    
  const srv = match[1].trim();
    
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));
  if (!isOwner) {
    bot.sendMessage(chatId, "❌ ᴋʜᴜsᴜs ᴏᴡɴᴇʀ", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}`}],
        ],
      },
    });
    return;
  }

  if (!srv) {
    bot.sendMessage(
      chatId,
      "Masukkan ID server yang ingin dihapus, contoh: /delsrv 1234"
    );
    return;
  }

  try {
    let f = await fetch(domain + "/api/application/servers/" + srv, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
    });

    let res = f.ok ? { errors: null } : await f.json();

    if (res.errors) {
      bot.sendMessage(chatId, "❌ sᴇʀᴠᴇʀ ᴛɪᴅᴀᴋ ᴀᴅᴀ");
    } else {
      bot.sendMessage(chatId, `✅ ꜱᴜᴋꜱᴇꜱ ᴅᴇʟᴇᴛᴇ ꜱᴇʀᴠᴇʀ ${srv}`, { parse_mode: "MarkDown",
    reply_to_message_id: msg.message_id });
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "Terjadi kesalahan saat menghapus server.");
  }
});

// deladmin
command(/^\/deladmin(?:\s+(.+))?/, async (msg, match) => {
  notifyOwner('deladmin', msg);
  const chatId = msg.chat.id;
  const userId = match[1];

  if (chatId.toString() !== settings.exGroupId) {
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));

  if (!isOwner) {
    return bot.sendMessage(chatId, "ᴋʜᴜꜱᴜꜱ ᴅɪ ᴘᴀɴᴇʟ ᴘᴜʙʟɪᴄ", {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: "ʙᴜʏ ᴘᴜʙʟɪᴄ", url: `https://t.me/${dev}` }]],
      },
    });
  }
}

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));
  if (!isOwner) {
    return bot.sendMessage(chatId, "❌ ᴋʜᴜsᴜs ᴏᴡɴᴇʀ", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}`}],
        ],
      },
    });
  }

  if (!userId) {
    return bot.sendMessage(
      chatId,
      "❌ Format salah!\nContoh: /deladmin ID",
      { parse_mode: "Markdown" }
    );
  }

  try {
    let f = await fetch(domain + "/api/application/users/" + userId, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
    });

    let res = f.ok ? { errors: null } : await f.json();

    if (res.errors) {
      bot.sendMessage(chatId, "❌ ᴜsᴇʀ ᴛɪᴅᴀᴋ ᴀᴅᴀ");
    } else {
      bot.sendMessage(chatId, `✅ ꜱᴜᴋꜱᴇꜱ ᴅᴇʟᴇᴛᴇ ᴀᴅᴍɪɴ ${userId}`, {
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id,
      });
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "Terjadi kesalahan saat menghapus admin.");
  }
});

// listsrvoff
command(/\/listsrvoff/, async (msg) => {
  const chatId = msg.chat.id;
    
  if (chatId.toString() !== settings.exGroupId) {
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));

  if (!isOwner) {
    return bot.sendMessage(chatId, "ᴋʜᴜꜱᴜꜱ ᴅɪ ᴘᴀɴᴇʟ ᴘᴜʙʟɪᴄ", {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: "ʙᴜʏ ᴘᴜʙʟɪᴄ", url: `https://t.me/${dev}` }]],
      },
    });
  }
}

  try {
    const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
    const isOwner = ownerUsers.includes(String(msg.from.id));
    if (!isOwner) {
      return bot.sendMessage(chatId, "❌ ᴋʜᴜsᴜs ᴏᴡɴᴇʀ", {
        reply_markup: {
          inline_keyboard: [[{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}`}]],
        },
      });
    }

    let offlineServers = [];
    let page = 1;
    let totalPages = 1;

    // Ambil semua halaman server
    do {
      let f = await fetch(`${domain}/api/application/servers?page=${page}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${plta}`,
        },
      });

      let res = await f.json();
      let servers = res.data;
      totalPages = res.meta.pagination.total_pages;

      for (let server of servers) {
        let s = server.attributes;
        try {
          let f3 = await fetch(
            `${domain}/api/client/servers/${s.uuid.split("-")[0]}/resources`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${pltc}`,
              },
            }
          );

          let data = await f3.json();
          let status = data.attributes ? data.attributes.current_state : s.status;

          if (status === "offline") {
            offlineServers.push(
              `ID Server: ${s.id}\nNama: ${s.name}\nStatus: ${status}\n`
            );
          }
        } catch (err) {
          console.error(`Gagal ambil data server ${s.id}`, err);
        }
      }

      page++;
    } while (page <= totalPages);

    if (offlineServers.length === 0) {
      return bot.sendMessage(chatId, "✅ Semua server dalam keadaan online.");
    }

    // Gabung semua offline server ke string
    let messageText = `📋 ᴅᴀғᴛᴀʀ sᴇʀᴠᴇʀ ᴏғғʟɪɴᴇ (${offlineServers.length}):\n\n${offlineServers.join("\n")}`;

    // Handle limit karakter Telegram (4096)
    while (messageText.length > 0) {
      let chunk = messageText.slice(0, 4000); 
      messageText = messageText.slice(4000);
      await bot.sendMessage(chatId, chunk);
    }

  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat memproses /listsrvoff.");
  }
});

// delallusr offline
command(/\/delusroff(?:\s+(\d+))?/, async (msg, match) => {
  notifyOwner("delusroff", msg);
  const chatId = msg.chat.id;
  const exceptId = match[1]; // ID pengecualian

  if (chatId.toString() !== settings.exGroupId) {
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));

  if (!isOwner) {
    return bot.sendMessage(chatId, "ᴋʜᴜꜱᴜꜱ ᴅɪ ᴘᴀɴᴇʟ ᴘᴜʙʟɪᴄ", {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: "ʙᴜʏ ᴘᴜʙʟɪᴄ", url: `https://t.me/${dev}` }]],
      },
    });
  }
}

  bot.sendMessage(chatId, "⏳");

  try {
    const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
    if (!ownerUsers.includes(String(msg.from.id))) {
      return bot.sendMessage(chatId, "❌ ᴋʜᴜsᴜs ᴏᴡɴᴇʀ", {
        reply_markup: {
          inline_keyboard: [[{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }]],
        },
      });
    }

    let page = 1;
    let totalPages = 1;
    let usersToDelete = [];

    // loop sampai semua page habis
    do {
      const f = await fetch(`${domainV2}/api/application/users?page=${page}&per_page=50`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${pltaV2}`,
        },
      });

      const res = await f.json();
      if (!res.data) break;

      const users = res.data;
      totalPages = res.meta.pagination.total_pages;

      for (let u of users) {
        const user = u.attributes;

        // skip kalau pengecualian
        if (exceptId && String(user.id) === exceptId) continue;

        if (user.root_admin) {
          try {
            // cek server user
            const f2 = await fetch(`${domainV2}/api/application/users/${user.id}?include=servers`, {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${pltaV2}`,
              },
            });

            const detail = await f2.json();
            const servers = detail.attributes.relationships.servers.data;

            if (!servers || servers.length === 0) {
              usersToDelete.push({ id: user.id, username: user.username });
            }
          } catch (err) {
            console.error(`Gagal cek server user ${user.id}`, err);
          }
        }
      }

      page++;
    } while (page <= totalPages);

    if (usersToDelete.length === 0) {
      return bot.sendMessage(chatId, "✅ Tidak ada user admin tanpa server untuk dihapus.");
    }

    let success = [];
    let failed = [];

    for (let usr of usersToDelete) {
      try {
        const del = await fetch(`${domainV2}/api/application/users/${usr.id}`, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${pltaV2}`,
          },
        });

        if (del.status === 204) {
          success.push(`✅ ${usr.username} (ID: ${usr.id})`);
        } else {
          failed.push(`❌ ${usr.username} (ID: ${usr.id})`);
        }
      } catch (err) {
        console.error(`Gagal hapus user ${usr.id}`, err);
        failed.push(`❌ ${usr.username} (ID: ${usr.id})`);
      }
    }

    let report = `🗑️ Sukses menghapus User yang Offline:\n\n` +
      `ʙᴇʀʜᴀsɪʟ ᴅɪʜᴀᴘᴜs: ${success.length}\n` +
      `ɢᴀɢᴀʟ ᴅɪʜᴀᴘᴜs: ${failed.length}\n\n`;

    if (success.length) report += `✅ ʙᴇʀʜᴀsɪʟ:\n${success.join("\n")}\n\n`;
    if (failed.length) report += `❌ ɢᴀɢᴀʟ:\n${failed.join("\n")}`;

    while (report.length > 0) {
      const chunk = report.slice(0, 4000);
      report = report.slice(4000);
      await bot.sendMessage(chatId, chunk);
    }

  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat memproses /delusroff.");
  }
});

// delallsrv offline
command(/\/delsrvoff/, async (msg) => {
  notifyOwner('delsrvoff', msg);
  const chatId = msg.chat.id;

  if (chatId.toString() !== settings.exGroupId) {
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));

  if (!isOwner) {
    return bot.sendMessage(chatId, "ᴋʜᴜꜱᴜꜱ ᴅɪ ᴘᴀɴᴇʟ ᴘᴜʙʟɪᴄ", {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: "ʙᴜʏ ᴘᴜʙʟɪᴄ", url: `https://t.me/${dev}` }]],
      },
    });
  }
}
    
  bot.sendMessage(chatId, "⏳");

  try {
    const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
    const isOwner = ownerUsers.includes(String(msg.from.id));
    if (!isOwner) {
      return bot.sendMessage(chatId, "❌ ᴋʜᴜsᴜs ᴏᴡɴᴇʀ", {
        reply_markup: {
          inline_keyboard: [[{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }]],
        },
      });
    }

    let page = 1;
    let totalPages = 1;
    let offlineServers = [];

    // Ambil semua server dari semua page
    do {
      let f = await fetch(`${domain}/api/application/servers?page=${page}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${plta}`,
        },
      });

      let res = await f.json();
      let servers = res.data;
      totalPages = res.meta.pagination.total_pages;

      for (let server of servers) {
        let s = server.attributes;
        try {
          let f3 = await fetch(
            `${domain}/api/client/servers/${s.uuid.split("-")[0]}/resources`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${pltc}`,
              },
            }
          );

          let data = await f3.json();
          let status = data.attributes ? data.attributes.current_state : s.status;

          if (status === "offline") {
            offlineServers.push({ id: s.id, name: s.name });
          }
        } catch (err) {
          console.error(`Gagal ambil data server ${s.id}`, err);
        }
      }

      page++;
    } while (page <= totalPages);

    if (offlineServers.length === 0) {
      return bot.sendMessage(chatId, "✅ Tidak ada server offline untuk dihapus.");
    }

    let success = [];
    let failed = [];

    for (let srv of offlineServers) {
      try {
        let del = await fetch(`${domain}/api/application/servers/${srv.id}`, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${plta}`,
          },
        });

        if (del.status === 204) {
          success.push(`✅ ${srv.name} (ID: ${srv.id})`);
        } else {
          failed.push(`❌ ${srv.name} (ID: ${srv.id})`);
        }
      } catch (err) {
        console.error(`Gagal hapus server ${srv.id}`, err);
        failed.push(`❌ ${srv.name} (ID: ${srv.id})`);
      }
    }

    let report = `🗑️ Sukses menghapus Server yang Offline:\n\n` +
      `ʙᴇʀʜᴀsɪʟ ᴅɪʜᴀᴘᴜs: ${success.length}\n` +
      `ɢᴀɢᴀʟ ᴅɪʜᴀᴘᴜs: ${failed.length}\n\n`;

    if (success.length) {
      report += `✅ ʙᴇʀʜᴀsɪʟ:\n${success.join("\n")}\n\n`;
    }
    if (failed.length) {
      report += `❌ ɢᴀɢᴀʟ:\n${failed.join("\n")}`;
    }

    // Handle limit karakter telegram
    while (report.length > 0) {
      let chunk = report.slice(0, 4000);
      report = report.slice(4000);
      await bot.sendMessage(chatId, chunk);
    }

  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat memproses /delsrvoff.");
  }
});
    
// total server
command(/\/totalserver/, async (msg) => {
  const chatId = msg.chat.id;

  if (chatId.toString() !== settings.exGroupId) {
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));

  if (!isOwner) {
    return bot.sendMessage(chatId, "ᴋʜᴜꜱᴜꜱ ᴅɪ ᴘᴀɴᴇʟ ᴘᴜʙʟɪᴄ", {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: "ʙᴜʏ ᴘᴜʙʟɪᴄ", url: `https://t.me/${dev}` }]],
      },
    });
  }
}

  try {

    let page = 1;
    let totalPages = 1;
    let totalServers = 0;

    // Loop semua halaman server
    do {
      let f = await fetch(`${domain}/api/application/servers?page=${page}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${plta}`,
        },
      });

      let res = await f.json();
      totalPages = res.meta.pagination.total_pages;

      if (res.data && res.data.length > 0) {
        totalServers += res.data.length;
      }

      page++;
    } while (page <= totalPages);

    return bot.sendMessage(
      chatId,
      `📊 Total server: *${totalServers}*`,
      { parse_mode: "Markdown",
    reply_to_message_id: msg.message_id }
    );

  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat memproses /totalserver.");
  }
});

// listadmin
const adminPages = new Map();

command(/\/listadmin/, async (msg) => {
  const chatId = msg.chat.id;

  if (chatId.toString() !== settings.exGroupId) {
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));

  if (!isOwner) {
    return bot.sendMessage(chatId, "ᴋʜᴜꜱᴜꜱ ᴅɪ ᴘᴀɴᴇʟ ᴘᴜʙʟɪᴄ", {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: "ʙᴜʏ ᴘᴜʙʟɪᴄ", url: `https://t.me/${dev}` }]],
      },
    });
  }
}

  const wait = await bot.sendMessage(chatId, "⏳");

  try {
    let page = 1;
    let admins = [];
    let totalPages = 1;

    // ambil semua admin
    do {
      const res = await fetch(`${domain}/api/application/users?page=${page}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${plta}`,
        },
      });
      const json = await res.json();
      if (!json.data) break;

      totalPages = json.meta.pagination.total_pages;
      const users = json.data;
      for (let user of users) {
        const u = user.attributes;
        if (u.root_admin) {
          admins.push({
            id: u.id,
            username: u.username,
            email: u.email,
            status: u.attributes?.user?.server_limit === null ? "Inactive" : "Active",
          });
        }
      }
      page++;
    } while (page <= totalPages);

    if (admins.length === 0) {
      return bot.editMessageText("⚠️ Tidak ada admin ditemukan.", {
        chat_id: chatId,
        message_id: wait.message_id,
      });
    }

    // ambil total server (inti)
    let totalServer = 0;
    try {
      const r = await fetch(`${domain}/api/application/servers`, {
        headers: { Authorization: `Bearer ${plta}` },
      });
      const j = await r.json();
      totalServer = j.meta.pagination.total;
    } catch {
      totalServer = "Unknown";
    }

    const pageSize = 10;
    const totalPage = Math.ceil(admins.length / pageSize);
    adminPages.set(chatId, { admins, totalPage, totalServer });

    const getPageText = (p) => {
      const { admins, totalPage, totalServer } = adminPages.get(chatId);
      const start = (p - 1) * pageSize;
      const end = Math.min(start + pageSize, admins.length);
      let text = `📊 Total Admin: ${admins.length}\n🖥️ Total Server: ${totalServer}\n\n`;

      for (let i = start; i < end; i++) {
        const a = admins[i];
        text += `ID: ${a.id}\nUsername: ${a.username}\nEmail: ${a.email}\nStatus: ${a.status}\n\n`;
      }
      return text.trim();
    };

    const text = getPageText(1);
    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: wait.message_id,
      reply_markup: {
        inline_keyboard: [[
          { text: "(1/" + totalPage + ")", callback_data: "none" },
          { text: "➡️", callback_data: "adm_next_1" }
        ]],
      },
    });
  } catch (err) {
    console.error(err);
    bot.editMessageText("⚠️ Terjadi kesalahan saat memuat daftar admin.", {
      chat_id: chatId,
      message_id: wait.message_id,
    });
  }
});

bot.on("callback_query", async (q) => {
  const chatId = q.message.chat.id;
  const data = q.data;

  if (!data.startsWith("adm_")) return;

  try {
    const saved = adminPages.get(chatId);
    if (!saved) return;

    let currentPage = parseInt(data.split("_")[2]);
    let newPage = data.includes("next") ? currentPage + 1 : currentPage - 1;
    if (newPage < 1 || newPage > saved.totalPage) return;

    const getPageText = (p) => {
      const { admins, totalPage, totalServer } = saved;
      const pageSize = 10;
      const start = (p - 1) * pageSize;
      const end = Math.min(start + pageSize, admins.length);
      let text = `📊 Total Admin: ${admins.length}\n🖥️ Total Server: ${totalServer}\n\n`;

      for (let i = start; i < end; i++) {
        const a = admins[i];
        text += `ID: ${a.id}\nUsername: ${a.username}\nEmail: ${a.email}\nStatus: ${a.status}\n\n`;
      }
      return text.trim();
    };

    const newText = getPageText(newPage);
    const { totalPage } = saved;
    const pageInfo = { text: `(${newPage}/${totalPage})`, callback_data: "none" };
    const keyboard = [];

    if (newPage > 1 && newPage < totalPage) {
      keyboard.push(
        { text: "⬅️", callback_data: `adm_prev_${newPage}` },
        pageInfo,
        { text: "➡️", callback_data: `adm_next_${newPage}` }
      );
    } else if (newPage > 1) {
      keyboard.push(
        { text: "⬅️", callback_data: `adm_prev_${newPage}` },
        pageInfo
      );
    } else if (newPage < totalPage) {
      keyboard.push(
        pageInfo,
        { text: "➡️", callback_data: `adm_next_${newPage}` }
      );
    } else {
      keyboard.push(pageInfo);
    }

    await bot.editMessageText(newText, {
      chat_id: chatId,
      message_id: q.message.message_id,
      reply_markup: { inline_keyboard: [keyboard] },
    });

    await bot.answerCallbackQuery(q.id);
  } catch (err) {
    console.error("Callback error:", err.message);
  }
});
    
// listsrv
const serverPages = new Map();

command(/^\/listsrv$/, async (msg) => {
  const chatId = msg.chat.id;

  if (chatId.toString() !== settings.exGroupId) {
  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));

  if (!isOwner) {
    return bot.sendMessage(chatId, "ᴋʜᴜꜱᴜꜱ ᴅɪ ᴘᴀɴᴇʟ ᴘᴜʙʟɪᴄ", {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: "ʙᴜʏ ᴘᴜʙʟɪᴄ", url: `https://t.me/${dev}` }]],
      },
    });
  }
}

  const wait = await bot.sendMessage(chatId, "⏳");
  try {
    let page = 1;
    let servers = [];
    let totalPages = 1;

    do {
      const res = await fetch(`${domain}/api/application/servers?page=${page}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${plta}`,
        },
      });
      const json = await res.json();
      if (!json.data) break;

      servers = servers.concat(json.data);
      totalPages = json.meta.pagination.total_pages;
      page++;
    } while (page <= totalPages);

    if (servers.length === 0) {
      return bot.editMessageText("⚠️ Tidak ada server ditemukan.", {
        chat_id: chatId,
        message_id: wait.message_id,
      });
    }

    const pageSize = 10;
    const total = servers.length;
    const totalPage = Math.ceil(total / pageSize);
    serverPages.set(chatId, { servers, totalPage });

    const getPageText = async (p) => {
      let start = (p - 1) * pageSize;
      let end = Math.min(start + pageSize, total);
      let text = `📋 ᴅᴀғᴛᴀʀ sᴇʀᴠᴇʀ :\n\n`;

      for (let i = start; i < end; i++) {
        const s = servers[i].attributes;
        try {
          const r = await fetch(`${domain}/api/client/servers/${s.uuid.split("-")[0]}/resources`, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${pltc}`,
            },
          });
          const d = await r.json();
          const status = d.attributes ? d.attributes.current_state : "unknown";
          text += `ID: ${s.id}\nNama: ${s.name}\nStatus: ${status}\n\n`;
        } catch {
          text += `ID: ${s.id}\nNama: ${s.name}\nStatus: unknown\n\n`;
        }
      }

      return text.trim();
    };

    const text = await getPageText(1);
    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: wait.message_id,
      reply_markup: {
        inline_keyboard: [[
          { text: "(1/" + totalPage + ")", callback_data: "none" },
          { text: "➡️", callback_data: "srv_next_1" }
        ]],
      },
    });
  } catch (err) {
    console.error(err);
    bot.editMessageText("❌ Gagal mengambil data server.", {
      chat_id: chatId,
      message_id: wait.message_id,
    });
  }
});

bot.on("callback_query", async (q) => {
  const chatId = q.message.chat.id;
  const data = q.data;

  if (!data.startsWith("srv_")) return;

  try {
    const saved = serverPages.get(chatId);
    if (!saved) return;

    let currentPage = parseInt(data.split("_")[2]);
    let newPage = data.includes("next") ? currentPage + 1 : currentPage - 1;
    if (newPage < 1 || newPage > saved.totalPage) return;

    const getPageText = async (p) => {
      const { servers, totalPage } = saved;
      const pageSize = 10;
      let start = (p - 1) * pageSize;
      let end = Math.min(start + pageSize, servers.length);
      let text = `📋 ᴅᴀғᴛᴀʀ sᴇʀᴠᴇʀ :\n\n`;

      for (let i = start; i < end; i++) {
        const s = servers[i].attributes;
        text += `ID: ${s.id}\nNama: ${s.name}\nStatus: ${s.status || "unknown"}\n\n`;
      }

      return text.trim();
    };

    const newText = await getPageText(newPage);
    const { totalPage } = saved;
    const pageInfo = { text: `(${newPage}/${totalPage})`, callback_data: "none" };
    const keyboard = [];

    if (newPage > 1 && newPage < totalPage) {
      keyboard.push(
        { text: "⬅️", callback_data: `srv_prev_${newPage}` },
        pageInfo,
        { text: "➡️", callback_data: `srv_next_${newPage}` }
      );
    } else if (newPage > 1) {
      keyboard.push(
        { text: "⬅️", callback_data: `srv_prev_${newPage}` },
        pageInfo
      );
    } else if (newPage < totalPage) {
      keyboard.push(
        pageInfo,
        { text: "➡️", callback_data: `srv_next_${newPage}` }
      );
    } else {
      keyboard.push(pageInfo);
    }

    await bot.editMessageText(newText, {
      chat_id: chatId,
      message_id: q.message.message_id,
      reply_markup: { inline_keyboard: [keyboard] },
    });

    await bot.answerCallbackQuery(q.id);
  } catch (err) {
    console.error("Callback error:", err.message);
  }
});   
}