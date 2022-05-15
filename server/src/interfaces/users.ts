export interface User {
    name: string,
    email: string,
    ticket: string,
    firstName: string,
    isAdmin: boolean,
    isPresent: boolean,
    hasAttended: boolean,
    eventId?: string,
}