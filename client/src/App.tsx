// src/App.tsx
import React, { useEffect, useState } from 'react';
import './App.css';

const App: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState<string>('');

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onmessage = (event) => {
      setMessages((prevMessages) => [...prevMessages, event.data]);
    };

    return () => {
      socket.close();
    };
  }, []);

  const sendMessage = () => {
    const socket = new WebSocket('ws://localhost:8080');
    socket.onopen = () => {
      socket.send(input);
      setInput('');
    };
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>WebSocket Chat</h1>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </header>
    </div>
  );
};

export default App;
