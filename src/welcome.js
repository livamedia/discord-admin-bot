const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const Canvas = require('canvas');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

class WelcomeSystem {
    static async initialize(client) {
        // Varsayılan ayarları yükle
        const settings = await db.get('welcome_settings') || {
            enabled: true,
            channel: null,
            message: 'Hoş geldin {user}! Sunucumuzun {count}. üyesisin!',
            image: true,
            color: '#00ff00',
            autoRole: null
        };

        client.welcomeSettings = settings;
    }

    static async createWelcomeImage(member) {
        const canvas = Canvas.createCanvas(1024, 500);
        const ctx = canvas.getContext('2d');

        // Arkaplan
        const background = await Canvas.loadImage('https://i.imgur.com/8F1NNx6.png');
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        // Yarı saydam overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Daire içinde avatar
        ctx.beginPath();
        ctx.arc(512, 166, 128, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        const avatar = await Canvas.loadImage(
            member.user.displayAvatarURL({ extension: 'png', size: 1024 })
        );
        ctx.drawImage(avatar, 384, 38, 256, 256);

        // Yazı ayarları
        ctx.font = '72px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';

        // Hoş geldin mesajı
        ctx.font = '42px sans-serif';
        ctx.fillText(`Hoş Geldin ${member.user.username}!`, 512, 360);

        // Üye sayısı
        ctx.font = '32px sans-serif';
        ctx.fillText(
            `Sunucumuzun ${member.guild.memberCount}. üyesisin!`,
            512,
            400
        );

        return new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome.png' });
    }

    static async welcomeMember(member) {
        const settings = member.client.welcomeSettings;
        if (!settings.enabled) return;

        const channel = member.guild.channels.cache.get(settings.channel);
        if (!channel) return;

        try {
            // Hoşgeldin mesajı
            let message = settings.message
                .replace('{user}', member)
                .replace('{count}', member.guild.memberCount)
                .replace('{server}', member.guild.name);

            const embed = new EmbedBuilder()
                .setColor(settings.color)
                .setTitle('👋 Yeni Üye!')
                .setDescription(message)
                .setTimestamp();

            // Resimli karşılama
            if (settings.image) {
                const attachment = await this.createWelcomeImage(member);
                embed.setImage('attachment://welcome.png');
                await channel.send({ embeds: [embed], files: [attachment] });
            } else {
                await channel.send({ embeds: [embed] });
            }

            // Otomatik rol
            if (settings.autoRole) {
                const role = member.guild.roles.cache.get(settings.autoRole);
                if (role) {
                    await member.roles.add(role);
                }
            }
        } catch (error) {
            console.error('Hoşgeldin mesajı gönderilirken hata:', error);
        }
    }

    static async updateSettings(settings) {
        await db.set('welcome_settings', settings);
    }

    static async setWelcomeChannel(message, channel) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
        }

        const settings = message.client.welcomeSettings;
        settings.channel = channel.id;
        await this.updateSettings(settings);

        return message.reply(`✅ Hoşgeldin kanalı ${channel} olarak ayarlandı!`);
    }

    static async setAutoRole(message, role) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
        }

        const settings = message.client.welcomeSettings;
        settings.autoRole = role.id;
        await this.updateSettings(settings);

        return message.reply(`✅ Otomatik rol ${role} olarak ayarlandı!`);
    }

    static async toggleWelcome(message) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
        }

        const settings = message.client.welcomeSettings;
        settings.enabled = !settings.enabled;
        await this.updateSettings(settings);

        return message.reply(`✅ Hoşgeldin sistemi ${settings.enabled ? 'aktif' : 'devre dışı'} edildi!`);
    }

    static async setWelcomeMessage(message, newMessage) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
        }

        const settings = message.client.welcomeSettings;
        settings.message = newMessage;
        await this.updateSettings(settings);

        const preview = newMessage
            .replace('{user}', message.author)
            .replace('{count}', message.guild.memberCount)
            .replace('{server}', message.guild.name);

        return message.reply(`✅ Hoşgeldin mesajı ayarlandı!\nÖnizleme: ${preview}`);
    }

    static async toggleWelcomeImage(message) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
        }

        const settings = message.client.welcomeSettings;
        settings.image = !settings.image;
        await this.updateSettings(settings);

        return message.reply(`✅ Hoşgeldin resmi ${settings.image ? 'aktif' : 'devre dışı'} edildi!`);
    }
}

module.exports = WelcomeSystem; 