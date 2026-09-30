const { 
    Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, 
    PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle 
} = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let db = JSON.parse(fs.readFileSync('./index.json', 'utf8'));
const saveDB = () => fs.writeFileSync('./index.json', JSON.stringify(db, null, 2));

// Tính Lực Chiến (CP) chuẩn xác theo Cảnh giới + EXP + Thể chất
function calculateCP(user) {
    const realmList = db.realms[user.system];
    const realm = realmList[user.level] || realmList[realmList.length - 1];
    const physiqueObj = db.physiques.find(p => p.name === user.physique) || { multiplier: 1.0 };
    const baseCP = realm ? realm.base_cp : 100;
    
    return Math.floor((baseCP + (user.exp * 0.5)) * physiqueObj.multiplier);
}

// Vẽ thanh tiến trình Dễ Nhìn Chuyên Nghiệp
function drawProgressBar(current, max, length = 8) {
    if (max <= 0) return '🟩'.repeat(length);
    const progress = Math.min(Math.max(current / max, 0), 1);
    const fill = Math.round(length * progress);
    return '🟩'.repeat(fill) + '⬛'.repeat(length - fill);
}

// Tự động đột phá (Xử lý mượt đến Max Cấp)
function checkAutoBreakthrough(userId, channel) {
    const user = db.users[userId];
    if (!user) return;

    let realmList = db.realms[user.system];
    let curRealm = realmList[user.level];

    // Lặp qua để tăng cấp nếu đủ EXP và chưa đạt Cảnh giới Tối cao
    while (curRealm && user.level < realmList.length - 1 && user.exp >= curRealm.exp_required) {
        user.exp -= curRealm.exp_required;
        user.level += 1;
        curRealm = realmList[user.level];

        if (channel) {
            const isMax = user.level === realmList.length - 1;
            const embed = new EmbedBuilder()
                .setTitle(isMax ? `👑 ĐẠT CẢNH GIỚI TỐI CAO!` : `⚡ TỰ ĐỘNG ĐỘT PHÁ CẢNH GIỚI!`)
                .setDescription(
                    `Chúc mừng **<@${userId}>** tu vi viên mãn, đột phá lên **${curRealm.icon}${curRealm.name}**!\n` +
                    `⚔️ Lực chiến hiện tại: **${calculateCP(user).toLocaleString()} CP**`
                )
                .setImage(curRealm.gif)
                .setColor(isMax ? 0xFFD700 : 0xF1C40F);
            channel.send({ embeds: [embed] }).catch(() => {});
        }
    }
    saveDB();
}

// Giao diện Tu Tiên Bắt Mắt (Gọn đẹp, Bỏ Uyển Sư Muội)
function buildControlPanel(user, pData) {
    const realmList = db.realms[pData.system];
    const curRealm = realmList[pData.level] || realmList[realmList.length - 1];
    const cp = calculateCP(pData);
    const isMaxLevel = pData.level >= realmList.length - 1;

    const expText = isMaxLevel ? '`[ĐẠT MAX CẤP]`' : `\`[${pData.exp.toLocaleString()}/${curRealm.exp_required.toLocaleString()}]\``;

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setAuthor({ name: `BẢNG ĐIỀU KHIỂN TU TIÊN - ${user.username}`, iconURL: user.displayAvatarURL() })
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setImage("https://i.imgur.com/7A20sQL.png")
        .addFields(
            { 
                name: '⚔️ THÔNG TIN TIÊN GIỚI', 
                value: ````ansi\n\u001b[1;33mCảnh Giới:\u001b[0m ${curRealm.icon} ${curRealm.name}\n\u001b[1;31mLực Chiến :\u001b[0m 💥 ${cp.toLocaleString()} CP\n\u001b[1;36mHệ Thống  :\u001b[0m ${pData.system === 'XiuXian' ? 'Phàm Nhân Tu Tiên' : 'Đấu Phá Thương Khung'}\n````, 
                inline: false 
            },
            { 
                name: '📊 TRẠNG THÁI TU VI', 
                value: `**Thể Lực:** ${drawProgressBar(pData.energy, 360)} \`[${pData.energy}/360]\`\n` +
                       `**Tu Vi  :** ${drawProgressBar(pData.exp, isMaxLevel ? 1 : curRealm.exp_required)} ${expText}`, 
                inline: false 
            },
            { 
                name: '💎 TÀI SẢN', 
                value: `\`💎 ${pData.nguyen_thach.toLocaleString()} Nguyên Thạch\` | \`🪙 ${pData.gold.toLocaleString()} Vàng\``, 
                inline: false 
            }
        )
        .setFooter({ text: 'Hệ Thống Quản Lý Động Phủ • Tu Tiên Giới', iconURL: client.user.displayAvatarURL() });

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ui_profile').setLabel('👤 Hồ Sơ').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('ui_dongphu').setLabel('🏰 Động Phủ').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ui_tongmon').setLabel('🏛️ Tông Môn').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ui_bxh').setLabel('🏆 Xếp Hạng').setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ui_lichluyen').setLabel('🧭 Lịch Luyện').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('ui_bicanh').setLabel('🔮 Bí Cảnh').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ui_nhiemvu').setLabel('📜 Nhiệm Vụ').setStyle(ButtonStyle.Secondary)
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ui_hanhtrang').setLabel('🎒 Hành Trang').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ui_cuahang').setLabel('🛒 Cửa Hàng').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ui_dophuong').setLabel('🎲 Đổ Phường').setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [row1, row2, row3] };
}

// Bảng Xếp Hạng Lực Chiến
function buildLeaderboard() {
    const userArray = Object.keys(db.users).map(id => {
        const u = db.users[id];
        const realmList = db.realms[u.system];
        const curRealm = realmList[u.level] || realmList[realmList.length - 1];
        return {
            id: id,
            cp: calculateCP(u),
            realm: curRealm.name
        };
    });

    userArray.sort((a, b) => b.cp - a.cp);
    const top10 = userArray.slice(0, 10);

    let desc = "";
    top10.forEach((u, index) => {
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `**#${index + 1}**`;
        desc += `${medal} <@${u.id}>\n┗ 💥 Lực Chiến: **${u.cp.toLocaleString()} CP** | 🟢 \`${u.realm}\`\n\n`;
    });

    return new EmbedBuilder()
        .setTitle('🏆 BẢNG XẾP HẠNG CAO THỦ TIÊN GIỚI')
        .setColor(0xF1C40F)
        .setDescription(desc || 'Chưa có cao thủ nào ghi danh!')
        .setTimestamp();
}

// Đăng ký Slash Commands
const commands = [
    new SlashCommandBuilder().setName('start').setDescription('Khởi tạo nhân vật Tu Tiên')
        .addStringOption(o => o.setName('system').setDescription('Chọn hệ thống tu luyện').setRequired(true)
            .addChoices(
                { name: 'Phàm Nhân Tu Tiên (14 Cảnh Giới)', value: 'XiuXian' }, 
                { name: 'Đấu Phá Thương Khung (12 Cảnh Giới)', value: 'DouQi' }
            )),
    new SlashCommandBuilder().setName('tutien').setDescription('Mở Bảng Điều Khiển Tu Tiên'),
    new SlashCommandBuilder().setName('bxh').setDescription('Xem Bảng Xếp Hạng Lực Chiến Server'),
    new SlashCommandBuilder().setName('setchannel').setDescription('Chỉ định kênh Tu Tiên (Admin)')
        .addChannelOption(o => o.setName('channel').setDescription('Kênh tu tiên').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('admin').setDescription('Lệnh Quản Trị Hệ Thống')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(s => s.setName('give').setDescription('Thêm tài nguyên')
            .addUserOption(o => o.setName('user').setDescription('Người nhận').setRequired(true))
            .addStringOption(o => o.setName('type').setDescription('Loại tài nguyên').setRequired(true)
                .addChoices({ name: 'EXP', value: 'exp' }, { name: 'Nguyên Thạch', value: 'nguyen_thach' }, { name: 'Vàng', value: 'gold' }))
            .addIntegerOption(o => o.setName('amount').setDescription('Số lượng').setRequired(true)))
].map(c => c.toJSON());

client.once('ready', async () => {
    console.log(`⚡ Bot Tu Tiên Giới đã chạy thành công: ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
});

// Chat nhận EXP + Thể Lực
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

// Handling Interactions
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
            if (db.users[uid]) return interaction.reply({ content: '❌ Đạo hữu đã tạo nhân vật trước đó rồi!', flags: 64 });
            const sys = options.getString('system');
            const randomPhysique = db.physiques[Math.floor(Math.random() * db.physiques.length)].name;
            const randomRoot = db.spiritual_roots[Math.floor(Math.random() * db.spiritual_roots.length)];

            db.users[uid] = {
                system: sys, level: 0, exp: 0, nguyen_thach: 1000, gold: 50, energy: 100,
                physique: randomPhysique, spiritual_root: randomRoot, afk_start: null,
                inventory: []
            };
            saveDB();
            return interaction.reply({ content: `✨ **Bước vào Tiên Lộ thành công!** Thể chất: **${randomPhysique}** | Linh căn: **${randomRoot}**. Gõ \`/tutien\` để mở giao diện.` });
        }

        if (commandName === 'bxh') {
            return interaction.reply({ embeds: [buildLeaderboard()] });
        }

        const pData = db.users[uid];
        if (!pData && commandName !== 'admin') return interaction.reply({ content: '⚠️ Đạo hữu chưa tạo nhân vật! Hãy dùng `/start`.', flags: 64 });

        if (commandName === 'tutien') {
            return interaction.reply(buildControlPanel(interaction.user, pData));
        }

        if (commandName === 'admin') {
            const sub = options.getSubcommand();
            const target = options.getUser('user');
            if (!db.users[target.id]) return interaction.reply({ content: '❌ Người dùng này chưa khởi tạo nhân vật!', flags: 64 });

            if (sub === 'give') {
                const type = options.getString('type');
                const amt = options.getInteger('amount');
                db.users[target.id][type] += amt;
                saveDB();
                await interaction.reply({ content: `✅ Đã ban thưởng **+${amt.toLocaleString()}${type}** cho <@${target.id}>!` });
                if (type === 'exp') checkAutoBreakthrough(target.id, interaction.channel);
                return;
            }
        }
    }

    // 2. Interactive Buttons
    if (interaction.isButton()) {
        const pData = db.users[uid];
        if (!pData) return interaction.reply({ content: '⚠️ Bạn chưa khởi tạo nhân vật! Vui lòng dùng lệnh `/start`.', flags: 64 });

        const cid = interaction.customId;

        if (cid === 'ui_bxh') {
            return interaction.reply({ embeds: [buildLeaderboard()], flags: 64 });
        }

        if (cid === 'ui_profile') {
            const realmList = db.realms[pData.system];
            const curRealm = realmList[pData.level] || realmList[realmList.length - 1];
            const embed = new EmbedBuilder()
                .setTitle(`📜 HỒ SƠ CHI TIẾT - ${interaction.user.username}`)
                .setColor(0x3498DB)
                .addFields(
                    { name: '💥 Lực Chiến', value: `\`${calculateCP(pData).toLocaleString()} CP\``, inline: true },
                    { name: '🟢 Cảnh Giới', value: `\`${curRealm.name}\``, inline: true },
                    { name: '🧬 Thể Chất', value: `\`${pData.physique}\``, inline: true },
                    { name: '🌱 Linh Căn', value: `\`${pData.spiritual_root}\``, inline: true },
                    { name: '💰 Nguyên Thạch', value: `\`${pData.nguyen_thach.toLocaleString()}\``, inline: true },
                    { name: '🪙 Vàng', value: `\`${pData.gold.toLocaleString()}\``, inline: true }
                );
            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (cid === 'ui_lichluyen') {
            if (pData.energy < 10) return interaction.reply({ content: '❌ Thể Lực không đủ (Cần 10 Thể Lực)!', flags: 64 });
            pData.energy -= 10;
            const expGain = Math.floor(Math.random() * 60) + 40;
            pData.exp += expGain;
            saveDB();
            checkAutoBreakthrough(uid, interaction.channel);
            await interaction.update(buildControlPanel(interaction.user, pData));
            return interaction.followUp({ content: `🧭 Bạn đi lịch luyện trảm yêu trừ ma, thu hoạch được **+${expGain} EXP**!`, flags: 64 });
        }

        if (cid === 'ui_bicanh') {
            if (pData.energy < 20) return interaction.reply({ content: '❌ Cần ít nhất 20 Thể Lực để thám hiểm Bí Cảnh!', flags: 64 });
            pData.energy -= 20;
            
            const lucky = Math.random() > 0.35;
            if (lucky) {
                const stoneAdd = Math.floor(Math.random() * 400) + 150;
                pData.nguyen_thach += stoneAdd;
                saveDB();
                await interaction.update(buildControlPanel(interaction.user, pData));
                return interaction.followUp({ content: `🔮 **Vào Bí Cảnh tìm được cơ duyên!** Thu hoạch **+${stoneAdd} Nguyên Thạch**!`, flags: 64 });
            } else {
                saveDB();
                await interaction.update(buildControlPanel(interaction.user, pData));
                return interaction.followUp({ content: `💀 Bí Cảnh quá nguy hiểm, bạn đụng phải Cổ Bào Quái Thú đành rút lui (Mất 20 Thể Lực)!`, flags: 64 });
            }
        }

        if (cid === 'ui_dongphu') {
            if (!pData.afk_start) {
                pData.afk_start = Date.now();
                saveDB();
                await interaction.update(buildControlPanel(interaction.user, pData));
                return interaction.followUp({ content: '🧘 Bạn đã nhập định bế quan tại Động Phủ!', flags: 64 });
            } else {
                const hours = Math.min((Date.now() - pData.afk_start) / 3600000, 24);
                const expReward = Math.floor(hours * 1000);
                const stoneReward = Math.floor(hours * 400);

                pData.exp += expReward;
                pData.nguyen_thach += stoneReward;
                pData.afk_start = null;
                saveDB();
                checkAutoBreakthrough(uid, interaction.channel);

                await interaction.update(buildControlPanel(interaction.user, pData));
                return interaction.followUp({ content: `🔓 **Xuất Quan!** Bế quan \`${hours.toFixed(1)} giờ\` nhận: **+${expReward.toLocaleString()} EXP** & **+${stoneReward.toLocaleString()} 💎**`, flags: 64 });
            }
        }

        if (cid === 'ui_cuahang') {
            let shopList = "🛒 **CỬA HÀNG LINH DƯỢC & VẬT PHẨM**\n\n";
            db.shop_items.forEach((item, index) => {
                shopList += `**${index + 1}. ${item.name}** - Giá: \`${item.price} 💎\`\n┗ *${item.desc}*\n`;
            });
            return interaction.reply({ content: shopList, flags: 64 });
        }

        if (cid === 'ui_dophuong') {
            if (pData.nguyen_thach < 200) return interaction.reply({ content: '❌ Bạn cần tối thiểu 200 Nguyên Thạch!', flags: 64 });
            const win = Math.random() >= 0.5;
            pData.nguyen_thach += win ? 200 : -200;
            saveDB();
            await interaction.update(buildControlPanel(interaction.user, pData));
            return interaction.followUp({ content: `🎲 Đổ Phường cược 200 Nguyên Thạch: Bạn **${win ? 'Thắng +200' : 'Thua -200'} 💎**!`, flags: 64 });
        }

        if (cid === 'ui_tongmon') return interaction.reply({ content: '🏛️ **Tông Môn:** Tính năng lập Bang Phái Tông Môn sẽ sớm ra mắt!', flags: 64 });
        if (cid === 'ui_nhiemvu') return interaction.reply({ content: '📜 **Nhiệm Vụ:** Đã điểm danh thành công hôm nay!', flags: 64 });
        if (cid === 'ui_hanhtrang') return interaction.reply({ content: '🎒 **Hành Trang:** Bạn chưa sở hữu vật phẩm đặc biệt nào.', flags: 64 });
    }
});

client.login(process.env.DISCORD_TOKEN);
