import * as seekProducer from '../seek/queue/seek.producer.js'
import * as linkedinProducer from '../linkedin/queue/linkedin.producer.js'

const registry = {
  seek: {
    checkConnection: seekProducer.enqueueCheckConnection,
    syncJobSource: seekProducer.enqueueSyncJobSource,
  },
  linkedin: {
    checkConnection: linkedinProducer.enqueueCheckConnection,
  },
}

export default registry;