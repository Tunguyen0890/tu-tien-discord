const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log(`Bot đã đăng nhập thành công với tên: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith('!play')) {
        const args = message.content.split(' ').slice(1).join(' ');
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) return message.reply('Bạn cần vào phòng thoại trước!');
        if (!args) return message.reply('Vui lòng nhập tên bài hát hoặc link!');

        // Kết nối vào phòng thoại
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        // Tìm kiếm và phát nhạc
        const stream = await play.stream(args);
        const resource = createAudioResource(stream.stream, { inputType: stream.type });
        const player = createAudioPlayer();

        player.play(resource);
        connection.subscribe(player);

        message.reply(`🎵 Đang phát: **${args}**`);
    }
});

client.login('TOKEN_BOT_CỦA_BẠN_O_DAY');
