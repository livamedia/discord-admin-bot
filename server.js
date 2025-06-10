const express = require('express');
const server = express();

server.all('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
        <html>
            <head>
                <title>Discord Bot Status</title>
            </head>
            <body>
                <h1>Bot Aktif! 🚀</h1>
                <p>Son kontrol: ${new Date().toLocaleString('tr-TR')}</p>
            </body>
        </html>
    `);
});

function keepAlive() {
    server.listen(3000, () => {
        console.log('Server is ready.');
    });
}

module.exports = keepAlive; 