import app from './app.js';
import { env } from './config/env.js';

const localAddress = `http://${env.host}:${env.port}`;

app.listen(env.port, env.host, () => {
  console.log(`JAVA ISLAND TRIP API berjalan di ${localAddress}`);
});
