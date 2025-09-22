import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Simulate some async operation
    const timer = setTimeout(() => {
      setMessage('Welcome to IterAgent Example!')
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleIncrement = () => {
    setCount(count + 1)
  }

  const handleDecrement = () => {
    setCount(count - 1)
  }

  const handleError = () => {
    try {
      // Intentionally cause an error for testing
      throw new Error('This is a test error for IterAgent!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleClearError = () => {
    setError('')
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 IterAgent Example App</h1>
        <p>This is a React + Vite app for testing IterAgent</p>
        
        {message && (
          <div className="message">
            <p>{message}</p>
          </div>
        )}

        <div className="counter-section">
          <h2>Counter: {count}</h2>
          <div className="button-group">
            <button onClick={handleDecrement}>-</button>
            <button onClick={handleIncrement}>+</button>
          </div>
        </div>

        <div className="error-section">
          <h3>Error Testing</h3>
          {error ? (
            <div className="error-message">
              <p>❌ Error: {error}</p>
              <button onClick={handleClearError}>Clear Error</button>
            </div>
          ) : (
            <button onClick={handleError}>Trigger Test Error</button>
          )}
        </div>

        <div className="info-section">
          <h3>App Info</h3>
          <ul>
            <li>Framework: React 18</li>
            <li>Build Tool: Vite</li>
            <li>Language: TypeScript</li>
            <li>Testing: IterAgent</li>
          </ul>
        </div>

        <div className="links">
          <a href="/about">About Page</a>
          <a href="/contact">Contact Page</a>
          <a href="/nonexistent">404 Page</a>
        </div>
      </header>
    </div>
  )
}

export default App
