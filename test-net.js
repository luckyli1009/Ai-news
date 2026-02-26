const net = require('net');

const server = net.createServer((socket) => {
  socket.end('goodbye\n');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

// Try listening on random port, localhost
try {
    server.listen(0, () => {
      console.log('opened server on', server.address());
    });
} catch (e) {
    console.error('Sync error:', e);
}
