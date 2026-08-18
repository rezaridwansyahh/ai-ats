import "./src/config/env.js"; // must be first

import "./src/bullmq/seek/seek.worker.js";
import "./src/bullmq/linkedin/linkedin.worker.js";
import "./src/bullmq/cv/cv.worker.js";

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
import question from "./src/modules/assessment/question/question.route.js"
import session from "./src/modules/assessment/session/session.route.js"
import assessmentBatteryResult from "./src/modules/assessment/assessment-battery-result/assessment-battery-result.route.js"
import assessmentAI from "./src/modules/assessment/assessment-ai/assessment-ai.route.js"
import sourcing from "./src/modules/sourcing/sourcing.route.js"
import recruiter from "./src/modules/recruiter/recruiter.route.js"
import pipeline from "./src/modules/pipeline/pipeline.route.js"
import stageCategory from "./src/modules/stage-category/stage-category.route.js"
import templateStage from "./src/modules/template-stage/template-stage.route.js"
import automationSetting from "./src/modules/automation-setting/automation.route.js"
import screening from "./src/modules/screening/screening.route.js"
import company from "./src/modules/company/company.route.js"
import companyUsage from "./src/modules/company-usage/company-usage.route.js"
import portalAssessment from "./src/modules/portal-assessment/portal-assessment.route.js"
import portalQa from "./src/modules/portal-qa/portal-qa.route.js"
import interview from "./src/modules/interview/interview.route.js"
import backgroundCheck from "./src/modules/background-check/background-check.route.js"
import portalBg from "./src/modules/portal-bg/portal-bg.route.js"
import offer from "./src/modules/offer/offer.route.js"
import onboarding from "./src/modules/onboarding/onboarding.route.js"
import portalOffer from "./src/modules/portal-offer/portal-offer.route.js"
import offerTemplate from "./src/modules/offer-template/offer-template.route.js"
import interviewPack from "./src/modules/interview-pack/interview-pack.route.js"
import portalInterview from "./src/modules/portal-interview/portal-interview.route.js"
import offerPack from "./src/modules/offer-pack/offer-pack.route.js";
import portalContract from "./src/modules/portal-contract/portal-contract.route.js";

app.use(express.json());

app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : null; // null = allow all in dev (no credentials restriction)

app.use(cors({
  origin: allowedOrigins
    ? (origin, cb) => {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
      }
    : true, // dev fallback — reflects request origin, works with credentials
  credentials: true,
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
portal.use("/api/company", company);
portal.use("/api/company-usage", companyUsage);
portal.use("/api/participant", participant);
portal.use("/api/question", question);
portal.use("/api/session", session);
portal.use("/api/assessment-battery-result", assessmentBatteryResult);
portal.use("/api/assessment-ai", assessmentAI);
portal.use("/api/portal-assessment", portalAssessment);
portal.use("/api/portal-qa", portalQa);
portal.use("/api/interview", interview);
portal.use("/api/background-check", backgroundCheck);
portal.use("/api/portal-bg-consent", portalBg);
portal.use("/api/offer", offer);
portal.use("/api/onboarding", onboarding);
portal.use("/api/portal-offer", portalOffer);
portal.use("/api/offer-template", offerTemplate);
portal.use("/api/interview-pack", interviewPack);
portal.use("/api/portal-interview", portalInterview);
portal.use("/api/offer-pack", offerPack)
portal.use("/api/portal-contract", portalContract);
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
app.use("/api/question", question);
app.use("/api/session", session);
app.use("/api/assessment-battery-result", assessmentBatteryResult);
app.use("/api/assessment-ai", assessmentAI);
app.use("/api/sourcing", sourcing);
app.use("/api/recruiter", recruiter);
app.use("/api/pipeline", pipeline);
app.use("/api/stage-category", stageCategory);
app.use("/api/template-stage", templateStage);
app.use("/api/automation-setting", automationSetting);
app.use("/api/screening", screening);
app.use("/api/company", company);
app.use("/api/company-usage", companyUsage);
app.use("/api/portal-assessment", portalAssessment);
app.use("/api/portal-qa", portalQa);
app.use("/api/interview", interview);
app.use("/api/background-check", backgroundCheck);
app.use("/api/portal-bg-consent", portalBg);
app.use("/api/offer", offer);
app.use("/api/onboarding", onboarding);
app.use("/api/portal-offer", portalOffer);
app.use("/api/offer-template", offerTemplate);
app.use("/api/interview-pack", interviewPack);
app.use("/api/portal-interview", portalInterview);
app.use("/api/offer-pack", offerPack);
app.use("/api/portal-contract", portalContract);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
