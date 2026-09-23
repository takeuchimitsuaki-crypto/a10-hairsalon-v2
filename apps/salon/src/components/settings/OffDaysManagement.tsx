import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../auth/client';

interface Stylist {
  id: string;
  name: string;
}

interface OffDay {
  id: string;
  stylist_id: string;
  date: string;
  reason?: string;
  created_at: string;
}

export const OffDaysManagement: React.FC = () => {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [selectedStylist, setSelectedStylist] = useState<string>('');
  const [offDays, setOffDays] = useState<OffDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  useEffect(() => {
    fetchStylists();
  }, []);

  useEffect(() => {
    if (selectedStylist) {
      fetchOffDays(selectedStylist);
    }
  }, [selectedStylist]);

  const fetchStylists = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/stylists`);
      const data = await res.json();
      const active = data.results.filter((s: any) => s.is_active === 1);
      setStylists(active);
      if (active.length > 0) {
        setSelectedStylist(active[0].id);
      }
    } catch (err) {
      setError('スタイリストの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffDays = async (stylistId: string) => {
    try {
      const res = await apiFetch(`/api/off-days/${stylistId}`);
      const data = await res.json();
      setOffDays((data.results || []).sort((a: OffDay, b: OffDay) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      setError('休み情報の取得に失敗しました');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStylist) return;

    try {
      const res = await apiFetch(`/api/off-days`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stylist_id: selectedStylist,
          ...formData
        })
      });
      if (!res.ok) throw new Error('作成に失敗しました');

      fetchOffDays(selectedStylist);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        reason: ''
      });
    } catch (err) {
      setError('保存に失敗しました');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('この休みを削除しますか？')) return;
    try {
      const res = await apiFetch(`/api/off-days/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('削除に失敗しました');
      if (selectedStylist) {
        fetchOffDays(selectedStylist);
      }
    } catch (err) {
      setError('削除に失敗しました');
      console.error(err);
    }
  };

  if (loading) return <div>読み込み中...</div>;
  if (stylists.length === 0) return <div>スタイリストが登録されていません</div>;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
  };

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 20px 0' }}>休み管理</h2>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
          スタイリスト選択
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
          {stylists.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{
        background: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              日付 *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
              理由
            </label>
            <input
              type="text"
              placeholder="休暇、研修など"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
          登録
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
        {offDays.map((offDay) => (
          <div key={offDay.id} style={{
            background: '#fff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
              {formatDate(offDay.date)}
              <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                ({getDayOfWeek(offDay.date)}曜日)
              </span>
            </div>
            {offDay.reason && (
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                理由: {offDay.reason}
              </div>
            )}
            <button
              onClick={() => handleDelete(offDay.id)}
              style={{
                width: '100%',
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
        ))}
      </div>

      {offDays.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          登録されている休みがありません
        </div>
      )}
    </div>
  );
};
