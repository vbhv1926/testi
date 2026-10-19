import * as net from 'net';

export interface LocalProxyTunnel {
  server: string;
  close: () => void;
}

/**
 * Starts a local HTTP proxy tunnel that forwards traffic to an authenticated upstream proxy.
 * Playwright can then connect to this local proxy without username/password, and the tunnel
 * will inject the Proxy-Authorization header pre-emptively on every request.
 */
export function startLocalProxyTunnel(proxyUrlStr: string): Promise<LocalProxyTunnel> {
  return new Promise((resolve, reject) => {
    let username = '';
    let password = '';
    let host = '';
    let port = 80;
    
    try {
      const u = new URL(proxyUrlStr.includes('://') ? proxyUrlStr : `http://${proxyUrlStr}`);
      username = decodeURIComponent(u.username);
      password = decodeURIComponent(u.password);
      host = u.hostname;
      port = u.port ? parseInt(u.port) : 80;
    } catch (err) {
      return reject(new Error('Invalid proxy URL format: ' + proxyUrlStr));
    }
    
    if (!username || !password) {
      // If no credentials are found in the proxy URL, we don't need a wrapper
      return resolve({ server: proxyUrlStr, close: () => {} });
    }
    
    const server = net.createServer((clientSocket) => {
      let upstreamSocket: net.Socket | null = null;
      
      clientSocket.once('data', (data) => {
        const dataStr = data.toString();
        
        if (dataStr.startsWith('CONNECT')) {
          const lines = dataStr.split('\r\n');
          const connectLine = lines[0];
          const parts = connectLine.split(' ');
          const target = parts[1];
          
          upstreamSocket = net.connect(port, host, () => {
            const auth = Buffer.from(`${username}:${password}`).toString('base64');
            upstreamSocket!.write(
              `CONNECT ${target} HTTP/1.1\r\n` +
              `Host: ${target}\r\n` +
              `Proxy-Authorization: Basic ${auth}\r\n` +
              `Proxy-Connection: Keep-Alive\r\n\r\n`
            );
          });
          
          upstreamSocket.once('data', (upstreamData) => {
            const upstreamStr = upstreamData.toString();
            if (upstreamStr.includes('200')) {
              clientSocket.write('HTTP/1.1 200 Connection established\r\n\r\n');
              clientSocket.pipe(upstreamSocket!);
              upstreamSocket!.pipe(clientSocket);
            } else {
              clientSocket.end();
            }
          });
          
          upstreamSocket.on('error', () => {
            clientSocket.end();
          });
        } else {
          upstreamSocket = net.connect(port, host, () => {
            const auth = Buffer.from(`${username}:${password}`).toString('base64');
            const modifiedDataStr = dataStr.replace(
              '\r\n',
              `\r\nProxy-Authorization: Basic ${auth}\r\n`
            );
            upstreamSocket!.write(modifiedDataStr);
            clientSocket.pipe(upstreamSocket!);
            upstreamSocket!.pipe(clientSocket);
          });
          
          upstreamSocket.on('error', () => {
            clientSocket.end();
          });
        }
      });
      
      clientSocket.on('error', () => {
        if (upstreamSocket) upstreamSocket.end();
      });
    });
    
    // Bind to a random available port (using 0)
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as net.AddressInfo;
      resolve({
        server: `http://127.0.0.1:${addr.port}`,
        close: () => {
          server.close();
        }
      });
    });
    
    server.on('error', (err) => {
      reject(err);
    });
  });
}
