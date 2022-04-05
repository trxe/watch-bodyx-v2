import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { useSockets } from '../context/socket.context'

import { useRef, useState } from 'react'
import EVENTS from '../config/events'
import DashboardContainer from '../containers/Dashboard'
import ViewerContainer from '../containers/Viewer'
import Snackbar from '../containers/Snackbar'

export default function Home() {
  const {socket, ticket, isAdmin, error, setNotif, isLoggedIn} = useSockets();
  const [isAdminView, setAdminView] = useState(true);
  const emailRef = useRef(null);
  const ticketRef = useRef(null);

  // console.log(socket.io.opts);

  const handleSetTicket = () => {
    const email = emailRef.current.value;
    const ticket = ticketRef.current.value;
    if (!email || !ticket) return; // SET ERROR
    socket.emit(EVENTS.CLIENT.LOGIN, 
      {socketId: socket.id, ticket, email}, 
      (res) => { 
        if (res.status === 'error') setNotif(res);
      });
  }

  const toggleAdminView = () => {
    setAdminView(!isAdminView);
  }

  return (
    <div>
      <Head>
        <title>BODYX</title>
      </Head>
      {!ticket && <div className={styles.loginWrapper}>
          <div className={styles.loginInner}>
            <h1>BODYX</h1>
            <input placeholder='Enter email' ref={emailRef}/>
            <input placeholder='Enter ticket' ref={ticketRef}/>
            <button onClick={handleSetTicket}>START</button>
          </div>
        </div>
      }
      {isLoggedIn && isAdmin && <div>
        {isAdminView ? <DashboardContainer /> :
          <div> <ViewerContainer /> </div>}
        </div>
      }
      {isLoggedIn && !isAdmin && <div>
          <ViewerContainer />
        </div>
      }
      {error != null &&
        <Snackbar timer={4000} 
          messageType={error.messageType}
          title={error.title}
          message={error.message}
        />
      }
    </div>
  )
}
