import '../styles/globals.css'
import SocketsProvider from '../context/socket.context'
import ChatRoomProvider from '../context/chats.context'
import PollProvider from '../context/poll.context'

function MyApp({ Component, pageProps }) {
  return <SocketsProvider>
    <ChatRoomProvider>
      <PollProvider>
        <Component {...pageProps} />
      </PollProvider>
    </ChatRoomProvider>
  </SocketsProvider>
}

export default MyApp
