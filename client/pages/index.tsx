import Head from 'next/head'
import themes from '../styles/Themes.module.css'
import { useSockets } from '../context/socket.context'

import { useEffect } from 'react'
import DashboardContainer from '../containers/Dashboard'
import Snackbar from '../containers/Snackbar'
import { CHANNELS } from '../config/channels'
import WaitingRoomContainer from '../containers/WaitingRoom'
import DisconnectedContainer, { DisconnectedModal } from '../containers/DisconnectedPage'
import ChangePasswordContainer from '../containers/ChangePassword'
import NonAttendeesContainer from '../containers/NonAttendees'
import AudienceViewContainer from '../containers/AudienceView'
import { useRouter } from 'next/router'

export default function Home() {
  const {channel, user, notif, connectionState} = useSockets();
  const router = useRouter();

  useEffect(() => {
    // resetting any hash fragments from poll
    history.pushState('', document.title, window.location.pathname);
    console.log(user, connectionState)
    if (!user && connectionState === 'disconnected') router.push('/login');
  }, [])

  return (
    <div className={themes.default}>
      <Head>
        <title>BODYX</title>
      </Head>
      {channel === CHANNELS.SM_ROOM && <DashboardContainer/>}
      {channel === CHANNELS.WAITING_ROOM && <WaitingRoomContainer/>}
      {channel === CHANNELS.MAIN_ROOM && <AudienceViewContainer />}
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
      {(connectionState === "disconnected" || connectionState === "reconnecting") 
        && <DisconnectedModal />}
    </div>
  )
}
