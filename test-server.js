const http = require('http');

const port = 8081;

function tryListen(host, callback) {
    const server = http.createServer((req, res) => {
        res.end('ok');
    });
    
    server.on('error', (err) => {
        console.error(`Failed to listen on ${host || 'DEFAULT'}:`, err.message);
        server.close();
        callback(false);
    });

    try {
        if (host) {
            server.listen(port, host, () => {
                console.log(`Success! Listening on ${host}:${port}`);
                server.close();
                callback(true);
            });
        } else {
            server.listen(port, () => {
                console.log(`Success! Listening on DEFAULT:${port}`);
                server.close();
                callback(true);
            });
        }
    } catch (e) {
        console.error(`Sync error on ${host}:`, e.message);
        callback(false);
    }
}

const hosts = [undefined, '0.0.0.0', '127.0.0.1', '::', '::1', 'localhost'];
let i = 0;

function next() {
    if (i >= hosts.length) return;
    const host = hosts[i++];
    console.log(`Trying ${host || 'DEFAULT'}...`);
    tryListen(host, (success) => {
        if (!success) setTimeout(next, 500);
        else console.log('Found working configuration!');
    });
}

next();
