const fs = require("fs");
const fetch = require("node-fetch");
const os = require("os");
const { exec } = require("child_process");

const usersFile = "./db/users/users.json";
const adminfile = "./db/users/adminID.json";
const premiumUsersFile = "./db/users/premiumUsers.json";
const ressUsersFile = "./db/users/ressellerUsers.json";
const privateUsers = JSON.parse(fs.readFileSync("./db/users/private/privateID.json"));

const settings = require("./settings/config.js");
const config = require("./settings/config.js");

const developer = settings.dev;
const pp = settings.pp;
const ppVid = settings.ppVid;

let ownerUsers = [];
let premiumUsers = [];
let ressUsers = [];
    
let users = [];
let userState = {};
let userUploads = {}
let web2zipSessions = {}

if (fs.existsSync(adminfile)) {
  ownerUsers = JSON.parse(fs.readFileSync(adminfile));
}

if (fs.existsSync(premiumUsersFile)) {
  premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
}
    
if (fs.existsSync(ressUsersFile)) {
  ressUsers = JSON.parse(fs.readFileSync(ressUsersFile));
}
    
const now = new Date();
const waktu = now.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" });

module.exports = (bot) => {
/*const joined = await isMember(msg.from.id);
    
  if (!joined) {
    await sendJoinChannel(msg);
    return;
  }*/

const isMember = async (userId) => {
  try {
    const member = await bot.getChatMember(`${settings.chUsn}`, userId);
    return ['creator','administrator','member'].includes(member.status);
  } catch {
    return false;
  }
};

// kirim tombol verifikasi
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

// callback tombol verifikasi
bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const userId = callbackQuery.from.id;
  const chatId = msg.chat.id;

  if (callbackQuery.data === "verify_join_channel") {
    try {
      const joined = await isMember(userId);
      
      await bot.answerCallbackQuery(callbackQuery.id);
    } catch (err) {
      await bot.sendMessage(chatId, `❌ Gagal mengecek status join, coba lagi nanti.`);
      await bot.answerCallbackQuery(callbackQuery.id);
    }
  }
});
    
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
    
  const joined = await isMember(msg.from.id);
    
  if (!joined) {
    await sendJoinChannel(msg);
    return;
  }
    
  let targetUser = msg.from;
  const senderId = targetUser.id;
  
  // runtime vps
  const vpsUptime = os.uptime();
  const vpsUptimeStr = `${Math.floor(vpsUptime / 86400)}d ${Math.floor((vpsUptime % 86400) / 3600)}h ${Math.floor((vpsUptime % 3600) / 60)}m`;
 
  const status = ownerUsers.includes(userId)
    ? "Owner"
    : premiumUsers.includes(userId)
    ? "Premium"
    : premiumUsers.includes(userId)
    ? "Reseller"
    : "User";
  
  let userSave = JSON.parse(fs.readFileSync(usersFile));
    if (!userSave.includes(senderId)) {
      userSave.push(senderId);
      fs.writeFileSync(usersFile, JSON.stringify(userSave, null, 2));
    }
    
    if (fs.existsSync(usersFile)) {
        users = JSON.parse(fs.readFileSync(usersFile));
    }
    const total = users.length;
    
  const menuText = `<blockquote>(¬‿¬) - Hello 👋@${msg.from.username}</blockquote>
  
<b>Haruko — Bot Telegram</b>
Bikin panel jadi gampang bareng <b>HARUKO</b>.
Tinggal klik, tinggal jalan.

<blockquote><b> ⎙pengguna :</b> ${status}
<b> ⎔ total user:</b> ${total} 
<b> ⎙runtime :</b> ${waktu}</blockquote>

<blockquote>╭──✧ <b>ᴍᴇɴᴜ ᴜᴛᴀᴍᴀ</b> ✧
│ ⪼ /ping – Status bot
│ ⪼ /cekid – Cek ID User
│ ⪼ /info – Status User
│ ⪼ /cekserver - informasi status panel 
╰──────────⧽</blockquote>
<blockquote>📡 ${vpsUptimeStr}</blockquote>
`;

  const keyboard = {
    caption: menuText,
    parse_mode: "HTML",
    reply_to_message_id: msg.message_id,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ ✪", callback_data: "privmenu", style: "Primary" },
          { text: "ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ ✪", callback_data: "createpanel", style: "Primary" }
        ],
        [
          { text: "ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ ♛", callback_data: "installmenu", style: "Success" },
          { text: "ᴄʀᴇᴀᴛᴇ ᴠᴘꜱ ☃", callback_data: "cvpsmenu", style: "Success" },
          { text: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ❀", callback_data: "othermenu", style: "Success" }
        ],
        [
          { text: "ᴇɴᴄʀʏᴘᴛ ᴍᴇɴᴜ ⎘", callback_data: "obfmenu", style: "Success" },
          { text: "ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ ❖", callback_data: "protectmenu", style: "Success" }
        ],
        [
          { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ ✖", callback_data: "ownermenu", style: "Success" }
         ],
         [
           { text: "ʙᴜʏ ꜱᴄʀɪᴘᴛ", callback_data: "buyy" }
        ]
      ],
    },
  };
  
  bot.sendVideo(chatId, pp, keyboard);
  //bot.sendVideo(chatId, ppVid, keyboard);
    
  /*bot.sendAudio(chatId, "./audio.mp3", {
    title: "lagu.mp3",
    performer: "Artis"
  });*/
});

bot.onText(/^\/cek$/, async (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  let targetUser = msg.from;
  if (msg.reply_to_message) targetUser = msg.reply_to_message.from;

  const userId = targetUser.id;
  const firstName = targetUser.first_name || "User";

  try {
    await bot.sendMessage(
      userId,
      "✅ Cek dulu bang"
    );

    // simpen id ke database      
    let users = JSON.parse(fs.readFileSync(usersFile));
    if (!users.includes(userId)) {
      users.push(userId);
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    }

    // kirim ke grup
    await bot.sendMessage(
      chatId,
      `✅ [${firstName}](tg://user?id=${userId}) sudah start bot! silahkan create.`,
      { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
    );
  } catch (err) {
    await bot.sendMessage(
      chatId,
      `❌ [${firstName}](tg://user?id=${userId}) belum start bot di private chat. dilarang create!`,
      { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
    );
  }
});

bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "buyy") {
    bot.answerCallbackQuery(callbackQuery.id);
     const text = `<pre>
SCRIPT HARUKORI ASISTEN 

⇒ FITURE

⇒ ENC MENU 

⇒ CLOSE PANEL/OPEN

⇒ PANEL MENU

⇒ CVPS MENU

⇒ OWNMENU

⇒ PROTECT MENU ( work )

⇒ OTHER MENU

⇒ AUTO-SHOLAT

⇒ DLLNYA

THIS SCRIPT IS NOT FOR SALE OR GIVEN!
</pre>`;
 bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "ʙᴜʏ ꜱᴄʀɪᴘᴛ", url: "https://t.me/haruko_dev", style: "Primary" },
            { text: "<<", callback_data: "back", style: "Primary" }
        ]
      ],
      },
    });
  }
});
    
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "createpanel") {
    bot.answerCallbackQuery(callbackQuery.id);
     const text = `<blockquote>
╭──✧ <b>ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ</b> ✧
│ ⪼ Version : 1.0.0
│ ⪼ Owner : @${developer}
│ ⪼ Type : Public
╰────────────⧽

╭──✧ <b>ᴏᴡɴᴇʀ ᴍᴇɴᴜ</b> ✧
│ ⪼ /addprem /delprem 
│ ⪼ /address /delress 
╰────────────⧽

╭──✧ <b>ᴍᴇɴᴜ ᴀᴅᴍɪɴ</b> ✧
│ ⪼ /listsrv /listsrvoff
│ ⪼ /listadmin /deladm
│ ⪼ /delusroff /delsrv 
│ ⪼ /delsrvoff /totalserver
│ ⪼ /servercpu /cekserver 
╰──────────────⧽

╭──✧ <b>ʀᴇꜱᴇʟʟᴇʀ ᴍᴇɴᴜ</b> ✧
│ ⪼ /1gb-/2gb nama,id
│ ⪼ /unli nama,id 
│ ⪼ /cadp nama,id
╰────────────⧽
</blockquote>`;
 bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ ⎚", callback_data: "privmenu", style: "Primary" },
            { text: "<<", callback_data: "back", style: "Primary" },
        ],
        [
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ ♰", callback_data: "ownermenu", style: "Primary" }
        ],
        [
          { text: "ꜱᴇʀᴠᴇʀ 2 ✖", callback_data: "serverdua", style: "danger" },
          { text: "ꜱᴇʀᴠᴇʀ 3 ✖", callback_data: "servertiga", style: "danger" },
          { text: "ꜱᴇʀᴠᴇʀ 4 ✖", callback_data: "serverempat", style: "danger" }
        ],
        [
          { text: "ꜱᴇʀᴠᴇʀ 5 ✖", callback_data: "serverlima", style: "danger" }
        ]
      ],
      },
    });
  }
});
    
bot.on("callback_query", (callbackQuery) => {
    if (callbackQuery.data === "privmenu") {
    bot.answerCallbackQuery(callbackQuery.id);

    const userId = callbackQuery.from.id.toString();

    if (!privateUsers.includes(userId)) {  bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Akses ditolak! Menu ini hanya untuk User Private",
        show_alert: true
      });
      return;
    }

    const text = `\`\`\`
╭──✧ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ ✧
│ ⪼ Version : 1.0.0
│ ⪼ Owner : @${developer}
│ ⪼ Type : Private
╰────────────⧽

╭──✧ ᴏᴡɴᴇʀ ᴘʀɪᴠᴀᴛᴇ ✧
│ ⪼ /pinfo /addpremp 
│ ⪼ /addressp <id>
╰────────────⧽

╭──✧ ᴘʀᴇᴍɪᴜᴍ ᴘʀɪᴠᴀᴛᴇ ✧
│ ⪼ /srvlist /srvofflist
│ ⪼ /admlist /srvdel 
│ ⪼ /srvoffdel /totalsrv
│ ⪼ /srvcpu /cadmin nama,id
╰────────────⧽

╭──✧ ʀᴇꜱᴇʟʟᴇʀ ᴘʀɪᴠᴀᴛᴇ ✧
│ ⪼ /1gbp-/10gbp nama,id
│ ⪼ /cunli nama,id
╰────────────⧽
\`\`\``;

    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "<<", callback_data: "back" },
            { text: "ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ ✮", callback_data: "createpanel", style: "Primary" },
          ],
          [
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ ∅", callback_data: "ownermenu", style: "Primary" }
          ]
        ],
      },
    });
  }
});

bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "serverdua") {
      
      const userId = callbackQuery.from.id.toString();
    const isResellerV2 = JSON.parse(fs.readFileSync("./db/users/version/resellerV2.json"));

    if (!isResellerV2.includes(userId)) {
      return;
    }
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<blockquote>┌─⧼ <b>ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ</b> ⧽
├ ⬡ Version : 2.0.0
├ ⬡ Owner : @${developer}
├ ⬡ Language : JavaScript
╰─────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴠ2</b> ⧽
├ /addowner /delowner 
├ /addpremv2  /delpremv2 
├ /addressv2 /delressv2 
├ /cadpv2 nama,id
├ /1gbv2 /10gbv2 nama,id 
├ /unliv2 nama,id
╰──────────────
</blockquote>`;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
        [
          { text: "<<", callback_data: "createpanel", style: "Primary" },
          { text: "ꜱᴇʀᴠᴇʀ 3 ✖", callback_data: "servertiga", style: "danger" },
          { text: "ꜱᴇʀᴠᴇʀ 4 ✖", callback_data: "serverempat", style: "danger" }
        ],
        [
          { text: "ꜱᴇʀᴠᴇʀ 5 ✖", callback_data: "serverlima", style: "danger" }
        ]
      ],
      },
    });
  }
});
  
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "servertiga") {
      
      const userId = callbackQuery.from.id.toString();
    const isResellerV3 = JSON.parse(fs.readFileSync("./db/users/version/resellerV3.json"));

    if (!isResellerV3.includes(userId)) {
      return;
    }
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<blockquote>┌─⧼ <b>ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ</b> ⧽
├ ⬡ Version : 3.0.0
├ ⬡ Owner : @${developer}
├ ⬡ Language : JavaScript
╰─────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴏᴡɴᴇʀ ᴠ3</b> ⧽
├ /addowner  /delowner 
├ /addpremv3 /delpremv3 
├ /addressv3  /delressv3 
├ /listsrv3 /listadmin3
├ /delsrv3 /cadpv3 nama,id
├ /1gbv3 /10gbv3 nama,id
├ /unliv3 nama,id
╰──────────────
</blockquote>
`;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
        [
          { text: "ꜱᴇʀᴠᴇʀ 2 ✖", callback_data: "serverdua", style: "danger" },
          { text: "<<", callback_data: "createpanel", style: "Success" },
          { text: "ꜱᴇʀᴠᴇʀ 4 ✖", callback_data: "serverempat", style: "danger" }
        ],
        [
          { text: "ꜱᴇʀᴠᴇʀ 5 ✖", callback_data: "serverlima", style: "danger" }
        ]
      ],
      },
    });
  }
});
    
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "serverempat") {
      
      const userId = callbackQuery.from.id.toString();
    const isResellerV4 = JSON.parse(fs.readFileSync("./db/users/version/resellerV4.json"));

    if (!isResellerV4.includes(userId)) {
      return;
    }
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<blockquote>┌─⧼ <b>ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ</b> ⧽
├ ⬡ Version : 4.0.0
├ ⬡ Owner : @${developer}
├ ⬡ Language : JavaScript
╰─────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴠ4</b> ⧽
├ /addowner — Add Owner
├ /delowner — Hapus Owner
├ /addpremv4 — Add Premium V4
├ /delpremv4 — Del Premium V4
├ /address4 — Add Reseller V4
├ /delressv4 — Del Reseller V4
├ /cadpv4 nama,id
├ /1gbv4-/10gbv4 nama,id
├ /unliv4 nama,id
╰──────────────
</blockquote>
`;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
        [
          { text: "ꜱᴇʀᴠᴇʀ 2 ✖", callback_data: "serverdua", style: "danger" },
          { text: "ꜱᴇʀᴠᴇʀ 3 ✖", callback_data: "servertiga", style: "danger" },
          { text: "<<", callback_data: "createpanel", style: "Success" }
        ],
        [
          { text: "ꜱᴇʀᴠᴇʀ 5 ✖", callback_data: "serverlima", style: "danger" }
        ]
      ],
      },
    });
  }
});
    
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "serverlima") {
      
      const userId = callbackQuery.from.id.toString();
    const isResellerV5 = JSON.parse(fs.readFileSync("./db/users/version/resellerV5.json"));

    if (!isResellerV5.includes(userId)) {
      return;
    }
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<blockquote>┌─⧼ <b>ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ</b> ⧽
├ ⬡ Version : 5.0.0
├ ⬡ Owner : @${developer}
├ ⬡ Language : JavaScript
╰─────────────

┌─⧼ <b>ᴍᴇɴᴜ ᴠ5</b> ⧽
├ /addowner — Add Owner
├ /delowner — Hapus Owner
├ /addpremv5 — Add Premium V5
├ /delpremv5 — Del Premium V5
├ /address5 — Add Reseller V5
├ /delressv5 — Del Reseller V5
├ /cadpv5 nama,id
├ /1gbv5-/10gbv5 nama,id
├ /unliv5 nama,id
╰──────────────
</blockquote>
`;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
        [
          { text: "ꜱᴇʀᴠᴇʀ 2 ✖", callback_data: "serverdua", style: "danger" },
          { text: "ꜱᴇʀᴠᴇʀ 3 ✖", callback_data: "servertiga", style: "danger" },
          { text: "ꜱᴇʀᴠᴇʀ 4 ✖", callback_data: "serverempat", style: "danger" }
        ],
        [
          { text: "<<", callback_data: "createpanel", style: "Primary" }
        ]
      ],
      },
    });
  }
});
 
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "ownermenu") {
    bot.answerCallbackQuery(callbackQuery.id);

    const text = `<blockquote>
╭──✧ <b>ᴏᴡɴᴇʀ ʙᴏᴛ</b> ✧
│ ⪼ /addtk /addpt
│ ⪼ /addown /addpr
╰────────────⧽

╭──✧ <b>ᴋʜᴜꜱᴜꜱ ᴅᴇᴠ</b> ✧
│ ⪼ /broadcast /setcd 
│ ⪼ /setting /reqpair 
│ ⪼ /backup
╰────────────⧽

╭──✧ <b>fitur baru</b>✧
│ ⪼ /open /close
│ ⪼ /closeadp /openadp
│ ⪼ /carisrv /antiddos
│ ⪼ /top /resetadm1
│ ⪼ /listsrvon
╰────────────⧽

╭──✧ <b>ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ</b> ✧
│ ⪼ /address /delress
│ ⪼ /addprem /delprem 
│ ⪼ /addpublic /addprivate
│ ⪼ /add – All Type
╰────────────⧽
</blockquote>
`;

    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ ♰", callback_data: "privmenu", style: "Primary" },
            { text: "ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ ♰", callback_data: "createpanel", style: "Primary" }
          ],
          [
            { text: "ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ ⎚", callback_data: "installmenu", style: "Primary" },
            { text: "<<", callback_data: "back", style: "danger" },
            { text: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ", callback_data: "othermenu", style: "Primary" }
          ],
          [
            { text: "ᴇɴᴄʀʏᴘᴛ ᴍᴇɴᴜ ♰", callback_data: "obfmenu", style: "Primary" },
            { text: "ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ ♰", callback_data: "protectmenu", style: "Primary" }
          ]
        ]
      }
    });
  }
});

bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "obfmenu") {
    bot.answerCallbackQuery(callbackQuery.id);

    const text = `<blockquote>
╭──✧ ᴅᴇᴏʙꜰᴜꜱᴄᴀᴛᴇ ᴍᴇɴᴜ ✧
│ ⪼ /deobfuscate /dec
╰────────────⧽

╭──✧ ᴇɴᴄʀʏᴘᴛᴇᴅ ʙᴀꜱɪᴄ ✧
│ ⪼ /enc &lt;low/medium/high&gt;
│ ⪼ /enceval &lt;low/medium/high&gt;
│ ⪼ /enclocked &lt;1-365&gt;
│ ⪼ /encx /encstrong /encbig
╰────────────⧽

╭──✧ ᴇɴᴄʀʏᴘᴛᴇᴅ ᴘʀᴇᴍɪᴜᴍ ✧
│ ⪼ /encultra /encmax
│ ⪼ /encquantum /encnova
│ ⪼ /encnebula /encsiu
│ ⪼ /encchina /encarab
│ ⪼ /encjapan /encjapxab
│ ⪼ /encnew /encinvis
│ ⪼ /invishard /encstealth 
│ ⪼ /customenc
╰────────────⧽
</blockquote>
`;

    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ ✍", callback_data: "privmenu", style: "Success" },
            { text: "ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ ♬", callback_data: "createpanel", style: "Success" },
          ],
          [
            { text: "ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ ♚", callback_data: "installmenu", style: "Success" },
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu", style: "Success" },
            { text: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ", callback_data: "othermenu", style: "Success" }
          ],
          [
            { text: "<<", callback_data: "back", style: "Primary" },
            { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "protectmenu", style: "Success" }
          ],
        ],
      },
    });
  }
});
    
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "protectmenu") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<pre>
╭─❏ 🔐 ꜱᴇᴄᴜʀɪᴛʏ ᴍᴇɴᴜ
│
│ ◦ /installprotectall
│ ◦ /uninstallprotectall
│
╰───────────────❏
</pre>`;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ ✆", callback_data: "privmenu", style: "Success" },
            { text: "ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ ✆", callback_data: "createpanel", style: "Success" },
          ],
          [
            { text: "ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ ✮", callback_data: "installmenu", style: "Success" },
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ ✮", callback_data: "ownermenu", style: "Success" },
            { text: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ ✮", callback_data: "othermenu" }
          ],
          [
            { text: "ᴇɴᴄʀʏᴘᴛ ᴍᴇɴᴜ ✰", callback_data: "obfmenu", style: "danger" },
            { text: "<<", callback_data: "back", style: "Success" }
          ],
        ],
      },
    });
 }
});
    
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "othermenu") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `\`\`\`
╭──✧ ᴄᴏɴᴠᴇʀᴛ ᴍᴇɴᴜ ✧
│ ⪼ /tourl <reply> 
│ ⪼ /shortlink <link> 
│ ⪼ /ytmp3 <link>
╰────────────⧽

╭──✧ ꜱᴛᴀʟᴋ ᴍᴇɴᴜ ✧
│ ⪼ /stalkgithub <user>
│ ⪼ /stalkyt <username>
│ ⪼ /stalkig <username>
│ ⪼ /stalktiktok <user>
╰────────────⧽

╭──✧ ᴍᴇᴅɪᴀ ᴍᴇɴᴜ ✧
│ ⪼ /pin <teks> /spotify <judul>
│ ⪼ /xnxx <teks|catbox> /brat <teks>
│ ⪼ /qc <teks> /iqc <ss iphone>
╰────────────⧽

╭──✧ ᴘʀɪᴍʙᴏɴ ᴍᴇɴᴜ ✧
│ ⪼ /artinama <nama> 
│ ⪼ /jodoh <nama|nama>
│ ⪼ /lacakip <ip>
╰────────────⧽
\`\`\`
`;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ ⎙", callback_data: "privmenu" },
            { text: "ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ ⎙", callback_data: "createpanel" },
          ],
          [
            { text: "ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ ⏚", callback_data: "installmenu" },
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ ⎙", callback_data: "ownermenu" },
            { text: "<<", callback_data: "back", style: "Primary" }
          ],
          [
            { text: "ᴇɴᴄʀʏᴘᴛ ᴍᴇɴᴜ ∞", callback_data: "obfmenu" },
            { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ ∞", callback_data: "protectmenu" }
          ],
        ],
      },
    });
 }
});
    
bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "installmenu") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `\`\`\`
╭──✧ ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ ✧
│ ⪼ /install <option>
╰────────────⧽

╭──✧ ᴜɴɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ ✧
│ ⪼ /uninstallpanel <option>
│ ⪼ /uninstallwings <option>
│ ⪼ /uninstalltema <ipvps,pwvps>
│ ⪼ /uninstalltemabg <ipvps,pwvps>
╰────────────⧽

╭──✧ ᴄʀᴇᴀᴛᴇ ɴᴏᴅᴇ ✧
│ ⪼ /createnode <ipvps,pwvps>
│ ⪼ /swings <ipvps,pwvps,token>
│ ⪼ /cwings <ipvps,pwvps>
╰────────────⧽

╭──✧ ʜᴀᴄᴋʙᴀᴄᴋ ᴘᴀɴᴇʟ ✧
│ ⪼ /usrpanel <ipvps,pwvps>
│ ⪼ /usrpasswd <ipvps,pwvps>
│ ⪼ /hbpanel <ipvps,pwvps>
│ ⪼ /clearall <ipvps,pwvps>
│ ⪼ /clearstorage <ipvps,pwvps>
╰────────────⧽

╭──✧ ʀᴜɴᴛɪᴍᴇ ᴠᴘꜱ ✧
│ ⪼ /spekvps <ipvps,pwvps>
│ ⪼ /cpuvps <ipvps,pwvps>
│ ⪼ /runtimevps <ipvps,pwvps>
│ ⪼ /refreshvps <ipvps,pwvps>
│ ⪼ /setpwvps <ipvps,pwlama,pwbaru>
╰────────────⧽

╭──✧ ꜱᴜʙᴅᴏᴍᴀɪɴ ✧
│ ⪼ /listsubdo
│ ⪼ /subdo <name,ipvps>
│ ⪼ /cleardns
╰────────────⧽

╭──✧ ɪɴꜱᴛᴀʟʟ ᴛᴇᴍᴀ ✧
│ ⪼ /installdepend (wajib)
│ ⪼ /installtemanebula <ipvps,pwvps>
│ ⪼ /installtemabg <ipvps,pwvps>
│ ⪼ /uninstalltema <ipvps,pwvps>
╰────────────⧽
\`\`\`
`;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ ∞", callback_data: "privmenu", style: "Primary" },
            { text: "ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ ∞", callback_data: "createpanel", style: "Primary" },
          ],
          [
            { text: "<<", callback_data: "back", style: "Primary" },
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ ⏚", callback_data: "ownermenu", style: "Primary" },
            { text: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ ⏚", callback_data: "othermenu", style: "Primary" }
          ],
          [
            { text: "ᴇɴᴄʀʏᴘᴛ ᴍᴇɴᴜ ∞", callback_data: "obfmenu", style: "Primary" },
            { text: "ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ ⏚", callback_data: "protectmenu", style: "Primary" }
          ],
          [
            { text: "ᴄʀᴇᴀᴛᴇ ᴠᴘꜱ ⎙", callback_data: "cvpsmenu", style: "Primary" }
          ]
        ],
      },
    });
 }
});

bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "cvpsmenu") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `\`\`\`
╭──✧ ɪɴꜱᴛᴀʟʟ ᴠᴘꜱ ✧
│ ⪼ /createvps <option>
│ ⪼ /statusdo <option>
╰────────────⧽

╭──✧ ꜱᴛᴀᴛᴜꜱ ᴠᴘꜱ ✧
│ ⪼ /cekdata <dropletId>
│ ⪼ /listvps <option>
│ ⪼ /delvps <dropletId>
╰────────────⧽
\`\`\`
`;
    bot.editMessageCaption(text, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
        [
            { text: "ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ ☑", callback_data: "privmenu", style: "Primary" },
            { text: "ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ ⎔", callback_data: "createpanel", style: "Primary" },
          ],
          [
            { text: "ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ ⎙", callback_data: "installmenu", style: "Primary" },
            { text: "⿻ ᴏᴡɴᴇʀ ᴍᴇɴᴜ ⎙", callback_data: "ownermenu", style: "Primary" },
            { text: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ ⎙", callback_data: "othermenu", style: "Primary" }
          ],
          [
            { text: "ᴇɴᴄʀʏᴘᴛ ᴍᴇɴᴜ ⎔", callback_data: "obfmenu", style: "Primary" },
            { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ ⎔", callback_data: "protectmenu", style: "Primary" }
          ],
          [
            { text: "<<", callback_data: "back", style: "Success" }
          ]
        ],
      },
    });
 }
});

bot.on("callback_query", (callbackQuery) => {
  if (callbackQuery.data === "back") {
  bot.answerCallbackQuery(callbackQuery.id);
      
   const userId = callbackQuery.from.id.toString();

  // runtime vps
  const vpsUptime = os.uptime();
  const vpsUptimeStr = `${Math.floor(vpsUptime / 86400)}d ${Math.floor((vpsUptime % 86400) / 3600)}h ${Math.floor((vpsUptime % 3600) / 60)}m`;
      
  const status = ownerUsers.includes(userId)
    ? "Owner"
    : premiumUsers.includes(userId)
    ? "Premium"
    : premiumUsers.includes(userId)
    ? "Reseller"
    : "User";
      
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile));
  }
  const total = users.length;
    
  const menuText = `<blockquote>(¬‿¬) - Hello 👋@${callbackQuery.from.username}</blockquote>
  
<b>Haruko — Bot Telegram</b>
Bikin panel jadi gampang bareng <b>HARUKO</b>.
Tinggal klik, tinggal jalan.

<blockquote><b> ⎙pengguna :</b> ${status}
<b> ⎔ total user:</b> ${total} 
<b> ⎙runtime :</b> ${waktu}</blockquote>

<blockquote>╭──✧ <b>ᴍᴇɴᴜ ᴜᴛᴀᴍᴀ</b> ✧
│ ⪼ /ping – Status bot
│ ⪼ /cekid – Cek ID User
│ ⪼ /info – Status User
│ ⪼ /cekserver - informasi status panel 
╰──────────⧽</blockquote>
<blockquote>📡 ${vpsUptimeStr}</blockquote>`;
      
  bot.editMessageCaption(menuText, {
    chat_id: callbackQuery.message.chat.id,
    message_id: callbackQuery.message.message_id,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "ᴘʀɪᴠᴀᴛᴇ ᴍᴇɴᴜ ✪", callback_data: "privmenu", style: "Primary" },
          { text: "ᴄʀᴇᴀᴛᴇ ᴘᴀɴᴇʟ ✪", callback_data: "createpanel", style: "Primary" }
        ],
        [
          { text: "ɪɴꜱᴛᴀʟʟ ᴍᴇɴᴜ ♛", callback_data: "installmenu", style: "Success" },
          { text: "ᴄʀᴇᴀᴛᴇ ᴠᴘꜱ ☃", callback_data: "cvpsmenu", style: "Success" },
          { text: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ ❀", callback_data: "othermenu", style: "Success" }
        ],
        [
          { text: "ᴇɴᴄʀʏᴘᴛ ᴍᴇɴᴜ ⎘", callback_data: "obfmenu", style: "Success" },
          { text: "ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ ❖", callback_data: "protectmenu", style: "Success" }
         ],
         [
          { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ ✖", callback_data: "ownermenu", style: "Success" }
         ],
         [
           { text: "ʙᴜʏ ꜱᴄʀɪᴘᴛ", callback_data: "buyy" }
        ]
        ]
      }
  });
}
});
}