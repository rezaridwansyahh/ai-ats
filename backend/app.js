import "./src/config/env.js"; // must be first

import "./src/bullmq/seek/seek.worker.js"; // ✅ add this

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
import job from "./src/modules/job/job.route.js"
import candidate from "./src/modules/candidate/candidate.route.js"
import applicant from "./src/modules/applicant/applicant.route.js"
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
app.use("/api/job", job);
app.use("/api/candidate", candidate);
app.use("/api/applicant", applicant);
app.use("/api/sourcing", sourcing);
app.use("/api/recruiter", recruiter);
app.use("/api/pipeline", pipeline);
app.use("/api/stage-category", stageCategory);
app.use("/api/template-stage", templateStage);
app.use("/api/sla", sla);
app.use("/api/automation-setting", automationSetting);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
