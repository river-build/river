import fs from 'fs'
import { MetricsDiscovery } from './metrics-discovery'
import { envVarsSchema } from './env-vars'
import { sleep } from './utils'

const PROMETHEUS_TARGETS_FILE = './prometheus/etc/config/targets.json'
const SLEEP_DURATION_MS = 1000 * 60 * 5 // 5 minutes

const run = async () => {
    const envVars = envVarsSchema.parse(process.env)
    const metricsDiscovery = MetricsDiscovery.init({
        riverRpcURL: envVars.RIVER_RPC_URL,
        env: envVars.ENV,
    })

    while (true) {
        console.info('Getting prometheus targets...')
        const targets = await metricsDiscovery.getPrometheusTargets()
        console.info('Writing prometheus targets...', targets)
        fs.writeFileSync(PROMETHEUS_TARGETS_FILE, targets)
        console.info(`Prometheus targets written to: ${PROMETHEUS_TARGETS_FILE}`)
        console.info(`Sleeping for ${SLEEP_DURATION_MS} ms...`)
        await sleep(SLEEP_DURATION_MS)
    }
}

run()
