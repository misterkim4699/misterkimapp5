import http from "http";

const PORT = 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Node écoute bien sur le port 3000 !");
});

server.listen(PORT, () => {
  console.log(`✅ Serveur minimal démarré sur http://localhost:${PORT}`);
});