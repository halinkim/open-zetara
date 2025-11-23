export interface AppSettings {
    snapshot: {
        resolutionScale: number; // 1-5, multiplier for snapshot resolution
    };
    editor: {
        fontSize: number;
    };
    appearance: {
        theme: 'dark' | 'light';
    };
}

export const DEFAULT_SETTINGS: AppSettings = {
    snapshot: {
        resolutionScale: 3
    },
    editor: {
        fontSize: 16
    },
    appearance: {
        theme: 'dark'
    }
};

const SETTINGS_KEY = 'app-settings';

export class SettingsManager {
    private static instance: SettingsManager;
    private settings: AppSettings;
    private listeners: Set<(settings: AppSettings) => void> = new Set();

    private constructor() {
        this.settings = this.loadSettings();
    }

    static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }

    private loadSettings(): AppSettings {
        if (typeof window === 'undefined') {
            return { ...DEFAULT_SETTINGS };
        }
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to ensure all keys exist
                return this.mergeWithDefaults(parsed);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
        return { ...DEFAULT_SETTINGS };
    }

    private mergeWithDefaults(stored: Partial<AppSettings>): AppSettings {
        return {
            snapshot: { ...DEFAULT_SETTINGS.snapshot, ...stored.snapshot },
            editor: { ...DEFAULT_SETTINGS.editor, ...stored.editor },
            appearance: { ...DEFAULT_SETTINGS.appearance, ...stored.appearance }
        };
    }

    private saveSettings(): void {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings, null, 2));
            this.notifyListeners();
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    getSettings(): AppSettings {
        return { ...this.settings };
    }

    updateSettings(updates: Partial<AppSettings>): void {
        this.settings = this.mergeWithDefaults({ ...this.settings, ...updates });
        this.saveSettings();
    }

    updateSetting<K extends keyof AppSettings>(
        category: K,
        key: keyof AppSettings[K],
        value: any
    ): void {
        (this.settings[category] as any)[key] = value;
        this.saveSettings();
    }

    subscribe(listener: (settings: AppSettings) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.settings));
    }

    resetToDefaults(): void {
        this.settings = { ...DEFAULT_SETTINGS };
        this.saveSettings();
    }
}

export const settingsManager = SettingsManager.getInstance();
