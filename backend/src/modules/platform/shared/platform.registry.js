import * as seekProducer from '../seek/queue/seek.producer.js'
import * as linkedinProducer from '../linkedin/queue/linkedin.producer.js'

const registry = {
  seek: {
    checkConnection: seekProducer.enqueueCheckConnection,
    syncJobSource: seekProducer.enqueueSyncJobSource,
    extractCandidate: seekProducer.enqueueExtractCandidate,
    debugSession: seekProducer.enqueueDebugSession,
  },
  linkedin: {
    checkConnection: linkedinProducer.enqueueCheckConnection,
  },
}

export default registry;