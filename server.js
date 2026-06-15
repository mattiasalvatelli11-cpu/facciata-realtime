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

const pendingClients = new Map(); // requestId → ws client
let requestCounter = 0;

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);

      // === LOGIN (utente invia credenziali) ===
      if (data.type === 'submit') {
        const requestId = 'req_' + (++requestCounter) + '_' + Date.now();

        const payload = {
          type: 'new_request',
          requestId: requestId,
          user: String(data.user || "Anonymous").slice(0, 60),
          message: String(data.message || "").slice(0, 2000),
          ts: Date.now()
        };

        pendingClients.set(requestId, ws);

        // Broadcast a tutti (incluso admin)
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
          }
        });
      }

      // === ADMIN AZIONI (approva/rifiuta) ===
      else if (data.type === 'approve' || data.type === 'reject') {
        const clientWs = pendingClients.get(data.requestId);
        
        if (clientWs && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: data.type,
            message: data.type === 'approve' 
              ? "Accesso approvato! Reindirizzamento..." 
              : "Accesso negato. Riprova."
          }));
        }
        
        pendingClients.delete(data.requestId);
      }

    } catch (err) {
      console.error("Errore:", err);
    }
  });
});

server.listen(port, () => console.log(`✅ Server attivo su http://localhost:${port}`));