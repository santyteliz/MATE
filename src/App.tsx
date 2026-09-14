import { useState } from 'react'
import { Landing } from './components/landing/Landing'
import './index.css'

function App() {
  const [showTransition, setShowTransition] = useState(false)

  const handleCreateMate = () => {
    setShowTransition(true)
    // Future: navigate to /personalizar
    // For now, show a transition state briefly then reset
    setTimeout(() => setShowTransition(false), 3000)
  }

  if (showTransition) {
    return (
      <div className="transition-screen">
        <div className="transition-content">
          <p className="transition-text">Preparando tu experiencia...</p>
          <div className="transition-loader" />
        </div>
      </div>
    )
  }

  return <Landing onCreateMate={handleCreateMate} />
}

export default App
