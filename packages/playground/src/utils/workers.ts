import workerpool from 'workerpool'
import workerURL from './unpack-worker?worker&url'

export const workerPool = workerpool.pool(workerURL, {
    workerOpts: {
        type: 'module',
    },
})
