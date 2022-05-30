import Head from 'next/head'
import themes from '../styles/Themes.module.css'
import styles from '../styles/Home.module.css'
import { useSockets } from '../context/socket.context'

import { useRef, useEffect } from 'react'
import DashboardContainer from '../containers/Dashboard'
import ViewerContainer from '../containers/Viewer'
import Snackbar, { createNotif } from '../containers/Snackbar'
import { CHANNELS } from '../config/channels'
import WaitingRoomContainer from '../containers/WaitingRoom'
import DisconnectedContainer from '../containers/DisconnectedPage'
import LoginContainer from '../containers/Login'
import ChangePasswordContainer from '../containers/ChangePassword'
import NonAttendeesContainer from '../containers/NonAttendees'

export default function Home() {
  const {channel, user, notif, setNotif, loginRequest} = useSockets();
  const emailRef = useRef(null);
  const ticketRef = useRef(null);

  useEffect(() => {
    // resetting any hash fragments from poll
    location.hash = '';
  }, [])

  const handleSetTicket = () => {
    const email = emailRef.current.value;
    const ticket = ticketRef.current.value;
    if (!email || !ticket || email.length == 0 || ticket.length == 0) {
      setNotif(createNotif('error', "Missing email or ticket number", "Please enter all details."));
    } else {
      loginRequest({email, ticket});
    }
  }

  return (
    <div className={themes.default}>
      <Head>
        <title>BODYX</title>
      </Head>
      {!user && <LoginContainer/>}
      {channel === CHANNELS.SM_ROOM && <DashboardContainer/>}
      {channel === CHANNELS.WAITING_ROOM && <WaitingRoomContainer/>}
      {channel === CHANNELS.MAIN_ROOM && <ViewerContainer isAdmin={user.isAdmin}/>}
      {channel === CHANNELS.DISCONNECTED && <DisconnectedContainer />}
      {channel === CHANNELS.CHANGE_PASSWORD && <ChangePasswordContainer />}
      {channel === CHANNELS.NON_ATTENDEES_ROOM && <NonAttendeesContainer />}
      {notif != null &&
        <Snackbar timer={4000} 
          messageType={notif.messageType}
          title={notif.title}
          message={notif.message}
        />
      }
    </div>
  )
}
