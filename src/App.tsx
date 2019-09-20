import React from 'react';
import './App.css';
import ScoreDial from './components/ScoreDial';

const App: React.FC = () => {
  return (
    <div className="App">
      <ScoreDial score={800}/>
    </div>
  );
}

export default App;
