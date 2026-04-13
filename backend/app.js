import "./src/config/env.js"; // must be first

import "./src/bullmq/seek/seek.worker.js"; // ✅ add this

import express from "express";
import cors from 'cors';
import { Router } from 'express';

const portal = Router();

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
import job from "./src/modules/job/job.route.js"
import candidate from "./src/modules/candidate/candidate.route.js"
import sourcing from "./src/modules/sourcing/sourcing.route.js"
import recruiter from "./src/modules/recruiter/recruiter.route.js"
import pipeline from "./src/modules/pipeline/pipeline.route.js"
import stageCategory from "./src/modules/stage-category/stage-category.route.js"
import templateStage from "./src/modules/template-stage/template-stage.route.js"
import sla from "./src/modules/sla/sla.router.js"
import automationSetting from "./src/modules/automation-setting/automation.route.js"

app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
}));

portal.use("/api/auth", auth);
portal.use("/api/cookies", cookies);
portal.use("/api/linkedin", linkedin);
portal.use("/api/seek", seek);
portal.use("/api/role", role);
portal.use("/api/user", user);
portal.use("/api/permission", permission);
portal.use("/api/module", module);
portal.use("/api/menu", menu);
portal.use("/api/job-account", jobAccount);
portal.use("/api/job-posting", jobPosting);
portal.use("/api/job", job);
portal.use("/api/candidate", candidate);
portal.use("/api/sourcing", sourcing);
portal.use("/api/recruiter", recruiter);
portal.use("/api/pipeline", pipeline);
portal.use("/api/stage-category", stageCategory);
portal.use("/api/template-stage", templateStage);
portal.use("/api/sla", sla);
portal.use("/api/automation-setting", automationSetting);

app.use("/portal", portal);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
