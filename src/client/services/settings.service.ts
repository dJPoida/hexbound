interface GameSettings {
  notificationsEnabled: boolean;
  showHexGrid: boolean;
  showDebugInfo: boolean;
  // Add other settings here in the future
}

const SETTINGS_KEY = 'hexbound-settings';

const defaultSettings: GameSettings = {
  notificationsEnabled: false,
  showHexGrid: false,
  showDebugInfo: false,
};

// Simple pub-sub implementation
type Listener = (settings: GameSettings) => void;
const listeners = new Set<Listener>();

const loadSettings = (): GameSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all default keys are present
      return { ...defaultSettings, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage', error);
  }
  return defaultSettings;
};

let currentSettings = loadSettings();

const saveSettings = () => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
  } catch (error) {
    console.error('Failed to save settings to localStorage', error);
  }
};

const notifyListeners = () => {
  listeners.forEach(listener => listener(currentSettings));
};

export const settingsService = {
  getSettings: (): Readonly<GameSettings> => {
    return currentSettings;
  },

  updateSettings: (newSettings: Partial<GameSettings>) => {
    currentSettings = { ...currentSettings, ...newSettings };
    saveSettings();
    notifyListeners();
  },

  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    // Unsubscribe function
    return () => {
      listeners.delete(listener);
    };
  },
};
