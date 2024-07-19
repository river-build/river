import { dlogger } from '@river-build/dlog'

// eslint-disable-next-line no-console
const logger = console.log

export class Analytics {
    private static visited = 0
    private static stack: string[] = []

    private static log(name: string, ...args: unknown[]) {
        logger(name, ...args)
    }

    static measure(name: string) {
        if (this.stack.length > this.visited) {
            const padding = '  '.repeat(this.visited * 2)
            this.log(padding + this.stack.at(-1)!)
            this.visited = this.stack.length
        }
        this.stack.push(name)
        const start = Date.now()
        return () => {
            this.stack.pop()
            if (this.stack.length < this.visited) {
                this.visited = this.stack.length
            }
            const duration = Date.now() - start
            const padding = '  '.repeat(this.stack.length * 2)
            this.log(padding + name, duration)
        }
    }
}
