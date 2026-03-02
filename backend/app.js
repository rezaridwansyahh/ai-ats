import "./src/config/env.js"; // must be first

import express from "express";
import cors from 'cors';

const app = express();

import cookies from "./src/modules/cookie/cookie.route.js";
import linkedin from "./src/modules/platform/linkedin/linkedin.route.js"
import seek from "./src/modules/platform/seek/seek.route.js"
import auth from "./src/modules/auth/auth.route.js"
import role from "./src/modules/role/role.route.js"
import user from "./src/modules/user/user.route.js"
import permission from "./src/modules/permission/permission.route.js"
import module from "./src/modules/module/module.route.js"
import menu from "./src/modules/menu/menu.route.js"
import jobAccount from "./src/modules/job-account/job-account.route.js"
import jobPosting from "./src/modules/job-post/job-post.router.js"

app.use(express.json());
app.use(cors());

app.use("/api/auth", auth);
app.use("/api/cookies", cookies);
app.use("/api/linkedin", linkedin);
app.use("/api/seek", seek);
app.use("/api/role", role);
app.use("/api/user", user);
app.use("/api/permission", permission);
app.use("/api/module", module);
app.use("/api/menu", menu);
app.use("/api/job-account", jobAccount);
app.use("/api/job-posting", jobPosting);

app.listen(3000, () => {
  console.log(`Server is listening on port: 3000`);
});
