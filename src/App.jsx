import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Home'; // Assuming this is your home page
import Assessment from './pages/Assessment'; // Your updated Assessment component
import TakeTest from './pages/TakeTest'; // The component for taking tests
import Results from './pages/Results';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/practice" element={<Assessment />} />
        <Route path="/assessment" element={<Assessment />}/>
        <Route path="/takeTest" element={<TakeTest />} />
        <Route path="/result" element={<Results />} />
      </Routes>
    </Router>
  );
}

export default App;
