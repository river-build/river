export class ExecutionError extends Error {
    private tags: { [key: string]: string } = {}

    constructor(message: string, sourceErr: Error) {
        super(`${message}: ${sourceErr.toString()}`)
        this.name = 'ExecutionError'
    }

    Tag(key: string, value: string): ExecutionError {
        this.tags[key] = value
        return this
    }

    toString(): string {
        let message = `${this.message}`

        if (this.tags.keys.length > 0) {
            message += ' {'
            for (const key in this.tags) {
                const value = this.tags[key]
                message += `"${key}": "${value}", `
            }
            message += message.slice(0, message.length - 2) + ' }'
        }
        return message
    }
}
