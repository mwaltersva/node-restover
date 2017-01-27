export function validateRequestBody(body: any): boolean {
    if (!body.message) return false;
    if (typeof body.message !== 'string') return false;

    return true;
}
