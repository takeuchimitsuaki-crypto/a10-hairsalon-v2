import React, { useState, useEffect } from 'react';

interface Salon {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const SalonInfo: React.FC = () => {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<Salon>>({});

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const res = await fetch('http://localhost:8787/api/salon/settings');
        const data = await res.json();
        setSalon(data.result);
        setFormData(data.result || {});
      } catch (err) {
        setError('サロン情報の取得に失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSalon();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8787/api/salon/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSalon(formData as Salon);
        setIsEditing(false);
      } else {
        setError('保存に失敗しました');
      }
    } catch (err) {
      setError('保存中にエラーが発生しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!salon) return <div>サロン情報が見つかりません</div>;

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 0, marginBottom: '20px' }}>
        サロン基本設定
      </h2>

      <div style={{
        background: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        {isEditing ? (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                サロン名
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                メールアドレス
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                電話番号
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                住所
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: '#ff6b9d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                保存
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(salon);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#ddd',
                  color: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: '#999' }}>サロン名</span>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{salon.name}</div>
            </div>
            {salon.email && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#999' }}>メールアドレス</span>
                <div style={{ fontSize: '14px' }}>{salon.email}</div>
              </div>
            )}
            {salon.phone && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#999' }}>電話番号</span>
                <div style={{ fontSize: '14px' }}>{salon.phone}</div>
              </div>
            )}
            {salon.address && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#999' }}>住所</span>
                <div style={{ fontSize: '14px' }}>{salon.address}</div>
              </div>
            )}
            <button
              onClick={() => setIsEditing(true)}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                background: '#ff6b9d',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              編集
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
