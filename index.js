const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Đọc cơ sở dữ liệu
let db = JSON.parse(fs.readFileSync('./index.json', 'utf8'));

function saveDB() {
    fs.writeFileSync('./index.json', JSON.stringify(db, null, 2));
}

// Khai báo Slash Commands
const commands = [
    new SlashCommandBuilder()
        .setName('start')
        .setDescription('Khởi tạo hồ sơ tu tiên của bạn')
        .addStringOption(option =>
            option.setName('system')
                .setDescription('Chọn hệ thống tu luyện')
                .setRequired(true)
                .addChoices(
                    { name: 'Phàm Nhân Tu Tiên', value: 'XiuXian' },
                    { name: 'Đấu Phá Thương Khung', value: 'DouQi' }
                )),
    new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Xem thông tin nhân vật tu tiên'),
    new SlashCommandBuilder()
        .setName('doihuong')
        .setDescription('Chuyển đổi giữa Phàm Nhân Tu Tiên và Đấu Phá Thương Khung'),
    new SlashCommandBuilder()
        .setName('tuluyen')
        .setDescription('Tĩnh tọa hấp thụ linh khí tăng tu vi tức thì')
].map(command => command.toJSON());

// Tự động đăng ký Slash Commands với Discord API khi Bot ready
client.once('ready', async () => {
    console.log(`⚡ Thiên Đạo Bot đã vận hành! Đăng nhập dưới tên: ${client.user.tag}`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('🔄 Đang đồng bộ Slash Commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('✅ Đã đồng bộ thành công Slash Commands trên toàn bộ Server!');
    } catch (error) {
        console.error('❌ Lỗi đồng bộ command:', error);
    }
});

// Xử lý các tương tác Slash Command
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, user } = interaction;
    const userId = user.id;

    // Lệnh /start
    if (commandName === 'start') {
        if (db.users[userId]) {
            return interaction.reply({ content: '❌ Đạo hữu đã nhập đạo rồi! Dùng `/profile` để kiểm tra.', flags: 64 });
        }

        const system = interaction.options.getString('system');
        const physique = db.physiques[Math.floor(Math.random() * db.physiques.length)];
        const root = db.spiritual_roots[Math.floor(Math.random() * db.spiritual_roots.length)];

        db.users[userId] = {
            system: system,
            level: 0,
            exp: 0,
            nguyen_thach: 1000,
            gold: 50,
            physique: physique,
            spiritual_root: root,
            dao_lu: "Chưa có",
            mount: "Không",
            pet: "Không",
            afk: false
        };

        saveDB();

        const sysName = system === 'XiuXian' ? 'Phàm Nhân Tu Tiên' : 'Đấu Phá Thương Khung';
        return interaction.reply({
            content: `🎉 **CHÚC MỪNG ĐẠO HỮU VƯỢT QUA KHOA BẢNG!**\n- Đường lối chọn: **${sysName}**\n- Thể chất ngẫu nhiên: ✨ **${physique}**\n- Linh căn ngẫu nhiên: 🌀 **${root}**\n\n🔹 Gõ \`/profile\` để xem bảng chỉ số.`
        });
    }

    // Lệnh /profile
    if (commandName === 'profile') {
        const playerData = db.users[userId];
        if (!playerData) {
            return interaction.reply({ content: '⚠️ Đạo hữu chưa có hồ sơ! Hãy dùng lệnh `/start` để khởi tạo.', flags: 64 });
        }

        const currentRealm = db.realms[playerData.system][playerData.level];

        const embed = new EmbedBuilder()
            .setTitle(`☯️ HỒ SƠ TU SĨ - ${user.username.toUpperCase()}`)
            .setColor(playerData.system === 'XiuXian' ? 0x00FF88 : 0xFF5500)
            .addFields(
                { name: '📜 Hệ Thống Tu Luyện', value: playerData.system === 'XiuXian' ? 'Phàm Nhân Tu Tiên' : 'Đấu Phá Thương Khung', inline: true },
                { name: '✨ Cảnh Giới', value: `${currentRealm.icon} ${currentRealm.name}`, inline: true },
                { name: '⚔️ Lực Chiến (CP)', value: `${currentRealm.base_cp.toLocaleString()}`, inline: true },
                { name: '❤️ Sinh Lực (HP)', value: `${currentRealm.base_hp.toLocaleString()}`, inline: true },
                { name: '🔷 Năng Lượng (MP)', value: `${currentRealm.base_mp.toLocaleString()}`, inline: true },
                { name: '🧘 Trạng Thái', value: playerData.afk ? '🔒 Bế Quan AFK' : '🟢 Nhàn Rỗi', inline: true },
                { name: '🧬 Thể Chất', value: playerData.physique, inline: true },
                { name: '🌀 Linh Căn', value: playerData.spiritual_root, inline: true },
                { name: '💖 Đạo Lữ', value: playerData.dao_lu, inline: true },
                { name: '💰 Tài Nguyên', value: `💎 **${playerData.nguyen_thach}** Nguyên Thạch | 🪙 **${playerData.gold}** Vàng`, inline: false },
                { name: '📊 Tu Vi (EXP)', value: `[${playerData.exp}/${currentRealm.exp_required}] EXP`, inline: false }
            )
            .setFooter({ text: 'Thiên Đạo Bot • Hệ Thống Tu Tiên Discord' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }

    // Lệnh /doihuong
    if (commandName === 'doihuong') {
        const playerData = db.users[userId];
        if (!playerData) {
            return interaction.reply({ content: '⚠️ Đạo hữu chưa nhập đạo! Dùng `/start` trước.', flags: 64 });
        }

        playerData.system = playerData.system === 'XiuXian' ? 'DouQi' : 'XiuXian';
        saveDB();

        const newSystem = playerData.system === 'XiuXian' ? 'Phàm Nhân Tu Tiên' : 'Đấu Phá Thương Khung';
        return interaction.reply({ content: `🔄 Đạo hữu đã chuyển hướng tu luyện sang: **${newSystem}**! Toàn bộ tu vi và thuộc tính được giữ nguyên.` });
    }

    // Lệnh /tuluyen
    if (commandName === 'tuluyen') {
        const playerData = db.users[userId];
        if (!playerData) {
            return interaction.reply({ content: '⚠️ Đạo hữu chưa nhập đạo! Dùng `/start` trước.', flags: 64 });
        }

        const expGained = Math.floor(Math.random() * 30) + 20;
        playerData.exp += expGained;
        saveDB();

        return interaction.reply({ content: `🧘 Đạo hữu nhập định tĩnh tọa, hấp thụ linh khí天地 nhận được **+${expGained} EXP**!` });
    }
});

// Chạy Bot bằng Token trong Environment Variable
client.login(process.env.DISCORD_TOKEN);
