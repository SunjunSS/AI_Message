import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// getElementById는 null을 반환할 수 있어 as HTMLElement로 타입 명시
// TS는 null 가능성이 있으면 통과X
createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
