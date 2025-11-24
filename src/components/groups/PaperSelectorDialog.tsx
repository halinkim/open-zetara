import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Paper } from '@/db/schema';
import { Search, X } from 'lucide-react';

interface PaperSelectorDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (paper: Paper) => void;
}

export function PaperSelectorDialog({ isOpen, onClose, onSelect }: PaperSelectorDialogProps) {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadPapers();
        }
    }, [isOpen]);

    const loadPapers = async () => {
        setLoading(true);
        try {
            const data = await api.papers.list();
            setPapers(data);
        } catch (error) {
            console.error('Failed to load papers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPapers = papers.filter(paper => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            paper.title.toLowerCase().includes(query) ||
            paper.authors.some(a => a.toLowerCase().includes(query))
        );
    });

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                width: '500px',
                maxHeight: '80vh',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                border: '1px solid var(--border-color)'
            }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Add Paper to Group</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div style={{ padding: '12px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <Search size={16} color="var(--text-secondary)" style={{ marginRight: '8px' }} />
                        <input
                            type="text"
                            placeholder="Search papers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                width: '100%',
                                outline: 'none'
                            }}
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
                    {loading ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
                    ) : filteredPapers.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No papers found</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {filteredPapers.map(paper => (
                                <div
                                    key={paper.id}
                                    onClick={() => onSelect(paper)}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        backgroundColor: 'var(--bg-primary)',
                                        border: '1px solid transparent'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = 'var(--bg-selection)';
                                        e.currentTarget.style.borderColor = 'var(--primary)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                >
                                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>{paper.title}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {paper.authors.join(', ')} • {paper.year}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
