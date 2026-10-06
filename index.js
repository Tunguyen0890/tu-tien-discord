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

// Đọc Token và Client ID từ Variables trên Railway
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const DATA_FILE = './data.json';
let db = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : {};

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// ------------------- DỮ LIỆU CẤU HÌNH CẢNH GIỚI (3 CẤP / ĐẠI CẢNH GIỚI) -------------------
const CANH_GIOI = [
  'Luyện Khí Sơ Kỳ', 'Luyện Khí Trung Kỳ', 'Luyện Khí Hậu Kỳ',
  'Trúc Cơ Sơ Kỳ', 'Trúc Cơ Trung Kỳ', 'Trúc Cơ Hậu Kỳ',
  'Kết Đan Sơ Kỳ', 'Kết Đan Trung Kỳ', 'Kết Đan Hậu Kỳ',
  'Nguyên Anh Sơ Kỳ', 'Nguyên Anh Trung Kỳ', 'Nguyên Anh Hậu Kỳ',
  'Hóa Thần Sơ Kỳ', 'Hóa Thần Trung Kỳ', 'Hóa Thần Hậu Kỳ',
  'Luyện Hư Sơ Kỳ', 'Luyện Hư Trung Kỳ', 'Luyện Hư Hậu Kỳ',
  'Hợp Thể Sơ Kỳ', 'Hợp Thể Trung Kỳ', 'Hợp Thể Hậu Kỳ',
  'Đại Thừa Sơ Kỳ', 'Đại Thừa Trung Kỳ', 'Đại Thừa Hậu Kỳ',
  'Độ Kiếp Kỳ', 'Chân Tiên', 'Kim Tiên', 'Thái Ất Ngọc Tiên', 'Đại La Kim Tiên', 'Đạo Tổ'
];

const LEVELUP_GIFS = [
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z2dG9xaXRybnhvYjM3d21ubjJsdnAzeGRqcnY5Y3ByaHRrZjFnYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L5aX0K9jJRm8w/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaG9wOXM1czd4bmhxdjI0czdydHR2czZrdWZreTF4bzZid2l1OGI5NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ul1omBLfJ330Y/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWVpZG9udXdzZnp5OG56dTBmYThxeG1yd3A3MWxjdmt1c3RzbnI0eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/G3w5bFkW3ijIs/giphy.gif'
];

const LINH_CAN_LIST = [
  'Ngũ Hành Tạp Linh Căn', 'Tam Hợp Linh Căn', 'Song Linh Căn (Lôi - Phong)',
  'Đơn Linh Căn (Biến Dị Lôi)', 'Hỗn Độn Tiên Căn', 'Âm Dương Biến Dị Căn'
];

const THE_CHAT_LIST = [
  'Phàm Thể', 'Hoang Cổ Thánh Thể', 'Hỗn Độn Chu Hoàng Thánh Thể',
  'Tiên Phong Đạo Cốt', 'Vô Cực Ma Thể', 'Cửu Âm Tuyệt Mạch'
];

const PET_LIST = [
  { name: 'Phệ Kim Trùng', cong: 1500, price: 5000 },
  { name: 'Đề Hồn Thú', cong: 3000, price: 12000 },
  { name: 'Mặc Giao', cong: 2000, price: 8000 },
  { name: 'Cửu Vĩ Thiên Hồ', cong: 4500, price: 20000 },
  { name: 'Băng Phượng', cong: 5000, price: 25000 }
];

const TOA_KY_LIST = [
  { name: 'Thánh Mạn Ngưu', lucChien: 1000, price: 3000 },
  { name: 'Thanh Phong Độc Giác Thú', lucChien: 2500, price: 8000 },
  { name: 'Hỗn Độn Càn Khôn Đạo Thú', lucChien: 10000, price: 50000 }
];

// ------------------- HÀM BỔ TRỢ & CHUẨN HÓA DỮ LIỆU -------------------
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function renderProgressBar(current, max, length = 8) {
  const percentage = Math.max(0, Math.min(1, current / max));
  const filled = Math.round(length * percentage);
  const empty = length - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}

function getLucChien(player) {
  let base = (player.congKich * 2) + player.phongNgu + (player.maxSinhMenh / 10) + (player.baoKich * 100);
  if (player.pet) {
    const petObj = PET_LIST.find(p => p.name === player.pet);
    if (petObj) base += petObj.cong * 2;
  }
  if (player.toaKy) {
    const tkObj = TOA_KY_LIST.find(t => t.name === player.toaKy);
    if (tkObj) base += tkObj.lucChien;
  }
  return Math.floor(base);
}

function getPlayerData(userId, username) {
  if (!db[userId]) db[userId] = {};
  
  // Tự động bổ sung các trường còn thiếu nếu là dữ liệu cũ
  db[userId].daoHieu = db[userId].daoHieu || username;
  db[userId].canhGioiIndex = db[userId].canhGioiIndex ?? 0;
  db[userId].tuVi = db[userId].tuVi ?? 0;
  db[userId].theLuc = db[userId].theLuc ?? 100;
  db[userId].maxTheLuc = db[userId].maxTheLuc ?? 100;
  db[userId].sinhMenh = db[userId].sinhMenh ?? 1000;
  db[userId].maxSinhMenh = db[userId].maxSinhMenh ?? 1000;
  db[userId].linhLuc = db[userId].linhLuc ?? 200;
  db[userId].maxLinhLuc = db[userId].maxLinhLuc ?? 200;
  db[userId].congKich = db[userId].congKich ?? 150;
  db[userId].phongNgu = db[userId].phongNgu ?? 80;
  db[userId].baoKich = db[userId].baoKich ?? 5;
  db[userId].neTranh = db[userId].neTranh ?? 5;
  db[userId].nguyenThach = db[userId].nguyenThach ?? 1000;
  db[userId].linhCan = db[userId].linhCan || getRandom(LINH_CAN_LIST);
  db[userId].theChat = db[userId].theChat || getRandom(THE_CHAT_LIST);
  db[userId].gioiVuc = db[userId].gioiVuc || 'Nhân Giới';
  db[userId].tongMon = db[userId].tongMon || null;
  db[userId].daoLu = db[userId].daoLu || null;
  db[userId].pet = db[userId].pet || null;
  db[userId].toaKy = db[userId].toaKy || null;

  saveData();
  return db[userId];
}

// ------------------- GIAO DIỆN EMBED -------------------
function createProfileEmbed(user, player) {
  const lucChien = getLucChien(player);
  return new EmbedBuilder()
    .setColor('#d4af37')
    .setTitle(`🐉 Tu Tiên - Profile Đạo Hữu`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'Đạo Hiệu', value: `**${player.daoHieu}**`, inline: true },
      { name: 'Giới Vực', value: `${player.gioiVuc}`, inline: true },
      { name: 'Lực Chiến', value: `⚔️ **${lucChien.toLocaleString()}**`, inline: true },
      { name: 'Cảnh Giới', value: `☯️ **${CANH_GIOI[player.canhGioiIndex]}** (${player.tuVi.toLocaleString()} EXP)`, inline: false },
      { name: 'Linh Căn', value: `🌀 ${player.linhCan}`, inline: true },
      { name: 'Thể Chất', value: `✨ ${player.theChat}`, inline: true },
      { name: 'Đạo Lữ', value: `💞 ${player.daoLu ? player.daoLu : 'Chưa có'}`, inline: true },
      { name: 'Tông Môn', value: `🏛️ ${player.tongMon ? player.tongMon : 'Tự Do'}`, inline: true },
      { name: 'Tọa Kỵ', value: `🦄 ${player.toaKy ? player.toaKy : 'Chưa có'}`, inline: true },
      { name: 'Linh Thú (Pet)', value: `🐾 ${player.pet ? player.pet : 'Chưa có'}`, inline: true },
      { name: 'Thể Lực', value: `${renderProgressBar(player.theLuc, player.maxTheLuc)} \`[${player.theLuc}/${player.maxTheLuc}]\``, inline: false },
      { name: 'Sinh Mệnh', value: `❤️ \`${player.sinhMenh}/${player.maxSinhMenh}\``, inline: true },
      { name: 'Linh Lực', value: `🔮 \`${player.linhLuc}/${player.maxLinhLuc}\``, inline: true },
      { name: 'Nguyên Thạch', value: `💎 \`${player.nguyenThach.toLocaleString()}\``, inline: true },
      { name: 'Công / Thủ', value: `⚔️️ ${player.congKich} / 🛡️ ${player.phongNgu}`, inline: true },
      { name: 'Bạo Kích / Né', value: `💥 ${player.baoKich}% / 🎯 ${player.neTranh}%`, inline: true }
    )
    .setFooter({ text: 'Phàm Nhân Tu Tiên Bot' });
}

function createLevelUpEmbed(user, player) {
  return new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('⚡ CHÚC MỪNG ĐỘT PHÁ CẢNH GIỚI! ⚡')
    .setDescription(`🎉 Thiên Địa Biến Động! Đạo hữu **${player.daoHieu}** đã cảm ngộ thiên đạo, đột phá lên **${CANH_GIOI[player.canhGioiIndex]}**!\n\n` +
      `⚔️ Công kích: **+150**\n🛡️️ Phòng ngự: **+80**\n❤️ Sinh mệnh tối đa: **+500**`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setImage(getRandom(LEVELUP_GIFS))
    .setFooter({ text: 'Danh Chấn Thiên Hạ - Phàm Nhân Tu Tiên' });
}

function createMainMenuButtons() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_hoso').setLabel('👤 Hồ Sơ').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_tuluyen').setLabel('⚡ Tu Luyện').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('btn_cuahang').setLabel('🛒 Shop Đan Dược').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_pet_shop').setLabel('🐾 Pet & Tọa Kỵ').setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_bicanh').setLabel('🌀 Bí Cảnh Group').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('btn_boss').setLabel('👹 Boss Thế Giới').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('btn_tongmon').setLabel('🏛️ Tông Môn').setStyle(ButtonStyle.Primary)
  );

  return [row1, row2];
}

// ------------------- ĐĂNG KÝ SLASH COMMANDS CHUẨN HOÀN TOÀN -------------------
const commands = [
  new SlashCommandBuilder().setName('tutien').setDescription('Mở Bảng Tu Tiên'),
  new SlashCommandBuilder().setName('pk').setDescription('Thách đấu PK với tu sĩ khác')
    .addUserOption(opt => opt.setName('target').setDescription('Đối thủ cần PK').setRequired(true)),
  new SlashCommandBuilder().setName('ketduyen').setDescription('Cầu hôn làm Đạo Lữ với tu sĩ khác')
    .addUserOption(opt => opt.setName('target').setDescription('Người muốn kết duyên').setRequired(true)),
  new SlashCommandBuilder().setName('createtongmon').setDescription('Tạo Tông Môn (Yêu cầu Nguyên Anh, 50k Nguyên Thạch)')
    .addStringOption(opt => opt.setName('name').setDescription('Tên Tông Môn').setRequired(true)),
  new SlashCommandBuilder().setName('bangxephang').setDescription('Xem Bảng Xếp Hạng Tu Sĩ'),
  
  // Lệnh Admin
  new SlashCommandBuilder().setName('admin_tuvi').setDescription('[Admin] Ban thưởng / Giảm Tu Vi')
    .addUserOption(o => o.setName('target').setDescription('Tu sĩ').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Số tu vi (+/-)').setRequired(true)),
  new SlashCommandBuilder().setName('admin_nguyenthach').setDescription('[Admin] Ban thưởng / Giảm Nguyên Thạch')
    .addUserOption(o => o.setName('target').setDescription('Tu sĩ').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Số Nguyên thạch (+/-)').setRequired(true))
];

async function registerCommands() {
  if (!TOKEN || !CLIENT_ID) {
    console.error("❌ THIẾU DISCORD_TOKEN HOẶC DISCORD_CLIENT_ID TRONG VARIABLES!");
    return;
  }
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('🔄 Đang làm sạch và cập nhật lại danh sách lệnh Slash...');
    // Đăng ký đè toàn bộ ứng dụng Global (Xóa toàn bộ lệnh cũ không còn dùng)
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Đã cập nhật lại toàn bộ Slash Commands chuẩn!');
  } catch (err) { 
    console.error('❌ Lỗi cập nhật Slash Commands:', err); 
  }
}

// ------------------- EVENT HANDLERS -------------------
client.on('ready', () => {
  console.log(`🤖 Bot Tu Tiên [${client.user.tag}] đã hoạt động!`);
  registerCommands();
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName, user, options, member } = interaction;
      const player = getPlayerData(user.id, user.username);

      // --- KIỂM TRA QUYỀN ADMIN CHO CÁC LỆNH ADMIN ---
      if (commandName.startsWith('admin_')) {
        const isAdmin = member && member.permissions && member.permissions.has(PermissionFlagsBits.Administrator);
        if (!isAdmin) {
          return interaction.reply({ 
            content: '❌ **Cảnh báo:** Bạn không phải là Quản Trị Viên (Administrator) để dùng lệnh này!', 
            ephemeral: true 
          });
        }
      }

      if (commandName === 'tutien') {
        const embed = createProfileEmbed(user, player);
        await interaction.reply({ embeds: [embed], components: createMainMenuButtons() });
      }

      else if (commandName === 'pk') {
        const targetUser = options.getUser('target');
        if (targetUser.id === user.id) return interaction.reply({ content: 'Không thể tự PK chính mình!', ephemeral: true });

        const targetPlayer = getPlayerData(targetUser.id, targetUser.username);
        const p1Power = getLucChien(player);
        const p2Power = getLucChien(targetPlayer);

        let p1Bonus = Math.random() < (player.baoKich / 100) ? 1.25 : 1.0;
        let p2Bonus = Math.random() < (targetPlayer.baoKich / 100) ? 1.25 : 1.0;

        let p1Final = p1Power * p1Bonus;
        let p2Final = p2Power * p2Bonus;

        let winner, loser, isCrit = p1Bonus > 1 || p2Bonus > 1;
        if (p1Final >= p2Final) {
          winner = player; loser = targetPlayer;
        } else {
          winner = targetPlayer; loser = player;
        }

        const reward = 500;
        winner.nguyenThach += reward;
        loser.nguyenThach = Math.max(0, loser.nguyenThach - reward);
        saveData();

        const pkEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('⚔️ ĐẤU TRƯỜNG SINH TỬ ⚔️')
          .setDescription(`**${player.daoHieu}** (Lực chiến: ${p1Power.toLocaleString()}) **VS** **${targetPlayer.daoHieu}** (Lực chiến: ${p2Power.toLocaleString()})\n\n` +
            `${isCrit ? '💥 *Trận đấu xuất hiện cú Đột Biến Bạo Kích!*\n' : ''}` +
            `🏆 **KẾT QUẢ:** Đạo hữu **${winner.daoHieu}** đã chiến thắng và đoạt lấy **${reward} Nguyên Thạch**!`);
        
        await interaction.reply({ embeds: [pkEmbed] });
      }

      else if (commandName === 'ketduyen') {
        const targetUser = options.getUser('target');
        if (targetUser.id === user.id) return interaction.reply({ content: 'Không thể kết duyên với chính mình!', ephemeral: true });
        const targetPlayer = getPlayerData(targetUser.id, targetUser.username);

        player.daoLu = targetPlayer.daoHieu;
        targetPlayer.daoLu = player.daoHieu;
        saveData();

        await interaction.reply({ content: `🎉 Chúc mừng **${player.daoHieu}** và **${targetPlayer.daoHieu}** đã chính thức kết thành **Đạo Lữ**, cùng nhau sóng đôi trên con đường trường sinh!` });
      }

      else if (commandName === 'createtongmon') {
        const name = options.getString('name');
        if (player.canhGioiIndex < 9) { // Cần Nguyên Anh Sơ Kỳ
          return interaction.reply({ content: '❌ Bạn phải đạt cảnh giới **Nguyên Anh** trở lên mới có thể khai sơn lập môn!', ephemeral: true });
        }
        if (player.nguyenThach < 50000) {
          return interaction.reply({ content: '❌ Khai sơn cần 50,000 Nguyên Thạch!', ephemeral: true });
        }

        player.nguyenThach -= 50000;
        player.tongMon = `${name} (Tông Chủ)`;
        saveData();
        await interaction.reply({ content: `🏰 Chúc mừng Tông Chủ **${player.daoHieu}** đã khai sáng tông môn **${name}** vang danh thiên hạ!` });
      }

      else if (commandName === 'bangxephang') {
        const sorted = Object.values(db).sort((a, b) => getLucChien(b) - getLucChien(a)).slice(0, 10);
        let list = sorted.map((p, i) => `${i + 1}. **${p.daoHieu || 'Ẩn Danh'}** - ${CANH_GIOI[p.canhGioiIndex || 0]} | ⚔️ ${getLucChien(p).toLocaleString()} LC`).join('\n');

        const bxhEmbed = new EmbedBuilder()
          .setColor('#gold')
          .setTitle('🏆 BẢNG XẾP HẠNG TU SĨ THIÊN HẠ')
          .setDescription(list || 'Chưa có dữ liệu.');
        await interaction.reply({ embeds: [bxhEmbed] });
      }

      // Xử lý Lệnh Admin
      else if (commandName === 'admin_tuvi') {
        const targetUser = options.getUser('target');
        const amount = options.getInteger('amount');
        const targetPlayer = getPlayerData(targetUser.id, targetUser.username);

        targetPlayer.tuVi += amount;
        saveData();

        const actionText = amount >= 0 ? `ban thưởng **+${amount.toLocaleString()} Tu Vi**` : `tước đi **${Math.abs(amount).toLocaleString()} Tu Vi**`;
        await interaction.reply({ 
          content: `🌌 **Thiên Đạo Ban Thưởng!** Thiên đạo đã ${actionText} cho tu sĩ **${targetPlayer.daoHieu}**!` 
        });
      }
      
      else if (commandName === 'admin_nguyenthach') {
        const targetUser = options.getUser('target');
        const amount = options.getInteger('amount');
        const targetPlayer = getPlayerData(targetUser.id, targetUser.username);

        targetPlayer.nguyenThach += amount;
        saveData();

        const actionText = amount >= 0 ? `ban thưởng **+${amount.toLocaleString()} Nguyên Thạch**` : `tước đi **${Math.abs(amount).toLocaleString()} Nguyên Thạch**`;
        await interaction.reply({ 
          content: `🌌 **Thiên Đạo Ban Thưởng!** Thiên đạo đã ${actionText} cho tu sĩ **${targetPlayer.daoHieu}**!` 
        });
      }
    }

    else if (interaction.isButton()) {
      const { customId, user } = interaction;
      const player = getPlayerData(user.id, user.username);

      if (customId === 'btn_hoso') {
        const embed = createProfileEmbed(user, player);
        await interaction.update({ embeds: [embed], components: createMainMenuButtons() });
      }

      else if (customId === 'btn_tuluyen') {
        if (player.theLuc < 10) return interaction.reply({ content: '❌ Bạn đã kiệt sức (Cần 10 thể lực)!', ephemeral: true });

        player.theLuc -= 10;
        player.tuVi += 100;
        
        if (player.tuVi >= (player.canhGioiIndex + 1) * 300 && player.canhGioiIndex < CANH_GIOI.length - 1) {
          player.canhGioiIndex += 1;
          player.congKich += 150;
          player.phongNgu += 80;
          player.maxSinhMenh += 500;
          saveData();

          const levelEmbed = createLevelUpEmbed(user, player);
          await interaction.reply({ embeds: [levelEmbed] });
        } else {
          saveData();
          await interaction.reply({ content: `🧘 Bế quan tu luyện, tốn 10 Thể Lực. Thu nhận **100 Tu Vi**!`, ephemeral: true });
        }
      }

      else if (customId === 'btn_cuahang') {
        const shopRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('buy_dan_tuvi').setLabel('💊 Tăng Tu Vi (1,000 NT)').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('buy_dan_theluc').setLabel('🍷 Hồi Thể Lực (500 NT)').setStyle(ButtonStyle.Primary)
        );
        await interaction.reply({ content: '🏪 **SHOP ĐAN DƯỢC**\nChủ tiệm: "Đạo hữu muốn mua loại đan dược nào?"', components: [shopRow], ephemeral: true });
      }

      else if (customId === 'buy_dan_tuvi') {
        if (player.nguyenThach < 1000) return interaction.reply({ content: '❌ Không đủ Nguyên Thạch!', ephemeral: true });
        player.nguyenThach -= 1000;
        player.tuVi += 300;
        
        if (player.tuVi >= (player.canhGioiIndex + 1) * 300 && player.canhGioiIndex < CANH_GIOI.length - 1) {
          player.canhGioiIndex += 1;
          player.congKich += 150;
          player.phongNgu += 80;
          player.maxSinhMenh += 500;
          saveData();

          const levelEmbed = createLevelUpEmbed(user, player);
          await interaction.reply({ embeds: [levelEmbed] });
        } else {
          saveData();
          await interaction.reply({ content: `✅ Dùng 1,000 NT mua Cửu Chuyển Dẫn Linh Đan, tăng **300 Tu Vi**!`, ephemeral: true });
        }
      }

      else if (customId === 'buy_dan_theluc') {
        if (player.nguyenThach < 500) return interaction.reply({ content: '❌ Không đủ Nguyên Thạch!', ephemeral: true });
        player.nguyenThach -= 500;
        player.theLuc = Math.min(player.maxTheLuc, player.theLuc + 50);
        saveData();
        await interaction.reply({ content: `✅ Dùng 500 NT mua Linh Trà, hồi **50 Thể Lực**!`, ephemeral: true });
      }

      else if (customId === 'btn_pet_shop') {
        let petText = "**🐾 DANH SÁCH LINH THÚ & TỌA KỴ**\n\n";
        PET_LIST.forEach((p, idx) => petText += `${idx + 1}. **${p.name}** - Công +${p.cong} - Giá: ${p.price} NT\n`);
        await interaction.reply({ content: petText, ephemeral: true });
      }

      else if (customId === 'btn_bicanh') {
        await interaction.reply({ content: `🌀 **BÍ CẢNH THÁI CỔ (Tối đa 6 người)**\nĐội hình hiện tại: 1/6 (${player.daoHieu}). Đã mở bí cảnh! Thu hoạch được 2,000 Nguyên Thạch!`, ephemeral: true });
        player.nguyenThach += 2000;
        saveData();
      }

      else if (customId === 'btn_boss') {
        await interaction.reply({ content: `👹 **BOSS THẾ GIỚI: THÁI CỔ MA LONG**\nĐạo hữu tiến vào tham chiến, gây **${getLucChien(player) * 2}** sát thương! Nhận 3,000 NT từ đấu giá thế giới!`, ephemeral: true });
        player.nguyenThach += 3000;
        saveData();
      }
    }
  } catch (error) {
    console.error("❌ Lỗi tương tác:", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Đã xảy ra lỗi khi thực thi lệnh!', ephemeral: true }).catch(() => {});
    }
  }
});

// Chạy Bot
if (TOKEN) {
  client.login(TOKEN).catch(err => {
    console.error("❌ Không thể kết nối Discord API. Lỗi Token:", err.message);
  });
} else {
  console.error("❌ Vui lòng cung cấp DISCORD_TOKEN trong Variables trên Railway!");
}
