export default {
    fetch(request: Request, env: Env, _ctx: ExecutionContext) {
        return worker.fetch(request, env)
    },
}

export const worker = {
    fetch(request: Request, env: Env): Response {
        return new Response('Hello World!')
    },
}
