import 'dotenv/config';
import app from './app';

const port = Number(process.env.API_PORT) || 8787;
app.listen(port, () => console.log(`[api] berjalan di http://localhost:${port}/api`));
