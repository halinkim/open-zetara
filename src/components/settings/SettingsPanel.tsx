'use client';

import React, { useState, useEffect } from 'react';
import { settingsManager, AppSettings, DEFAULT_SETTINGS } from '@/lib/settings';
import { api } from '@/lib/api';
import { RotateCcw, Download, Upload } from 'lucide-react';

export function SettingsPanel() {
    const [settings, setSettings] = useState<AppSettings>(settingsManager.getSettings());
    const [jsonView, setJsonView] = useState(false);

    useEffect(() => {
        const unsubscribe = settingsManager.subscribe(setSettings);
        return unsubscribe;
    }, []);

    const handleSettingChange = <K extends keyof AppSettings>(
        category: K,
        key: keyof AppSettings[K],
        value: any
    ) => {
        settingsManager.updateSetting(category, key, value);
    };

    const handleReset = () => {
        if (confirm('Reset all settings to default values?')) {
            settingsManager.resetToDefaults();
        }
    };

    const handleJsonChange = (value: string) => {
        try {
            const parsed = JSON.parse(value);
            settingsManager.updateSettings(parsed);
        } catch (error) {
            console.error('Invalid JSON:', error);
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)'
        }}>
            {/* Header */}
            <div style={{
                height: '40px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px'
            }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Settings</span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={() => setJsonView(!jsonView)}
                        style={{
                            background: 'none',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                        }}
                    >
                        {jsonView ? 'UI View' : 'JSON View'}
                    </button>
                    <button
                        onClick={handleReset}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                        title="Reset to defaults"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '20px'
            }}>
                {jsonView ? (
                    <div>
                        <div style={{ marginBottom: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Edit settings as JSON. Changes are saved automatically.
                        </div>
                        <textarea
                            value={JSON.stringify(settings, null, 2)}
                            onChange={(e) => handleJsonChange(e.target.value)}
                            style={{
                                width: '100%',
                                height: '400px',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                padding: '10px',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                resize: 'vertical'
                            }}
                        />
                    </div>
                ) : (
                    <div>
                        {/* Snapshot Settings */}
                        <SettingSection title="Snapshot">
                            <SettingItem
                                label="Resolution Scale"
                                description="Higher values produce sharper snapshots but use more memory (1-5)"
                            >
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    step="0.5"
                                    value={settings.snapshot.resolutionScale}
                                    onChange={(e) => handleSettingChange('snapshot', 'resolutionScale', parseFloat(e.target.value))}
                                    style={{
                                        width: '80px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        padding: '4px 8px'
                                    }}
                                />
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    step="0.5"
                                    value={settings.snapshot.resolutionScale}
                                    onChange={(e) => handleSettingChange('snapshot', 'resolutionScale', parseFloat(e.target.value))}
                                    style={{ marginLeft: '10px', width: '200px' }}
                                />
                            </SettingItem>
                        </SettingSection>

                        {/* Editor Settings */}
                        <SettingSection title="Editor">
                            <SettingItem
                                label="Font Size"
                                description="Text font size in pixels"
                            >
                                <input
                                    type="number"
                                    min="10"
                                    max="32"
                                    value={settings.editor.fontSize}
                                    onChange={(e) => handleSettingChange('editor', 'fontSize', parseInt(e.target.value))}
                                    style={{
                                        width: '80px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        padding: '4px 8px'
                                    }}
                                />
                            </SettingItem>
                        </SettingSection>

                        {/* Appearance Settings */}
                        <SettingSection title="Appearance">
                            <SettingItem
                                label="Theme"
                                description="Application color theme"
                            >
                                <select
                                    value={settings.appearance.theme}
                                    onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        padding: '4px 8px'
                                    }}
                                >
                                    <option value="dark">Dark</option>
                                    <option value="light">Light</option>
                                </select>
                            </SettingItem>
                        </SettingSection>

                        {/* Data Management */}
                        <SettingSection title="Data Management">
                            <SettingItem
                                label="Export Library"
                                description="Download a backup of all papers and canvas data"
                            >
                                <button
                                    onClick={() => api.system.export()}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '13px'
                                    }}
                                >
                                    <Download size={14} />
                                    Export Data
                                </button>
                            </SettingItem>

                            <SettingItem
                                label="Import Library"
                                description="Restore library from a backup file (ZIP)"
                            >
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="file"
                                        accept=".zip"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (confirm('This will overwrite your current library. Are you sure?')) {
                                                    try {
                                                        await api.system.import(file);
                                                        alert('Import successful! Reloading...');
                                                        window.location.reload();
                                                    } catch (error) {
                                                        console.error('Import failed:', error);
                                                        alert('Import failed. Please check the console.');
                                                    }
                                                }
                                            }
                                            // Reset input
                                            e.target.value = '';
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <button
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            backgroundColor: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '13px'
                                        }}
                                    >
                                        <Upload size={14} />
                                        Import Data
                                    </button>
                                </div>
                            </SettingItem>
                        </SettingSection>
                    </div>
                )}
            </div>
        </div>
    );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: '30px' }}>
            <h3 style={{
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '15px',
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }}>
                {title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {children}
            </div>
        </div>
    );
}

function SettingItem({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0'
        }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                    {label}
                </div>
                {description && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {description}
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {children}
            </div>
        </div>
    );
}
