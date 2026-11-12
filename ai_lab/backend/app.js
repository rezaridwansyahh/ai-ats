import './src/config/env.js'; // must be first

import express from 'express';
import cors from 'cors';
import { Router } from 'express';
import getDb from './src/config/postgres.js';

import employee from './src/modules/employee/employee.route.js';

const app = express();
const api = Router();

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

api.get('/health', async (_req, res) => {
  const { rows } = await getDb().query('SELECT NOW() AS now, current_database() AS db');
  res.json({ ok: true, ...rows[0] });
});

api.use('/employee', employee);

app.use('/api', api);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is listening on port: ${PORT}`));