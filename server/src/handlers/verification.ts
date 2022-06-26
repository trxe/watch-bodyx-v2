import { VerifiedAction, VERIFY_TIMEOUT } from "../interfaces/verifiedAction";

let emailVerify: Map<string, VerifiedAction> = new Map<string, VerifiedAction>();

/**
 * Sets a verification code for this email. Also caches the timestamp it was 
 * generated (to enable checking timeout) and the intended action.
 * @param email 
 * @returns Verification code generated
 */
const generateAndSetVerification = (email: string, action: Function): string => {
    // generate verification code
    let codeArray = Array(6);
    for (let i = 0 ; i < 6; i++) {
        codeArray[i] = Math.floor(Math.random() * 10)
    }
    const code = codeArray.join('');
    emailVerify.set(email, {action, timestamp: Date.now(), code});
    return code;
}

/**
 * Regenerate a verification code with a new timestamp
 * @param email 
 * @returns Verification code generated
 */
const regenerateVerification = (email: string): string => {
    if (!emailVerify.has(email)) throw `No pending action for ${email}`;
    // generate verification code
    let codeArray = Array(6);
    for (let i = 0 ; i < 6; i++) {
        codeArray[i] = Math.floor(Math.random() * 10)
    }
    const code = codeArray.join('');
    const {action} = emailVerify.get(email);
    emailVerify.set(email, {action, timestamp: Date.now(), code});
    return code;
}

/**
 * Performs cached action if code is correct and has not timed out.
 * @param email 
 * @param givenCode 
 */
const verifyCode = (email: string, givenCode: string) => {
    if (!emailVerify.has(email)) throw `No pending action for ${email}`;
    const {action, timestamp, code} = emailVerify.get(email);
    if (code !== givenCode) throw `Invalid/Incorrect verification code.`
    if (Date.now() - timestamp > VERIFY_TIMEOUT) 
        throw `Verification code expired. Generate a new one.`
    action();
    emailVerify.delete(email);
}

const Verifier = {
    generateAndSetVerification,
    regenerateVerification,
    verifyCode
}

export default Verifier;