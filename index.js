const { 
    Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, 
    PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle 
} = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Đường dẫn lưu data
const dbPath = fs.existsSync('/app/data/index.json') ? '/app/data/index.json' : './index.json';
let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const saveDB = () => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

// Tính Lực Chiến (CP)
function calculateCP(user) {
    const realmList = db.realms[user.system];
    const realm = realmList[user.level] || realmList[realmList.length - 1];
    const physiqueObj = db.physiques.find(p => p.name === user.physique) || { multiplier: 1.0 };
    const baseCP = realm ? realm.base_cp : 100;

    let mountCP = 0;
    if (user.mount) {
        const m = db.mounts.find(x => x.id === user.mount);
        if (m) mountCP = m.cp_bonus;
    }

    let petCP = 0;
    if (user.pet) {
        const p = db.pets.find(x => x.id === user.pet);
        if (p) petCP = p.cp_bonus;
    }

    const partnerBonus = user.partner ? 1.1 : 1.0;
    return Math.floor(((baseCP + (user.exp * 0.5)) * physiqueObj.multiplier + mountCP + petCP) * partnerBonus);
}

// Thanh tiến trình
function drawProgressBar(current, max, length = 8) {
    if (max <= 0) return '🟩'.repeat(length);
    const progress = Math.min(Math.max(current / max, 0), 1);
    const fill = Math.round(length * progress);
    return '🟩'.repeat(fill) + '⬛'.repeat(length - fill);
}

// Tự động đột phá
function checkAutoBreakthrough(userId, channel) {
    const user = db.users[userId];
    if (!user) return;

    let realmList = db.realms[user.system];
    let curRealm = realmList[user.level];

    while (curRealm && user.level < realmList.length - 1 && user.exp >= curRealm.exp_required) {
        user.exp -= curRealm.exp_required;
        user.level += 1;
        curRealm = realmList[user.level];

        if (channel) {
            const isMax = user.level === realmList.length - 1;
            const embed = new EmbedBuilder()
                .setTitle(isMax ? `👑 ĐẠT CẢNH GIỚI TỐI CAO!` : `⚡ TỰ ĐỘNG ĐỘT PHÁ CẢNH GIỚI!`)
                .setDescription(
                    `Chúc mừng **<@${userId}>** đột phá lên **${curRealm.icon}${curRealm.name}**!\n` +
                    `⚔️ Lực chiến hiện tại: **${calculateCP(user).toLocaleString()} CP**`
                )
                .setColor(isMax ? 0xFFD700 : 0xF1C40F);
            channel.send({ embeds: [embed] }).catch(() => {});
        }
    }
    saveDB();
}

// Bảng Điều Khiển
function buildControlPanel(user, pData) {
    const realmList = db.realms[pData.system];
    const curRealm = realmList[pData.level] || realmList[realmList.length - 1];
    const cp = calculateCP(pData);
    const isMaxLevel = pData.level >= realmList.length - 1;

    const expText = isMaxLevel ? '`[ĐẠT MAX CẤP]`' : `\`[${pData.exp.toLocaleString()}/${curRealm.exp_required.toLocaleString()}]\``;
    const mountObj = db.mounts.find(m => m.id === pData.mount);
    const petObj = db.pets.find(p => p.id === pData.pet);

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setAuthor({ name: `BẢNG ĐIỀU KHIỂN TU TIÊN - ${user.username}`, iconURL: user.displayAvatarURL() })
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
            { 
                name: '⚔️ THÔNG TIN TIÊN GIỚI', 
                value: `**Cảnh Giới:** ${curRealm.icon}${curRealm.name}\n` +
                       `**Lực Chiến :** 💥 ${cp.toLocaleString()} CP\n` +
                       `**Đạo Lữ    :** ${pData.partner ? `<@${pData.partner}>` : 'Chưa có'}\n` +
                       `**Tọa Kỵ    :** ${mountObj ? mountObj.name : 'Chưa có'} | **Linh Thú:** ${petObj ? petObj.name : 'Chưa có'}`, 
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
        .setFooter({ text: 'Hệ Thống Quản Lý Động Phủ • Tu Tiên Giới' });

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ui_profile').setLabel('👤 Hồ Sơ').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('ui_dongphu').setLabel('🏰 Động Phủ').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ui_tongmon').setLabel('🏛️ Tông Môn').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ui_bxh').setLabel('🏆 Xếp Hạng').setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ui_lichluyen').setLabel('🧭 Lịch Luyện').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('ui_songtu').setLabel('💖 Song Tu').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ui_bicanh').setLabel('🔮 Bí Cảnh').setStyle(ButtonStyle.Secondary)
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ui_toaky').setLabel('🐎 Tọa Kỵ / Pet').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ui_cuahang').setLabel('🛒 Cửa Hàng').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ui_dophuong').setLabel('🎲 Đổ Phường').setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [row1, row2, row3] };
}

// Đăng ký Slash Commands
const commands = [
    new SlashCommandBuilder().setName('setchannel').setDescription('Chỉ định kênh hoạt động (Admin)')
        .addChannelOption(o => o.setName('channel').setDescription('Chọn kênh Tu Tiên').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    // LỆNH ADMIN BUFF DATA
    new SlashCommandBuilder().setName('adminbuff').setDescription('Buff/Trừ tài nguyên hoặc level cho đạo hữu (Admin)')
        .addUserOption(o => o.setName('user').setDescription('Người chơi').setRequired(true))
        .addStringOption(o => o.setName('loai').setDescription('Loại buff').setRequired(true)
            .addChoices(
                { name: '💎 Nguyên Thạch', value: 'nguyen_thach' },
                { name: '✨ EXP Tu Vi', value: 'exp' },
                { name: '⚡ Level Cảnh Giới', value: 'level' }
            ))
        .addIntegerOption(o => o.setName('soluong').setDescription('Số lượng muốn cộng (hoặc trừ)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    // LỆNH MUA TỌA KỴ / PET
    new SlashCommandBuilder().setName('mua').setDescription('Mua Tọa Kỵ hoặc Linh Thú bằng ID')
        .addStringOption(o => o.setName('id').setDescription('Nhập ID mặt hàng (Ví dụ: m1, m2, p1, p2)').setRequired(true)),

    new SlashCommandBuilder().setName('start').setDescription('Khởi tạo nhân vật Tu Tiên')
        .addStringOption(o => o.setName('system').setDescription('Chọn hệ thống').setRequired(true)
            .addChoices({ name: 'Phàm Nhân Tu Tiên', value: 'XiuXian' }, { name: 'Đấu Phá Thương Khung', value: 'DouQi' })),
    new SlashCommandBuilder().setName('tutien').setDescription('Mở Bảng Điều Khiển Tu Tiên'),
    new SlashCommandBuilder().setName('ketduyen').setDescription('Kết thành Đạo Lữ với người chơi khác')
        .addUserOption(o => o.setName('user').setDescription('Đối tượng cầu hôn').setRequired(true)),
    new SlashCommandBuilder().setName('tongmon').setDescription('Quản lý Tông Môn')
        .addSubcommand(s => s.setName('tao').setDescription('Tạo Tông Môn mới (Cần 10,000 Nguyên Thạch)')
            .addStringOption(o => o.setName('ten').setDescription('Tên Tông Môn').setRequired(true)))
        .addSubcommand(s => s.setName('giatnhap').setDescription('Gia nhập Tông Môn')
            .addStringOption(o => o.setName('ten').setDescription('Tên Tông Môn').setRequired(true)))
].map(c => c.toJSON());

client.once('ready', async () => {
    console.log(`⚡ Bot Tu Tiên Giới đã khởi chạy: ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
});

// Chat nhận EXP
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

// Xử lý Interaction
client.on('interactionCreate', async (interaction) => {
    const uid = interaction.user.id;

    // Lệnh SetChannel
    if (interaction.isChatInputCommand() && interaction.commandName === 'setchannel') {
        const targetChannel = interaction.options.getChannel('channel');
        db.config.channel_id = targetChannel.id;
        saveDB();
        return interaction.reply({ content: `✅ Đã giới hạn Bot Tu Tiên chỉ hoạt động tại kênh ${targetChannel}!`, flags: 64 });
    }

    // Kiểm tra kênh giới hạn
    if (db.config.channel_id && interaction.channelId !== db.config.channel_id) {
        return interaction.reply({ 
            content: `⛔ Bot Tu Tiên chỉ hoạt động tại kênh <#${db.config.channel_id}>! Vui lòng sang đó thực hiện.`, 
            flags: 64 
        });
    }

    if (interaction.isChatInputCommand()) {
        const { commandName, options } = interaction;

        // XỬ LÝ LỆNH ADMIN BUFF
        if (commandName === 'adminbuff') {
            const targetUser = options.getUser('user');
            const type = options.getString('loai');
            const amount = options.getInteger('soluong');

            if (!db.users[targetUser.id]) {
                return interaction.reply({ content: '❌ Người dùng này chưa khởi tạo nhân vật!', flags: 64 });
            }

            db.users[targetUser.id][type] += amount;
            if (db.users[targetUser.id][type] < 0) db.users[targetUser.id][type] = 0; // Tránh âm tiền/cấp

            saveDB();
            if (type === 'exp') checkAutoBreakthrough(targetUser.id, interaction.channel);

            return interaction.reply({ 
                content: `🛠️ **[ADMIN BUFF]** Đã điều chỉnh **${type}** của <@${targetUser.id}> thêm **${amount > 0 ? '+' + amount : amount}**!`,
                flags: 64 
            });
        }

        // XỬ LÝ LỆNH MUA TỌA KỴ / PET
        if (commandName === 'mua') {
            const pData = db.users[uid];
            if (!pData) return interaction.reply({ content: '⚠️ Bạn chưa tạo nhân vật! Gõ `/start`.', flags: 64 });

            const itemID = options.getString('id').toLowerCase();
            const mount = db.mounts.find(m => m.id === itemID);
            const pet = db.pets.find(p => p.id === itemID);

            if (!mount && !pet) {
                return interaction.reply({ content: '❌ ID vật phẩm không tồn tại! Bấm nút "Tọa Kỵ / Pet" để xem danh sách ID.', flags: 64 });
            }

            const item = mount || pet;
            if (pData.nguyen_thach < item.price) {
                return interaction.reply({ content: `❌ Bạn không đủ Nguyên Thạch! Cần **${item.price} 💎** nhưng hiện có **${pData.nguyen_thach} 💎**.`, flags: 64 });
            }

            pData.nguyen_thach -= item.price;
            if (mount) pData.mount = mount.id;
            if (pet) pData.pet = pet.id;

            saveDB();
            return interaction.reply({ content: `🎉 Bạn đã mua thành công **${item.name}**! Lực chiến tăng thêm **+${item.cp_bonus} CP**.` });
        }

        if (commandName === 'start') {
            if (db.users[uid]) return interaction.reply({ content: '❌ Bạn đã tạo nhân vật!', flags: 64 });
            const sys = options.getString('system');
            const randomPhysique = db.physiques[Math.floor(Math.random() * db.physiques.length)].name;
            const randomRoot = db.spiritual_roots[Math.floor(Math.random() * db.spiritual_roots.length)];

            db.users[uid] = {
                system: sys, level: 0, exp: 0, nguyen_thach: 2000, gold: 50, energy: 100,
                physique: randomPhysique, spiritual_root: randomRoot, mount: null, pet: null,
                partner: null, guild: null, last_songtu: 0
            };
            saveDB();
            return interaction.reply({ content: `✨ **Khởi tạo nhân vật thành công!** Thể chất: **${randomPhysique}** | Linh căn: **${randomRoot}**. Gõ \`/tutien\` để bắt đầu.` });
        }

        const pData = db.users[uid];
        if (!pData) return interaction.reply({ content: '⚠️ Bạn chưa tạo nhân vật! Gõ `/start`.', flags: 64 });

        if (commandName === 'tutien') {
            return interaction.reply(buildControlPanel(interaction.user, pData));
        }

        if (commandName === 'ketduyen') {
            const target = options.getUser('user');
            if (target.id === uid) return interaction.reply({ content: '❌ Không thể tự kết duyên với chính mình!', flags: 64 });
            if (!db.users[target.id]) return interaction.reply({ content: '❌ Người này chưa tạo nhân vật!', flags: 64 });
            if (pData.partner) return interaction.reply({ content: '❌ Bạn đã có Đạo Lữ rồi!', flags: 64 });
            if (db.users[target.id].partner) return interaction.reply({ content: '❌ Đối phương đã có Đạo Lữ!', flags: 64 });

            pData.partner = target.id;
            db.users[target.id].partner = uid;
            saveDB();

            return interaction.reply({ content: `💖 Chúc mừng **<@${uid}>** và **<@${target.id}>** đã kết thành **Đạo Lữ**!` });
        }

        if (commandName === 'tongmon') {
            const sub = options.getSubcommand();
            if (sub === 'tao') {
                const name = options.getString('ten');
                if (pData.nguyen_thach < 10000) return interaction.reply({ content: '❌ Cần 10,000 Nguyên Thạch để lập Tông Môn!', flags: 64 });
                if (db.guilds[name]) return interaction.reply({ content: '❌ Tên Tông Môn đã tồn tại!', flags: 64 });

                pData.nguyen_thach -= 10000;
                db.guilds[name] = { master: uid, members: [uid], level: 1 };
                pData.guild = name;
                saveDB();

                return interaction.reply({ content: `🏛️ Chúc mừng bạn đã khai sơn lập phái, thành lập Tông Môn **${name}**!` });
            }

            if (sub === 'giatnhap') {
                const name = options.getString('ten');
                if (!db.guilds[name]) return interaction.reply({ content: '❌ Tông Môn không tồn tại!', flags: 64 });
                if (pData.guild) return interaction.reply({ content: '❌ Bạn đã có Tông Môn rồi!', flags: 64 });

                db.guilds[name].members.push(uid);
                pData.guild = name;
                saveDB();

                return interaction.reply({ content: `🏛️ Bạn đã gia nhập Tông Môn **${name}**!` });
            }
        }
    }

    // Xử lý nút bấm
    if (interaction.isButton()) {
        const pData = db.users[uid];
        if (!pData) return interaction.reply({ content: '⚠️ Gõ `/start` để tạo nhân vật.', flags: 64 });

        const cid = interaction.customId;

        // Xem cửa hàng Tọa kỵ & Pet (Hiển thị rõ ID để mua)
        if (cid === 'ui_toaky') {
            let msg = "🐎 **CỬA HÀNG TỌA KỴ & LINH THÚ**\n*(Dùng lệnh `/mua [ID]` để sở hữu)*\n\n**Tọa Kỵ:**\n";
            db.mounts.forEach(m => msg += `• ID: \`${m.id}\` | **${m.name}** - Giá: \`${m.price} 💎\` (+${m.cp_bonus} CP)\n`);
            msg += "\n**Linh Thú:**\n";
            db.pets.forEach(p => msg += `• ID: \`${p.id}\` | **${p.name}** - Giá: \`${p.price} 💎\` (+${p.cp_bonus} CP)\n`);
            
            return interaction.reply({ content: msg, flags: 64 });
        }

        if (cid === 'ui_songtu') {
            if (!pData.partner) return interaction.reply({ content: '❌ Bạn chưa có Đạo Lữ! Dùng lệnh `/ketduyen` để kết duyên.', flags: 64 });
            
            const now = Date.now();
            if (now - (pData.last_songtu || 0) < 14400000) {
                return interaction.reply({ content: '⏳ Đạo Lữ đang hồi sức, cần chờ thêm để tiếp tục Song Tu!', flags: 64 });
            }

            pData.last_songtu = now;
            const expAdd = 1500;
            pData.exp += expAdd;
            saveDB();
            checkAutoBreakthrough(uid, interaction.channel);

            await interaction.update(buildControlPanel(interaction.user, pData));
            return interaction.followUp({ content: `💖 Bạn cùng Đạo Lữ <@${pData.partner}> Song Tu nhận **+${expAdd} EXP**!`, flags: 64 });
        }

        if (cid === 'ui_lichluyen') {
            if (pData.energy < 10) return interaction.reply({ content: '❌ Thể Lực không đủ!', flags: 64 });
            pData.energy -= 10;
            const expGain = Math.floor(Math.random() * 60) + 40;
            pData.exp += expGain;
            saveDB();
            checkAutoBreakthrough(uid, interaction.channel);
            await interaction.update(buildControlPanel(interaction.user, pData));
            return interaction.followUp({ content: `🧭 Lịch luyện nhận **+${expGain} EXP**!`, flags: 64 });
        }

        if (cid === 'ui_dongphu') {
            if (!pData.afk_start) {
                pData.afk_start = Date.now();
                saveDB();
                await interaction.update(buildControlPanel(interaction.user, pData));
                return interaction.followUp({ content: '🧘 Đã nhập định bế quan!', flags: 64 });
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
                return interaction.followUp({ content: `🔓 Xuất quan nhận: **+${expReward} EXP** & **+${stoneReward} 💎**`, flags: 64 });
            }
        }

        if (cid === 'ui_tongmon') {
            if (!pData.guild) return interaction.reply({ content: '🏛️ Bạn chưa có Tông Môn! Dùng `/tongmon tao` hoặc `/tongmon giatnhap`.', flags: 64 });
            const g = db.guilds[pData.guild];
            return interaction.reply({ content: `🏛️ **TÔNG MÔN: ${pData.guild}**\n• Cấp độ: ${g.level}\n• Chưởng Môn: <@${g.master}>\n• Thành viên: ${g.members.length} người`, flags: 64 });
        }

        if (cid === 'ui_cuahang') return interaction.reply({ content: '🛒 Bấm nút "Tọa Kỵ / Pet" để xem danh sách và dùng `/mua [ID]` để mua đồ.', flags: 64 });
        if (cid === 'ui_dophuong') {
            if (pData.nguyen_thach < 200) return interaction.reply({ content: '❌ Cần 200 Nguyên Thạch!', flags: 64 });
            const win = Math.random() >= 0.5;
            pData.nguyen_thach += win ? 200 : -200;
            saveDB();
            await interaction.update(buildControlPanel(interaction.user, pData));
            return interaction.followUp({ content: `🎲 Kết quả: Bạn **${win ? 'Thắng +200' : 'Thua -200'} 💎**!`, flags: 64 });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
