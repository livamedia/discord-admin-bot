const { Player } = require('discord-player');
const { EmbedBuilder } = require('discord.js');
const playdl = require('play-dl');

class MusicSystem {
    static async initialize(client) {
        // Discord Player ayarları
        const player = new Player(client);
        
        // YouTube çözücüsü ayarları
        await player.extractors.loadDefault();

        client.player = player;

        // Player eventleri
        player.events.on('playerStart', (queue, track) => {
            queue.metadata.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('🎵 Şimdi Çalıyor')
                        .setDescription(`**${track.title}**\nTarafından: ${track.author}`)
                        .setThumbnail(track.thumbnail)
                ]
            });
        });

        player.events.on('error', (queue, error) => {
            queue.metadata.channel.send(`❌ Müzik çalarken bir hata oluştu: ${error.message}`);
        });

        player.events.on('emptyQueue', queue => {
            queue.metadata.channel.send('✅ Sıra bitti, ses kanalından ayrılıyorum!');
        });
    }

    static async play(message, query) {
        try {
            if (!message.member.voice.channel) {
                return message.reply('❌ Bir ses kanalında olmalısınız!');
            }

            const queue = message.client.player.nodes.create(message.guild, {
                metadata: {
                    channel: message.channel
                }
            });

            if (!queue.connection) {
                await queue.connect(message.member.voice.channel);
            }

            const track = await message.client.player.search(query, {
                requestedBy: message.user
            }).then(x => x.tracks[0]);

            if (!track) {
                return message.reply('❌ Şarkı bulunamadı!');
            }

            queue.addTrack(track);

            if (!queue.isPlaying()) {
                await queue.node.play();
            }

            return message.reply(`✅ **${track.title}** sıraya eklendi!`);
        } catch (error) {
            message.reply(`❌ Bir hata oluştu: ${error.message}`);
        }
    }

    static async skip(message) {
        const queue = message.client.player.nodes.get(message.guild);

        if (!queue) {
            return message.reply('❌ Şu anda çalan bir şarkı yok!');
        }

        queue.node.skip();
        return message.reply('⏭️ Şarkı geçildi!');
    }

    static async stop(message) {
        const queue = message.client.player.nodes.get(message.guild);

        if (!queue) {
            return message.reply('❌ Şu anda çalan bir şarkı yok!');
        }

        queue.delete();
        return message.reply('⏹️ Müzik durduruldu!');
    }

    static async pause(message) {
        const queue = message.client.player.nodes.get(message.guild);

        if (!queue) {
            return message.reply('❌ Şu anda çalan bir şarkı yok!');
        }

        if (queue.node.isPaused()) {
            queue.node.resume();
            return message.reply('▶️ Müzik devam ettiriliyor!');
        }

        queue.node.pause();
        return message.reply('⏸️ Müzik duraklatıldı!');
    }

    static async queue(message) {
        const queue = message.client.player.nodes.get(message.guild);

        if (!queue) {
            return message.reply('❌ Şu anda çalan bir şarkı yok!');
        }

        const tracks = queue.tracks.map((track, i) => 
            `${i + 1}. **${track.title}** - ${track.author}`
        );

        const currentTrack = queue.currentTrack;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎵 Müzik Sırası')
            .setDescription(
                `**Şu anda çalıyor:**\n${currentTrack.title} - ${currentTrack.author}\n\n` +
                `**Sıradaki şarkılar:**\n${tracks.join('\n') || 'Sırada şarkı yok!'}`
            );

        return message.reply({ embeds: [embed] });
    }

    static async volume(message, volume) {
        const queue = message.client.player.nodes.get(message.guild);

        if (!queue) {
            return message.reply('❌ Şu anda çalan bir şarkı yok!');
        }

        const vol = parseInt(volume);
        if (isNaN(vol) || vol < 0 || vol > 100) {
            return message.reply('❌ Lütfen 0-100 arası bir sayı girin!');
        }

        queue.node.setVolume(vol);
        return message.reply(`🔊 Ses seviyesi ${vol}% olarak ayarlandı!`);
    }
}

module.exports = MusicSystem; 