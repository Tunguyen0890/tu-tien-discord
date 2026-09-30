const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let db = JSON.parse(fs.readFileSync('./index.json', 'utf8'));

function saveDB() {
    fs.writeFileSync('./index.json', JSON.stringify(db, null, 2));
}

const commands = [
    new SlashCommandBuilder().setName('start').setDescription('Khởi tạo hồ sơ tu tiên nhân vật')
        .addStringOption(opt => opt.setName('system').setDescription('Chọn hệ thống').setRequired(true)
            .addChoices({ name: 'Phàm Nhân Tu Tiên', value: 'XiuXian' }, { name: 'Đấu Phá Thương Khung', value: 'DouQi' })),
    
    new SlashCommandBuilder().setName('profile').setDescription('Xem hồ sơ chi tiết và Avatar nhân vật'),
    new SlashCommandBuilder().setName('doihuong').setDescription('Đổi đường lối tu luyện (Giữ nguyên toàn bộ chỉ số)'),
    new SlashCommandBuilder().setName('tuluyen').setDescription('Tĩnh tọa hấp thụ linh khí tích lũy tu vi'),
    
    new SlashCommandBuilder().setName('dongphu').setDescription('Quản lý động phủ treo máy AFK')
        .addSubcommand(sub => sub.setName('bequan').setDescription('Bắt đầu bế quan tích lũy tài nguyên'))
        .addSubcommand(sub => sub.setName('xuatquan').setDescription('Xuất quan nhận thành quả bế quan')),
        
    new SlashCommandBuilder().setName('dotpha').setDescription('Độ kiếp đột phá cảnh giới (Kèm hiệu ứng GIF)'),
    new SlashCommandBuilder().setName('phithang').setDescription('Phi thăng Tiên Giới / Đấu Đế Giới'),
    new SlashCommandBuilder().setName('songtu').setDescription('Kết duyên/Song tu với đạo hữu')
        .addUserOption(opt => opt.setName('target').setDescription('Đạo hữu muốn song tu').setRequired(true)),
        
    new SlashCommandBuilder().setName('bicanh').setDescription('Tham gia phó bản/bí cảnh săn đồ hiếm'),
    new SlashCommandBuilder().setName('pk').setDescription('Giao đấu PK với đạo hữu khác')
        .addUserOption(opt => opt.setName('target').setDescription('Đối thủ').setRequired(true)),
    new SlashCommandBuilder().setName('worldboss').setDescription('Săn Boss Thế Giới'),
    
    new SlashCommandBuilder().setName('shop').setDescription('Xem cửa hàng thường (Mua bằng Nguyên Thạch)'),
    new SlashCommandBuilder().setName('globalshop').setDescription('Xem Shop Thế Giới cao cấp (Mua bằng Vàng)'),
    new SlashCommandBuilder().setName('mua').setDescription('Mua vật phẩm từ Shop')
        .addStringOption(opt => opt.setName('item_id').setDescription('Mã vật phẩm').setRequired(true)),
        
    new SlashCommandBuilder().setName('taixiu').setDescription('Đặt cược Sòng Bạc Tu Tiên')
        .addStringOption(opt => opt.setName('chon').setDescription('Tài hoặc Xỉu').setRequired(true).addChoices({ name: 'Tài', value: 'tai' }, { name: 'Xỉu', value: 'xiu' }))
        .addIntegerOption(opt => opt.setName('cuoc').setDescription('Số Nguyên Thạch cược').setRequired(true)),
        
    new SlashCommandBuilder().setName('bxh').setDescription('Xem Bảng Xếp Hạng Thế Giới')
        .addStringOption(opt => opt.setName('type').setDescription('Loại BXH').setRequired(true)
            .addChoices({ name: 'Cảnh Giới', value: 'canhgioi' }, { name: 'Lực Chiến', value: 'chienluc' }, { name: 'Đại Phú Hào', value: 'daiphutho' })),
            
    new SlashCommandBuilder().setName('setchannel').setDescription('Chỉ định kênh chạy lệnh Tu Tiên (Admin)')
        .addChannelOption(opt => opt.setName('channel').setDescription('Kênh chỉ định').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder().setName('admin').setDescription('Tất cả quyền hạn quản trị hệ thống Tu Tiên (Admin Only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub.setName('give').setDescription('Ban thưởng tài sản/tu vi')
            .addUserOption(opt => opt.setName('user').setDescription('Người nhận').setRequired(true))
            .addStringOption(opt => opt.setName('type').setDescription('Loại').setRequired(true).addChoices({ name: 'EXP', value: 'exp' }, { name: 'Nguyên Thạch', value: 'nguyen_thach' }, { name: 'Vàng', value: 'gold' }))
            .addIntegerOption(opt => opt.setName('amount').setDescription('Số lượng').setRequired(true)))
        .addSubcommand(sub => sub.setName('take').setDescription('Thu hồi/Tịch thu tài sản')
            .addUserOption(opt => opt.setName('user').setDescription('Đối tượng').setRequired(true))
            .addStringOption(opt => opt.setName('type').setDescription('Loại').setRequired(true).addChoices({ name: 'EXP', value: 'exp' }, { name: 'Nguyên Thạch', value: 'nguyen_thach' }, { name: 'Vàng', value: 'gold' }))
            .addIntegerOption(opt => opt.setName('amount').setDescription('Số lượng').setRequired(true)))
        .addSubcommand(sub => sub.setName('punish').setDescription('Tế tu vi, giáng cảnh giới')
            .addUserOption(opt => opt.setName('user').setDescription('Đối tượng').setRequired(true))
            .addIntegerOption(opt => opt.setName('levels').setDescription('Số cấp giáng').setRequired(true)))
        .addSubcommand(sub => sub.setName('spawnboss').setDescription('Triệu hồi Boss Thế Giới')
            .addStringOption(opt => opt.setName('name').setDescription('Tên Boss').setRequired(true))
            .addIntegerOption(opt => opt.setName('hp').setDescription('Lượng Máu Boss').setRequired(true)))
].map(c => c.toJSON());

client.once('ready', async () => {
    console.log(`⚡ Thiên Đạo Bot đã vận hành thành công dưới tên: ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Đã đồng bộ tất cả 100% Slash Commands thành công!');
    } catch (err) {
        console.error('❌ Lỗi đồng bộ lệnh:', err);
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const userId = message.author.id;
    
    if (db.config.channel_id && message.channel.id !== db.config.channel_id) return;
    
    if (db.users[userId]) {
        const expAdd = Math.floor(Math.random() * 5) + 2;
        const stoneAdd = Math.floor(Math.random() * 3) + 1;
        db.users[userId].exp += expAdd;
        db.users[userId].nguyen_thach += stoneAdd;
        saveDB();
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (db.config.channel_id && interaction.channelId !== db.config.channel_id && interaction.commandName !== 'setchannel') {
        return interaction.reply({ content: `⚠️ Thiên Đạo Bot chỉ hoạt động tại kênh <#${db.config.channel_id}>!`, flags: 64 });
    }

    const { commandName, user, options } = interaction;
    const userId = user.id;

    if (commandName === 'setchannel') {
        const channel = options.getChannel('channel');
        db.config.channel_id = channel.id;
        saveDB();
        return interaction.reply({ content: `✅ Đã thiết lập thành công kênh lệnh duy nhất: ${channel}` });
    }

    if (commandName === 'start') {
        if (db.users[userId]) return interaction.reply({ content: '❌ Đạo hữu đã nhập đạo từ trước! Hãy dùng `/profile`.', flags: 64 });
        const system = options.getString('system');
        const phys = db.physiques[Math.floor(Math.random() * db.physiques.length)];
        const root = db.spiritual_roots[Math.floor(Math.random() * db.spiritual_roots.length)];

        db.users[userId] = {
            system: system, level: 0, exp: 0, nguyen_thach: 1000, gold: 50,
            physique: phys.name, spiritual_root: root, dao_lu: "Chưa có",
            mount: "Chưa có", pet: "Chưa có", afk_start: null
        };
        saveDB();
        const sysText = system === 'XiuXian' ? 'Phàm Nhân Tu Tiên' : 'Đấu Phá Thương Khung';
        return interaction.reply({ content: `🎉 **KHỞI TẠO HỒ SƠ THÀNH CÔNG!**\n- Hệ thống: **${sysText}**\n- Thể chất: ✨ **${phys.name}**\n- Linh căn: 🌀 **${root}**\n\nDùng lệnh \`/profile\` để kiểm tra thông số.` });
    }

    const pData = db.users[userId];
    if (!pData && commandName !== 'admin') {
        return interaction.reply({ content: '⚠️ Đạo hữu chưa tạo nhân vật! Gõ `/start` để khởi tạo.', flags: 64 });
    }

    if (commandName === 'profile') {
        const realmList = db.realms[pData.system];
        const curRealm = realmList[pData.level];
        const avatarURL = user.displayAvatarURL({ dynamic: true, size: 512 });

        const embed = new EmbedBuilder()
            .setTitle(`☯️ HỒ SƠ TU SĨ - ${user.username.toUpperCase()}`)
            .setThumbnail(avatarURL)
            .setColor(pData.system === 'XiuXian' ? 0x00FF88 : 0xFF5500)
            .addFields(
                { name: '📜 Hệ Thống', value: pData.system === 'XiuXian' ? 'Phàm Nhân Tu Tiên' : 'Đấu Phá Thương Khung', inline: true },
                { name: '✨ Cảnh Giới', value: `${curRealm.icon} ${curRealm.name}`, inline: true },
                { name: '⚔️ Lực Chiến (CP)', value: `${(curRealm.base_cp).toLocaleString()}`, inline: true },
                { name: '❤️ HP / 🔷 MP', value: `${curRealm.base_hp} / ${curRealm.base_mp}`, inline: true },
                { name: '🧬 Thể Chất', value: pData.physique, inline: true },
                { name: '🌀 Linh Căn', value: pData.spiritual_root, inline: true },
                { name: '💖 Đạo Lữ', value: pData.dao_lu, inline: true },
                { name: '🐉 Tọa Kỵ / Pet', value: `${pData.mount} | ${pData.pet}`, inline: true },
                { name: '🔒 Động Phủ', value: pData.afk_start ? '🧘 Đang Bế Quan AFK' : '🟢 Nhàn Rỗi', inline: true },
                { name: '💰 Tài Nguyên', value: `💎 **${pData.nguyen_thach}** Nguyên Thạch | 🪙 **${pData.gold}** Vàng`, inline: false },
                { name: '📊 Tu Vi (EXP)', value: `[${pData.exp}/${curRealm.exp_required}] EXP`, inline: false }
            )
            .setFooter({ text: 'Thiên Đạo Bot • Quản Lý Discord Server toàn năng' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'doihuong') {
        pData.system = pData.system === 'XiuXian' ? 'DouQi' : 'XiuXian';
        saveDB();
        const sysText = pData.system === 'XiuXian' ? 'Phàm Nhân Tu Tiên' : 'Đấu Phá Thương Khung';
        return interaction.reply({ content: `🔄 Đạo hữu đã chuyển hướng tu luyện sang **${sysText}** thành công! Mọi tài sản và tu vi giữ nguyên.` });
    }

    if (commandName === 'tuluyen') {
        const expGet = Math.floor(Math.random() * 40) + 20;
        pData.exp += expGet;
        saveDB();
        return interaction.reply({ content: `🧘 Đạo hữu tĩnh tọa vận chuyển chu thiên, linh khí nhập thể nhận **+${expGet} EXP**!` });
    }

    if (commandName === 'dotpha') {
        const curRealm = db.realms[pData.system][pData.level];
        if (pData.exp < curRealm.exp_required) {
            return interaction.reply({ content: `❌ Tu vi chưa đủ viên mãn! Cần \`[${pData.exp}/${curRealm.exp_required}]\` EXP để đột phá.`, flags: 64 });
        }

        const success = Math.random() < 0.75;
        if (success) {
            pData.level += 1;
            pData.exp = 0;
            saveDB();
            const newRealm = db.realms[pData.system][pData.level];

            const embed = new EmbedBuilder()
                .setTitle(`⚡ ĐỘ KIẾP THÀNH CÔNG! UY ÁP TRỜI ĐẤT!`)
                .setDescription(`Chúc mừng **${user.username}** đã vượt qua Thiên Kiếp, đột phá lên cảnh giới **${newRealm.icon} ${newRealm.name}**!`)
                .setImage(newRealm.gif)
                .setColor(0xFFFF00);

            return interaction.reply({ embeds: [embed] });
        } else {
            pData.exp = Math.floor(pData.exp * 0.8);
            saveDB();
            return interaction.reply({ content: `⚡ Thiên kiếp quá càn quét! Đột phá thất bại, đạo hữu tổn hại 20% tu vi!` });
        }
    }

    if (commandName === 'dongphu') {
        const sub = options.getSubcommand();
        if (sub === 'bequan') {
            if (pData.afk_start) return interaction.reply({ content: '🔒 Đạo hữu đang trong trạng thái bế quan rồi!', flags: 64 });
            pData.afk_start = Date.now();
            saveDB();
            return interaction.reply({ content: '🧘 Đạo hữu đã đóng cửa Động Phủ, bắt đầu quá trình bế quan tu luyện...' });
        }
        if (sub === 'xuatquan') {
            if (!pData.afk_start) return interaction.reply({ content: '❌ Đạo hữu chưa bế quan!', flags: 64 });
            const hours = Math.min((Date.now() - pData.afk_start) / (1000 * 60 * 60), 24);
            const expReward = Math.floor(hours * 500);
            const stoneReward = Math.floor(hours * 200);

            pData.exp += expReward;
            pData.nguyen_thach += stoneReward;
            pData.afk_start = null;
            saveDB();

            return interaction.reply({ content: `🔓 **XUẤT QUAN THÀNH CÔNG!**\nBế quan trong \`${hours.toFixed(1)}\` giờ. Thu hoạch:\n- EXP Tu Vi: **+${expReward}**\n- Nguyên Thạch: **+${stoneReward}** 💎` });
        }
    }

    if (commandName === 'taixiu') {
        const choice = options.getString('chon');
        const bet = options.getInteger('cuoc');

        if (pData.nguyen_thach < bet) return interaction.reply({ content: '❌ Đạo hữu không đủ Nguyên Thạch!', flags: 64 });

        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const d3 = Math.floor(Math.random() * 6) + 1;
        const total = d1 + d2 + d3;
        const result = total >= 11 ? 'tai' : 'xiu';

        if (choice === result) {
            pData.nguyen_thach += bet;
            saveDB();
            return interaction.reply({ content: `🎲 Kèo lắc ra **[${d1}][${d2}][${d3}] = ${total}** (${result.toUpperCase()})!\n🎉 Đạo hữu đoán đúng, nhận **+${bet} Nguyên Thạch**!` });
        } else {
            pData.nguyen_thach -= bet;
            saveDB();
            return interaction.reply({ content: `🎲 Kèo lắc ra **[${d1}][${d2}][${d3}] = ${total}** (${result.toUpperCase()})!\n💔 Đạo hữu đoán sai, mất **-${bet} Nguyên Thạch**!` });
        }
    }

    if (commandName === 'bxh') {
        const type = options.getString('type');
        let userArray = Object.entries(db.users).map(([id, val]) => ({ id, ...val }));

        if (type === 'canhgioi') userArray.sort((a, b) => b.level - a.level);
        if (type === 'chienluc') userArray.sort((a, b) => (db.realms[b.system][b.level].base_cp) - (db.realms[a.system][a.level].base_cp));
        if (type === 'daiphutho') userArray.sort((a, b) => b.nguyen_thach - a.nguyen_thach);

        let desc = "";
        for (let i = 0; i < Math.min(userArray.length, 10); i++) {
            const u = userArray[i];
            const rName = db.realms[u.system][u.level].name;
            desc += `**#${i + 1}** <@${u.id}> - ${rName} | 💎 ${u.nguyen_thach.toLocaleString()} Nguyên Thạch\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle(`🏆 BẢNG XẾP HẠNG THẾ GIỚI - ${type.toUpperCase()}`)
            .setDescription(desc || "Chưa có dữ liệu cao thủ!")
            .setColor(0xFFD700);

        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'admin') {
        const sub = options.getSubcommand();
        const target = options.getUser('user');
        const amount = options.getInteger('amount');
        const type = options.getString('type');

        if (sub === 'give') {
            if (!db.users[target.id]) return interaction.reply({ content: '❌ Người chơi chưa nhập đạo!', flags: 64 });
            db.users[target.id][type] += amount;
            saveDB();
            return interaction.reply({ content: `✅ Đã ban thưởng **+${amount} ${type}** cho <@${target.id}>!` });
        }

        if (sub === 'take') {
            if (!db.users[target.id]) return interaction.reply({ content: '❌ Người chơi chưa nhập đạo!', flags: 64 });
            db.users[target.id][type] = Math.max(0, db.users[target.id][type] - amount);
            saveDB();
            return interaction.reply({ content: `✅ Đã tịch thu **-${amount} ${type}** của <@${target.id}>!` });
        }

        if (sub === 'punish') {
            const levels = options.getInteger('levels');
            if (!db.users[target.id]) return interaction.reply({ content: '❌ Người chơi chưa nhập đạo!', flags: 64 });
            db.users[target.id].level = Math.max(0, db.users[target.id].level - levels);
            saveDB();
            return interaction.reply({ content: `⚖️ THIÊN ĐẠO TRỪ PHẠT! Đã giáng **${levels} cảnh giới** của <@${target.id}>!` });
        }

        if (sub === 'spawnboss') {
            const bossName = options.getString('name');
            const hp = options.getInteger('hp');
            db.config.world_boss = { name: bossName, max_hp: hp, cur_hp: hp };
            saveDB();

            const embed = new EmbedBuilder()
                .setTitle(`🔥 BOSS THẾ GIỚI XUẤT THẾ: ${bossName.toUpperCase()}`)
                .setDescription(`Máu Boss: **${hp.toLocaleString()} HP**!\nToàn bộ đạo hữu hãy gõ \`/worldboss\` để tham gia tiêu diệt!`)
                .setColor(0xFF0000);

            return interaction.reply({ embeds: [embed] });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
