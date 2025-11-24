'use client';

import React, { useState, useEffect } from 'react';
import { settingsManager, AppSettings } from '@/lib/settings';
import { api } from '@/lib/api';
import { RotateCcw, Download, Upload, Monitor, Type, Database, Server, FolderOpen } from 'lucide-react';

type SettingsTab = 'general' | 'editor' | 'appearance' | 'data';

export function SettingsPanel() {
    const [settings, setSettings] = useState<AppSettings>(settingsManager.getSettings());
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [serverDataDir, setServerDataDir] = useState<string>('');
    const [serverDataDirInput, setServerDataDirInput] = useState<string>('');
    const [loadingServerSettings, setLoadingServerSettings] = useState(false);

    useEffect(() => {
        const unsubscribe = settingsManager.subscribe(setSettings);
        fetchServerSettings();
        return unsubscribe;
    }, []);

    const fetchServerSettings = async () => {
        setLoadingServerSettings(true);
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                setServerDataDir(data.dataDir);
                setServerDataDirInput(data.dataDir);
            }
        } catch (error) {
            console.error('Failed to fetch server settings:', error);
        } finally {
            setLoadingServerSettings(false);
        }
    };

    const handleSaveServerSettings = async () => {
        if (serverDataDirInput === serverDataDir) return;

        if (!confirm('Changing the data directory requires a server restart to take effect. Continue?')) {
            return;
        }

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataDir: serverDataDirInput }),
            });

            if (res.ok) {
                alert('Settings saved. Please restart the server for changes to take effect.');
                setServerDataDir(serverDataDirInput);
            } else {
                alert('Failed to save settings.');
            }
        } catch (error) {
            console.error('Failed to save server settings:', error);
            alert('An error occurred.');
        }
    };

    const handleSettingChange = <K extends keyof AppSettings>(
        category: K,
        key: keyof AppSettings[K],
        value: any
    ) => {
        settingsManager.updateSetting(category, key, value);
    };

    const handleReset = () => {
        if (confirm('Reset all client settings to default values?')) {
            settingsManager.resetToDefaults();
        }
    };

    const renderSidebarItem = (tab: SettingsTab, icon: React.ReactNode, label: string) => (
        <button
            onClick={() => setActiveTab(tab)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                width: '100%',
                border: 'none',
                background: activeTab === tab ? 'var(--bg-secondary)' : 'transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: activeTab === tab ? 500 : 400,
                marginBottom: '2px'
            }}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            overflow: 'hidden'
        }}>
            {/* Sidebar */}
            <div style={{
                width: '200px',
                borderRight: '1px solid var(--border-color)',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    padding: '10px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '5px'
                }}>
                    Settings
                </div>
                {renderSidebarItem('general', <Server size={16} />, 'General')}
                {renderSidebarItem('editor', <Type size={16} />, 'Editor')}
                {renderSidebarItem('appearance', <Monitor size={16} />, 'Appearance')}
                {renderSidebarItem('data', <Database size={16} />, 'Data Management')}

                <div style={{ flex: 1 }} />

                <button
                    onClick={handleReset}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderRadius: '4px',
                        fontSize: '13px',
                        marginTop: '10px'
                    }}
                >
                    <RotateCcw size={16} />
                    Reset Settings
                </button>
            </div>

            {/* Content Area */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '0'
            }}>
                <div style={{ maxWidth: '800px', padding: '30px 40px' }}>
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: 500,
                        marginBottom: '30px',
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '10px'
                    }}>
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </h2>

                    {activeTab === 'general' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{
                                padding: '15px',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                fontSize: '13px',
                                lineHeight: '1.5'
                            }}>
                                <strong>Server Configuration</strong>
                                <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)' }}>
                                    These settings affect where your data is stored on the server.
                                </p>
                            </div>

                            <SettingSection title="Storage">
                                <SettingItem
                                    label="Data Directory"
                                    description="Absolute path where papers and PDFs are stored. Requires restart."
                                >
                                    <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '400px' }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <FolderOpen size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                            <input
                                                type="text"
                                                value={serverDataDirInput}
                                                onChange={(e) => setServerDataDirInput(e.target.value)}
                                                placeholder={loadingServerSettings ? "Loading..." : "/path/to/data"}
                                                style={{
                                                    width: '100%',
                                                    padding: '6px 10px 6px 30px',
                                                    backgroundColor: 'var(--bg-primary)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '4px',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '13px'
                                                }}
                                            />
                                        </div>
                                        <button
                                            onClick={handleSaveServerSettings}
                                            disabled={serverDataDirInput === serverDataDir || loadingServerSettings}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: serverDataDirInput !== serverDataDir ? 'var(--accent-color)' : 'var(--bg-secondary)',
                                                color: serverDataDirInput !== serverDataDir ? '#fff' : 'var(--text-secondary)',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: serverDataDirInput !== serverDataDir ? 'pointer' : 'default',
                                                fontSize: '13px',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </SettingItem>
                            </SettingSection>
                        </div>
                    )}

                    {activeTab === 'editor' && (
                        <SettingSection title="Text Editor">
                            <SettingItem
                                label="Font Size"
                                description="Controls the font size of text elements in pixels."
                            >
                                <input
                                    type="number"
                                    min="10"
                                    max="32"
                                    value={settings.editor.fontSize}
                                    onChange={(e) => handleSettingChange('editor', 'fontSize', parseInt(e.target.value))}
                                    style={{
                                        width: '80px',
                                        backgroundColor: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        padding: '6px 10px'
                                    }}
                                />
                            </SettingItem>

                            <SettingItem
                                label="Snapshot Resolution"
                                description="Quality multiplier for PDF snapshots (1-5). Higher values use more memory."
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        step="0.5"
                                        value={settings.snapshot.resolutionScale}
                                        onChange={(e) => handleSettingChange('snapshot', 'resolutionScale', parseFloat(e.target.value))}
                                        style={{ width: '120px' }}
                                    />
                                    <span style={{ fontSize: '13px', width: '30px' }}>{settings.snapshot.resolutionScale}x</span>
                                </div>
                            </SettingItem>
                        </SettingSection>
                    )}

                    {activeTab === 'appearance' && (
                        <SettingSection title="Theme">
                            <SettingItem
                                label="Color Theme"
                                description="Select the application color scheme."
                            >
                                <select
                                    value={settings.appearance.theme}
                                    onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                                    style={{
                                        backgroundColor: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        padding: '6px 10px',
                                        minWidth: '150px'
                                    }}
                                >
                                    <option value="dark">Dark Mode</option>
                                    <option value="light">Light Mode</option>
                                </select>
                            </SettingItem>
                        </SettingSection>
                    )}

                    {activeTab === 'data' && (
                        <SettingSection title="Backup & Restore">
                            <SettingItem
                                label="Export Library"
                                description="Download a complete backup of your papers, PDFs, and canvas data."
                            >
                                <button
                                    onClick={() => api.system.export()}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '6px 12px',
                                        backgroundColor: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '13px'
                                    }}
                                >
                                    <Download size={14} />
                                    Export Backup
                                </button>
                            </SettingItem>

                            <SettingItem
                                label="Import Library"
                                description="Restore your library from a previously exported ZIP file. This will overwrite existing data."
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
                                            gap: '8px',
                                            padding: '6px 12px',
                                            backgroundColor: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '13px'
                                        }}
                                    >
                                        <Upload size={14} />
                                        Import Backup
                                    </button>
                                </div>
                            </SettingItem>
                        </SettingSection>
                    )}
                </div>
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
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }}>
                {title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
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
            alignItems: 'flex-start',
            padding: '16px 0',
            borderBottom: '1px solid var(--border-color-subtle, rgba(128, 128, 128, 0.1))'
        }}>
            <div style={{ flex: 1, paddingRight: '20px' }}>
                <div style={{ fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {label}
                </div>
                {description && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
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
