// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CalendarPage from './pages/CalendarPage';
import AddReminder from './pages/AddReminder';
import Settings from './pages/Settings';



// inside <Routes>


function App() {
  return (
    <div className="p-4">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<CalendarPage />} />
<Route path="/add" element={<AddReminder />} />
<Route path="/settings" element={<Settings />} />

      </Routes>
    </div>
  );
}

export default App;
