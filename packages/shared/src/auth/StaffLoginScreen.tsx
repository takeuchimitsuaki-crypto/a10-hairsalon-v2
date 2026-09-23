import React, { useEffect, useRef, useState } from 'react';
import { useStaffAuth } from './StaffAuthProvider';

// スタッフを選択 → 6桁PINを入力 してログインする（Salon App / Stylist App 共通）
export const StaffLoginScreen: React.FC<{ subtitle: string }> = ({ subtitle }) => {
  const { client, login } = useStaffAuth();
  const [staffList, setStaffList] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pinInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    client.listLoginStaff()
      .then(setStaffList)
      .catch(() => setError('スタッフ一覧を読み込めませんでした。通信状況を確認してください。'))
      .finally(() => setLoadingList(false));
  }, [client]);

  useEffect(() => {
    if (selected) pinInput.current?.focus();
  }, [selected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !/^\d{6}$/.test(pin)) {
      setError('6桁の数字のPINを入力してください');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await login(selected.id, pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
      setPin('');
      pinInput.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', padding: '24px', boxSizing: 'border-box' }}>
        <h1 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold' }}>A10 Hairsalon</h1>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>{subtitle}</div>

        {!selected ? (
          <>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>スタッフを選択</div>
            {loadingList && <div style={{ color: '#999' }}>読み込み中...</div>}
            {!loadingList && staffList.length === 0 && !error && (
              <div style={{ color: '#999', fontSize: '13px' }}>
                ログインできるスタッフがいません。オーナーの初期設定（PIN登録）が必要です。
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
              {staffList.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelected(s); setError(''); setPin(''); }}
                  style={{ padding: '14px 12px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '15px', textAlign: 'left' }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selected.name}</div>
              <button
                type="button"
                onClick={() => { setSelected(null); setPin(''); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '13px' }}
              >
                スタッフを選び直す
              </button>
            </div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }} htmlFor="pin">
              PIN（6桁の数字）
            </label>
            <input
              id="pin"
              ref={pinInput}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '22px', letterSpacing: '8px', textAlign: 'center', boxSizing: 'border-box' }}
            />
            <button
              type="submit"
              disabled={submitting || pin.length !== 6}
              style={{
                width: '100%', marginTop: '16px', padding: '12px', background: pin.length === 6 ? '#ff6b9d' : '#f3b3c9',
                color: '#fff', border: 'none', borderRadius: '4px', cursor: pin.length === 6 ? 'pointer' : 'default', fontSize: '15px', fontWeight: 'bold'
              }}
            >
              {submitting ? '確認中...' : 'ログイン'}
            </button>
          </form>
        )}

        {error && <div style={{ color: '#cc0000', fontSize: '13px', marginTop: '12px' }}>{error}</div>}
      </div>
    </div>
  );
};
