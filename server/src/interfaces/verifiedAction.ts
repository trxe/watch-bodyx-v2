export const VERIFY_TIMEOUT = 120000;

export interface VerifiedAction {
    action: Function
    timestamp: number
    code?: string
}