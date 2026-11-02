import "./src/config/env.js"; // must be first

import "./src/bullmq/seek/seek.worker.js";
import "./src/bullmq/linkedin/linkedin.worker.js";
import "./src/bullmq/cv/cv.worker.js";
import "./src/bullmq/match-rescore/match-rescore.worker.js";
import { registerSeekSchedulers } from "./src/bullmq/seek/seek.scheduler.js";

registerSeekSchedulers().catch((err) => console.error('Failed to register Seek schedulers:', err));

import express from "express";
import cors from 'cors';
import { Router } from 'express';

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
import assessment from "./src/modules/assessment/assessment.route.js"
import participant from "./src/modules/assessment/participant/participant.route.js"
import question from "./src/modules/assessment/question/question.route.js"
import assessmentAnswer from "./src/modules/assessment/assessment-answer/assessment-answer.route.js"
import assessmentScore from "./src/modules/assessment/assessment-score/assessment-score.route.js"
import session from "./src/modules/assessment/session/session.route.js"
import assessmentBatteryResult from "./src/modules/assessment/assessment-battery-result/assessment-battery-result.route.js"
import assessmentAI from "./src/modules/assessment/assessment-ai/assessment-ai.route.js"
import sourcing from "./src/modules/sourcing/sourcing.route.js"
import pipeline from "./src/modules/pipeline/pipeline.route.js"
import stageCategory from "./src/modules/stage-category/stage-category.route.js"
import templateStage from "./src/modules/template-stage/template-stage.route.js"
import automationSetting from "./src/modules/automation-setting/automation.route.js"
import screening from "./src/modules/screening/screening.route.js"
import company from "./src/modules/company/company.route.js"
import companyUsage from "./src/modules/company-usage/company-usage.route.js"
import setting from "./src/modules/setting/setting.route.js"
import portalAssessment from "./src/modules/portal-assessment/portal-assessment.route.js"
import portalQa from "./src/modules/portal-qa/portal-qa.route.js"
import interview from "./src/modules/interview/interview.route.js"
import backgroundCheck from "./src/modules/background-check/background-check.route.js"
import portalBg from "./src/modules/portal-bg/portal-bg.route.js"
import offer from "./src/modules/offer/offer.route.js"
import onboarding from "./src/modules/onboarding/onboarding.route.js"
import onboardingLms from "./src/modules/onboarding-lms/onboarding-lms.route.js"
import portalOffer from "./src/modules/portal-offer/portal-offer.route.js"
import offerTemplate from "./src/modules/offer-template/offer-template.route.js"
import interviewPack from "./src/modules/interview-pack/interview-pack.route.js"
import portalInterview from "./src/modules/portal-interview/portal-interview.route.js"
import offerPack from "./src/modules/offer-pack/offer-pack.route.js";
import portalContract from "./src/modules/portal-contract/portal-contract.route.js";
import emailTemplate from "./src/modules/email-template/email-template.route.js";
import portalOnboarding from "./src/modules/portal-onboarding/portal-onboarding.route.js";
import onboardingAssessmentResult from "./src/modules/onboarding assessment/onboarding-assessment-result.route.js";
import onboardingQuestion from "./src/modules/onboarding assessment/question/onboarding-question.route.js";
import chatBotSource from "./src/modules/chat-bot/source/source.route.js";
import chatBotConversation from "./src/modules/chat-bot/conversation/conversation.route.js";
import chatBotMessage from "./src/modules/chat-bot/message/message.route.js";
import form from "./src/modules/application-form/form.route.js";

const app = express();
const api = Router();

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

api.use("/auth", auth);
api.use("/cookies", cookies);
api.use("/linkedin", linkedin);
api.use("/seek", seek);
api.use("/role", role);
api.use("/user", user);
api.use("/permission", permission);
api.use("/module", module);
api.use("/menu", menu);
api.use("/job-account", jobAccount);
api.use("/job-posting", jobPosting);
api.use("/job-sourcing", jobSourcing);
api.use("/job", job);
api.use("/applicant", applicant);
api.use("/candidate-pipeline", candidatePipeline);
api.use("/sourcing", sourcing);
api.use("/pipeline", pipeline);
api.use("/stage-category", stageCategory);
api.use("/template-stage", templateStage);
api.use("/automation-setting", automationSetting);
api.use("/screening", screening);
api.use("/company", company);
api.use("/company-usage", companyUsage);
api.use("/setting", setting);
api.use("/assessment", assessment);
api.use("/participant", participant);
api.use("/question", question);
api.use("/assessment-answer", assessmentAnswer);
api.use("/assessment-score", assessmentScore);
api.use("/session", session);
api.use("/assessment-battery-result", assessmentBatteryResult);
api.use("/assessment-ai", assessmentAI);
api.use("/portal-assessment", portalAssessment);
api.use("/portal-qa", portalQa);
api.use("/interview", interview);
api.use("/background-check", backgroundCheck);
api.use("/portal-bg-consent", portalBg);
api.use("/offer", offer);
api.use("/onboarding", onboarding);
api.use("/onboarding-lms", onboardingLms);
api.use("/portal-offer", portalOffer);
api.use("/offer-template", offerTemplate);
api.use("/interview-pack", interviewPack);
api.use("/portal-interview", portalInterview);
api.use("/offer-pack", offerPack)
api.use("/portal-contract", portalContract);
api.use("/email-template", emailTemplate)
api.use("/portal-onboarding", portalOnboarding);
api.use("/onboarding-assessment-result", onboardingAssessmentResult);
api.use("/onboarding-question", onboardingQuestion);
api.use("/chat-bot/source", chatBotSource);
api.use("/chat-bot/conversation", chatBotConversation);
api.use("/chat-bot/message", chatBotMessage);
api.use("/form", form);

app.use(["/api", "/portal/api"], api);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});