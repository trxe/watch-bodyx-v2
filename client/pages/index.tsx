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
import { showName, themeName } from '../config/global_settings'

export default function Home() {
  const {channel, user, notif, connectionState} = useSockets();
  const router = useRouter();

  useEffect(() => {
    // resetting any hash fragments from poll
    history.pushState('', document.title, window.location.pathname);
    if (!user && connectionState === 'disconnected') router.push('/login');
  }, [router, user, connectionState])

  return (
    <div className={themeName}>
      <Head>
        <title>{showName}</title>
      </Head>
      {channel === CHANNELS.SM_ROOM && <DashboardContainer/>}
      {channel === CHANNELS.WAITING_ROOM && <WaitingRoomContainer/>}
      {channel === CHANNELS.MAIN_ROOM && <AudienceViewContainer />}
      {channel === CHANNELS.DISCONNECTED && <DisconnectedContainer />}
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
