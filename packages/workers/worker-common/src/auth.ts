export interface AuthEnv {
    AUTH_SECRET: string
    ADMIN_AUTH_SECRET?: string
}

export const isAdminAuthedRequest = (request: Request, env: AuthEnv) => {
    const authToken = request.headers.get('Authorization')?.split(' ')[1]
    if (!authToken) {
        return false
    }
    // use atob, Buffer isn't available in workers by default
    try {
        return atob(authToken) === env.ADMIN_AUTH_SECRET
    } catch (error) {
        return false
    }
}

export const isAuthedRequest = (request: Request, env: AuthEnv) => {
    const authToken = request.headers.get('Authorization')?.split(' ')[1]
    if (!authToken) {
        return false
    }
    // use atob, Buffer isn't available in workers by default
    try {
        return atob(authToken) === env.AUTH_SECRET
    } catch (error) {
        return false
    }
}
