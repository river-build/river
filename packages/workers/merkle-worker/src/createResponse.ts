import { toJson } from './utils'

export enum ErrorCode {
    BAD_REQUEST = 'BAD_REQUEST',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

type ApiResponse<T> = {
    success: boolean
    message: string
    errorDetail?: ApiErrorDetail
    data?: T
}

export type ApiErrorDetail = {
    code: ErrorCode // Application-specific error code (e.g., "VALIDATION_ERROR")
    description: string // Description of the error for developers
}

export function createSuccessResponse<T>(status: number, message: string, data?: T) {
    return new Response(
        toJson({
            success: true,
            message,
            data,
            /**
             * @deprecated
             * backwards compatibility for fields added directly in response
             * clients should migrate to data field
             */
            ...data,
        } satisfies ApiResponse<T>),
        {
            status,
        },
    )
}

export function createErrorResponse(status: number, message: string, code: ErrorCode) {
    return new Response(
        toJson({
            success: false,
            message,
            errorDetail: {
                code,
                description: message,
            },
            /**
             * @deprecated
             * backwards compatibility for old error string
             * clients should migrate to errorDetail field
             */
            error: message,
        } satisfies ApiResponse<null> & { error: string }),
        {
            status,
        },
    )
}
