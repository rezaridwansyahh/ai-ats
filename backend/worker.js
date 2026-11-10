import "./src/config/env.js"; // must be first

import "./src/modules/platform/seek/queue/seek.worker.js"
import "./src/modules/platform/linkedin/queue/linkedin.worker.js"
import "./src/bullmq/cv/cv.worker.js"
import "./src/bullmq/match-rescore/match-rescore.worker.js"
