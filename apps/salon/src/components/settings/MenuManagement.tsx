import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';

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

interface MenuSet {
  id: string;
  salon_id: string;
  name: string;
  total_price: number;
  total_duration_minutes: number;
  color_code?: string;
  description?: string;
  is_active: number;
}

interface Stylist {
  id: string;
  name: string;
}

type TabType = 'single' | 'set';

export const MenuManagement: React.FC = () => {
  const [tab, setTab] = useState<TabType>('single');
  const [menus, setMenus] = useState<Menu[]>([]);
  const [menuSets, setMenuSets] = useState<MenuSet[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<'salon' | 'stylist'>('salon');
  const [selectedStylist, setSelectedStylist] = useState<string>('');
  const [singleMenuForm, setSingleMenuForm] = useState({
    name: '',
    duration_minutes: 30,
    price: 0,
    color_code: '#ff6b9d',
    description: ''
  });
  const [setMenuForm, setSetMenuForm] = useState({
    name: '',
    total_duration_minutes: 60,
    total_price: 0,
    color_code: '#ff6b9d',
    description: '',
    menu_ids: [] as string[]
  });

  const SALON_ID = 'salon_001';

  useEffect(() => {
    fetchStylists();
    fetchMenus();
    fetchMenuSets();
  }, []);

  useEffect(() => {
    if (stylists.length > 0 && !selectedStylist) {
      setSelectedStylist(stylists[0].id);
    }
  }, [stylists, selectedStylist]);

  const fetchStylists = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stylists`);
      const data = await res.json();
      setStylists(data.results.filter((s: any) => s.is_active === 1));
    } catch (err) {
      console.error('スタイリスト取得エラー:', err);
    }
  };

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/menus`);
      const data = await res.json();
      setMenus(data.results);
    } catch (err) {
      setError('メニューの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuSets = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/menu-sets?salon_id=salon_001`);
      const data = await res.json();
      setMenuSets(data.results);
    } catch (err) {
      console.error('セットメニュー取得エラー:', err);
    }
  };

  const handleSingleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetType === 'stylist' && !selectedStylist) {
      setError('スタイリストを選択してください');
      return;
    }
    try {
      if (editingId) {
        const res = await fetch(`${API_BASE_URL}/api/menus/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(singleMenuForm)
        });
        if (!res.ok) throw new Error('更新に失敗しました');
      } else {
        const payload = {
          salon_id: SALON_ID,
          ...singleMenuForm,
          ...(targetType === 'stylist' && { stylist_id: selectedStylist })
        };
        const res = await fetch(`${API_BASE_URL}/api/menus`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('作成に失敗しました');
      }
      setSingleMenuForm({
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

  const handleEditSingleMenu = (menu: Menu) => {
    setEditingId(menu.id);
    setSingleMenuForm({
      name: menu.name,
      duration_minutes: menu.duration_minutes,
      price: menu.price,
      color_code: menu.color_code || '#ff6b9d',
      description: menu.description || ''
    });
    setShowForm(true);
  };

  const handleDeleteSingleMenu = async (id: string) => {
    if (!window.confirm('このメニューを削除しますか？')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/menus/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('削除に失敗しました');
      fetchMenus();
    } catch (err) {
      setError('削除に失敗しました');
      console.error(err);
    }
  };

  const handleSetMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setMenuForm.menu_ids.length) {
      setError('最低1つのメニューを選択してください');
      return;
    }
    try {
      if (editingId) {
        const res = await fetch(`${API_BASE_URL}/api/menu-sets/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setMenuForm)
        });
        if (!res.ok) throw new Error('更新に失敗しました');
      } else {
        const res = await fetch(`${API_BASE_URL}/api/menu-sets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ salon_id: SALON_ID, ...setMenuForm })
        });
        if (!res.ok) throw new Error('作成に失敗しました');
      }
      setSetMenuForm({
        name: '',
        total_duration_minutes: 60,
        total_price: 0,
        color_code: '#ff6b9d',
        description: '',
        menu_ids: []
      });
      setEditingId(null);
      setShowForm(false);
      fetchMenuSets();
    } catch (err) {
      setError('保存に失敗しました');
      console.error(err);
    }
  };

  const handleEditSetMenu = (set: MenuSet) => {
    setEditingId(set.id);
    setSetMenuForm({
      name: set.name,
      total_duration_minutes: set.total_duration_minutes,
      total_price: set.total_price,
      color_code: set.color_code || '#ff6b9d',
      description: set.description || '',
      menu_ids: []
    });
    setShowForm(true);
  };

  const handleDeleteSetMenu = async (id: string) => {
    if (!window.confirm('このセットメニューを削除しますか？')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/menu-sets/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('削除に失敗しました');
      fetchMenuSets();
    } catch (err) {
      setError('削除に失敗しました');
      console.error(err);
    }
  };

  const toggleMenuSelection = (menuId: string) => {
    setSetMenuForm({
      ...setMenuForm,
      menu_ids: setMenuForm.menu_ids.includes(menuId)
        ? setMenuForm.menu_ids.filter(id => id !== menuId)
        : [...setMenuForm.menu_ids, menuId]
    });
  };


  if (loading) return <div>読み込み中...</div>;

  const tabButtonStyle = (isActive: boolean) => ({
    padding: '8px 16px',
    background: isActive ? '#ff6b9d' : '#e0e0e0',
    color: isActive ? '#fff' : '#333',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: isActive ? 'bold' : 'normal',
    marginRight: '4px'
  });

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button style={tabButtonStyle(tab === 'single')} onClick={() => setTab('single')}>
          単品メニュー
        </button>
        <button style={tabButtonStyle(tab === 'set')} onClick={() => setTab('set')}>
          セットメニュー
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      {tab === 'single' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>単品メニュー</h2>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (editingId) {
                  setEditingId(null);
                  setSingleMenuForm({
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

          {showForm && (
            <form onSubmit={handleSingleMenuSubmit} style={{
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
                  value={singleMenuForm.name}
                  onChange={(e) => setSingleMenuForm({ ...singleMenuForm, name: e.target.value })}
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
                    value={singleMenuForm.duration_minutes}
                    onChange={(e) => setSingleMenuForm({ ...singleMenuForm, duration_minutes: parseInt(e.target.value) })}
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
                    value={singleMenuForm.price}
                    onChange={(e) => setSingleMenuForm({ ...singleMenuForm, price: parseFloat(e.target.value) })}
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
                    value={singleMenuForm.color_code}
                    onChange={(e) => setSingleMenuForm({ ...singleMenuForm, color_code: e.target.value })}
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
                    value={singleMenuForm.color_code}
                    onChange={(e) => setSingleMenuForm({ ...singleMenuForm, color_code: e.target.value })}
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
                  value={singleMenuForm.description}
                  onChange={(e) => setSingleMenuForm({ ...singleMenuForm, description: e.target.value })}
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
                    <td style={{ padding: '12px' }}>¥{menu.price.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEditSingleMenu(menu)}
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
                          onClick={() => handleDeleteSingleMenu(menu.id)}
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
              単品メニューがまだ登録されていません
            </div>
          )}
        </>
      )}

      {tab === 'set' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>セットメニュー</h2>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (editingId) {
                  setEditingId(null);
                  setSetMenuForm({
                    name: '',
                    total_duration_minutes: 60,
                    total_price: 0,
                    color_code: '#ff6b9d',
                    description: '',
                    menu_ids: []
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

          {showForm && (
            <form onSubmit={handleSetMenuSubmit} style={{
              background: '#f9f9f9',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  セットメニュー名 *
                </label>
                <input
                  type="text"
                  required
                  value={setMenuForm.name}
                  onChange={(e) => setSetMenuForm({ ...setMenuForm, name: e.target.value })}
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
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                  含まれるメニュー *
                </label>
                <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '4px', padding: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {menus.map((menu) => (
                    <label key={menu.id} style={{ display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={setMenuForm.menu_ids.includes(menu.id)}
                        onChange={() => toggleMenuSelection(menu.id)}
                        style={{ marginRight: '8px', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: menu.color_code }} />
                        <span>{menu.name}</span>
                        <span style={{ color: '#999', fontSize: '12px' }}>({menu.duration_minutes}分 / ¥{menu.price})</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                    合計施術時間（分）*
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={setMenuForm.total_duration_minutes}
                    onChange={(e) => setSetMenuForm({ ...setMenuForm, total_duration_minutes: parseInt(e.target.value) })}
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
                    合計価格（円）*
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={setMenuForm.total_price}
                    onChange={(e) => setSetMenuForm({ ...setMenuForm, total_price: parseFloat(e.target.value) })}
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
                    value={setMenuForm.color_code}
                    onChange={(e) => setSetMenuForm({ ...setMenuForm, color_code: e.target.value })}
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
                    value={setMenuForm.color_code}
                    onChange={(e) => setSetMenuForm({ ...setMenuForm, color_code: e.target.value })}
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
                  value={setMenuForm.description}
                  onChange={(e) => setSetMenuForm({ ...setMenuForm, description: e.target.value })}
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
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>セット名</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>施術時間</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>価格</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {menuSets.map((set) => (
                  <tr key={set.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '2px',
                            background: set.color_code
                          }}
                        />
                        {set.name}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{set.total_duration_minutes}分</td>
                    <td style={{ padding: '12px' }}>¥{set.total_price.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEditSetMenu(set)}
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
                          onClick={() => handleDeleteSetMenu(set.id)}
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

          {menuSets.length === 0 && !showForm && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              セットメニューがまだ登録されていません
            </div>
          )}
        </>
      )}
    </div>
  );
};
