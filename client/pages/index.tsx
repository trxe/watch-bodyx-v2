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

export default function Home() {
  const {channel, user, notif, setNotif, loginRequest} = useSockets();
  const emailRef = useRef(null);
  const ticketRef = useRef(null);
  const TEMP = true;

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

  if (TEMP) return <div className={themes.default}><DashboardContainer /></div>

  return (
    <div>
      <Head>
        <title>BODYX</title>
      </Head>
      {!user && <div className={styles.loginWrapper}>
          <div className={styles.loginInner}>
            <h1>BODYX</h1>
            <input placeholder='Enter email' ref={emailRef}/>
            <input placeholder='Enter ticket' ref={ticketRef}/>
            <button onClick={handleSetTicket}>START</button>
          </div>
        </div>
      }
      {channel === CHANNELS.SM_ROOM && <DashboardContainer/>}
      {channel === CHANNELS.WAITING_ROOM && <WaitingRoomContainer/>}
      {channel === CHANNELS.MAIN_ROOM && <ViewerContainer isAdmin={user.isAdmin}/>}
      {channel === CHANNELS.DISCONNECTED && <DisconnectedContainer />}
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
