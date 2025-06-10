# Discord Admin Bot

Gelişmiş özellikler içeren bir Discord yönetim botu.

## Özellikler

### 🛡️ Otomatik Moderasyon
- Küfür engelleme
- Link kontrolü
- Spam koruması
- Büyük harf kullanımı kontrolü

### ⭐ Level Sistemi
- Mesaj başına XP
- Ses kanalında geçirilen süreye göre XP
- Özel level kartı
- Level atlandığında otomatik rol

### 🎵 Müzik Sistemi
- YouTube/URL'den müzik çalma
- Sıra sistemi
- Ses kontrolü
- Duraklatma/devam ettirme

### 🎉 Çekiliş Sistemi
- Süre ve kazanan sayısı belirleme
- Otomatik kazanan seçimi
- Yeniden çekilebilme
- Emoji ile katılım

### 👋 Hoşgeldin Sistemi
- Özelleştirilebilir mesajlar
- Resimli karşılama
- Otomatik rol verme
- Kanal ayarlama

## Komutlar

### 📊 Genel Komutlar
- `!ping` - Bot gecikmesini gösterir
- `!sunucu` - Sunucu istatistiklerini gösterir
- `!avatar [@kullanıcı]` - Kullanıcının avatarını gösterir

### 🎵 Müzik Komutları
- `!play <şarkı>` - Şarkı çalar
- `!skip` - Şarkıyı atlar
- `!stop` - Müziği durdurur
- `!pause` - Müziği duraklatır/devam ettirir
- `!queue` - Sırayı gösterir
- `!volume <0-100>` - Ses seviyesini ayarlar

### ⭐ Level Sistemi
- `!rank` - Level kartınızı gösterir

### 🎉 Çekiliş Komutları
- `!çekiliş <süre> <kazanan> <ödül>` - Çekiliş başlatır
- `!reroll <mesaj ID>` - Çekilişi yeniden çeker

### 👋 Hoşgeldin Sistemi
- `!hoşgeldin-kanal #kanal` - Hoşgeldin kanalını ayarlar
- `!otorol @rol` - Otomatik rol ayarlar
- `!hoşgeldin-mesaj <mesaj>` - Hoşgeldin mesajını ayarlar
- `!hoşgeldin-resim` - Resimli karşılamayı açar/kapatır

### ⚔️ Moderasyon Komutları
- `!kick @kullanıcı [sebep]` - Kullanıcıyı sunucudan atar
- `!ban @kullanıcı [sebep]` - Kullanıcıyı sunucudan yasaklar
- `!temizle [1-100]` - Belirtilen sayıda mesajı siler
- `!rol-ver @kullanıcı @rol` - Kullanıcıya rol verir
- `!rol-al @kullanıcı @rol` - Kullanıcıdan rol alır
- `!duyuru [mesaj]` - Duyuru yapar

## Kurulum

1. Bu repoyu klonlayın:
```bash
git clone https://github.com/kullanıcıadı/discord-admin-bot.git
cd discord-admin-bot
```

2. Gerekli paketleri yükleyin:
```bash
npm install
```

3. `.env` dosyası oluşturun:
```env
DISCORD_TOKEN=your_discord_bot_token_here
GUILD_ID=your_guild_id_here
LOG_CHANNEL_ID=your_log_channel_id_here
TICKET_CATEGORY_ID=your_ticket_category_id_here
```

4. Botu başlatın:
```bash
npm start
```

## Geliştirme

Geliştirme modunda çalıştırmak için:
```bash
npm run dev
```

## Katkıda Bulunma

1. Bu repoyu forklayın
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın. 