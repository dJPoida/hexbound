import { useResponsive } from '../../../hooks';
import { StyleColor } from '../../../types/ui';
import { Icon, IconName } from '../Icon';
import styles from './Tabs.module.css';

export interface TabEntry {
  id: string;
  label: string;
  icon?: IconName;
}

export interface TabsProps {
  tabs: TabEntry[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTabId, onTabChange, className = '' }: TabsProps) {
  const { isMobile } = useResponsive();

  // Find current tab index for mobile navigation
  const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
  const isFirstTab = currentIndex === 0;
  const isLastTab = currentIndex === tabs.length - 1;
  const currentTab = tabs[currentIndex];

  const handlePreviousTab = () => {
    if (!isFirstTab) {
      onTabChange(tabs[currentIndex - 1].id);
    }
  };

  const handleNextTab = () => {
    if (!isLastTab) {
      onTabChange(tabs[currentIndex + 1].id);
    }
  };

  if (isMobile) {
    return (
      <div className={`${styles.tabsContainer} ${styles.mobile} ${className}`}>
        <button
          className={`${styles.arrowButton} ${isFirstTab ? styles.disabled : ''}`}
          onClick={handlePreviousTab}
          disabled={isFirstTab}
          aria-label='Previous tab'
        >
          <Icon name='arrow-left' color={StyleColor.GREY} />
        </button>

        <div className={styles.mobileTabLabel}>
          {currentTab?.icon && <Icon name={currentTab.icon} color={StyleColor.GREY} />}
          <span>{currentTab?.label}</span>
        </div>

        <button
          className={`${styles.arrowButton} ${isLastTab ? styles.disabled : ''}`}
          onClick={handleNextTab}
          disabled={isLastTab}
          aria-label='Next tab'
        >
          <Icon name='arrow-right' color={StyleColor.GREY} />
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.tabsContainer} ${styles.desktop} ${className}`}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-selected={isActive}
            role='tab'
          >
            {tab.icon && (
              <Icon name={tab.icon} color={isActive ? StyleColor.DEFAULT : StyleColor.GREY} />
            )}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
