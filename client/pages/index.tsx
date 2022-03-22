import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { useSockets } from '../context/socket.context'

import MessagesContainer from '../containers/Messages'
import RoomsContainer from '../containers/Rooms'
import { useRef, useState } from 'react'
import EVENTS from '../config/events'
import DashboardContainer from '../containers/Dashboard'
import ViewerContainer from '../containers/Viewer'

export default function Home() {
  const {socket, ticket, isAdmin} = useSockets();
  const [isAdminView, setAdminView] = useState(true);
  const ticketRef = useRef(null);

  const handleSetTicket = () => {
    const value = ticketRef.current.value;
    if (!value) return;
    socket.emit(EVENTS.CLIENT.LOGIN, {ticket: value});
  }

  const toggleAdminView = () => {
    setAdminView(!isAdminView);
  }

  const NavBar = <div className={styles.bar}>
        <button onClick={toggleAdminView}>MODE</button>
        <h2>BODYX</h2>
    </div>;

  return (
    <div>
      <Head>
        <title>BODYX</title>
      </Head>
      {!ticket && <div className={styles.loginWrapper}>
          <div className={styles.loginInner}>
            <h1>BODYX</h1>
            <input placeholder='Enter ticket' ref={ticketRef}/>
            <button onClick={handleSetTicket}>START</button>
          </div>
        </div>
      }
      {isAdmin && <div>
        {NavBar}
        {isAdminView ? <DashboardContainer /> :
          <div> <ViewerContainer /> </div>}
        </div>
      }
      {!isAdmin && <div>
          <ViewerContainer />
        </div>
      }
    </div>
  )
}
