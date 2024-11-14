import * as model from '@microsoft/api-extractor-model'
import * as fs from 'node:fs'

import { renderApiFunction } from './render/functions'
import { type ModuleItem } from './render/module-types'
import { createDataLookup, getId } from './utils/model'
import { resolve } from 'node:path'

const config = {
    projectName: 'react-sdk',
    packageDir: '../../react-sdk',
    entryFile: './src/index.ts', // with regards to the package
    pagesDir: '../../../docs/sdk/react-sdk',
    mintlifyJson: '../../../docs/mint.json',
}
export type DocgenConfig = typeof config

console.log('Generating API docs.')

////////////////////////////////////////////////////////////
/// Load API Model and construct lookup
////////////////////////////////////////////////////////////
const fileName = `./${config.projectName}.api.json`
const filePath = resolve(import.meta.dirname, fileName)
const apiPackage = new model.ApiModel().loadPackage(filePath)
const dataLookup = createDataLookup(apiPackage)

fs.writeFileSync(resolve(import.meta.dirname, './lookup.json'), JSON.stringify(dataLookup, null, 2))

////////////////////////////////////////////////////////////
/// Get API entrypoint and namespaces
////////////////////////////////////////////////////////////
const apiEntryPoint = apiPackage.members.find(
    (x) => x.kind === model.ApiItemKind.EntryPoint,
) as model.ApiEntryPoint
if (!apiEntryPoint) {
    throw new Error('Could not find api entrypoint')
}

////////////////////////////////////////////////////////////
/// Generate markdown files
////////////////////////////////////////////////////////////

const functionsMap = new Map<
    string,
    {
        description: string | undefined
        link: string
    }
>()

const dir = resolve(import.meta.dirname, `${config.pagesDir}/api/`)
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
}

for (const module of apiEntryPoint.members) {
    const name = module.displayName
    const baseLink = `./api/${name}`
    const functions: ModuleItem[] = []

    const id = getId(module)
    const data = dataLookup[id]
    if (!data) {
        throw new Error(`Could not find data for ${id}`)
    }

    const { description, displayName } = data

    let apiContent = ''
    const typeContent = ''
    if (module.kind === model.ApiItemKind.Function) {
        // Resolve overloads for function
        const overloads = module
            .getMergedSiblings()
            .map(getId)
            .filter((x) => !x.endsWith('namespace'))
        // Skip overloads without TSDoc attached
        if (overloads.length > 1 && overloads.find((x) => dataLookup[x]?.comment?.summary) !== id) {
            continue
        }
        const link = `${baseLink}`
        functions.push({ apiItem: module, description, link })

        apiContent = renderApiFunction({
            apiItem: apiPackage,
            data,
            dataLookup,
            overloads,
        })
    }

    if (functions.length > 0) {
        const content = ['---', `title: ${displayName}`, '---']
        for (const f of functions) {
            if (f.apiItem.displayName !== displayName) {
                content.push(`## ${f.apiItem.displayName}`)
            }
            functionsMap.set(displayName, {
                description: f.description,
                link: f.link,
            })
            content.push(f.description)
            content.push(apiContent)
            content.push(typeContent)
        }
        fs.writeFileSync(`${dir}/${displayName}.mdx`, content.join('\n'))
    }
}

////////////////////////////////////////////////////////////
/// Generate "API Reference" page
////////////////////////////////////////////////////////////

let content = '# API Reference\n\n'

content += '| Name | Description |\n'
content += '| --- | --- |\n'

for (const [name, info] of functionsMap) {
    content += `| ${info.link ? `[${name}](${info.link})` : name} | ${info.description} |\n`
}

content += '\n'

fs.writeFileSync(resolve(import.meta.dirname, `${config.pagesDir}/overview.mdx`), content)

console.log('Done.')
