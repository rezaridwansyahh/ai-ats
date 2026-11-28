import './src/config/env.js'; 
import express from 'express';
import cors from 'cors';
import { Router } from 'express';
import getDb from './src/config/postgres.js';

import employee from './src/modules/employee/employee.route.js';
import employeeImport from './src/modules/employee-import/employee-import.route.js';
import moduleRoute from "./src/modules/module/module.route.js";
import menuRoute from "./src/modules/menu/menu.route.js";
import attendance from './src/modules/attendance/attendance.route.js';
import attendanceSetting from './src/modules/attendance-setting/attendance-setting.route.js';
import attendanceEvent from './src/modules/attendanve-event/attendance-event.route.js';
import attendanceImport from './src/modules/attendance-import/attendance-import.route.js';
import attendanceRekap from './src/modules/attendance-rekap/attendance-rekap.route.js';
import leave from './src/modules/leave/leave.route.js';
import portalLeave from './src/modules/portal-leave/portal-leave.route.js';

const app = express();
const api = Router();

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

api.get('/health', async (_req, res) => {
  const { rows } = await getDb().query('SELECT NOW() AS now, current_database() AS db');
  res.json({ ok: true, ...rows[0] });
});

api.use('/employee', employee);
api.use('/employee-import', employeeImport);
api.use("/module", moduleRoute);
api.use("/menu", menuRoute);
api.use('/attendance', attendance);
api.use('/attendance-setting', attendanceSetting);
api.use('/attendance-event', attendanceEvent);
api.use('/attendance-import', attendanceImport);
api.use('/attendance-rekap', attendanceRekap);
api.use('/leave', leave);
api.use('/portal-leave', portalLeave);

app.use('/api', api);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is listening on port: ${PORT}`));