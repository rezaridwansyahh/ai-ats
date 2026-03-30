import "./src/config/env.js"; // must be first

import express from "express";
import cors from 'cors';

const app = express();

import auth from "./src/modules/auth/auth.route.js";
import landing from "./src/modules/landing/landing.route.js";
import emailNotify from "./src/modules/email-notify/email-notify.route.js";

app.use(express.json());
app.use(cors());

app.use("/api/auth", auth);
app.use("/api/landing", landing);
app.use("/api/email-notify", emailNotify);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Landing server is listening on port: ${PORT}`);
});
