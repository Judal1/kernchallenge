import React, { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/ping')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage('Error while connecting to the API'));
  }, []);

  return <div>backend response : {message}</div>;
}

export default App;
