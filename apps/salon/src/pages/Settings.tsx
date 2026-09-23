import React, { useState } from 'react';
import { Header } from '../components/Header';
import { SalonInfo } from '../components/settings/SalonInfo';
import { StaffManagement } from '../components/settings/StaffManagement';
import { MenuManagement } from '../components/settings/MenuManagement';
import { WorkingHoursManagement } from '../components/settings/WorkingHoursManagement';
import { OffDaysManagement } from '../components/settings/OffDaysManagement';
import { useAuth } from '../auth/AuthContext';

type Tab = 'salon' | 'staff' | 'menus' | 'hours' | 'offdays';

// requiresSettings: change_settings 権限が無いスタッフには表示しない（API 側でも拒否される）
const TABS: { id: Tab; label: string; icon: string; requiresSettings: boolean }[] = [
  { id: 'salon', label: 'サロン基本設定', icon: '🏢', requiresSettings: true },
  { id: 'staff', label: 'スタッフ管理', icon: '👩‍💼', requiresSettings: false },
  { id: 'menus', label: 'メニュー管理', icon: '✂️', requiresSettings: true },
  { id: 'hours', label: '営業時間設定', icon: '⏰', requiresSettings: true },
  { id: 'offdays', label: '休み管理', icon: '📅', requiresSettings: true },
];

export const Settings: React.FC = () => {
  const { can } = useAuth();
  const tabs = TABS.filter((tab) => !tab.requiresSettings || can('change_settings'));
  const [activeTab, setActiveTab] = useState<Tab>(tabs[0].id);

  return (
    <>
      <Header title="設定" />
      <div style={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
        {/* Sidebar */}
        <div style={{
          width: '200px',
          background: '#f5f5f5',
          borderRight: '1px solid #e0e0e0',
          overflowY: 'auto'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%',
                padding: '16px 12px',
                border: 'none',
                background: activeTab === tab.id ? '#fff' : 'transparent',
                borderLeft: activeTab === tab.id ? '4px solid #ff6b9d' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                color: activeTab === tab.id ? '#ff6b9d' : '#666',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ marginRight: '8px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          background: '#fff'
        }}>
          {activeTab === 'salon' && <SalonInfo />}
          {activeTab === 'staff' && <StaffManagement />}
          {activeTab === 'menus' && <MenuManagement />}
          {activeTab === 'hours' && <WorkingHoursManagement />}
          {activeTab === 'offdays' && <OffDaysManagement />}
        </div>
      </div>
    </>
  );
};
