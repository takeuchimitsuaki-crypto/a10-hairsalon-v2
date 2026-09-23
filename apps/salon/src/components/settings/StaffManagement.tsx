import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch, staffAuth } from '../../auth/client';
import { useAuth } from '../../auth/AuthContext';
import {
  ALL_PERMISSIONS, isManagerRole, PERMISSION_LABELS, ROLE_LABELS, StaffPermission, StaffRole,
} from '../../../../../packages/shared/src/auth/staffAuth';

interface Staff {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  role: StaffRole;
  accepts_bookings: number;
  is_active: number;
  has_pin: boolean;
  is_locked: boolean;
  permissions?: StaffPermission[]; // owner / admin にだけ返る
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' };
const primaryButton: React.CSSProperties = {
  padding: '8px 16px', background: '#ff6b9d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
};
const smallButton: React.CSSProperties = {
  flex: 1, padding: '6px 12px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
};
const badge = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', background: bg, color, marginRight: '4px',
});

const emptyForm = { name: '', email: '', phone: '', bio: '', role: 'stylist' as StaffRole, accepts_bookings: true };

export const StaffManagement: React.FC = () => {
  const { session, can, refresh } = useAuth();
  const actor = session!.staff;
  const actorIsOwner = actor.role === 'owner';
  const actorIsManager = isManagerRole(actor.role);

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [pinTarget, setPinTarget] = useState<Staff | null>(null);
  const [pinForm, setPinForm] = useState({ current: '', pin: '', confirm: '' });
  const [permissionDrafts, setPermissionDrafts] = useState<Record<string, StaffPermission[]>>({});

  // ---- 画面の表示判定（API 側と同じ条件。実際の拒否は API が行う） ----
  const canAdministerTarget = (t: Staff) => (isManagerRole(t.role) ? actorIsOwner : true);
  const canManageStaff = (t: Staff) => can('add_remove_staff') && canAdministerTarget(t);
  const canEditProfile = (t: Staff) => t.id === actor.id || canManageStaff(t);
  const canChangeRole = (t: Staff) => actorIsManager && canAdministerTarget(t);
  const canSetPermissions = (t: Staff) => actorIsManager && !isManagerRole(t.role);
  const canSetPin = (t: Staff) => t.is_active === 1 && (t.id === actor.id || (actorIsManager && canAdministerTarget(t)));
  const assignableRoles: StaffRole[] = actorIsOwner ? ['owner', 'admin', 'staff', 'stylist'] : ['staff', 'stylist'];

  const fetchStaff = useCallback(async () => {
    try {
      const res = await apiFetch('/api/staff');
      if (!res.ok) throw new Error(await staffAuth.readError(res));
      const data = await res.json();
      setStaffList(data.results);
      setPermissionDrafts({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スタッフの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchStaff(); }, [fetchStaff]);

  // API を呼び、失敗したらエラーを表示する。成功したら一覧を読み直す
  const run = async (path: string, init: RequestInit, successMessage: string): Promise<boolean> => {
    setError('');
    setNotice('');
    const res = await apiFetch(path, init);
    if (!res.ok) {
      setError(await staffAuth.readError(res));
      return false;
    }
    setNotice(successMessage);
    await fetchStaff();
    return true;
  };

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEdit = (t: Staff) => {
    setEditing(t);
    setFormData({
      name: t.name, email: t.email || '', phone: t.phone || '', bio: t.bio || '',
      role: t.role, accepts_bookings: t.accepts_bookings === 1,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const profile = { name: formData.name, email: formData.email, phone: formData.phone, bio: formData.bio };
    let ok: boolean;
    if (editing) {
      const body = canManageStaff(editing) ? { ...profile, accepts_bookings: formData.accepts_bookings } : profile;
      ok = await run(`/api/staff/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) }, `${formData.name} を更新しました`);
    } else {
      ok = await run('/api/staff', {
        method: 'POST',
        body: JSON.stringify({ ...profile, role: formData.role, accepts_bookings: formData.accepts_bookings }),
      }, `${formData.name} を追加しました。ログインするにはPINの設定が必要です`);
    }
    if (ok) {
      setShowForm(false);
      setEditing(null);
      setFormData(emptyForm);
    }
  };

  const handleRoleChange = async (t: Staff, role: StaffRole) => {
    if (role === t.role) return;
    if (!window.confirm(`${t.name} の役割を「${ROLE_LABELS[t.role]}」から「${ROLE_LABELS[role]}」に変更しますか？\n変更すると ${t.name} は再ログインが必要になります。`)) return;
    const ok = await run(`/api/staff/${t.id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }, `${t.name} の役割を変更しました`);
    if (ok && t.id === actor.id) await refresh();
  };

  const handleActiveChange = async (t: Staff, active: boolean) => {
    if (!active && !window.confirm(`${t.name} を無効にしますか？\nログインできなくなり、予約表・LINE の指名候補からも外れます。予約やカルテのデータは残ります。`)) return;
    await run(
      `/api/staff/${t.id}`,
      active ? { method: 'PUT', body: JSON.stringify({ is_active: true }) } : { method: 'DELETE' },
      active ? `${t.name} を有効にしました` : `${t.name} を無効にしました`
    );
  };

  const togglePermission = (t: Staff, permission: StaffPermission) => {
    const current = permissionDrafts[t.id] ?? t.permissions ?? [];
    const next = current.includes(permission) ? current.filter((p) => p !== permission) : [...current, permission];
    setPermissionDrafts({ ...permissionDrafts, [t.id]: next });
  };

  const savePermissions = async (t: Staff) => {
    const permissions = permissionDrafts[t.id];
    if (!permissions) return;
    await run(`/api/staff/${t.id}/permissions`, { method: 'PUT', body: JSON.stringify({ permissions }) }, `${t.name} の権限を保存しました`);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinTarget) return;
    if (!/^\d{6}$/.test(pinForm.pin)) { setError('PINは6桁の数字で入力してください'); return; }
    if (pinForm.pin !== pinForm.confirm) { setError('新しいPINが一致しません'); return; }
    const isSelf = pinTarget.id === actor.id;
    const body = isSelf ? { pin: pinForm.pin, current_pin: pinForm.current } : { pin: pinForm.pin };
    const ok = await run(`/api/staff/${pinTarget.id}/pin`, { method: 'PUT', body: JSON.stringify(body) },
      isSelf ? 'PINを変更しました' : `${pinTarget.name} のPINを設定しました。${pinTarget.name} のログイン中の端末はログアウトされます`);
    if (ok) {
      setPinTarget(null);
      setPinForm({ current: '', pin: '', confirm: '' });
    }
  };

  const pinInput = (key: 'current' | 'pin' | 'confirm', label: string) => (
    <div style={{ marginBottom: '12px' }}>
      <label style={labelStyle}>{label}</label>
      <input
        type="password" inputMode="numeric" autoComplete="off" maxLength={6}
        value={pinForm[key]}
        onChange={(e) => setPinForm({ ...pinForm, [key]: e.target.value.replace(/\D/g, '').slice(0, 6) })}
        style={{ ...inputStyle, letterSpacing: '6px' }}
      />
    </div>
  );

  if (loading) return <div>読み込み中...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>スタッフ管理</h2>
        {can('add_remove_staff') && (
          <button onClick={() => (showForm ? setShowForm(false) : openCreate())} style={primaryButton}>
            {showForm ? 'キャンセル' : '新規追加'}
          </button>
        )}
      </div>

      {error && <div style={{ color: '#cc0000', marginBottom: '10px' }}>{error}</div>}
      {notice && <div style={{ color: '#2e7d32', marginBottom: '10px' }}>{notice}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>{editing ? `${editing.name} を編集` : 'スタッフを追加'}</div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>名前 *</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>メールアドレス（任意）</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>電話番号（任意）</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>自己紹介（任意）</label>
            <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} style={{ ...inputStyle, minHeight: '80px' }} />
          </div>
          {!editing && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>役割</label>
              <select
                value={formData.role}
                onChange={(e) => {
                  const role = e.target.value as StaffRole;
                  setFormData({ ...formData, role, accepts_bookings: role === 'stylist' });
                }}
                style={inputStyle}
              >
                {assignableRoles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
          )}
          {(!editing || canManageStaff(editing)) && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px' }}>
              <input type="checkbox" checked={formData.accepts_bookings} onChange={(e) => setFormData({ ...formData, accepts_bookings: e.target.checked })} />
              予約を受ける（予約表・LINE の指名候補・空き時間の計算に表示する）
            </label>
          )}
          <button type="submit" style={primaryButton}>{editing ? '更新' : '追加'}</button>
        </form>
      )}

      {pinTarget && (
        <form onSubmit={handlePinSubmit} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', maxWidth: '360px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>
            {pinTarget.id === actor.id ? '自分のPINを変更' : `${pinTarget.name} のPINを設定`}
          </div>
          {pinTarget.id === actor.id && pinTarget.has_pin && pinInput('current', '現在のPIN')}
          {pinInput('pin', '新しいPIN（6桁の数字）')}
          {pinInput('confirm', '新しいPIN（確認）')}
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>同じ数字の繰り返しや連番（123456 など）は使えません。</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={primaryButton}>設定</button>
            <button type="button" onClick={() => { setPinTarget(null); setPinForm({ current: '', pin: '', confirm: '' }); }} style={{ ...smallButton, flex: 'none' }}>
              キャンセル
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {staffList.map((t) => {
          const draft = permissionDrafts[t.id];
          const permissions = draft ?? t.permissions ?? [];
          return (
            <div key={t.id} style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e0e0e0', opacity: t.is_active ? 1 : 0.6 }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 'bold' }}>
                {t.name}{t.id === actor.id && <span style={{ fontSize: '12px', color: '#999', fontWeight: 'normal' }}>（自分）</span>}
              </h3>
              <div style={{ marginBottom: '8px' }}>
                <span style={badge('#e3f2fd', '#1976d2')}>{ROLE_LABELS[t.role]}</span>
                {t.accepts_bookings ? <span style={badge('#e8f5e9', '#2e7d32')}>予約受付</span> : <span style={badge('#f5f5f5', '#666')}>予約なし</span>}
                {!t.has_pin && <span style={badge('#fff8e1', '#b26a00')}>PIN未設定</span>}
                {t.is_locked && <span style={badge('#ffebee', '#cc0000')}>ロック中</span>}
                {!t.is_active && <span style={badge('#eeeeee', '#666')}>無効</span>}
              </div>
              {t.email && <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>📧 {t.email}</div>}
              {t.phone && <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>📱 {t.phone}</div>}
              {t.bio && <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{t.bio}</div>}

              {canChangeRole(t) && t.is_active === 1 && (
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', color: '#666' }}>役割 </label>
                  <select value={t.role} onChange={(e) => { void handleRoleChange(t, e.target.value as StaffRole); }} style={{ fontSize: '12px', padding: '2px 4px' }}>
                    {(assignableRoles.includes(t.role) ? assignableRoles : [t.role, ...assignableRoles]).map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
              )}

              {canSetPermissions(t) && t.is_active === 1 && (
                <div style={{ background: '#fafafa', borderRadius: '4px', padding: '8px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>権限</div>
                  {ALL_PERMISSIONS.map((p) => (
                    <label key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', marginBottom: '2px' }}>
                      <input type="checkbox" checked={permissions.includes(p)} onChange={() => togglePermission(t, p)} />
                      {PERMISSION_LABELS[p]}
                    </label>
                  ))}
                  {draft && (
                    <button onClick={() => { void savePermissions(t); }} style={{ ...primaryButton, padding: '4px 12px', fontSize: '12px', marginTop: '4px' }}>
                      権限を保存
                    </button>
                  )}
                </div>
              )}
              {isManagerRole(t.role) && (
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>オーナー・管理者はすべての権限を持ちます</div>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {canEditProfile(t) && t.is_active === 1 && <button onClick={() => openEdit(t)} style={smallButton}>編集</button>}
                {canSetPin(t) && (
                  <button onClick={() => { setPinTarget(t); setPinForm({ current: '', pin: '', confirm: '' }); setError(''); }} style={smallButton}>
                    {t.id === actor.id ? 'PIN変更' : t.has_pin ? 'PIN再設定' : 'PIN設定'}
                  </button>
                )}
                {canManageStaff(t) && (t.is_active ? (
                  <button onClick={() => { void handleActiveChange(t, false); }} style={{ ...smallButton, background: '#ffcccc', color: '#cc0000' }}>無効にする</button>
                ) : (
                  <button onClick={() => { void handleActiveChange(t, true); }} style={smallButton}>有効に戻す</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {staffList.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>スタッフがまだ登録されていません</div>
      )}
    </div>
  );
};
