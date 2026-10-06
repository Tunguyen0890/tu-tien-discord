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

const TOKEN = 'YOUR_BOT_TOKEN_HERE';
const CLIENT_ID = 'YOUR_CLIENT_ID_HERE';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const DATA_FILE = './data.json';
let db = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : {};

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// ------------------- DỮ LIỆU CẤU HÌNH -------------------
const CANH_GIOI = [
  'Luyện Khí Sơ Kỳ', 'Luyện Khí Hậu Kỳ', 'Trúc Cơ Sơ Kỳ', 'Trúc Cơ Hậu Kỳ',
  'Kết Đan Sơ Kỳ', 'Kết Đan Hậu Kỳ', 'Nguyên Anh Sơ Kỳ', 'Nguyên Anh Hậu Kỳ',
  'Hóa Thần Sơ Kỳ', 'Hóa Thần Hậu Kỳ', 'Luyện Hư', 'Hợp Thể', 'Đại Thừa', 'Độ Kiếp Thành Tiên'
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
  { name: '噬金虫 - Phệ Kim Trùng', cong: 1500, price: 5000 },
  { name: '啼魂兽 - Đề Hồn Thú', cong: 3000, price: 12000 },
  { name: '墨蛟 - Mặc Giao', cong: 2000, price: 8000 },
  { name: '九尾天狐 - Cửu Vĩ Thiên Hồ', cong: 4500, price: 20000 },
  { name: '冰凤 - Băng Phượng', cong: 5000, price: 25000 },
  { name: '太灵清犀 - Thái Linh Thanh Tây', cong: 1800, price: 7000 },
  { name: '六翼霜蝉 - Lục Dực Sương Thiền', cong: 3500, price: 15000 },
  { name: '金毛吼 - Kim Mao Hống', cong: 2800, price: 10000 }
];

const TOA_KY_LIST = [
  { name: 'Thánh Mạn Ngưu', lucChien: 1000, price: 3000 },
  { name: 'Thanh Phong Độc Giác Thú', lucChien: 2500, price: 8000 },
  { name: 'Hỗn Độn Càn Khôn Đạo Thú', lucChien: 10000, price: 50000 },
  { name: 'Kim Xỉ Long Mộc Chu', lucChien: 4000, price: 15000 },
  { name: 'Xích Viêm Hỏa Kỳ Lân', lucChien: 8000, price: 35000 },
  { name: 'Tuyết Vũ Ngân Đao Sư', lucChien: 3000, price: 10000 },
  { name: 'Thâm Hải Băng Long', lucChien: 12000, price: 60000 },
  { name: 'Cửu U Triệu Hán Thú', lucChien: 6000, price: 25000 }
];

// ------------------- HÀM BỔ TRỢ -------------------
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
  if (!db[userId]) {
    db[userId] = {
      daoHieu: username,
      canhGioiIndex: 0,
      tuVi: 0,
      theLuc: 100, maxTheLuc: 100,
      sinhMenh: 1000, maxSinhMenh: 1000,
      linhLuc: 200, maxLinhLuc: 200,
      congKich: 150, phongNgu: 80,
      baoKich: 5, neTranh: 5,
      nguyenThach: 1000,
      linhCan: getRandom(LINH_CAN_LIST),
      theChat: getRandom(THE_CHAT_LIST),
      gioiVuc: 'Nhân Giới',
      tongMon: null,
      daoLu: null,
      pet: null,
      toaKy: null
    };
    saveData();
  }
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
      { name: 'Cảnh Giới', value: `☯️ **${CANH_GIOI[player.canhGioiIndex]}** (${player.tuVi} EXP)`, inline: false },
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
      { name: 'Công / Thủ', value: `⚔️ ${player.congKich} / 🛡️ ${player.phongNgu}`, inline: true },
      { name: 'Bạo Kích / Né', value: `💥 ${player.baoKich}% / 🎯 ${player.neTranh}%`, inline: true }
    )
    .setFooter({ text: 'Phàm Nhân Tu Tiên Bot' });
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

// ------------------- REGISTRATION COMMANDS -------------------
const commands = [
  new SlashCommandBuilder().setName('tutien').setDescription('Mở Bảng Tu Tiên'),
  new SlashCommandBuilder().setName('pk').setDescription('Thách đấu PK với tu sĩ khác')
    .addUserOption(opt => opt.setName('target').setDescription('Đối thủ cần PK').setRequired(true)),
  new SlashCommandBuilder().setName('ketduyen').setDescription('Cầu hôn làm Đạo Lữ với tu sĩ khác')
    .addUserOption(opt => opt.setName('target').setDescription('Người muốn kết duyên').setRequired(true)),
  new SlashCommandBuilder().setName('createtongmon').setDescription('Tạo Tông Môn (Yêu cầu Nguyên Anh, 50k Nguyên Thạch)')
    .addStringOption(opt => opt.setName('name').setDescription('Tên Tông Môn').setRequired(true)),
  new SlashCommandBuilder().setName('bangxephang').setDescription('Xem Bảng Xếp Hạng Tu Sĩ'),
  
  // Admin Commands
  new SlashCommandBuilder().setName('admin_tuvi').setDescription('[Admin] Tăng/Giảm Tu vi')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(o => o.setName('target').setDescription('Tu sĩ').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Số tu vi (+/-)').setRequired(true)),
  new SlashCommandBuilder().setName('admin_nguyenthach').setDescription('[Admin] Tăng/Giảm Nguyên Thạch')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(o => o.setName('target').setDescription('Tu sĩ').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Số Nguyên thạch (+/-)').setRequired(true))
];

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Lệnh Slash đã được đăng ký!');
  } catch (err) { console.error(err); }
})();

// ------------------- EVENT HANDLERS -------------------
client.on('ready', () => console.log(`Bot Tu Tiên ${client.user.tag} sẵn sàng!`));

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const { commandName, user, options } = interaction;
    const player = getPlayerData(user.id, user.username);

    if (commandName === 'tutien') {
      const embed = createProfileEmbed(user, player);
      await interaction.reply({ embeds: [embed], components: createMainMenuButtons() });
    }

    // PK Hệ Thống
    else if (commandName === 'pk') {
      const targetUser = options.getUser('target');
      if (targetUser.id === user.id) return interaction.reply({ content: 'Không thể tự PK chính mình!', ephemeral: true });

      const targetPlayer = getPlayerData(targetUser.id, targetUser.username);
      const p1Power = getLucChien(player);
      const p2Power = getLucChien(targetPlayer);

      // Tỷ lệ may mắn crit
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

    // Đạo Lữ
    else if (commandName === 'ketduyen') {
      const targetUser = options.getUser('target');
      if (targetUser.id === user.id) return interaction.reply({ content: 'Không thể kết duyên với chính mình!', ephemeral: true });
      const targetPlayer = getPlayerData(targetUser.id, targetUser.username);

      player.daoLu = targetPlayer.daoHieu;
      targetPlayer.daoLu = player.daoHieu;
      saveData();

      await interaction.reply({ content: `🎉 Chúc mừng **${player.daoHieu}** và **${targetPlayer.daoHieu}** đã chính thức kết thành **Đạo Lữ**, cùng nhau sóng đôi trên con đường trường sinh!` });
    }

    // Tạo Tông Môn
    else if (commandName === 'createtongmon') {
      const name = options.getString('name');
      if (player.canhGioiIndex < 6) { // Nguyên Anh
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

    // Bảng Xếp Hạng
    else if (commandName === 'bangxephang') {
      const sorted = Object.values(db).sort((a, b) => getLucChien(b) - getLucChien(a)).slice(0, 10);
      let list = sorted.map((p, i) => `${i + 1}. **${p.daoHieu}** - ${CANH_GIOI[p.canhGioiIndex]} | ⚔️ ${getLucChien(p).toLocaleString()} LC`).join('\n');

      const bxhEmbed = new EmbedBuilder()
        .setColor('#gold')
        .setTitle('🏆 BẢNG XẾP HẠNG TU SĨ THIÊN HẠ')
        .setDescription(list || 'Chưa có dữ liệu.');
      await interaction.reply({ embeds: [bxhEmbed] });
    }

    // Admin Tools
    else if (commandName === 'admin_tuvi') {
      const targetUser = options.getUser('target');
      const amount = options.getInteger('amount');
      const targetPlayer = getPlayerData(targetUser.id, targetUser.username);

      targetPlayer.tuVi += amount;
      saveData();
      await interaction.reply({ content: `✅ Đã điều chỉnh Tu Vi của **${targetPlayer.daoHieu}**: ${amount > 0 ? '+' : ''}${amount}`, ephemeral: true });
    }
    else if (commandName === 'admin_nguyenthach') {
      const targetUser = options.getUser('target');
      const amount = options.getInteger('amount');
      const targetPlayer = getPlayerData(targetUser.id, targetUser.username);

      targetPlayer.nguyenThach += amount;
      saveData();
      await interaction.reply({ content: `✅ Đã điều chỉnh Nguyên Thạch của **${targetPlayer.daoHieu}**: ${amount > 0 ? '+' : ''}${amount}`, ephemeral: true });
    }
  }

  // Button Interactions
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
      
      // Kiểm tra đột phá
      if (player.tuVi >= (player.canhGioiIndex + 1) * 500 && player.canhGioiIndex < CANH_GIOI.length - 1) {
        player.canhGioiIndex += 1;
        player.congKich += 300;
        player.phongNgu += 150;
        player.maxSinhMenh += 1000;
        saveData();
        await interaction.reply({ content: `🎉 **ĐỘT PHÁ!** Bạn đã thành công tiến thăng **${CANH_GIOI[player.canhGioiIndex]}**!` });
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
      saveData();
      await interaction.reply({ content: `✅ Dùng 1,000 NT mua Cửu Chuyển Dẫn Linh Đan, tăng **300 Tu Vi**!`, ephemeral: true });
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
});

client.login(TOKEN);
