export const getEventURL = (eventId: string): string => `https://www.eventbriteapi.com/v3/events/${eventId}`;
export const getEventAttendeesURL = (eventId: string): string => `https://www.eventbriteapi.com/v3/events/${eventId}/attendees`;
export const getOrderAttendeesURL = (orderId: string): string => `https://www.eventbriteapi.com/v3/orders/${orderId}/?expand=attendees`;

export const generateCode = (digits?: number): string => {
    const length = digits != null ? digits : 6;
    let code = '';
    for (let i = 0; i < length; i++) {
        code += Math.floor(Math.random() * 10);
    }
    console.log(code);
    return code;
}