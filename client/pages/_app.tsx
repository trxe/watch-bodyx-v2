import '../styles/globals.css'
import SocketsProvider from '../context/socket.context'
import ChatRoomProvider from '../context/chats.context'

function MyApp({ Component, pageProps }) {
  return <SocketsProvider>
    <ChatRoomProvider>
      <Component {...pageProps} />
    </ChatRoomProvider>
  </SocketsProvider>
}

export default MyApp
