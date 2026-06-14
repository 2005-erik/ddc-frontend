import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import IntroScene from './components/IntroScene.jsx'
import ChatWidget from './components/ChatWidget.jsx'
import { IntroProvider, useIntro } from './scenes/IntroContext.jsx'
import Home from './pages/Home.jsx'

function Background() {
  const { setIntroDone } = useIntro()
  return <IntroScene onComplete={() => setIntroDone(true)} />
}

export default function App() {
  return (
    <IntroProvider>
      {/* Фон-сцена живёт вне Routes — монтируется один раз, не рестартится при переходах */}
      <Background />

      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>

      {/* Плавающий чат-бот — вне Routes, виден на всех экранах */}
      <ChatWidget />
    </IntroProvider>
  )
}