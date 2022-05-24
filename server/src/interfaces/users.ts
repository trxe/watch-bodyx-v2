export interface User {
    name: string,
    email: string,
    ticket: string,
    passwordHash?: string,
    firstName: string,
    isAdmin: boolean,
    isPresent: boolean,
    hasAttended: boolean,
    eventId?: string,
}