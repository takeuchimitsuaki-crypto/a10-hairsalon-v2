import React, { useState, useEffect } from 'react';

interface Menu {
  id: string;
  name: string;
  price: number;
}

interface Stylist {
  id: string;
  name: string;
}

export const Booking: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [selectedMenu, setSelectedMenu] = useState('');
  const [selectedStylist, setSelectedStylist] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [menusRes, stylistsRes] = await Promise.all([
          fetch('http://localhost:8787/api/menus'),
          fetch('http://localhost:8787/api/stylists')
        ]);

        if (menusRes.ok) {
          const menusData = await menusRes.json();
          setMenus(menusData.results || []);
        }

        if (stylistsRes.ok) {
          const stylistsData = await stylistsRes.json();
          setStylists(stylistsData.results || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBooking = () => {
    if (!selectedMenu || !selectedStylist || !selectedDate) {
      alert('すべてのフィールドを入力してください');
      return;
    }
    alert(`予約完了：\nメニュー: ${selectedMenu}\nスタイリスト: ${selectedStylist}\n日時: ${selectedDate}`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>予約する</h2>
      <div style={{
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        marginTop: '15px'
      }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#999' }}>データ読み込み中...</p>
        ) : (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                メニュー選択
              </label>
              <select 
                value={selectedMenu}
                onChange={(e) => setSelectedMenu(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                <option value="">メニューを選択してください</option>
                {menus.map(menu => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name} - ¥{menu.price}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                スタイリスト選択
              </label>
              <select 
                value={selectedStylist}
                onChange={(e) => setSelectedStylist(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                <option value="">スタイリストを選択してください</option>
                {stylists.map(stylist => (
                  <option key={stylist.id} value={stylist.id}>
                    {stylist.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                予約日時
              </label>
              <input 
                type="datetime-local" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }} 
              />
            </div>

            <button 
              onClick={handleBooking}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
              予約を確定する
            </button>
          </>
        )}
      </div>
    </div>
  );
};
