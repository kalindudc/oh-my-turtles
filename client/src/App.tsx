// src/App.tsx
import React, { useEffect, useState } from 'react';
import './App.css';

const id = crypto.randomUUID();

const App: React.FC = () => {

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onmessage = (event) => {
      console.log(event.data);
    };

    return () => {
      socket.close();
    };
  }, []);

  const register = () => {
    const socket = new WebSocket('ws://localhost:8080');
    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'register',
        clientType: 'client',
        id: id,
      }));
    };
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>WebSocket connect</h1>
        <button onClick={register}>connect</button>
      </header>
    </div>
  );
};

export default App;
