import * as spawn from 'cross-spawn'
import minimist from 'minimist'
import path from 'node:path'
import fs from 'node:fs'
import picocolors from 'picocolors'

const getPackageManager = () => {
    if (process.env.npm_config_user_agent) {
        const agent = process.env.npm_config_user_agent
        if (agent.startsWith('yarn')) return 'yarn'
        if (agent.startsWith('npm')) return 'npm'
        if (agent.startsWith('pnpm')) return 'pnpm'
        if (agent.startsWith('bun')) return 'bun'
    }
    return 'npm' // Default to npm if no user agent is found
}

const argv = minimist(process.argv.slice(2))

async function init(targetDir: string) {
    const packageName = targetDir === '.' ? path.basename(process.cwd()) : targetDir
    const projectDir = targetDir === '.' ? process.cwd() : path.join(process.cwd(), targetDir)

    const pkgManager = getPackageManager()

    console.log(picocolors.blue(`\nScaffolding project in ${targetDir}...`))

    const createViteCommand = (() => {
        switch (pkgManager) {
            case 'yarn':
                return ['create', 'vite', packageName, '--template', 'react-ts']
            case 'pnpm':
                return ['create', 'vite', packageName, '--template', 'react-ts']
            case 'bun':
                return ['create', 'vite', packageName, '--template', 'react-ts']
            default:
                return ['create', 'vite@latest', packageName, '--', '--template', 'react-ts']
        }
    })()

    const result = spawn.sync(pkgManager, createViteCommand, { stdio: 'inherit' })

    if (result.signal === 'SIGINT' || result.signal === 'SIGTERM') {
        console.log('\nOperation cancelled')
        process.exit(1)
    }

    if (result.status !== 0) {
        console.error(picocolors.red('\nFailed to scaffold project.'))
        process.exit(1)
    }

    console.log(picocolors.green('\nVite project created successfully.'))

    console.log(picocolors.blue('\nAdding River SDK dependencies...'))

    const packageJsonPath = path.join(projectDir, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

    if (!packageJson.dependencies || !packageJson.devDependencies) {
        packageJson.dependencies = {}
        packageJson.devDependencies = {}
    }

    packageJson.dependencies['@river-build/sdk'] = 'latest'
    packageJson.dependencies['@river-build/react-sdk'] = 'latest'
    packageJson.devDependencies['vite-plugin-node-polyfills'] = 'latest'

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')

    console.log(picocolors.green('\nRiver SDK dependencies added successfully.'))
    console.log(picocolors.blue('\nUpdating vite.config.ts...'))

    const viteConfigPath = path.join(projectDir, 'vite.config.ts')
    let viteConfig = fs.readFileSync(viteConfigPath, 'utf8')

    // Add import for vite-plugin-node-polyfills
    viteConfig = `import { nodePolyfills } from 'vite-plugin-node-polyfills'\n${viteConfig}`

    // Add nodePolyfills to plugins array
    viteConfig = viteConfig.replace(/plugins:\s*\[([\s\S]*?)\]/, (_, pluginsContent) => {
        const trimmedContent = pluginsContent.trim()
        const separator = trimmedContent ? ',\n    ' : ''
        return `plugins: [${pluginsContent}${separator}nodePolyfills()\n  ]`
    })

    fs.writeFileSync(viteConfigPath, viteConfig)
    console.log(picocolors.green('\nvite.config.ts updated successfully.'))

    console.log(picocolors.green('\nDone! 🎉'))
    console.log(picocolors.blue('\nNow run: cd ' + targetDir + ' && ' + pkgManager + ` install`))
    console.log(picocolors.blue('\nThen run: ' + pkgManager + ' dev'))
    console.log()
}

init(argv._[0] || '.').catch((e) => {
    console.error(e)
})
