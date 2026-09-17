import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>My Salon</h1>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  );
}

function Home() {
  return (
    <div>
      <h2>予約・カルテ・メッセージ</h2>
      <p>LiME風デザインで実装予定...</p>
      <div style={{ marginTop: '20px' }}>
        <button style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px' }}>
          予約する
        </button>
        <button style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px' }}>
          カルテ履歴
        </button>
        <button style={{ display: 'block', width: '100%', padding: '10px' }}>
          メッセージ
        </button>
      </div>
    </div>
  );
}
