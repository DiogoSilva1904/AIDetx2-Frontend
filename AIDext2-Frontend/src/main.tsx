//import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './pages/Home.css'
import App from './App.tsx'
import { ModeProvider } from "./context/ModeContext";
//import Home from './pages/Home.tsx'
//import TextScanner from './components/TextClassifierBox/TextClassifierBox.tsx'
//import Navbar from './components/Navbar/Navbar.tsx'

{/* <StrictMode>
  <Navbar/>
  <TextScanner />
  <Home/>
</StrictMode>, */}

{/* <StrictMode>
    <App/>
  </StrictMode> */}

createRoot(document.getElementById('root')!).render(
  <ModeProvider>
    <App />
  </ModeProvider>
)
