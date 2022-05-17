import { createNotif, INotif } from "../containers/Snackbar";

const DISCONNECTED: INotif = createNotif('error', 'You have been disconnected.', 'Please refresh and try logging in again.')

export const NOTIF = {
    DISCONNECTED
}