import express from 'express';
import cors from 'cors';
import client from 'prom-client';

const app = express();

import auths from './routes/auths.js';
import roles from './routes/roles.js';
import modules from './routes/modules.js';
import menus from './routes/menus.js';
import permissions from './routes/permissions.js';
import users from './routes/users.js';
import JobAccounts from './routes/job-accounts.js';
import JobPosting from './routes/job-posting-linkedin.js';
import JobPostingLinkedin from './routes/job-posting-linkedin.js';
import JobPostingSeek from './routes/job-posting-seek.js';

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode,
    });
  });
  next();
});

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});


const allowedOrigins = [
  /\.localhost$/,                 
  /^http:\/\/localhost(:\d+)?$/   
];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) return callback(null, true);

//       const isAllowed = allowedOrigins.some((rule) =>
//         rule instanceof RegExp ? rule.test(origin) : rule === origin
//       );

//       if (isAllowed) {
//         callback(null, true);
//       } else {
//         console.log("CORS blocked:", origin);
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//     exposedHeaders: ["Content-Disposition"], 
//   })
// );

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", auths);
app.use("/api/module", modules);
app.use("/api/menu", menus);
app.use("/api/permission", permissions);
app.use("/api/role", roles);
app.use("/api/user", users);
app.use("/api/job-account", JobAccounts);
app.use("/api/job-posting", JobPosting);
app.use("/api/seek", JobPostingSeek);
app.use("/api/linkedin", JobPostingLinkedin)

export default app;