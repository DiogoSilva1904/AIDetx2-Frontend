import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './pages/Home.css'
import App from './App.tsx'
//import Home from './pages/Home.tsx'
//import TextScanner from './components/TextClassifierBox/TextClassifierBox.tsx'
//import Navbar from './components/Navbar/Navbar.tsx'

{/* <StrictMode>
  <Navbar/>
  <TextScanner />
  <Home/>
</StrictMode>, */}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App/>
  </StrictMode>
)
