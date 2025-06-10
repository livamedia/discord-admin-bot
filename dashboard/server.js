const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const { Client } = require('discord.js');
require('dotenv').config();

// Discord bot client
const client = new Client({
    intents: [
        "Guilds",
        "GuildMessages",
        "GuildVoiceStates",
        "GuildMembers",
        "DirectMessages"
    ]
});

// Express middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Ana dashboard sayfası
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.IO bağlantı yönetimi
io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı');

    // İlk bağlantıda mevcut istatistikleri gönder
    sendInitialStats(socket);

    // Duyuru gönderme
    socket.on('send_announcement', async (data) => {
        try {
            if (data.type === 'dm') {
                const guild = client.guilds.cache.get(process.env.GUILD_ID);
                const members = await guild.members.fetch();
                let successCount = 0;
                let failCount = 0;

                for (const [id, member] of members) {
                    try {
                        await member.send(data.message);
                        successCount++;
                    } catch {
                        failCount++;
                    }
                }

                socket.emit('announcement_result', {
                    success: true,
                    message: `Duyuru gönderildi! Başarılı: ${successCount}, Başarısız: ${failCount}`
                });
            } else {
                const channel = client.channels.cache.get(data.channel);
                await channel.send(data.message);
                socket.emit('announcement_result', {
                    success: true,
                    message: 'Duyuru başarıyla gönderildi!'
                });
            }
        } catch (error) {
            socket.emit('announcement_result', {
                success: false,
                message: 'Duyuru gönderilirken bir hata oluştu!'
            });
        }
    });

    // Ayarları güncelleme
    socket.on('update_settings', (settings) => {
        try {
            // Ayarları kaydet
            process.env.PREFIX = settings.prefix;
            process.env.LOG_CHANNEL_ID = settings.logChannel;
            process.env.TICKET_CATEGORY_ID = settings.ticketCategory;

            socket.emit('settings_result', {
                success: true,
                message: 'Ayarlar başarıyla güncellendi!'
            });
        } catch (error) {
            socket.emit('settings_result', {
                success: false,
                message: 'Ayarlar güncellenirken bir hata oluştu!'
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı');
    });
});

// İstatistikleri gönder
async function sendInitialStats(socket) {
    try {
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        
        // Genel istatistikler
        const stats = {
            totalMembers: guild.memberCount,
            voiceMembers: guild.voiceStates.cache.size,
            openTickets: getOpenTicketsCount(),
            uptime: Math.floor(client.uptime / 1000)
        };
        socket.emit('stats_update', stats);

        // Ses istatistikleri
        const voiceStats = getVoiceStats();
        socket.emit('voice_update', voiceStats);

        // Ticket istatistikleri
        const tickets = getTickets();
        socket.emit('ticket_update', tickets);

        // Duyuru geçmişi
        const announcements = getAnnouncements();
        socket.emit('announcement_update', announcements);
    } catch (error) {
        console.error('İstatistikler gönderilirken hata:', error);
    }
}

// Ses istatistiklerini getir
function getVoiceStats() {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const stats = [];

    guild.voiceStates.cache.forEach(voiceState => {
        if (voiceState.channelId) {
            const member = voiceState.member;
            const channel = voiceState.channel;
            
            stats.push({
                username: member.user.tag,
                avatar: member.user.displayAvatarURL(),
                duration: calculateDuration(voiceState.joinedTimestamp),
                channel: channel.name,
                lastActive: new Date()
            });
        }
    });

    return stats;
}

// Ticket bilgilerini getir
function getTickets() {
    // Bu fonksiyon ticket verilerini veritabanından çekecek
    // Şimdilik örnek veri döndürüyoruz
    return [
        {
            id: 1,
            username: 'Örnek Kullanıcı',
            subject: 'Yardım Talebi',
            status: 'open',
            createdAt: new Date()
        }
    ];
}

// Açık ticket sayısını getir
function getOpenTicketsCount() {
    // Bu fonksiyon veritabanından açık ticket sayısını çekecek
    // Şimdilik örnek veri döndürüyoruz
    return 1;
}

// Duyuru geçmişini getir
function getAnnouncements() {
    // Bu fonksiyon duyuru geçmişini veritabanından çekecek
    // Şimdilik örnek veri döndürüyoruz
    return [
        {
            date: new Date(),
            type: 'dm',
            sender: 'Admin',
            message: 'Örnek duyuru',
            success: true
        }
    ];
}

// Süre hesaplama
function calculateDuration(joinedTimestamp) {
    const now = Date.now();
    const duration = now - joinedTimestamp;
    return Math.floor(duration / 1000 / 60); // Dakika cinsinden
}

// Discord bot olayları
client.on('ready', () => {
    console.log(`Bot olarak giriş yapıldı: ${client.user.tag}`);
});

client.on('voiceStateUpdate', (oldState, newState) => {
    // Ses durumu değiştiğinde tüm bağlı clientlara güncelleme gönder
    io.emit('voice_update', getVoiceStats());
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Dashboard sunucusu ${PORT} portunda çalışıyor`);
});

// Discord bot'unu başlat
client.login(process.env.DISCORD_TOKEN); 