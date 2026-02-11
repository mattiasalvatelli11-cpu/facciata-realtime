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
  console.log('Nuovo client connesso');

  ws.on('message', (message, isBinary) => {
    if (isBinary) {
      // Invia chunk binario a tutti gli altri client (admin)
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client !== ws) {
          client.send(message);
        }
      });
    } else {
      try {
        const data = JSON.parse(message);
        console.log('Messaggio JSON:', data);
      } catch (e) {
        console.error('Errore parse:', e);
      }
    }
  });

  ws.on('close', () => console.log('Client disconnesso'));
});

server.listen(port, () => console.log(`Server su porta ${port}`));