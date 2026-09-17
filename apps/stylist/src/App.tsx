import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Stylist App</h1>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      <h2>Schedule & Karte Management</h2>
      <p>Stylist features coming soon...</p>
    </div>
  );
}
