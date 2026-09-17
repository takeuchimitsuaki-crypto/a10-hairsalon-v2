import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Salon Admin Dashboard</h1>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
      <p>Salon management features coming soon...</p>
    </div>
  );
}
