import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/Homepage/HomePage';
import AccountPage from './components/Accounts/AccountPage';
import OwnerPage from './components/Owner/OwnerPage';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/owner-page" element={<OwnerPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
