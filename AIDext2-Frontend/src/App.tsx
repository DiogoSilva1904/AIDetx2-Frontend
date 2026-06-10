import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar/Navbar'
import Home from './pages/Home'
import Documentation from './pages/Documentation'
import Models from './pages/Models'



function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/models" element={<Models/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
