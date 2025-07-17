import { useState } from 'preact/hooks';

import { TabEntry, Tabs } from './Tabs';

// Test component to demonstrate Tabs functionality
export function TabsTest() {
  const [activeTab, setActiveTab] = useState('tab1');

  const tabs: TabEntry[] = [
    { id: 'tab1', label: 'Game State', icon: 'terminal' },
    { id: 'tab2', label: 'Map', icon: 'map' },
    { id: 'tab3', label: 'Performance', icon: 'layers' },
    { id: 'tab4', label: 'Network', icon: 'wifi' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tab1':
        return <div>Game State Content</div>;
      case 'tab2':
        return <div>Map Content</div>;
      case 'tab3':
        return <div>Performance Content</div>;
      case 'tab4':
        return <div>Network Content</div>;
      default:
        return <div>No content</div>;
    }
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Tabs Component Test</h2>

      <Tabs tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab} />

      <div
        style={{
          padding: '1rem',
          border: '1px solid #ccc',
          borderRadius: '4px',
          minHeight: '200px',
        }}
      >
        {renderTabContent()}
      </div>
    </div>
  );
}
