import React, { useState, useEffect } from 'react';

interface Stylist {
  id: string;
  name: string;
}

interface WorkingHour {
  id: string;
  stylist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: number;
}

const DAYS = ['月', '火', '水', '木', '金', '土', '日'];

export const WorkingHoursManagement: React.FC = () => {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [selectedStylist, setSelectedStylist] = useState<string>('');
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '18:00'
  });

  useEffect(() => {
    fetchStylists();
  }, []);

  useEffect(() => {
    if (selectedStylist) {
      fetchWorkingHours(selectedStylist);
    }
  }, [selectedStylist]);

  const fetchStylists = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8787/api/stylists');
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

  const fetchWorkingHours = async (stylistId: string) => {
    try {
      const res = await fetch(`http://localhost:8787/api/working-hours/${stylistId}`);
      const data = await res.json();
      setWorkingHours(data.results || []);
    } catch (err) {
      setError('営業時間の取得に失敗しました');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStylist) return;

    try {
      const existing = workingHours.find(w => w.day_of_week === formData.day_of_week);

      if (existing) {
        const res = await fetch(`http://localhost:8787/api/working-hours/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start_time: formData.start_time,
            end_time: formData.end_time
          })
        });
        if (!res.ok) throw new Error('更新に失敗しました');
      } else {
        const res = await fetch('http://localhost:8787/api/working-hours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stylist_id: selectedStylist,
            ...formData
          })
        });
        if (!res.ok) throw new Error('作成に失敗しました');
      }

      fetchWorkingHours(selectedStylist);
      setFormData({ day_of_week: 0, start_time: '09:00', end_time: '18:00' });
    } catch (err) {
      setError('保存に失敗しました');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('この営業時間を削除しますか？')) return;
    try {
      const res = await fetch(`http://localhost:8787/api/working-hours/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('削除に失敗しました');
      if (selectedStylist) {
        fetchWorkingHours(selectedStylist);
      }
    } catch (err) {
      setError('削除に失敗しました');
      console.error(err);
    }
  };

  if (loading) return <div>読み込み中...</div>;
  if (stylists.length === 0) return <div>スタイリストが登録されていません</div>;

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 20px 0' }}>営業時間設定</h2>

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              曜日 *
            </label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              {DAYS.map((day, idx) => (
                <option key={idx} value={idx}>
                  {['日', '月', '火', '水', '木', '金', '土'][idx] === day ? day : DAYS[idx]}曜日
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              開始時間 *
            </label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
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
              終了時間 *
            </label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
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
          設定
        </button>
      </form>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
        <thead>
          <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>曜日</th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>開始時間</th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>終了時間</th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, idx) => {
            const wh = workingHours.find(w => w.day_of_week === idx);
            return (
              <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '12px' }}>{day}曜日</td>
                <td style={{ padding: '12px' }}>{wh ? wh.start_time : '-'}</td>
                <td style={{ padding: '12px' }}>{wh ? wh.end_time : '-'}</td>
                <td style={{ padding: '12px' }}>
                  {wh && (
                    <button
                      onClick={() => handleDelete(wh.id)}
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
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
