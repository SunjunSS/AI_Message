import { createBrowserRouter } from 'react-router-dom'
import MainHome from './components/MainHome'
import MessageCompose from './components/MessageCompose'
import GoogleCallback from './components/GoogleCallback'  // ✅ 수정

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainHome />,
  },
  {
    path: '/compose',
    element: <MessageCompose />,
  },
  {
    path: '/auth/google/callback',  // ✅ 수정
    element: <GoogleCallback />,
  },
])

export default router