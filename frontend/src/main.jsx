import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import HomePage from './HomePage'
import ChatPage from './ChatPage'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [initialMessage, setInitialMessage] = useState('')

  const handleStartChat = (message) => {
    setInitialMessage(message)
    setCurrentPage('chat')
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
    setInitialMessage('')
  }

  return (
    <>
      {currentPage === 'home' && <HomePage onStartChat={handleStartChat} />}
      {currentPage === 'chat' && (
        <ChatPage 
          initialMessage={initialMessage}
          onBackToHome={handleBackToHome}
        />
      )}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)