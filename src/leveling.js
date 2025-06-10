const { QuickDB } = require('quick.db');
const { AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');
const db = new QuickDB();

class LevelingSystem {
    static async initialize(client) {
        // Varsayılan ayarları yükle
        const settings = await db.get('leveling_settings') || {
            messageXP: {
                min: 15,
                max: 25
            },
            voiceXP: {
                perMinute: 10
            },
            levelRoles: {
                // level: roleId
                5: null,
                10: null,
                20: null,
                30: null,
                50: null
            }
        };

        client.levelingSettings = settings;
    }

    static async addXP(userId, guildId, amount) {
        const key = `xp_${guildId}_${userId}`;
        const userData = await db.get(key) || { xp: 0, level: 0 };
        
        userData.xp += amount;
        
        // Level hesaplama
        const newLevel = Math.floor(0.1 * Math.sqrt(userData.xp));
        
        if (newLevel > userData.level) {
            userData.level = newLevel;
            await db.set(key, userData);
            return true; // Level atladı
        }
        
        await db.set(key, userData);
        return false; // Level atlamadı
    }

    static async addMessageXP(message) {
        if (message.author.bot) return;
        
        const settings = message.client.levelingSettings;
        const xpAmount = Math.floor(
            Math.random() * (settings.messageXP.max - settings.messageXP.min + 1) + 
            settings.messageXP.min
        );
        
        const levelUp = await this.addXP(
            message.author.id,
            message.guild.id,
            xpAmount
        );
        
        if (levelUp) {
            const userData = await this.getUserData(message.author.id, message.guild.id);
            const levelUpMessage = await message.channel.send(
                `🎉 Tebrikler ${message.author}! Level ${userData.level} oldun!`
            );
            
            // Level rolü kontrolü
            await this.checkLevelRole(message.member, userData.level);
            
            setTimeout(() => levelUpMessage.delete().catch(() => {}), 5000);
        }
    }

    static async addVoiceXP(member, minutes) {
        if (member.user.bot) return;
        
        const settings = member.client.levelingSettings;
        const xpAmount = settings.voiceXP.perMinute * minutes;
        
        const levelUp = await this.addXP(
            member.id,
            member.guild.id,
            xpAmount
        );
        
        if (levelUp) {
            const userData = await this.getUserData(member.id, member.guild.id);
            const channel = member.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
            
            if (channel) {
                channel.send(
                    `🎉 Tebrikler ${member}! Ses kanalında vakit geçirerek Level ${userData.level} oldun!`
                );
            }
            
            // Level rolü kontrolü
            await this.checkLevelRole(member, userData.level);
        }
    }

    static async checkLevelRole(member, level) {
        const settings = member.client.levelingSettings;
        
        // Mevcut levele ait rol varsa ekle
        if (settings.levelRoles[level]) {
            const role = member.guild.roles.cache.get(settings.levelRoles[level]);
            if (role) {
                await member.roles.add(role).catch(() => {});
            }
        }
    }

    static async getUserData(userId, guildId) {
        const key = `xp_${guildId}_${userId}`;
        return await db.get(key) || { xp: 0, level: 0 };
    }

    static async createRankCard(member) {
        const userData = await this.getUserData(member.id, member.guild.id);
        const canvas = Canvas.createCanvas(700, 250);
        const ctx = canvas.getContext('2d');

        // Arkaplan
        ctx.fillStyle = '#2f3136';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Kullanıcı avatarı
        const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'png' }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 25, 25, 200, 200);
        ctx.restore();

        // Kullanıcı bilgileri
        ctx.font = '40px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(member.user.tag, 250, 80);

        // Level ve XP
        ctx.font = '30px sans-serif';
        ctx.fillText(`Level: ${userData.level}`, 250, 140);
        ctx.fillText(`XP: ${userData.xp}`, 250, 180);

        // XP bar
        const requiredXP = Math.pow((userData.level + 1) / 0.1, 2);
        const progress = (userData.xp / requiredXP) * 400;

        ctx.fillStyle = '#484b4e';
        ctx.fillRect(250, 200, 400, 25);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(250, 200, progress, 25);

        return new AttachmentBuilder(canvas.toBuffer(), { name: 'rank.png' });
    }

    static async updateSettings(settings) {
        await db.set('leveling_settings', settings);
    }
}

module.exports = LevelingSystem; 