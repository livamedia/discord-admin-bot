const { PermissionsBitField } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

// Küfür listesi
const badWords = [
    'küfür1', 'küfür2', // Buraya küfür listesi eklenecek
];

// Link whitelist
const whitelistedDomains = [
    'discord.gg',
    'discord.com',
    'youtube.com',
    'youtu.be'
];

class AutoMod {
    static async initialize(client) {
        // Veritabanından ayarları yükle
        const settings = await db.get('automod_settings') || {
            antiSpam: true,
            antiLink: true,
            antiSwear: true,
            capsLimit: 70,
            spamThreshold: 5,
            spamInterval: 5000
        };

        client.autoModSettings = settings;
    }

    static async checkMessage(message) {
        if (message.author.bot) return false;
        if (message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return false;

        const checks = [
            this.checkSpam(message),
            this.checkSwearing(message),
            this.checkLinks(message),
            this.checkCaps(message)
        ];

        const results = await Promise.all(checks);
        return results.some(result => result === true);
    }

    static async checkSpam(message) {
        if (!message.client.autoModSettings.antiSpam) return false;

        const key = `spam_${message.author.id}`;
        const messages = await db.get(key) || [];
        const now = Date.now();

        // Eski mesajları temizle
        const recentMessages = messages.filter(msg => 
            now - msg < message.client.autoModSettings.spamInterval
        );

        recentMessages.push(now);
        await db.set(key, recentMessages);

        if (recentMessages.length >= message.client.autoModSettings.spamThreshold) {
            message.delete().catch(() => {});
            message.channel.send(`${message.author}, spam yapmayı bırak!`).then(msg => {
                setTimeout(() => msg.delete().catch(() => {}), 3000);
            });
            return true;
        }

        return false;
    }

    static async checkSwearing(message) {
        if (!message.client.autoModSettings.antiSwear) return false;

        const containsBadWord = badWords.some(word => 
            message.content.toLowerCase().includes(word.toLowerCase())
        );

        if (containsBadWord) {
            message.delete().catch(() => {});
            message.channel.send(`${message.author}, küfür kullanımı yasaktır!`).then(msg => {
                setTimeout(() => msg.delete().catch(() => {}), 3000);
            });
            return true;
        }

        return false;
    }

    static async checkLinks(message) {
        if (!message.client.autoModSettings.antiLink) return false;

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const containsLink = urlRegex.test(message.content);

        if (containsLink) {
            const isWhitelisted = whitelistedDomains.some(domain => 
                message.content.includes(domain)
            );

            if (!isWhitelisted) {
                message.delete().catch(() => {});
                message.channel.send(`${message.author}, link paylaşımı yasaktır!`).then(msg => {
                    setTimeout(() => msg.delete().catch(() => {}), 3000);
                });
                return true;
            }
        }

        return false;
    }

    static async checkCaps(message) {
        if (!message.client.autoModSettings.capsLimit) return false;

        const text = message.content;
        if (text.length < 8) return false;

        const upperCount = text.replace(/[^A-ZĞÜŞİÖÇ]/g, '').length;
        const totalCount = text.replace(/[^A-Za-zĞÜŞİÖÇğüşıöç]/g, '').length;
        const capsPercentage = (upperCount / totalCount) * 100;

        if (capsPercentage > message.client.autoModSettings.capsLimit) {
            message.delete().catch(() => {});
            message.channel.send(`${message.author}, çok fazla büyük harf kullanımı!`).then(msg => {
                setTimeout(() => msg.delete().catch(() => {}), 3000);
            });
            return true;
        }

        return false;
    }

    static async updateSettings(guildId, settings) {
        await db.set('automod_settings', {
            ...settings
        });
    }
}

module.exports = AutoMod; 