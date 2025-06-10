const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const ms = require('ms');
const db = new QuickDB();

class GiveawaySystem {
    static async initialize(client) {
        // Aktif çekilişleri kontrol et
        setInterval(() => this.checkGiveaways(client), 10000);
    }

    static async createGiveaway(message, args) {
        // Yetki kontrolü
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
        }

        // Süre ve kazanan sayısı
        const duration = ms(args[0]);
        const winnersCount = parseInt(args[1]);
        const prize = args.slice(2).join(' ');

        if (!duration || !winnersCount || !prize) {
            return message.reply('❌ Kullanım: !çekiliş <süre> <kazanan sayısı> <ödül>\nÖrnek: !çekiliş 1h 1 Discord Nitro');
        }

        const endTime = Date.now() + duration;

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🎉 ÇEKİLİŞ 🎉')
            .setDescription(
                `**Ödül:** ${prize}\n` +
                `**Kazanan Sayısı:** ${winnersCount}\n` +
                `**Bitiş:** <t:${Math.floor(endTime / 1000)}:R>\n\n` +
                `Katılmak için 🎉 emojisine tıklayın!`
            )
            .setTimestamp(endTime);

        const giveawayMessage = await message.channel.send({ embeds: [embed] });
        await giveawayMessage.react('🎉');

        // Çekilişi veritabanına kaydet
        await db.set(`giveaway_${giveawayMessage.id}`, {
            channelId: message.channel.id,
            messageId: giveawayMessage.id,
            guildId: message.guild.id,
            prize,
            winnersCount,
            endTime,
            ended: false,
            hostId: message.author.id
        });

        return message.reply('✅ Çekiliş başlatıldı!');
    }

    static async checkGiveaways(client) {
        const giveaways = await db.all();
        const now = Date.now();

        for (const data of giveaways) {
            if (!data.id.startsWith('giveaway_')) continue;
            
            const giveaway = data.value;
            if (giveaway.ended || giveaway.endTime > now) continue;

            const guild = client.guilds.cache.get(giveaway.guildId);
            if (!guild) continue;

            const channel = guild.channels.cache.get(giveaway.channelId);
            if (!channel) continue;

            try {
                const message = await channel.messages.fetch(giveaway.messageId);
                const reaction = message.reactions.cache.get('🎉');
                
                if (!reaction) continue;

                const users = await reaction.users.fetch();
                const validUsers = users.filter(user => 
                    !user.bot && guild.members.cache.has(user.id)
                );

                if (validUsers.size === 0) {
                    const noWinnerEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('🎉 ÇEKİLİŞ BİTTİ 🎉')
                        .setDescription(
                            `**Ödül:** ${giveaway.prize}\n` +
                            `**Sonuç:** Yeterli katılım olmadığı için kazanan seçilemedi.`
                        )
                        .setTimestamp();

                    await message.edit({ embeds: [noWinnerEmbed] });
                } else {
                    const winners = [];
                    const entries = Array.from(validUsers.values());

                    for (let i = 0; i < Math.min(giveaway.winnersCount, validUsers.size); i++) {
                        const winnerIndex = Math.floor(Math.random() * entries.length);
                        winners.push(entries[winnerIndex]);
                        entries.splice(winnerIndex, 1);
                    }

                    const winnerEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('🎉 ÇEKİLİŞ BİTTİ 🎉')
                        .setDescription(
                            `**Ödül:** ${giveaway.prize}\n` +
                            `**Kazananlar:** ${winners.map(w => `<@${w.id}>`).join(', ')}\n` +
                            `**Düzenleyen:** <@${giveaway.hostId}>`
                        )
                        .setTimestamp();

                    await message.edit({ embeds: [winnerEmbed] });
                    await channel.send(
                        `🎉 Tebrikler ${winners.map(w => `<@${w.id}>`).join(', ')}! ` +
                        `**${giveaway.prize}** kazandınız!`
                    );
                }

                // Çekilişi bitir
                await db.set(`giveaway_${message.id}`, {
                    ...giveaway,
                    ended: true
                });

            } catch (error) {
                console.error(`Çekiliş kontrol hatası: ${error}`);
            }
        }
    }

    static async reroll(message, messageId) {
        // Yetki kontrolü
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
        }

        const giveaway = await db.get(`giveaway_${messageId}`);
        if (!giveaway || !giveaway.ended) {
            return message.reply('❌ Geçerli bir çekiliş ID\'si değil!');
        }

        try {
            const channel = message.guild.channels.cache.get(giveaway.channelId);
            const giveawayMessage = await channel.messages.fetch(messageId);
            const reaction = giveawayMessage.reactions.cache.get('🎉');

            const users = await reaction.users.fetch();
            const validUsers = users.filter(user => 
                !user.bot && message.guild.members.cache.has(user.id)
            );

            if (validUsers.size === 0) {
                return message.reply('❌ Yeterli katılım yok!');
            }

            const winners = [];
            const entries = Array.from(validUsers.values());

            for (let i = 0; i < Math.min(giveaway.winnersCount, validUsers.size); i++) {
                const winnerIndex = Math.floor(Math.random() * entries.length);
                winners.push(entries[winnerIndex]);
                entries.splice(winnerIndex, 1);
            }

            await message.channel.send(
                `🎉 **${giveaway.prize}** için yeni kazananlar: ${winners.map(w => `<@${w.id}>`).join(', ')}! Tebrikler!`
            );

        } catch (error) {
            message.reply('❌ Çekiliş yeniden çekilirken bir hata oluştu!');
        }
    }
}

module.exports = GiveawaySystem; 