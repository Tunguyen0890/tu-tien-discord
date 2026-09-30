const { 
    Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, 
    PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle 
} = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Tải dữ liệu index.json
let db = JSON.parse(fs.readFileSync('./index.json', 'utf8'));
const saveDB = () => fs.writeFileSync('./index.json', JSON.stringify(db, null, 2));

// Thanh Thể Lực dạng Progress Bar [16/360]
function renderProgressBar(current, max) {
    const totalBars = 10;
    const filledBars = Math.round((current / max) * totalBars);
    const emptyBars = totalBars - filledBars;
    return '🟩'.repeat(filledBars) + '⬛'.repeat(emptyBars) + ` [${current}/${max}]`;
}

// TỰ ĐỘNG ĐỘT PHÁ
function checkAutoBreakthrough(userId, channel) {
    const user = db.users[userId];
    if (!user) return;

    let realmList = db.realms[user.system];
    let curRealm = realmList[user.level];

    while (curRealm && user.exp >= curRealm.exp_required && user.level < realmList.length - 1) {
        user.exp -= curRealm.exp_required;
        user.level += 1;
        curRealm = realmList[user.level];

        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle(`⚡ TỰ ĐỘNG ĐỘT PHÁ CẢNH GIỚI!`)
                .setDescription(`Chúc mừng **<@${userId}>** tu vi viên mãn, đột phá thành công lên **${curRealm.icon} ${curRealm.name}**!`)
                .setImage(curRealm.gif)
                .setColor(0xE6A100);
            channel.send({ embeds: [embed] }).catch(() => {});
        }
    }
    saveDB();
}

// Dựng Bảng Điều Khiển chuẩn Uyển Sư Muội
function buildUyenSuMuoiUI(user, pData) {
    const curRealm = db.realms[pData.system][pData.level];
    
    const embed = new EmbedBuilder()
        .setColor(0xD4A373)
        .setImage("https://i.imgur.com/7A20sQL.png")
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setDescription(
            `Cảnh giới: ${curRealm.icon} **${curRealm.name}**\n` +
            `Giới vực: 🌏 **Nhân Giới**\n\n` +
            `Đạo hiệu: **${pData.nickname || user.username}**\n` +
            `Thể Chất: **${pData.physique}** | Linh Căn: **${pData.spiritual_root}**\n` +
            `Thể Lực: ${renderProgressBar(pData.energy || 16, 360)}\n` +
            `Tu Vi (EXP): \`[${pData.exp}/${curRealm.exp_required}]\`\n` +
            `Tài Sản: 💎 **${pData.nguyen_thach.toLocaleString()}** Nguyên Thạch | 🪙 **${pData.gold}** Vàng`
        );

    // Hàng 1: Thông Tin
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ui_profile').setLabel('👤 Hồ Sơ').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('ui_dongphu').setLabel('🏰 Động Phủ').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ui_tongmon').setLabel('🏛️ Tông Môn').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ui_huongdan').setLabel('📖 Hướng Dẫn').setStyle(ButtonStyle.Secondary)
    );

    // Hàng 2: Tu Luyện
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ui_lichluyen').setLabel('🧭 Lịch Luyện').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('ui_hoatdong').setLabel('🎯 Hoạt Động').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ui_bicanh').setLabel('🔮 Bí Cảnh').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ui_nhiemvu').setLabel('📜 Nhiệm Vụ').setStyle(ButtonStyle.Secondary)
    );

    // Hàng 3: Tài Sản
    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ui_hanhtrang').setLabel('🎒 Hành Trang').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ui_cuahang').setLabel('🛒 Cửa Hàng').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ui_dophuong').setLabel('🎲 Đổ Phường').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ui_vanthu').setLabel('🦊 Vạn Thú Các').setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [row1, row2, row3] };
}

// Đăng ký Slash Commands
const commands = [
    new SlashCommandBuilder().setName('start').setDescription('Khởi tạo nhân vật Tu Tiên')
        .addStringOption(o => o.setName('system').setDescription('Chọn hệ thống').setRequired(true)
            .addChoices(
                { name: 'Phàm Nhân Tu Tiên', value: 'XiuXian' },
                { name: 'Đấu Phá Thương Khung', value: 'DouQi' }
            )),
    new SlashCommandBuilder().setName('tutien').setDescription('Mở Bảng Điều Khiển Uyển Sư Muội'),
    new SlashCommandBuilder().setName('setchannel').setDescription('Chỉ định kênh Tu Tiên (Admin Only)')
        .addChannelOption(o => o.setName('channel').setDescription('Kênh chỉ định').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('admin').setDescription('Lệnh Quản Trị Admin')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(s => s.setName('give').setDescription('Cấp tài sản/tu vi')
            .addUserOption(o => o.setName('user').setDescription('Người nhận').setRequired(true))
            .addStringOption(o => o.setName('type').setDescription('Loại').setRequired(true)
                .addChoices(
                    { name: 'EXP', value: 'exp' },
                    { name: 'Nguyên Thạch', value: 'nguyen_thach' },
                    { name: 'Vàng', value: 'gold' }
                ))
            .addIntegerOption(o => o.setName('amount').setDescription('Số lượng').setRequired(true)))
        .addSubcommand(s => s.setName('punish').setDescription('Tế tu vi/Giáng cấp')
            .addUserOption(o => o.setName('user').setDescription('Đối tượng').setRequired(true))
            .addIntegerOption(o => o.setName('levels').setDescription('Số cấp giáng').setRequired(true)))
].map(c => c.toJSON());

client.once('ready', async () => {
    console.log(`🌸 Uyển Sư Muội Bot đã sẵn sàng: ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
});

// Nhắn tin tích lũy EXP + Hồi thể lực
client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !msg.guild) return;
    if (db.config.channel_id && msg.channel.id !== db.config.channel_id) return;

    const uid = msg.author.id;
    if (db.users[uid]) {
        db.users[uid].exp += Math.floor(Math.random() * 5) + 3;
        db.users[uid].nguyen_thach += 1;
        if (db.users[uid].energy < 360) db.users[uid].energy += 1;
        saveDB();
        checkAutoBreakthrough(uid, msg.channel);
    }
});

// Xử lý Sự Kiện Tương Tác
client.on('interactionCreate', async (interaction) => {
    const uid = interaction.user.id;

    // 1. Slash Commands
    if (interaction.isChatInputCommand()) {
        const { commandName, options } = interaction;

        if (commandName === 'setchannel') {
            db.config.channel_id = options.getChannel('channel').id;
            saveDB();
            return interaction.reply({ content: `✅ Đã thiết lập kênh Tu Tiên tại ${options.getChannel('channel')}` });
        }

        if (commandName === 'start') {
            if (db.users[uid]) return interaction.reply({ content: '❌ Đạo hữu đã có hồ sơ!', flags: 64 });
            
            const sys = options.getString('system');
            const randomPhysique = db.physiques[Math.floor(Math.random() * db.physiques.length)].name;
            const randomRoot = db.spiritual_roots[Math.floor(Math.random() * db.spiritual_roots.length)];

            db.users[uid] = {
                system: sys,
                level: 0,
                exp: 0,
                nguyen_thach: 1000,
                gold: 50,
                energy: 16,
                physique: randomPhysique,
                spiritual_root: randomRoot,
                afk_start: null,
                nickname: interaction.user.username
            };
            saveDB();
            return interaction.reply({ content: `🌸 **Khởi tạo hồ sơ thành công!** Cấp cho bạn Thể chất: **${randomPhysique}** | Linh căn: **${randomRoot}**. Gõ \`/tutien\` để bắt đầu.` });
        }

        const pData = db.users[uid];
        if (!pData && commandName !== 'admin') {
            return interaction.reply({ content: '⚠️ Đạo hữu chưa tạo nhân vật! Gõ `/start` trước.', flags: 64 });
        }

        if (commandName === 'tutien') {
            return interaction.reply(buildUyenSuMuoiUI(interaction.user, pData));
        }

        if (commandName === 'admin') {
            const sub = options.getSubcommand();
            const target = options.getUser('user');
            if (!db.users[target.id]) return interaction.reply({ content: '❌ Người chơi chưa khởi tạo nhân vật!', flags: 64 });

            if (sub === 'give') {
                const type = options.getString('type');
                const amt = options.getInteger('amount');
                db.users[target.id][type] += amt;
                saveDB();
                await interaction.reply({ content: `✅ Admin đã cộng **+${amt} ${type}** cho <@${target.id}>!` });
                if (type === 'exp') checkAutoBreakthrough(target.id, interaction.channel);
                return;
            }

            if (sub === 'punish') {
                const lvl = options.getInteger('levels');
                db.users[target.id].level = Math.max(0, db.users[target.id].level - lvl);
                saveDB();
                return interaction.reply({ content: `⚖️ THIÊN ĐẠO TRỪ PHẠT! Đã giáng **${lvl} cấp** của <@${target.id}>!` });
            }
        }
    }

    // 2. Nút Bấm Interactive Menu
    if (interaction.isButton()) {
        const pData = db.users[uid];
        if (!pData) return interaction.reply({ content: '⚠️ Bạn chưa tạo nhân vật! Gõ `/start`.', flags: 64 });

        const cid = interaction.customId;

        // Lịch Luyện
        if (cid === 'ui_lichluyen') {
            if (pData.energy < 10) return interaction.reply({ content: '❌ Thể Lực không đủ (Cần tối thiểu 10 Thể Lực)!', flags: 64 });
            
            pData.energy -= 10;
            const expAdd = Math.floor(Math.random() * 40) + 30;
            pData.exp += expAdd;
            saveDB();
            checkAutoBreakthrough(uid, interaction.channel);

            await interaction.update(buildUyenSuMuoiUI(interaction.user, pData));
            return interaction.followUp({ content: `🧭 Bạn đi lịch luyện nhận được **+${expAdd} EXP**!`, flags: 64 });
        }

        // Bế quan Động Phủ
        if (cid === 'ui_dongphu') {
            if (!pData.afk_start) {
                pData.afk_start = Date.now();
                saveDB();
                await interaction.update(buildUyenSuMuoiUI(interaction.user, pData));
                return interaction.followUp({ content: '🧘 Đã nhập định bế quan tại Động Phủ!', flags: 64 });
            } else {
                const hours = Math.min((Date.now() - pData.afk_start) / 3600000, 24);
                const expReward = Math.floor(hours * 600);
                const stoneReward = Math.floor(hours * 250);

                pData.exp += expReward;
                pData.nguyen_thach += stoneReward;
                pData.afk_start = null;
                saveDB();
                checkAutoBreakthrough(uid, interaction.channel);

                await interaction.update(buildUyenSuMuoiUI(interaction.user, pData));
                return interaction.followUp({ content: `🔓 **Xuất Quan!** Nhận: **+${expReward} EXP** & **+${stoneReward} 💎**`, flags: 64 });
            }
        }

        // Đổ Phường (Tài Xỉu)
        if (cid === 'ui_dophuong') {
            if (pData.nguyen_thach < 200) return interaction.reply({ content: '❌ Cần ít nhất 200 Nguyên Thạch!', flags: 64 });
            
            const win = Math.random() >= 0.5;
            pData.nguyen_thach += win ? 200 : -200;
            saveDB();

            await interaction.update(buildUyenSuMuoiUI(interaction.user, pData));
            return interaction.followUp({ content: `🎲 Đổ Phường: Bạn **${win ? 'Thắng +200' : 'Thua -200'} 💎**!`, flags: 64 });
        }

        // Cửa Hàng
        if (cid === 'ui_cuahang') {
            let shopMsg = "🛒 **CỬA HÀNG UYỂN SƯ MUỘI**\n\n";
            db.shop_items.normal.forEach(item => {
                shopMsg += `• **${item.name}**: ${item.price} 💎 (${item.desc})\n`;
            });
            return interaction.reply({ content: shopMsg, flags: 64 });
        }

        return interaction.reply({ content: `🚧 Tính năng **${cid.replace('ui_', '').toUpperCase()}** đang nâng cấp!`, flags: 64 });
    }
});

client.login(process.env.DISCORD_TOKEN);
