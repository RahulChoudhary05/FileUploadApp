import mongoose from 'mongoose';
import dns from 'dns';

const DEFAULT_DNS_SERVERS = ['8.8.8.8', '1.1.1.1'];

const parseDnsServers = () => {
  const raw = process.env.DNS_SERVERS;
  if (!raw) return DEFAULT_DNS_SERVERS;
  const servers = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return servers.length ? servers : DEFAULT_DNS_SERVERS;
};

const connectWithUri = (uri) =>
  mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
  });

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('MongoDB Connection Error: MONGODB_URI is not set');
    process.exit(1);
  }

  try {
    const conn = await connectWithUri(mongoUri);
    console.log('MongoDB Connected:', conn.connection.host);
    return conn;
  } catch (error) {
    const isSrvDnsError =
      mongoUri.startsWith('mongodb+srv://') &&
      error?.message?.includes('querySrv ECONNREFUSED');

    if (isSrvDnsError) {
      try {
        const dnsServers = parseDnsServers();
        dns.setServers(dnsServers);
        console.warn(
          `MongoDB SRV lookup failed. Retrying with DNS servers: ${dnsServers.join(', ')}`
        );
        const conn = await connectWithUri(mongoUri);
        console.log('MongoDB Connected:', conn.connection.host);
        return conn;
      } catch (retryError) {
        console.error('MongoDB Connection Error:', retryError.message);
        console.error(
          'Tip: if this persists, use Atlas Standard connection string (mongodb://...) as MONGODB_URI.'
        );
        process.exit(1);
      }
    }

    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};
