import { useState, useEffect } from 'react'
import SnakeGame from './components/SnakeGame'
import ThemeToggle from './components/ThemeToggle'
import './App.css'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Snake Game</h1>
        <ThemeToggle isDarkMode={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
      </header>
      <main className="app-main">
        <SnakeGame />
      </main>
    </div>
  )
}

export default App
