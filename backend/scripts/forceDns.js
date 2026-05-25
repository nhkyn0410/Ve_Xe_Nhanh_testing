const dns = require('node:dns');

const servers = (process.env.DNS_SERVERS || '1.1.1.1,8.8.8.8')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);

if (servers.length > 0) {
  dns.setServers(servers);
}
