'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Paper } from '@/db/schema';
import { useAppStore } from '@/lib/store';
import { MetadataEditor } from './MetadataEditor';
import { Edit2, Search } from 'lucide-react';

export function PaperList() {
    const [papers, setPapers] = useState<Paper[]>([]);
    const { selectedPaperId, setSelectedPaperId, lastUpdate } = useAppStore();
    const [editingPaperId, setEditingPaperId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchPapers = async () => {
        try {
            const data = await api.papers.list();
            setPapers(data);
        } catch (error) {
            console.error('Failed to load papers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPapers();
        // Poll for updates or setup a refresh mechanism if needed
        // For now, we can refresh on focus or manually
        const interval = setInterval(fetchPapers, 5000); // Simple polling for now
        return () => clearInterval(interval);
    }, [lastUpdate]);

    const filteredPapers = papers.filter(paper => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            paper.title.toLowerCase().includes(query) ||
            paper.authors.some(a => a.toLowerCase().includes(query)) ||
            paper.year?.includes(query) ||
            paper.tags?.some(t => t.toLowerCase().includes(query))
        );
    });

    if (loading && papers.length === 0) {
        return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading...</div>;
    }

    return (
        <>
            <div style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#333',
                    borderRadius: '4px',
                    padding: '4px 8px'
                }}>
                    <Search size={14} color="#888" style={{ marginRight: '6px' }} />
                    <input
                        type="text"
                        placeholder="Search papers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            fontSize: '13px',
                            width: '100%',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', overflowY: 'auto', flex: 1 }}>
                {filteredPapers.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        No papers found
                    </div>
                )}
                {filteredPapers.map(paper => (
                    <div
                        key={paper.id}
                        onClick={() => setSelectedPaperId(paper.id || null)}
                        className="group" // For hover effect
                        style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            backgroundColor: selectedPaperId === paper.id ? 'var(--bg-activity-bar)' : 'transparent',
                            color: selectedPaperId === paper.id ? 'var(--text-active)' : 'var(--text-primary)',
                            borderBottom: '1px solid var(--border-color)',
                            fontSize: '13px',
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {paper.title}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {paper.authors.join(', ')}
                                {paper.year && ` (${paper.year})`}
                            </div>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingPaperId(paper.id || null);
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                opacity: 0.5
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                            title="Edit Metadata"
                        >
                            <Edit2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {editingPaperId && (
                <MetadataEditor
                    paperId={editingPaperId}
                    onClose={() => {
                        setEditingPaperId(null);
                        fetchPapers(); // Refresh after edit
                    }}
                />
            )}
        </>
    );
}

