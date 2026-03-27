const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);
      
      const payload = {
        user: String(data.user || "Anonymous").slice(0, 60),
        message: String(data.message || "").slice(0, 2000),
        ts: Date.now()
      };

      const msgString = JSON.stringify(payload);

      // Invia a TUTTI i client (incluso Admin)
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msgString);
        }
      });

    } catch (err) {
      console.error("Errore:", err);
    }
  });
});

server.listen(port, () => console.log(`Server attivo su porta ${port}`));