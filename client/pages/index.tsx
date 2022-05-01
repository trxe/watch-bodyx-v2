import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { useSockets } from '../context/socket.context'

import { useRef, useState } from 'react'
import EVENTS from '../config/events'
import DashboardContainer from '../containers/Dashboard'
import ViewerContainer from '../containers/Viewer'
import Snackbar, { createNotif } from '../containers/Snackbar'
import { CHANNELS } from '../config/channels'
import WaitingRoomContainer from '../containers/WaitingRoom'
import DisconnectedContainer from '../containers/DisconnectedPage'

export default function Home() {
  const {socket, channel, user, notif, setNotif} = useSockets();
  const emailRef = useRef(null);
  const ticketRef = useRef(null);

  const handleSetTicket = () => {
    const email = emailRef.current.value;
    const ticket = ticketRef.current.value;
    if (!email || !ticket) {
      setNotif(createNotif('error', "Missing email or ticket number", "Please enter all details."));
    }
    socket.emit(EVENTS.CLIENT.LOGIN, 
      {socketId: socket.id, ticket, email}, 
      (res) => { 
        if (res.status === 'error') setNotif(res);
      });
  }

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
      {channel === CHANNELS.MAIN_ROOM && <ViewerContainer />}
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
