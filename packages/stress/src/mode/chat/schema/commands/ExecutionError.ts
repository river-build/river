class ExecutionError extends Error {
    private sourceErr: Error
    private tags: { [key: string]: any } = {}

    constructor(message: string, sourceErr: Error) {
        super(`${message}: ${sourceErr}`)
        this.sourceErr = sourceErr
        this.name = 'ExecutionError'
    }

    Tag(key: string, value: any): ExecutionError {
        this.tags[key] = value
        return this
    }

    toString(): String {
        let message = `${this.message}`

        if (this.tags.length > 0) {
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
