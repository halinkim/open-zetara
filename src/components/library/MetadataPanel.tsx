'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Paper } from '@/db/schema';
import { useAppStore } from '@/lib/store';
import { fetchCrossrefMetadata } from '@/lib/metadataUtils';
import { Loader2, Save, X, Globe, Book, Calendar, User, Tag, ExternalLink } from 'lucide-react';

interface MetadataPanelProps {
    paperId: number;
    onClose: () => void;
}

export function MetadataPanel({ paperId, onClose }: MetadataPanelProps) {
    const [paper, setPaper] = useState<Paper | null>(null);
    const [formData, setFormData] = useState<Partial<Paper>>({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const { triggerUpdate } = useAppStore();

    useEffect(() => {
        const loadPaper = async () => {
            try {
                const data = await api.papers.get(paperId);
                setPaper(data);
                setFormData({
                    title: data.title,
                    authors: data.authors,
                    journal: data.journal || '',
                    year: data.year || '',
                    doi: data.doi || '',
                    url: data.url || '',
                    tags: data.tags || [],
                });
            } catch (error) {
                console.error('Failed to load paper:', error);
            }
        };
        if (paperId) {
            loadPaper();
        }
    }, [paperId]);

    const handleChange = (field: keyof Paper, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAuthorsChange = (value: string) => {
        const authors = value.split(',').map(a => a.trim()).filter(a => a);
        setFormData(prev => ({ ...prev, authors }));
    };

    const handleTagsChange = (value: string) => {
        const tags = value.split(',').map(t => t.trim()).filter(t => t);
        setFormData(prev => ({ ...prev, tags }));
    };

    const handleSave = async () => {
        if (!paperId || !paper) return;
        setLoading(true);
        try {
            await api.papers.update({
                ...paper,
                ...formData,
                title: formData.title || 'Untitled',
                authors: formData.authors || ['Unknown'],
            } as Paper);
            triggerUpdate();
        } catch (error) {
            console.error('Failed to save metadata:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchMetadata = async () => {
        if (!formData.doi) return;
        setFetching(true);
        try {
            const metadata = await fetchCrossrefMetadata(formData.doi);
            setFormData(prev => ({
                ...prev,
                title: metadata.title || prev.title,
                authors: metadata.authors || prev.authors,
                journal: metadata.journal || prev.journal,
                year: metadata.year || prev.year,
                url: metadata.url || prev.url,
            }));
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
            alert('Failed to fetch metadata from Crossref. Please check the DOI.');
        } finally {
            setFetching(false);
        }
    };

    if (!paper) return null;

    return (
        <div style={{
            width: '350px',
            height: '100%',
            backgroundColor: 'var(--bg-secondary)',
            borderLeft: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Metadata</h3>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                    <X size={18} />
                </button>
            </div>

            {/* Form */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Title */}
                <div className="form-group">
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Title</label>
                    <textarea
                        value={formData.title || ''}
                        onChange={(e) => handleChange('title', e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '60px', resize: 'vertical' }}
                    />
                </div>

                {/* Authors */}
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <User size={12} /> Authors (comma separated)
                    </label>
                    <input
                        type="text"
                        value={formData.authors?.join(', ') || ''}
                        onChange={(e) => handleAuthorsChange(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                </div>

                {/* Journal & Year */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group" style={{ flex: 2 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            <Book size={12} /> Journal
                        </label>
                        <input
                            type="text"
                            value={formData.journal || ''}
                            onChange={(e) => handleChange('journal', e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            <Calendar size={12} /> Year
                        </label>
                        <input
                            type="text"
                            value={formData.year || ''}
                            onChange={(e) => handleChange('year', e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>
                </div>

                {/* DOI & Fetch */}
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <Globe size={12} /> DOI
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={formData.doi || ''}
                            onChange={(e) => handleChange('doi', e.target.value)}
                            placeholder="10.xxxx/xxxxx"
                            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                        <button
                            onClick={handleFetchMetadata}
                            disabled={fetching || !formData.doi}
                            style={{
                                padding: '0 12px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-activity-bar)',
                                color: 'var(--text-primary)',
                                cursor: fetching || !formData.doi ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            {fetching ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                            Fetch
                        </button>
                    </div>
                </div>

                {/* URL */}
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <ExternalLink size={12} /> URL
                    </label>
                    <input
                        type="text"
                        value={formData.url || ''}
                        onChange={(e) => handleChange('url', e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                </div>

                {/* Tags */}
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <Tag size={12} /> Tags (comma separated)
                    </label>
                    <input
                        type="text"
                        value={formData.tags?.join(', ') || ''}
                        onChange={(e) => handleTagsChange(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                </div>
            </div>

            {/* Footer */}
            <div style={{
                padding: '16px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'flex-end'
            }}>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'var(--accent-color)',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        fontWeight: 500
                    }}
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Changes
                </button>
            </div>
        </div>
    );
}
