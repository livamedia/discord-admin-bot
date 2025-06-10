# Discord Bot

Bu basit Discord botu Discord.js kullanılarak oluşturulmuştur.

## Özellikler

- `!merhaba` - Bot size selam verir
- `!yardım` - Mevcut komutların listesini gösterir

## Kurulum

1. Bu repoyu klonlayın
2. Gerekli paketleri yükleyin:
   ```bash
   npm install
   ```
3. `.env` dosyası oluşturun ve Discord bot tokenınızı ekleyin:
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   ```
4. Botu başlatın:
   ```bash
   npm start
   ```

## Discord Bot Token Alma

1. [Discord Developer Portal](https://discord.com/developers/applications)'a gidin
2. "New Application" butonuna tıklayın
3. Botunuza bir isim verin
4. Sol menüden "Bot" sekmesine gidin
5. "Add Bot" butonuna tıklayın
6. "Token" kısmından tokenınızı kopyalayın
7. Bu tokeni `.env` dosyanıza ekleyin

## Botu Sunucunuza Ekleme

1. [Discord Developer Portal](https://discord.com/developers/applications)'da uygulamanızı seçin
2. Sol menüden "OAuth2" > "URL Generator"a gidin
3. Scopes'dan "bot"u seçin
4. Bot Permissions'dan gerekli izinleri seçin
5. Oluşturulan URL'yi kullanarak botu sunucunuza ekleyin

## Geliştirme

Geliştirme modunda çalıştırmak için:
```bash
npm run dev
``` 