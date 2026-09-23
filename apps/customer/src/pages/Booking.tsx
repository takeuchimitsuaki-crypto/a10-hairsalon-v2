import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

interface Menu {
  id: string;
  name: string;
  price: number;
}

interface Stylist {
  id: string;
  name: string;
}

interface Availability {
  available: Array<{
    stylist_id: string;
    name: string;
    available_count: number;
    slots: string[];
  }>;
  unavailable: Array<{
    stylist_id: string;
    name: string;
    reason: string;
  }>;
}

export const Booking: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [selectedMenu, setSelectedMenu] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStylist, setSelectedStylist] = useState('');
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalStylist, setModalStylist] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [menusRes, stylistsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/menus`),
          fetch(`${API_BASE_URL}/api/stylists`)
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

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedMenu || !selectedDate) {
        setAvailability(null);
        return;
      }

      try {
        const dateStr = selectedDate.split('T')[0];
        const res = await fetch(
          `${API_BASE_URL}/api/availability?date=${dateStr}&menu_id=${selectedMenu}`
        );

        if (res.ok) {
          const data = await res.json();
          setAvailability(data);
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
      }
    };

    fetchAvailability();
  }, [selectedMenu, selectedDate]);

  const handleBooking = () => {
    if (!selectedMenu || !selectedStylist || !selectedDate) {
      alert('すべてのフィールドを入力してください');
      return;
    }
    alert(`予約完了：\nメニュー: ${selectedMenu}\nスタイリスト: ${selectedStylist}\n日時: ${selectedDate}`);
  };

  const isUnavailable = (stylistId: string): boolean => {
    if (!availability) return false;
    return availability.unavailable.some(s => s.stylist_id === stylistId);
  };

  const handleShowAvailableStylist = (unavailableStylist: any) => {
    setModalStylist(unavailableStylist);
    setShowModal(true);
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

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                スタイリスト選択
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stylists.map(stylist => {
                  const unavailable = isUnavailable(stylist.id);
                  const availableStylist = availability?.available.find(s => s.stylist_id === stylist.id);

                  return (
                    <div key={stylist.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        id={`stylist-${stylist.id}`}
                        name="stylist"
                        value={stylist.id}
                        checked={selectedStylist === stylist.id}
                        onChange={(e) => setSelectedStylist(e.target.value)}
                        disabled={unavailable}
                        style={{ cursor: unavailable ? 'not-allowed' : 'pointer' }}
                      />
                      <label
                        htmlFor={`stylist-${stylist.id}`}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '4px',
                          background: unavailable ? '#f5f5f5' : '#fafafa',
                          border: selectedStylist === stylist.id ? '2px solid #1976d2' : '1px solid #ddd',
                          cursor: unavailable ? 'not-allowed' : 'pointer',
                          opacity: unavailable ? 0.6 : 1,
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                        <span style={{ fontWeight: unavailable ? 'normal' : 'inherit' }}>
                          {stylist.name}
                          {availableStylist && !unavailable && (
                            <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                              ({availableStylist.available_count}枠)
                            </span>
                          )}
                        </span>
                      </label>

                      {unavailable && availability?.available.length > 0 && (
                        <button
                          onClick={() => handleShowAvailableStylist(stylist)}
                          style={{
                            padding: '4px 8px',
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                          title="この日時で空いているスタイリストを見る">
                          💡 他に空きあり
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleBooking}
              disabled={!selectedMenu || !selectedStylist || !selectedDate}
              style={{
                width: '100%',
                padding: '12px',
                background: selectedMenu && selectedStylist && selectedDate ? '#1976d2' : '#ccc',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedMenu && selectedStylist && selectedDate ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
              予約を確定する
            </button>
          </>
        )}
      </div>

      {showModal && modalStylist && availability?.available && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '70vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>
              {modalStylist.name}は予約できません
            </h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              この日時で空いているスタイリスト：
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
              {availability.available.map(stylist => (
                <div key={stylist.stylist_id} style={{
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: '#fafafa'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    {stylist.name} ({stylist.available_count}枠空き)
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {stylist.slots.slice(0, 5).join(', ')}
                    {stylist.slots.length > 5 && `他 ${stylist.slots.length - 5}件`}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
