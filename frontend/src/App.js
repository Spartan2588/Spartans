import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Platform from './pages/Platform';
import Scenarios from './pages/Scenarios';
import Impact from './pages/Impact';
import About from './pages/About';
import PageTransition from './components/PageTransition';

function AppContent() {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="app">
      <Navigation />
      <PageTransition isActive={isTransitioning}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/platform" element={<Platform />} />
          <Route path="/scenarios" element={<Scenarios />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </PageTransition>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
