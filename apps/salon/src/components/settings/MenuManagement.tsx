import React, { useState, useEffect } from 'react';

interface Menu {
  id: string;
  salon_id: string;
  stylist_id?: string;
  name: string;
  duration_minutes: number;
  price: number;
  color_code?: string;
  description?: string;
  is_active: number;
}

interface Stylist {
  id: string;
  name: string;
}

export const MenuManagement: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<'salon' | 'stylist'>('salon');
  const [selectedStylist, setSelectedStylist] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    duration_minutes: 30,
    price: 0,
    color_code: '#ff6b9d',
    description: ''
  });

  const SALON_ID = 'salon_001';

  useEffect(() => {
    fetchStylists();
    fetchMenus();
  }, []);

  useEffect(() => {
    if (stylists.length > 0 && !selectedStylist) {
      setSelectedStylist(stylists[0].id);
    }
  }, [stylists, selectedStylist]);

  const fetchStylists = async () => {
    try {
      const res = await fetch('http://localhost:8787/api/stylists');
      const data = await res.json();
      setStylists(data.results.filter((s: any) => s.is_active === 1));
    } catch (err) {
      console.error('スタイリスト取得エラー:', err);
    }
  };

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8787/api/menus');
      const data = await res.json();
      setMenus(data.results);
    } catch (err) {
      setError('メニューの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetType === 'stylist' && !selectedStylist) {
      setError('スタイリストを選択してください');
      return;
    }
    try {
      if (editingId) {
        const res = await fetch(`http://localhost:8787/api/menus/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('更新に失敗しました');
      } else {
        const payload = {
          salon_id: SALON_ID,
          ...formData,
          ...(targetType === 'stylist' && { stylist_id: selectedStylist })
        };
        const res = await fetch('http://localhost:8787/api/menus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('作成に失敗しました');
      }
      setFormData({
        name: '',
        duration_minutes: 30,
        price: 0,
        color_code: '#ff6b9d',
        description: ''
      });
      setTargetType('salon');
      setSelectedStylist('');
      setEditingId(null);
      setShowForm(false);
      fetchMenus();
    } catch (err) {
      setError('保存に失敗しました');
      console.error(err);
    }
  };

  const handleEdit = (menu: Menu) => {
    setEditingId(menu.id);
    setFormData({
      name: menu.name,
      duration_minutes: menu.duration_minutes,
      price: menu.price,
      color_code: menu.color_code || '#ff6b9d',
      description: menu.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('このメニューを削除しますか？')) return;
    try {
      const res = await fetch(`http://localhost:8787/api/menus/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('削除に失敗しました');
      fetchMenus();
    } catch (err) {
      setError('削除に失敗しました');
      console.error(err);
    }
  };

  if (loading) return <div>読み込み中...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>メニュー管理</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (editingId) {
              setEditingId(null);
              setFormData({
                name: '',
                duration_minutes: 30,
                price: 0,
                color_code: '#ff6b9d',
                description: ''
              });
            }
          }}
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
          {showForm ? 'キャンセル' : '新規追加'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                対象 *
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as 'salon' | 'stylist')}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="salon">サロン（全体）</option>
                <option value="stylist">スタイリスト個別</option>
              </select>
            </div>
            {targetType === 'stylist' && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  スタイリスト *
                </label>
                <select
                  value={selectedStylist}
                  onChange={(e) => setSelectedStylist(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">選択してください</option>
                  {stylists.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              メニュー名 *
            </label>
            <input
              type="text"
              required
              value={formData.name}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                施術時間（分）*
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
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
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                価格（円）*
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
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
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              色
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={formData.color_code}
                onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                style={{
                  width: '50px',
                  height: '40px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              />
              <input
                type="text"
                value={formData.color_code}
                onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                minHeight: '80px'
              }}
            />
          </div>

          <button
            type="submit"
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
            {editingId ? '更新' : '作成'}
          </button>
        </form>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '20px'
        }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>メニュー名</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>施術時間</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>価格</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {menus.map((menu) => (
              <tr key={menu.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '2px',
                        background: menu.color_code
                      }}
                    />
                    {menu.name}
                  </div>
                </td>
                <td style={{ padding: '12px' }}>{menu.duration_minutes}分</td>
                <td style={{ padding: '12px' }}>${menu.price.toLocaleString()}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(menu)}
                      style={{
                        padding: '4px 8px',
                        background: '#e0e0e0',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(menu.id)}
                      style={{
                        padding: '4px 8px',
                        background: '#ffcccc',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: '#cc0000'
                      }}
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {menus.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          メニューがまだ登録されていません
        </div>
      )}
    </div>
  );
};
