const express = require('express');
const app = express();
require('dotenv').config();
const { Client, GatewayIntentBits, Events, PermissionsBitField, EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const AutoMod = require('./src/automod');
const LevelingSystem = require('./src/leveling');
const MusicSystem = require('./src/music');
const GiveawaySystem = require('./src/giveaway');
const WelcomeSystem = require('./src/welcome');
const keepAlive = require('./server.js');

// Web sunucusu ayarları
app.get('/', (req, res) => {
    res.send('Bot is running! 🚀');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});

// Ses kayıtları için veri yapısı
const voiceStates = new Map();
const voiceLogs = new Map();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Sistemleri başlat
client.once(Events.ClientReady, async () => {
    console.log(`✅ ${client.user.tag} başarıyla giriş yaptı!`);
    client.user.setActivity('!yardım | Admin Bot', { type: 'WATCHING' });

    // Sistemleri başlat
    await AutoMod.initialize(client);
    await LevelingSystem.initialize(client);
    await MusicSystem.initialize(client);
    await GiveawaySystem.initialize(client);
    await WelcomeSystem.initialize(client);
});

// Ses takip sistemi
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const member = newState.member;
    const userId = member.id;
    const now = Date.now();

    // Kullanıcı ses kanalına girdiğinde
    if (!oldState.channelId && newState.channelId) {
        voiceStates.set(userId, {
            channelId: newState.channelId,
            joinTime: now
        });
    }
    // Kullanıcı ses kanalından çıktığında
    else if (oldState.channelId && !newState.channelId) {
        const joinData = voiceStates.get(userId);
        if (joinData) {
            const duration = now - joinData.joinTime;
            const date = new Date().toLocaleDateString('tr-TR');
            
            if (!voiceLogs.has(date)) {
                voiceLogs.set(date, new Map());
            }
            
            const dailyLogs = voiceLogs.get(date);
            const previousDuration = dailyLogs.get(userId) || 0;
            dailyLogs.set(userId, previousDuration + duration);
            
            voiceStates.delete(userId);

            // Log kanalına bilgi gönder
            const logChannel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);
            if (logChannel) {
                const minutes = Math.floor(duration / 1000 / 60);
                logChannel.send(`📊 **${member.user.tag}** ses kanalında ${minutes} dakika geçirdi.`);
            }
        }
    }
});

// Ticket sistemi
async function createTicket(interaction, userName, nickname) {
    const guild = interaction.guild;
    const category = await guild.channels.cache.get(process.env.TICKET_CATEGORY_ID);
    
    const channel = await guild.channels.create({
        name: `ticket-${nickname}`,
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: [
            {
                id: guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: interaction.user.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            },
        ],
    });

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Ticket Oluşturuldu')
        .setDescription(`Kullanıcı Adı: ${userName}\nNickname: ${nickname}`)
        .setTimestamp();

    await channel.send({ embeds: [embed] });
    return channel;
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        const modal = {
            title: 'Ticket Oluştur',
            custom_id: 'ticket_modal',
            components: [{
                type: 1,
                components: [{
                    type: 4,
                    custom_id: 'userName',
                    label: 'Kullanıcı Adınız',
                    style: 1,
                    min_length: 1,
                    max_length: 32,
                    required: true,
                }]
            },
            {
                type: 1,
                components: [{
                    type: 4,
                    custom_id: 'nickname',
                    label: 'Nickname',
                    style: 1,
                    min_length: 1,
                    max_length: 32,
                    required: true,
                }]
            }]
        };

        await interaction.showModal(modal);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'ticket_modal') {
        const userName = interaction.fields.getTextInputValue('userName');
        const nickname = interaction.fields.getTextInputValue('nickname');

        const channel = await createTicket(interaction, userName, nickname);
        await interaction.reply({ content: `Ticket oluşturuldu: ${channel}`, ephemeral: true });
    }
});

// Mesaj eventi
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    // AutoMod kontrolü
    const isViolation = await AutoMod.checkMessage(message);
    if (isViolation) return;

    // Level sistemi
    await LevelingSystem.addMessageXP(message);

    // Komut işleme
    const prefixes = ['!'];
    const prefix = prefixes.find(p => message.content.startsWith(p));
    if (!prefix) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    switch (command) {
        // Mevcut komutlar
        case 'ping':
            await message.reply('Pong! 🏓');
            break;

        // Müzik komutları
        case 'play':
        case 'p':
            if (!args.length) {
                return message.reply('❌ Lütfen bir şarkı adı veya URL girin!');
            }
            await MusicSystem.play(message, args.join(' '));
            break;

        case 'skip':
            await MusicSystem.skip(message);
            break;

        case 'stop':
            await MusicSystem.stop(message);
            break;

        case 'pause':
            await MusicSystem.pause(message);
            break;

        case 'queue':
            await MusicSystem.queue(message);
            break;

        case 'volume':
            await MusicSystem.volume(message, args[0]);
            break;

        // Level komutları
        case 'rank':
        case 'level':
            const attachment = await LevelingSystem.createRankCard(message.member);
            await message.reply({ files: [attachment] });
            break;

        // Çekiliş komutları
        case 'çekiliş':
            await GiveawaySystem.createGiveaway(message, args);
            break;

        case 'reroll':
            if (!args[0]) {
                return message.reply('❌ Lütfen bir çekiliş ID\'si girin!');
            }
            await GiveawaySystem.reroll(message, args[0]);
            break;

        // Hoşgeldin sistemi komutları
        case 'hoşgeldin-kanal':
            const channel = message.mentions.channels.first();
            if (!channel) {
                return message.reply('❌ Lütfen bir kanal etiketleyin!');
            }
            await WelcomeSystem.setWelcomeChannel(message, channel);
            break;

        case 'otorol':
            const autoRole = message.mentions.roles.first();
            if (!autoRole) {
                return message.reply('❌ Lütfen bir rol etiketleyin!');
            }
            await WelcomeSystem.setAutoRole(message, autoRole);
            break;

        case 'hoşgeldin-mesaj':
            const newMessage = args.join(' ');
            if (!newMessage) {
                return message.reply('❌ Lütfen bir mesaj yazın!');
            }
            await WelcomeSystem.setWelcomeMessage(message, newMessage);
            break;

        case 'hoşgeldin-resim':
            await WelcomeSystem.toggleWelcomeImage(message);
            break;

        // Yardım komutu
        case 'yardım':
        case 'help':
            const helpEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🛠️ Admin Bot Komutları')
                .setDescription('Aşağıdaki komutları kullanabilirsiniz:')
                .addFields(
                    { name: '📊 Genel Komutlar', value: 
                        '`!ping` - Bot gecikmesini gösterir\n' +
                        '`!sunucu` - Sunucu istatistiklerini gösterir\n' +
                        '`!avatar [@kullanıcı]` - Kullanıcının avatarını gösterir'
                    },
                    { name: '🎵 Müzik Komutları', value: 
                        '`!play <şarkı>` - Şarkı çalar\n' +
                        '`!skip` - Şarkıyı atlar\n' +
                        '`!stop` - Müziği durdurur\n' +
                        '`!pause` - Müziği duraklatır/devam ettirir\n' +
                        '`!queue` - Sırayı gösterir\n' +
                        '`!volume <0-100>` - Ses seviyesini ayarlar'
                    },
                    { name: '⭐ Level Sistemi', value: 
                        '`!rank` - Level kartınızı gösterir'
                    },
                    { name: '🎉 Çekiliş Komutları', value: 
                        '`!çekiliş <süre> <kazanan> <ödül>` - Çekiliş başlatır\n' +
                        '`!reroll <mesaj ID>` - Çekilişi yeniden çeker'
                    },
                    { name: '👋 Hoşgeldin Sistemi', value: 
                        '`!hoşgeldin-kanal #kanal` - Hoşgeldin kanalını ayarlar\n' +
                        '`!otorol @rol` - Otomatik rol ayarlar\n' +
                        '`!hoşgeldin-mesaj <mesaj>` - Hoşgeldin mesajını ayarlar\n' +
                        '`!hoşgeldin-resim` - Resimli karşılamayı açar/kapatır'
                    },
                    { name: '⚔️ Moderasyon Komutları', value: 
                        '`!kick @kullanıcı [sebep]` - Kullanıcıyı sunucudan atar\n' +
                        '`!ban @kullanıcı [sebep]` - Kullanıcıyı sunucudan yasaklar\n' +
                        '`!temizle [1-100]` - Belirtilen sayıda mesajı siler\n' +
                        '`!rol-ver @kullanıcı @rol` - Kullanıcıya rol verir\n' +
                        '`!rol-al @kullanıcı @rol` - Kullanıcıdan rol alır\n' +
                        '`!duyuru [mesaj]` - Duyuru yapar'
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: `${message.guild.name} | Requested by ${message.author.tag}`,
                    iconURL: message.guild.iconURL()
                });
            
            await message.channel.send({ embeds: [helpEmbed] });
            break;

        case 'temizle':
        case 'clear':
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) 
                return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
            
            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount < 1 || amount > 100) 
                return message.reply('❌ Lütfen 1-100 arası bir sayı girin!');
            
            try {
                await message.channel.bulkDelete(amount);
                const msg = await message.channel.send(`✅ ${amount} mesaj silindi!`);
                setTimeout(() => msg.delete(), 3000);
            } catch (error) {
                message.reply('❌ Mesajları silerken bir hata oluştu!');
            }
            break;

        case 'kick':
            if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) 
                return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
            
            const userToKick = message.mentions.members.first();
            if (!userToKick) return message.reply('❌ Lütfen bir kullanıcı etiketleyin!');
            
            try {
                await userToKick.kick(args.join(' ') || 'Sebep belirtilmedi');
                message.reply(`✅ ${userToKick.user.tag} sunucudan atıldı!`);
            } catch (error) {
                message.reply('❌ Kullanıcıyı atarken bir hata oluştu!');
            }
            break;

        case 'ban':
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) 
                return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
            
            const userToBan = message.mentions.members.first();
            if (!userToBan) return message.reply('❌ Lütfen bir kullanıcı etiketleyin!');
            
            try {
                await userToBan.ban({ reason: args.join(' ') || 'Sebep belirtilmedi' });
                message.reply(`✅ ${userToBan.user.tag} sunucudan yasaklandı!`);
            } catch (error) {
                message.reply('❌ Kullanıcıyı yasaklarken bir hata oluştu!');
            }
            break;

        case 'rol-ver':
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) 
                return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
            
            const memberToRole = message.mentions.members.first();
            const roleToAdd = message.mentions.roles.first();
            
            if (!memberToRole || !roleToAdd) return message.reply('❌ Lütfen bir kullanıcı ve rol etiketleyin!');
            
            try {
                await memberToRole.roles.add(roleToAdd);
                message.reply(`✅ ${memberToRole.user.tag} kullanıcısına ${roleToAdd.name} rolü verildi!`);
            } catch (error) {
                message.reply('❌ Rol verirken bir hata oluştu!');
            }
            break;

        case 'rol-al':
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) 
                return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
            
            const targetMember = message.mentions.members.first();
            const targetRole = message.mentions.roles.first();
            
            if (!targetMember || !targetRole) return message.reply('❌ Lütfen bir kullanıcı ve rol etiketleyin!');
            
            try {
                await targetMember.roles.remove(targetRole);
                message.reply(`✅ ${targetMember.user.tag} kullanıcısından ${targetRole.name} rolü alındı!`);
            } catch (error) {
                message.reply('❌ Rol alınırken bir hata oluştu!');
            }
            break;

        case 'duyuru':
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) 
                return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
            
            const announcement = args.join(' ');
            if (!announcement) return message.reply('❌ Lütfen bir duyuru mesajı yazın!');
            
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('📢 DUYURU')
                .setDescription(announcement)
                .setTimestamp()
                .setFooter({ text: `${message.guild.name} | ${message.author.tag} tarafından`, iconURL: message.guild.iconURL() });
            
            try {
                await message.channel.send({ embeds: [embed] });
                message.delete();
            } catch (error) {
                message.reply('❌ Duyuru gönderilirken bir hata oluştu!');
            }
            break;

        case 'ticket':
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) 
                return message.reply('❌ Bu komutu kullanma yetkiniz yok!');

            const button = new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('Ticket Oluştur')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎫');

            const row = new ActionRowBuilder().addComponents(button);

            const ticketEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Ticket Sistemi')
                .setDescription('Ticket oluşturmak için aşağıdaki butona tıklayın.')
                .setTimestamp();

            await message.channel.send({ embeds: [ticketEmbed], components: [row] });
            break;

        case 'sesistatistik':
        case 'voicestats':
            if (!message.member.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) 
                return message.reply('❌ Bu komutu kullanma yetkiniz yok!');

            const date = args[0] || new Date().toLocaleDateString('tr-TR');
            const dailyStats = voiceLogs.get(date);

            if (!dailyStats) {
                return message.reply('❌ Bu tarih için istatistik bulunamadı!');
            }

            const statsEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`📊 Ses İstatistikleri (${date})`)
                .setDescription('Kullanıcıların ses kanallarında geçirdiği süreler:');

            for (const [userId, duration] of dailyStats) {
                const member = await message.guild.members.fetch(userId);
                const minutes = Math.floor(duration / 1000 / 60);
                statsEmbed.addFields({ name: member.user.tag, value: `${minutes} dakika`, inline: true });
            }

            await message.channel.send({ embeds: [statsEmbed] });
            break;

        case 'dmduyuru':
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) 
                return message.reply('❌ Bu komutu kullanma yetkiniz yok!');

            const dmMessage = args.join(' ');
            if (!dmMessage) return message.reply('❌ Lütfen bir mesaj yazın!');

            let successCount = 0;
            let failCount = 0;

            const members = await message.guild.members.fetch();
            for (const [id, member] of members) {
                try {
                    await member.send(dmMessage);
                    successCount++;
                } catch {
                    failCount++;
                }
            }

            message.reply(`✅ DM Duyurusu gönderildi!\nBaşarılı: ${successCount}\nBaşarısız: ${failCount}`);
            break;
    }
});

// Yeni üye katıldığında
client.on(Events.GuildMemberAdd, async (member) => {
    await WelcomeSystem.welcomeMember(member);
});

// Ses durumu değiştiğinde
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    // Kullanıcı ses kanalına girdiğinde
    if (!oldState.channelId && newState.channelId) {
        const voiceData = {
            joinTime: Date.now()
        };
        client.voiceStates.set(newState.member.id, voiceData);
    }
    // Kullanıcı ses kanalından çıktığında
    else if (oldState.channelId && !newState.channelId) {
        const voiceData = client.voiceStates.get(oldState.member.id);
        if (voiceData) {
            const duration = Date.now() - voiceData.joinTime;
            const minutes = Math.floor(duration / 1000 / 60);
            await LevelingSystem.addVoiceXP(oldState.member, minutes);
            client.voiceStates.delete(oldState.member.id);
        }
    }
});

// Hata yönetimi
client.on('error', error => {
    console.error('Discord bot hatası:', error);
});

client.on('disconnect', () => {
    console.log('Bot Discord\'dan ayrıldı, yeniden bağlanmaya çalışılıyor...');
});

client.on('reconnecting', () => {
    console.log('Bot yeniden bağlanıyor...');
});

client.on('resume', () => {
    console.log('Bot bağlantısı yeniden sağlandı!');
});

// Botu başlat
keepAlive();
client.login(process.env.DISCORD_TOKEN); 