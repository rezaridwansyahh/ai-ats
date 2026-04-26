import "./src/config/env.js"; // must be first

import "./src/bullmq/seek/seek.worker.js"; // ✅ add this
import "./src/bullmq/linkedin/linkedin.worker.js";

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
import jobSourcing from './src/modules/job-source/job-source.router.js'
import job from "./src/modules/job/job.route.js"
import applicant from "./src/modules/applicant/applicant.route.js"
import candidatePipeline from "./src/modules/candidate-pipeline/candidate-pipeline.route.js"
import participant from "./src/modules/assessment/participant/participant.route.js"
import assessmentResult from "./src/modules/assessment/assessment-result/assessment-result.route.js"
import question from "./src/modules/assessment/question/question.route.js"
import session from "./src/modules/assessment/session/session.route.js"
import assessmentBatteryResult from "./src/modules/assessment/assessment-battery-result/assessment-battery-result.route.js"
import sourcing from "./src/modules/sourcing/sourcing.route.js"
import recruiter from "./src/modules/recruiter/recruiter.route.js"
import pipeline from "./src/modules/pipeline/pipeline.route.js"
import stageCategory from "./src/modules/stage-category/stage-category.route.js"
import templateStage from "./src/modules/template-stage/template-stage.route.js"
import automationSetting from "./src/modules/automation-setting/automation.route.js"
import screening from "./src/modules/screening/screening.route.js"

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
portal.use("/api/job-sourcing", jobSourcing);
portal.use("/api/job", job);
portal.use("/api/applicant", applicant);
portal.use("/api/candidate-pipeline", candidatePipeline);
portal.use("/api/sourcing", sourcing);
portal.use("/api/recruiter", recruiter);
portal.use("/api/pipeline", pipeline);
portal.use("/api/stage-category", stageCategory);
portal.use("/api/template-stage", templateStage);
portal.use("/api/automation-setting", automationSetting);
portal.use("/api/screening", screening);
portal.use("/api/participant", participant);
portal.use("/api/assessment-result", assessmentResult);
portal.use("/api/question", question);
portal.use("/api/session", session);
portal.use("/api/assessment-battery-result", assessmentBatteryResult);

app.use("/portal", portal);
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
app.use("/api/applicant", applicant);
app.use("/api/candidate-pipeline", candidatePipeline);
app.use("/api/participant", participant);
app.use("/api/assessment-result", assessmentResult);
app.use("/api/question", question);
app.use("/api/session", session);
app.use("/api/assessment-battery-result", assessmentBatteryResult);
app.use("/api/sourcing", sourcing);
app.use("/api/recruiter", recruiter);
app.use("/api/pipeline", pipeline);
app.use("/api/stage-category", stageCategory);
app.use("/api/template-stage", templateStage);
app.use("/api/automation-setting", automationSetting);
app.use("/api/screening", screening);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
