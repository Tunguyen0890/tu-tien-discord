const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  SlashCommandBuilder, 
  REST, 
  Routes,
  PermissionFlagsBits
} = require('discord.js');
const fs = require('fs');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const DATA_FILE = './data.json';
let db = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : {};

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// ------------------- CẤU HÌNH CẢNH GIỚI & THUỘC TÍNH -------------------
const CANH_GIOI_BASE = [
  'Luyện Khí', 'Trúc Cơ', 'Kết Đan', 'Nguyên Anh', 'Hóa Thần', 
  'Luyện Hư', 'Hợp Thể', 'Đại Thừa', 'Độ Kiếp', 'Chân Tiên', 'Kim Tiên', 'Thái Ất Ngọc Tiên', 'Đạo Tổ'
];

// Kho GIF thăng cấp phong phú đa dạng hiệu ứng
const LEVELUP_GIFS = [
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z2dG9xaXRybnhvYjM3d21ubjJsdnAzeGRqcnY5Y3ByaHRrZjFnYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L5aX0K9jJRm8w/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaG9wOXM1czd4bmhxdjI0czdydHR2czZrdWZreTF4bzZid2l1OGI5NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ul1omBLfJ330Y/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWVpZG9udXdzZnp5OG56dTBmYThxeG1yd3A3MWxjdmt1c3RzbnI0eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/G3w5bFkW3ijIs/giphy.gif',
  'https://media1.tenor.com/m/fJ6xL4HkFscAAAAC/anime-power.gif',
  'https://media1.tenor.com/m/4Y9qC5_yO58AAAAC/dragon-ball-super.gif',
  'https://media1.tenor.com/m/WqK4p_E14JMAAAAC/solo-leveling.gif',
  'https://media.tenor.com/g_m-y92xVCEAAAAC/dbz-aura.gif',
  'https://media.tenor.com/o2KxKq8C-qEAAAAC/goku-power-up.gif',
  'https://media.tenor.com/9C44H-dCg-8AAAAC/super-saiyan.gif',
  'https://media.tenor.com/uR2B5fM4-qYAAAAC/anime-aura.gif'
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function renderProgressBar(current, max, length = 8) {
  const percentage = Math.max(0, Math.min(1, current / max));
  const filled = Math.round(length * percentage);
  const empty = length - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}

// Lấy tên cảnh giới chuẩn
function getCanhGioiString(levelIndex) {
  const baseIdx = Math.floor(levelIndex / 9);
  const subIdx = levelIndex % 9;
  const baseName = CANH_GIOI_BASE[Math.min(baseIdx, CANH_GIOI_BASE.length - 1)];
  
  let stage = 'Sơ Kỳ';
  if (subIdx >= 3 && subIdx < 6) stage = 'Trung Kỳ';
  else if (subIdx >= 6) stage = 'Hậu Kỳ';

  const tangMap = ['Nhất Tầng', 'Nhị Tầng', 'Tam Tầng', 'Tứ Tầng', 'Ngũ Tầng', 'Lục Tầng', 'Thất Tầng', 'Bát Tầng', 'Cửu Tầng'];
  return `⚪ **${baseName} ${stage} -${tangMap[subIdx]}**`;
}

// Khởi tạo và đồng bộ dữ liệu người chơi
function getPlayerData(userId, username) {
  if (!db[userId]) db[userId] = {};
  
  db[userId].daoHieu = db[userId].daoHieu || username;
  db[userId].gioiTinh = db[userId].gioiTinh || 'Chưa đặt';
  db[userId].danhHieu = db[userId].danhHieu || 'Tu Tiên Giả';
  db[userId].gioiVuc = db[userId].gioiVuc || 'Nhân Giới';
  
  db[userId].canhGioiIndex = db[userId].canhGioiIndex ?? 2;
  db[userId].tuVi = db[userId].tuVi ?? 0;
  db[userId].tienLuc = db[userId].tienLuc ?? 2155;
  
  db[userId].theLuc = db[userId].theLuc ?? 300;
  db[userId].maxTheLuc = db[userId].maxTheLuc ?? 300;
  db[userId].sinhMenh = db[userId].sinhMenh ?? 575;
  db[userId].maxSinhMenh = db[userId].maxSinhMenh ?? 575;
  db[userId].linhLuc = db[userId].linhLuc ?? 25;
  db[userId].maxLinhLuc = db[userId].maxLinhLuc ?? 200;
  
  db[userId].congKich = db[userId].congKich ?? 75;
  db[userId].phongNgu = db[userId].phongNgu ?? 50;
  db[userId].tocDo = db[userId].tocDo ?? 34;
  db[userId].baoKich = db[userId].baoKich ?? 80;
  db[userId].neTranh = db[userId].neTranh ?? 100;
  
  db[userId].linhCan = db[userId].linhCan || 'Kim';
  db[userId].theChat = db[userId].theChat || 'Phàm Nhân Chi Khu';
  db[userId].tongMon = db[userId].tongMon || 'Chưa có';
  db[userId].nguyenThach = db[userId].nguyenThach ?? 1000;

  saveData();
  return db[userId];
}

function getRequiredExp(levelIndex) {
  return (levelIndex + 1) * 200;
}

// TỰ ĐỘNG ĐỘT PHÁ CẢNH GIỚI
function checkAndAutoLevelUp(player) {
  let leveledUp = false;
  let reqExp = getRequiredExp(player.canhGioiIndex);
  
  while (player.tuVi >= reqExp) {
    player.tuVi -= reqExp;
    player.canhGioiIndex += 1;
    player.congKich += 15;
    player.phongNgu += 10;
    player.maxSinhMenh += 50;
    player.sinhMenh = player.maxSinhMenh;
    player.tienLuc += 250;
    leveledUp = true;
    reqExp = getRequiredExp(player.canhGioiIndex);
  }
  
  if (leveledUp) saveData();
  return leveledUp;
}

// ------------------- GIAO DIỆN EMBED MENU -------------------
// 1. EMBED CHÍNH (Giống hình ảnh 1: Menu Tổng Quan Nút Bấm)
function createMainMenuEmbed(user, player) {
  return new EmbedBuilder()
    .setColor('#1e1f22')
    .setImage('https://i.imgur.com/3Yp7jP4.jpeg')
    .setDescription(
      `Cảnh giới: ${getCanhGioiString(player.canhGioiIndex)}\n` +
      `Giới vực: **${player.gioiVuc}**\n\n` +
      `**Đạo hiệu: ${player.daoHieu}**\n` +
      `**Thể Lực:** ${renderProgressBar(player.theLuc, player.maxTheLuc)} \`[${player.theLuc}/${player.maxTheLuc}]\``
    );
}

// 2. EMBED CHI TIẾT HỒ SƠ (Giống hình ảnh 2: Bảng Chỉ Số)
function createProfileEmbed(user, player) {
  return new EmbedBuilder()
    .setColor('#1e1f22')
    .setImage('https://i.imgur.com/3Yp7jP4.jpeg')
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setDescription(
      `**Đạo hiệu:** **${player.daoHieu}**\n` +
      `**Giới tính:** **${player.gioiTinh}**\n` +
      `**Danh hiệu:** **${player.danhHieu}**\n` +
      `**Giới vực:** **${player.gioiVuc}**\n\n` +
      `**Cảnh giới:** ${getCanhGioiString(player.canhGioiIndex)}\n` +
      `**Linh căn:** 🟡 **${player.linhCan}**\n` +
      `**Thể Chất:** **${player.theChat}**\n` +
      `**Tông môn:** *${player.tongMon}*\n` +
      `**Tiên lực:** **${player.tienLuc.toLocaleString()}**\n` +
      `───────────────────────────────\n` +
      `📜 **Thể Lực:** ${renderProgressBar(player.theLuc, player.maxTheLuc)} \`[${player.theLuc}/${player.maxTheLuc}]\`\n` +
      `❤️ **Sinh Mệnh:** **${player.sinhMenh} /${player.maxSinhMenh}**\n` +
      `🔮 **Linh Lực:** **${player.linhLuc}/${player.maxLinhLuc}**\n` +
      `🏹 **Công Kích:** **${player.congKich}**\n` +
      `🛡️ **Phòng Ngự:** **${player.phongNgu}**\n` +
      `🪽 **Tốc Độ:** **${player.tocDo}**\n` +
      `💥 **Bạo Kích:** **${player.baoKich}**\n` +
      `🏃 **Né Tránh:** **${player.neTranh}**`
    );
}

// 3. EMBED LÊN CẤP THÔNG BÁO (KÈM GIF LỚN)
function createLevelUpEmbed(user, player) {
  return new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('⚡ TỰ ĐỘNG ĐỘT PHÁ CẢNH GIỚI! ⚡')
    .setDescription(
      `Chúc mừng <@${user.id}> đột phá lên ${getCanhGioiString(player.canhGioiIndex)}!\n` +
      `⚔️ **Tiên lực hiện tại:** **${player.tienLuc.toLocaleString()} CP**`
    )
    .setImage(getRandom(LEVELUP_GIFS))
    .setFooter({ text: 'Uyên Sư Muội Tu Tiên' });
}

// ------------------- TẠO CÁC NÚT BẤM MENU GIỐNG HỆT ẢNH -------------------
function createMenuActionRows() {
  // Nhóm Thông Tin
  const rowInfo = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_hoso').setLabel('👤 Hồ Sơ').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_dongphu').setLabel('🏰 Động Phủ').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_tongmon').setLabel('🏛️ Tông Môn').setStyle(ButtonStyle.Secondary)
  );

  const rowInfo2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_huongdan').setLabel('📖 Hướng Dẫn').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_tienbang').setLabel('🏅 Tiên Bảng').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_tiencu').setLabel('✨ Tiên Cư').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_hethong').setLabel('⚙️ Hệ Thống').setStyle(ButtonStyle.Secondary)
  );

  // Nhóm Tu Luyện
  const rowTuLuyen = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_lichluyen').setLabel('🧭 Lịch Luyện').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_hoatdong').setLabel('🎯 Hoạt Động').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_bicanh').setLabel('🔮 Bí Cảnh').setStyle(ButtonStyle.Primary)
  );

  const rowTuLuyen2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_nhiemvu').setLabel('📜 Nhiệm Vụ').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_chetao').setLabel('⚒️ Chế Tạo').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_ngoaivuc').setLabel('🌌 Ngoại Vực').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_vandinh').setLabel('⚔️ Vấn Đỉnh').setStyle(ButtonStyle.Secondary)
  );

  // Nhóm Tài Sản
  const rowTaiSan = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_hanhtrang').setLabel('🎒 Hành Trang').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_vanbaolau').setLabel('🏛️ Vạn Bảo Lầu').setStyle(ButtonStyle.Secondary)
  );

  return [rowInfo, rowInfo2, rowTuLuyen, rowTuLuyen2, rowTaiSan];
}

// ------------------- SLASH COMMANDS DEFINITION -------------------
const commands = [
  new SlashCommandBuilder().setName('tutien').setDescription('Mở Bảng Tu Tiên'),
  new SlashCommandBuilder().setName('bangxephang').setDescription('Xem Bảng Xếp Hạng Tu Sĩ'),
  new SlashCommandBuilder().setName('admin_addexp').setDescription('[Admin] Cộng EXP/Tu vi cho người chơi')
    .addUserOption(o => o.setName('target').setDescription('Tu sĩ').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Số EXP').setRequired(true))
];

async function registerCommands() {
  if (!TOKEN || !CLIENT_ID) return;
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Đã đăng ký lại Slash Commands chuẩn!');
  } catch (err) {
    console.error('❌ Lỗi đăng ký Slash Commands:', err);
  }
}

// ------------------- EVENTS -------------------
client.on('ready', () => {
  console.log(`🤖 Bot Uyên Sư Muội [${client.user.tag}] đã sẵn sàng!`);
  registerCommands();
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName, user, options, member } = interaction;
      const player = getPlayerData(user.id, user.username);

      if (commandName === 'tutien') {
        const embed = createMainMenuEmbed(user, player);
        await interaction.reply({ embeds: [embed], components: createMenuActionRows() });
      }

      else if (commandName === 'bangxephang') {
        await interaction.deferReply();

        const entries = Object.entries(db);
        if (entries.length === 0) {
          return interaction.editReply({ content: '📊 Chưa có dữ liệu tu sĩ nào!' });
        }

        const sorted = entries
          .map(([id, p]) => ({ id, ...p }))
          .sort((a, b) => (b.canhGioiIndex || 0) - (a.canhGioiIndex || 0) || (b.tienLuc || 0) - (a.tienLuc || 0))
          .slice(0, 10);

        let listText = '';
        for (let i = 0; i < sorted.length; i++) {
          const p = sorted[i];
          const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `\`#${i + 1}\``;
          listText += `${rankIcon} **${p.daoHieu || 'Tu Sĩ Ẩn Danh'}** • ${getCanhGioiString(p.canhGioiIndex || 0)} (Tiên lực: **${(p.tienLuc || 0).toLocaleString()}**)\n`;
        }

        const bxhEmbed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('🏆 BẢNG XẾP HẠNG PHONG THẦN BẢNG')
          .setDescription(listText)
          .setFooter({ text: 'Uyên Sư Muội Tu Tiên' });

        await interaction.editReply({ embeds: [bxhEmbed] });
      }

      else if (commandName === 'admin_addexp') {
        const isAdmin = member && member.permissions && member.permissions.has(PermissionFlagsBits.Administrator);
        if (!isAdmin) {
          return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh tối thượng này!', ephemeral: true });
        }

        const targetUser = options.getUser('target');
        const amount = options.getInteger('amount');
        const targetPlayer = getPlayerData(targetUser.id, targetUser.username);

        targetPlayer.tuVi += amount;
        const didLevelUp = checkAndAutoLevelUp(targetPlayer);

        if (didLevelUp) {
          const levelEmbed = createLevelUpEmbed(targetUser, targetPlayer);
          await interaction.reply({ content: `✅ Đã cộng **${amount} EXP** cho **${targetPlayer.daoHieu}**!`, embeds: [levelEmbed] });
        } else {
          await interaction.reply({ content: `✅ Đã cộng **${amount} EXP** cho **${targetPlayer.daoHieu}**!` });
        }
      }
    }

    else if (interaction.isButton()) {
      const { customId, user } = interaction;
      const player = getPlayerData(user.id, user.username);

      if (customId === 'btn_hoso') {
        const embed = createProfileEmbed(user, player);
        const backRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('btn_quaylai').setLabel('🏠 Quay Lại').setStyle(ButtonStyle.Danger)
        );
        await interaction.update({ embeds: [embed], components: [backRow] });
      }

      else if (customId === 'btn_quaylai') {
        const embed = createMainMenuEmbed(user, player);
        await interaction.update({ embeds: [embed], components: createMenuActionRows() });
      }

      else if (customId === 'btn_lichluyen') {
        if (player.theLuc < 10) {
          return interaction.reply({ content: '❌ Thể lực không đủ (Cần 10 thể lực)!', ephemeral: true });
        }

        player.theLuc -= 10;
        player.tuVi += 250;

        const didLevelUp = checkAndAutoLevelUp(player);

        if (didLevelUp) {
          const levelEmbed = createLevelUpEmbed(user, player);
          await interaction.reply({ embeds: [levelEmbed] });
        } else {
          saveData();
          await interaction.reply({ content: `🧘 **${player.daoHieu}** hoàn thành lịch luyện, tốn 10 Thể Lực. Nhận **+250 EXP**!`, ephemeral: true });
        }
      }

      else {
        // Phản hồi mặc định cho tất cả các nút chưa gán sự kiện phụ
        await interaction.reply({ content: `✨ Tính năng **${customId.replace('btn_', '').toUpperCase()}** đang được Uyên Sư Muội cập nhật!`, ephemeral: true });
      }
    }
  } catch (error) {
    console.error('❌ Lỗi tương tác:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Đã xảy ra lỗi hệ thống, vui lòng thử lại!', ephemeral: true }).catch(() => {});
    }
  }
});

if (TOKEN) {
  client.login(TOKEN).catch(console.error);
}
