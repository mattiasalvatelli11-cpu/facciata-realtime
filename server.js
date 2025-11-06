const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 8080;

// Serve files in the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// --- MAIN PAGE ROUTE ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- ADMIN PAGE ROUTE ---
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// --- CREATE HTTP + WEBSOCKET SERVER ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// --- WEBSOCKET HANDLING ---
wss.on('connection', (ws) => {
  console.log("New client connected");

  ws.on('message', (raw) => {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }

    // Clean up minimum values
    data.user = String(data.user || "Anonymous").slice(0, 60);
    data.message = String(data.message || "").slice(0, 2000);
    data.ts = Date.now();

    const msg = JSON.stringify(data);

    // Send to all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });

    console.log(`[MSG] ${data.user}: ${data.message}`);
  });
});

// --- START SERVER ---
server.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
