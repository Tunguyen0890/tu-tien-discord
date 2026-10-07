const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// THAY TOKEN BOT CỦA BẠN VÀO ĐÂY (Hoặc dùng process.env.DISCORD_TOKEN trên Railway)
const TOKEN = process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN_HERE';

// Lưu trữ trạng thái bàn chơi theo Channel ID
const games = new Map();

// --- BỘ BÀI & TIỆN ÍCH ---
const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function calculateHand(hand) {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    if (['J', 'Q', 'K'].includes(card.value)) {
      total += 10;
    } else if (card.value === 'A') {
      aces += 1;
    } else {
      total += parseInt(card.value);
    }
  }

  // TÍNH ĐIỂM XÌ LÁT VIỆT NAM CHO LÁ ÁCH (A)
  if (hand.length === 2 && aces === 2) return { score: 22, type: 'XI_BAN' };
  if (hand.length === 2 && aces === 1 && total === 10) return { score: 21, type: 'XI_DACH' };

  // Bài >= 3 lá: A linh hoạt 10, 11 hoặc 1 điểm tùy tổng
  for (let i = 0; i < aces; i++) {
    if (total + 11 <= 21 && (total + 11 + (aces - 1 - i)) <= 21) {
      total += 11;
    } else if (total + 10 <= 21 && (total + 10 + (aces - 1 - i)) <= 21) {
      total += 10;
    } else {
      total += 1;
    }
  }

  if (hand.length === 5 && total <= 21) return { score: total, type: 'NGU_LINH' };
  if (total > 21) return { score: total, type: 'QUAC' };
  return { score: total, type: 'NORMAL' };
}

function formatHand(hand, hideFirst = false) {
  if (hideFirst) {
    return `🎴 ${hand.slice(1).map(c => `[${c.value}${c.suit}]`).join(' ')}`;
  }
  return hand.map(c => `[${c.value}${c.suit}]`).join(' ');
}

// --- XỬ LÝ GAME ---
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!xilat' || message.content === '!xilatchoi') {
    if (games.has(message.channel.id)) {
      return message.reply('⚠️ Đang có bàn chơi dang dở ở kênh này!');
    }

    const game = {
      host: message.author, // Người mở bàn làm Nhà Cái
      players: [{ user: message.author, hand: [], status: 'PLAYING', isDealer: true }],
      deck: createDeck(),
      state: 'WAITING', // WAITING, PLAYING, ENDED
      currentIndex: 1, // Bắt đầu lượt từ nhà con đầu tiên
    };

    games.set(message.channel.id, game);

    const embed = new EmbedBuilder()
      .setTitle('🎲 BÀN CHƠI XÌ LÁT MULTIPLAYER (TỐI ĐA 11 NGƯỜI)')
      .setDescription(`👑 **Nhà Cái:** ${message.author}\n\nNhấn **Tham Gia** để chơi (Tối đa 10 nhà con).\nNhà cái nhấn **Bắt Đầu** khi đã đủ người!`)
      .setColor('#2b2d31');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_game').setLabel('Tham Gia').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('start_game').setLabel('Bắt Đầu Game').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('cancel_game').setLabel('Hủy Bàn').setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const game = games.get(interaction.channelId);
  if (!game) {
    return interaction.reply({ content: '❌ Bàn chơi đã kết thúc hoặc không tồn tại!', ephemeral: true });
  }

  const { customId, user } = interaction;

  // 1. THAM GIA BÀN
  if (customId === 'join_game') {
    if (game.state !== 'WAITING') return interaction.reply({ content: 'Game đã bắt đầu!', ephemeral: true });
    if (game.players.some(p => p.user.id === user.id)) return interaction.reply({ content: 'Bạn đã ở trong bàn!', ephemeral: true });
    if (game.players.length >= 11) return interaction.reply({ content: 'Bàn đã đầy (1 Cái + 10 Con)!', ephemeral: true });

    game.players.push({ user, hand: [], status: 'PLAYING', isDealer: false });
    return interaction.reply({ content: `✅ **${user.username}** đã tham gia bàn! (${game.players.length}/11)`, ephemeral: false });
  }

  // 2. HỦY BÀN
  if (customId === 'cancel_game') {
    if (user.id !== game.host.id) return interaction.reply({ content: 'Chỉ Nhà Cái mới có quyền hủy bàn!', ephemeral: true });
    games.delete(interaction.channelId);
    return interaction.update({ content: '❌ Bàn chơi đã bị hủy.', embeds: [], components: [] });
  }

  // 3. BẮT ĐẦU GAME
  if (customId === 'start_game') {
    if (user.id !== game.host.id) return interaction.reply({ content: 'Chỉ Nhà Cái mới có thể bắt đầu!', ephemeral: true });
    if (game.players.length < 2) return interaction.reply({ content: 'Cần ít nhất 2 người (1 Cái + 1 Con) để bắt đầu!', ephemeral: true });

    game.state = 'PLAYING';

    // Chia 2 lá đầu tiên
    for (let i = 0; i < 2; i++) {
      for (const p of game.players) {
        p.hand.push(game.deck.pop());
      }
    }

    updateGameUI(interaction, game, `🎲 **Game bắt đầu!**\nĐang tới lượt của: ${game.players[game.currentIndex].user}`);
  }

  // 4. RÚT BÀI (HIT)
  if (customId === 'hit') {
    const currentPlayer = game.players[game.currentIndex];
    if (user.id !== currentPlayer.user.id) return interaction.reply({ content: 'Chưa tới lượt của bạn!', ephemeral: true });

    currentPlayer.hand.push(game.deck.pop());
    const handInfo = calculateHand(currentPlayer.hand);

    if (handInfo.type === 'QUAC' || currentPlayer.hand.length === 5) {
      nextTurn(interaction, game);
    } else {
      updateGameUI(interaction, game, `🃏 ${user} vừa rút thêm 1 lá.`);
    }
  }

  // 5. DẰN BÀI (STAND)
  if (customId === 'stand') {
    const currentPlayer = game.players[game.currentIndex];
    if (user.id !== currentPlayer.user.id) return interaction.reply({ content: 'Chưa tới lượt của bạn!', ephemeral: true });

    const handInfo = calculateHand(currentPlayer.hand);
    if (!currentPlayer.isDealer && handInfo.score < 16 && handInfo.type === 'NORMAL') {
      return interaction.reply({ content: '⚠️ Bài dưới 16 điểm chưa đủ tuổi dằn!', ephemeral: true });
    }
    if (currentPlayer.isDealer && handInfo.score < 15 && handInfo.type === 'NORMAL') {
      return interaction.reply({ content: '⚠️ Nhà Cái phải từ 15 điểm trở lên mới được dằn!', ephemeral: true });
    }

    nextTurn(interaction, game);
  }
});

function nextTurn(interaction, game) {
  game.currentIndex++;

  if (game.currentIndex >= game.players.length) {
    endGame(interaction, game);
  } else {
    const nextPlayer = game.players[game.currentIndex];
    const msg = nextPlayer.isDealer 
      ? `👑 **Đã tới lượt Nhà Cái (${nextPlayer.user}) rút/dằn bài!**` 
      : `👉 Tới lượt của nhà con: ${nextPlayer.user}`;
    updateGameUI(interaction, game, msg);
  }
}

async function updateGameUI(interaction, game, statusMessage) {
  const embed = new EmbedBuilder()
    .setTitle('🎴 BÀN XÌ LÁT - ĐANG CHƠI')
    .setColor('#0099ff')
    .setDescription(statusMessage);

  const dealer = game.players[0];
  const dealerInfo = calculateHand(dealer.hand);
  
  const isDealerTurn = game.currentIndex === 0;
  embed.addFields({
    name: `👑 Nhà Cái: ${dealer.user.username}`,
    value: isDealerTurn ? `Bài: ${formatHand(dealer.hand)} (${dealerInfo.score}đ)` : `Bài: ${formatHand(dealer.hand, true)}`,
  });

  for (let i = 1; i < game.players.length; i++) {
    const p = game.players[i];
    const info = calculateHand(p.hand);
    const isCurrent = game.currentIndex === i;
    
    let tag = isCurrent ? '➡️ ' : '';
    let statusText = `Bài: ${formatHand(p.hand)} | Điểm: ${info.score}`;
    if (info.type === 'XI_BAN') statusText = `Bài: ${formatHand(p.hand)} | 🔥 **XÌ BÀN**`;
    if (info.type === 'XI_DACH') statusText = `Bài: ${formatHand(p.hand)} | ✨ **XÌ DÁCH**`;
    if (info.type === 'QUAC') statusText = `Bài: ${formatHand(p.hand)} | 💥 **QUẮC (${info.score}đ)**`;

    embed.addFields({
      name: `${tag}Nhà con ${i}: ${p.user.username}`,
      value: statusText,
      inline: false
    });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('hit').setLabel('Rút Bài').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('stand').setLabel('Dằn Bài').setStyle(ButtonStyle.Secondary)
  );

  if (interaction.replied || interaction.deferred) {
    await interaction.editReply({ embeds: [embed], components: [row] });
  } else {
    await interaction.update({ embeds: [embed], components: [row] });
  }
}

async function endGame(interaction, game) {
  const dealer = game.players[0];
  const dealerInfo = calculateHand(dealer.hand);

  const embed = new EmbedBuilder()
    .setTitle('🏆 KẾT QUẢ VÁN XÌ LÁT')
    .setColor('#00ff00')
    .addFields({
      name: `👑 Nhà Cái: ${dealer.user.username}`,
      value: `Bài: ${formatHand(dealer.hand)} | Điểm: ${dealerInfo.score} (${dealerInfo.type})`
    });

  for (let i = 1; i < game.players.length; i++) {
    const p = game.players[i];
    const pInfo = calculateHand(p.hand);
    let result = '';

    if (pInfo.type === 'XI_BAN' && dealerInfo.type !== 'XI_BAN') result = '🎉 **THẮNG** (Xì Bàn)';
    else if (dealerInfo.type === 'XI_BAN' && pInfo.type !== 'XI_BAN') result = '❌ **THUA** (Cái Xì Bàn)';
    else if (pInfo.type === 'XI_DACH' && dealerInfo.type !== 'XI_DACH') result = '🎉 **THẮNG** (Xì Dách)';
    else if (dealerInfo.type === 'XI_DACH' && pInfo.type !== 'XI_DACH') result = '❌ **THUA** (Cái Xì Dách)';
    else if (pInfo.type === 'NGU_LINH' && dealerInfo.type !== 'NGU_LINH') result = '🎉 **THẮNG** (Ngũ Linh)';
    else if (dealerInfo.type === 'NGU_LINH') result = '❌ **THUA** (Cái Ngũ Linh)';
    else if (pInfo.type === 'QUAC' && dealerInfo.type === 'QUAC') result = '🤝 **HÒA** (Cùng Quắc)';
    else if (pInfo.type === 'QUAC') result = '❌ **THUA** (Quắc)';
    else if (dealerInfo.type === 'QUAC') result = '🎉 **THẮNG** (Cái Quắc)';
    else if (pInfo.score > dealerInfo.score) result = '🎉 **THẮNG**';
    else if (pInfo.score < dealerInfo.score) result = '❌ **THUA**';
    else result = '🤝 **HÒA**';

    embed.addFields({
      name: `Nhà con: ${p.user.username}`,
      value: `Bài: ${formatHand(p.hand)} (${pInfo.score}đ) ➔ ${result}`,
      inline: false
    });
  }

  games.delete(interaction.channelId);
  await interaction.update({ embeds: [embed], components: [] });
}

// Bắt sự kiện Bot đăng nhập thành công
client.once('ready', () => {
  console.log(`🤖 Bot online với tên: ${client.user.tag}`);
});

// Đăng nhập bot
client.login(TOKEN);
