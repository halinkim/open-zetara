'use client';

import React, { useState, useEffect } from 'react';
import { Paper } from '@/db/schema';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { fetchCrossrefMetadata, searchCrossref } from '@/lib/metadataUtils';
import { X, Search, Download, Save, Loader2 } from 'lucide-react';

interface MetadataEditorProps {
    paperId: number;
    onClose: () => void;
}

export function MetadataEditor({ paperId, onClose }: MetadataEditorProps) {
    const [paper, setPaper] = useState<Paper | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const { triggerUpdate } = useAppStore();

    // Form state
    const [title, setTitle] = useState('');
    const [authors, setAuthors] = useState('');
    const [journal, setJournal] = useState('');
    const [year, setYear] = useState('');
    const [doi, setDoi] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        const loadPaper = async () => {
            try {
                const p = await api.papers.get(paperId);
                if (p) {
                    setPaper(p);
                    setTitle(p.title || '');
                    setAuthors(p.authors?.join(', ') || '');
                    setJournal(p.journal || '');
                    setYear(p.year || '');
                    setDoi(p.doi || '');
                    setUrl(p.url || '');
                }
            } catch (error) {
                console.error('Failed to load paper:', error);
            }
        };
        loadPaper();
    }, [paperId]);

    const handleSave = async () => {
        if (!paper || !paper.id) return;

        setLoading(true);
        try {
            await api.papers.update({
                ...paper,
                title,
                authors: authors.split(',').map(a => a.trim()).filter(a => a),
                journal,
                year,
                doi,
                url
            });
            triggerUpdate();
            onClose();
        } catch (error) {
            console.error('Error saving metadata:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchCrossref = async () => {
        if (!doi) return;

        setFetching(true);
        try {
            const metadata = await fetchCrossrefMetadata(doi);
            if (metadata.title) setTitle(metadata.title);
            if (metadata.authors) setAuthors(metadata.authors.join(', '));
            if (metadata.journal) setJournal(metadata.journal);
            if (metadata.year) setYear(metadata.year);
            if (metadata.url) setUrl(metadata.url);
        } catch (error) {
            alert('Failed to fetch metadata from Crossref. Please check the DOI.');
        } finally {
            setFetching(false);
        }
    };

    if (!paper) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#252526',
                padding: '20px',
                borderRadius: '8px',
                width: '500px',
                maxWidth: '90%',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                border: '1px solid #3e3e42'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Edit Metadata</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {/* DOI Field with Fetch Button */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '12px' }}>DOI</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                value={doi}
                                onChange={(e) => setDoi(e.target.value)}
                                placeholder="10.xxxx/xxxxx"
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    backgroundColor: '#333',
                                    border: '1px solid #3e3e42',
                                    color: '#fff',
                                    borderRadius: '4px'
                                }}
                            />
                            <button
                                onClick={handleFetchCrossref}
                                disabled={fetching || !doi}
                                style={{
                                    padding: '0 15px',
                                    backgroundColor: '#007acc',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: fetching || !doi ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    opacity: fetching || !doi ? 0.7 : 1
                                }}
                            >
                                {fetching ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                Fetch
                            </button>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '12px' }}>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: '#333',
                                border: '1px solid #3e3e42',
                                color: '#fff',
                                borderRadius: '4px'
                            }}
                        />
                    </div>

                    {/* Authors */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '12px' }}>Authors (comma separated)</label>
                        <input
                            type="text"
                            value={authors}
                            onChange={(e) => setAuthors(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: '#333',
                                border: '1px solid #3e3e42',
                                color: '#fff',
                                borderRadius: '4px'
                            }}
                        />
                    </div>

                    {/* Journal & Year */}
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 2 }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '12px' }}>Journal / Conference</label>
                            <input
                                type="text"
                                value={journal}
                                onChange={(e) => setJournal(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#333',
                                    border: '1px solid #3e3e42',
                                    color: '#fff',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '12px' }}>Year</label>
                            <input
                                type="text"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#333',
                                    border: '1px solid #3e3e42',
                                    color: '#fff',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>
                    </div>

                    {/* URL */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '12px' }}>URL</label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: '#333',
                                border: '1px solid #3e3e42',
                                color: '#fff',
                                borderRadius: '4px'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 15px',
                            backgroundColor: 'transparent',
                            border: '1px solid #3e3e42',
                            color: '#ccc',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{
                            padding: '8px 15px',
                            backgroundColor: '#007acc',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
