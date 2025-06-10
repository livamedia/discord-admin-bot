require('dotenv').config();
const { Client, GatewayIntentBits, Events, PermissionsBitField, EmbedBuilder } = require('discord.js');
const keepAlive = require('../server.js');

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
        GatewayIntentBits.DirectMessageReactions
    ]
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

client.once(Events.ClientReady, (c) => {
    console.log(`✅ ${c.user.tag} başarıyla giriş yaptı!`);
    client.user.setActivity('!yardım | Admin Bot', { type: 'WATCHING' });
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Yönetici komutları
    switch (command) {
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

        case 'temizle':
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) 
                return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
            
            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount < 1 || amount > 100) 
                return message.reply('❌ Lütfen 1-100 arası bir sayı girin!');
            
            try {
                await message.channel.bulkDelete(amount);
                message.channel.send(`✅ ${amount} mesaj silindi!`).then(msg => {
                    setTimeout(() => msg.delete(), 3000);
                });
            } catch (error) {
                message.reply('❌ Mesajları silerken bir hata oluştu!');
            }
            break;

        case 'rol-ver':
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) 
                return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
            
            const member = message.mentions.members.first();
            const role = message.mentions.roles.first();
            
            if (!member || !role) return message.reply('❌ Lütfen bir kullanıcı ve rol etiketleyin!');
            
            try {
                await member.roles.add(role);
                message.reply(`✅ ${member.user.tag} kullanıcısına ${role.name} rolü verildi!`);
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

        case 'yardım':
            const helpEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🛠️ Admin Bot Komutları')
                .setDescription('Aşağıdaki komutları kullanabilirsiniz:')
                .addFields(
                    { name: '!kick @kullanıcı [sebep]', value: 'Kullanıcıyı sunucudan atar' },
                    { name: '!ban @kullanıcı [sebep]', value: 'Kullanıcıyı sunucudan yasaklar' },
                    { name: '!temizle [1-100]', value: 'Belirtilen sayıda mesajı siler' },
                    { name: '!rol-ver @kullanıcı @rol', value: 'Kullanıcıya rol verir' },
                    { name: '!rol-al @kullanıcı @rol', value: 'Kullanıcıdan rol alır' },
                    { name: '!duyuru [mesaj]', value: 'Duyuru yapar' }
                )
                .setTimestamp();
            
            message.channel.send({ embeds: [helpEmbed] });
            break;
    }
});

keepAlive();
client.login(process.env.DISCORD_TOKEN); 