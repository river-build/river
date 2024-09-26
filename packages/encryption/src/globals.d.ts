// eslint-disable-next-line @typescript-eslint/prefer-namespace-keyword
declare module globalThis {
    // OlmLib fails initialization if this is not defined
    // eslint-disable-next-line no-var
    var OLM_OPTIONS: Record<string, unknown>
}
