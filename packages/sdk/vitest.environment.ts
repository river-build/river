/// File is got from vitest/environments
import { Environment, builtinEnvironments } from 'vitest/environments'
function catchWindowErrors(window: Window) {
    let userErrorListenerCount = 0
    function throwUnhandlerError(e: ErrorEvent) {
        if (userErrorListenerCount === 0 && e.error != null) {
            process.emit('uncaughtException', e.error)
        }
    }
    const addEventListener = window.addEventListener.bind(window)
    const removeEventListener = window.removeEventListener.bind(window)
    window.addEventListener('error', throwUnhandlerError)
    window.addEventListener = function (...args: [any, any, any]) {
        if (args[0] === 'error') {
            userErrorListenerCount++
        }
        return addEventListener.apply(this, args)
    }
    window.removeEventListener = function (...args: [any, any, any]) {
        if (args[0] === 'error' && userErrorListenerCount) {
            userErrorListenerCount--
        }
        return removeEventListener.apply(this, args)
    }
    return function clearErrorHandlers() {
        window.removeEventListener('error', throwUnhandlerError)
    }
}

export default <Environment>{
    name: builtinEnvironments.jsdom.name,
    transformMode: builtinEnvironments.jsdom.transformMode,
    async setupVM({ jsdom = {} }) {
        const { CookieJar, JSDOM, ResourceLoader, VirtualConsole } = await import('jsdom')
        const {
            html = '<!DOCTYPE html>',
            userAgent,
            url = 'http://localhost:3000',
            contentType = 'text/html',
            pretendToBeVisual = true,
            includeNodeLocations = false,
            runScripts = 'dangerously',
            resources,
            console = false,
            cookieJar = false,
            ...restOptions
        } = jsdom as any
        let dom = new JSDOM(html, {
            pretendToBeVisual,
            resources: resources ?? (userAgent ? new ResourceLoader({ userAgent }) : undefined),
            runScripts,
            url,
            virtualConsole:
                console && globalThis.console
                    ? new VirtualConsole().sendTo(globalThis.console)
                    : undefined,
            cookieJar: cookieJar ? new CookieJar() : undefined,
            includeNodeLocations,
            contentType,
            userAgent,
            ...restOptions,
        })
        const clearWindowErrors = catchWindowErrors(dom.window as any)

        dom.window.Buffer = Buffer
        dom.window.Uint8Array = Uint8Array // 👈 river needs
        dom.window.ReadableStream = ReadableStream // 👈 river needs

        dom.window.jsdom = dom

        // inject web globals if they missing in JSDOM but otherwise available in Nodejs
        // https://nodejs.org/dist/latest/docs/api/globals.html
        const globalNames = [
            'structuredClone',
            'fetch',
            'Request',
            'Response',
            'BroadcastChannel',
            'MessageChannel',
            'MessagePort',
            'TextEncoder',
            'TextDecoder',
        ] as const
        for (const name of globalNames) {
            const value = globalThis[name]
            if (typeof value !== 'undefined' && typeof dom.window[name] === 'undefined') {
                dom.window[name] = value
            }
        }

        return {
            getVmContext() {
                return dom.getInternalVMContext()
            },
            teardown() {
                clearWindowErrors()
                dom.window.close()
                dom = undefined as any
            },
        }
    },
    setup: builtinEnvironments.jsdom.setup,
}
