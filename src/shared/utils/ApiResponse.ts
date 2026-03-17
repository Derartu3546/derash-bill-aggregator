export class ApiResponse {
    static success(data: any, message: string = 'Operation successful') {
        return {
            status: 'SUCCESS',
            message,
            data,
            timestamp: new Date().toISOString(),
        };
    }

    static error(message: string, code: string = 'INTERNAL_ERROR', details: any = null) {
        return {
            status: 'FAILED',
            message,
            error_code: code,
            details,
            timestamp: new Date().toISOString(),
        };
    }
}

