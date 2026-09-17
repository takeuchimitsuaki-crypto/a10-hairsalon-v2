import React, { useState, useEffect } from 'react';

interface Stylist {
  id: string;
  salon_id: string;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  is_active: number;
}

export const StylistManagement: React.FC = () => {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: ''
  });

  const SALON_ID = 'salon_001'; // 本番環境では動的に取得

  useEffect(() => {
    fetchStylists();
  }, []);

  const fetchStylists = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8787/api/stylists');
      const data = await res.json();
      setStylists(data.results.filter((s: Stylist) => s.is_active === 1));
    } catch (err) {
      setError('スタイリストの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await fetch(`http://localhost:8787/api/stylists/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('更新に失敗しました');
      } else {
        const res = await fetch('http://localhost:8787/api/stylists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ salon_id: SALON_ID, ...formData })
        });
        if (!res.ok) throw new Error('作成に失敗しました');
      }
      setFormData({ name: '', email: '', phone: '', bio: '' });
      setEditingId(null);
      setShowForm(false);
      fetchStylists();
    } catch (err) {
      setError('保存に失敗しました');
      console.error(err);
    }
  };

  const handleEdit = (stylist: Stylist) => {
    setEditingId(stylist.id);
    setFormData({
      name: stylist.name,
      email: stylist.email || '',
      phone: stylist.phone || '',
      bio: stylist.bio || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('このスタイリストを削除しますか？')) return;
    try {
      const res = await fetch(`http://localhost:8787/api/stylists/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('削除に失敗しました');
      fetchStylists();
    } catch (err) {
      setError('削除に失敗しました');
      console.error(err);
    }
  };

  if (loading) return <div>読み込み中...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>スタイリスト管理</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (editingId) {
              setEditingId(null);
              setFormData({ name: '', email: '', phone: '', bio: '' });
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
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              名前 *
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

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              メールアドレス
            </label>
            <input
              type="email"
              value={formData.email}
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
              value={formData.phone}
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
              自己紹介
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {stylists.map((stylist) => (
          <div key={stylist.id} style={{
            background: '#fff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>{stylist.name}</h3>
            {stylist.email && <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>📧 {stylist.email}</div>}
            {stylist.phone && <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>📱 {stylist.phone}</div>}
            {stylist.bio && <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{stylist.bio}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleEdit(stylist)}
                style={{
                  flex: 1,
                  padding: '6px 12px',
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
                onClick={() => handleDelete(stylist.id)}
                style={{
                  flex: 1,
                  padding: '6px 12px',
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
          </div>
        ))}
      </div>

      {stylists.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          スタイリストがまだ登録されていません
        </div>
      )}
    </div>
  );
};
