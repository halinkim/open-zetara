'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Paper } from '@/db/schema';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, MoreHorizontal, Edit2, Trash2, FileText } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface LibraryTableProps {
    onOpenReader: (paperId: number) => void;
    onSelectionChange?: (selectedIds: number[]) => void;
}

type SortField = 'title' | 'authors' | 'year' | 'journal' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export function LibraryTable({ onOpenReader, onSelectionChange }: LibraryTableProps) {
    const papers = useLiveQuery(() => db.papers.toArray());
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; paperId: number } | null>(null);

    // ... sort logic ...

    const sortedPapers = useMemo(() => {
        if (!papers) return [];

        return [...papers].sort((a, b) => {
            let aValue: any = a[sortField];
            let bValue: any = b[sortField];

            if (sortField === 'authors') {
                aValue = a.authors[0] || '';
                bValue = b.authors[0] || '';
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [papers, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleRowClick = (e: React.MouseEvent, id: number) => {
        let newSelected: Set<number>;
        if (e.ctrlKey || e.metaKey) {
            newSelected = new Set(selectedIds);
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
        } else {
            newSelected = new Set([id]);
        }
        setSelectedIds(newSelected);
        onSelectionChange?.(Array.from(newSelected));
    };

    const handleContextMenu = (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        setSelectedIds(new Set([id]));
        onSelectionChange?.([id]); // Ensure selection is updated on right click too
        setContextMenu({ x: e.clientX, y: e.clientY, paperId: id });
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this paper?')) {
            await db.papers.delete(id);
            // Also delete associated canvas
            const canvas = await db.canvases.where('paperId').equals(id).first();
            if (canvas && canvas.id) {
                await db.canvases.delete(canvas.id);
            }
        }
    };

    if (!papers) return null;

    return (
        <div
            className="library-table-container"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                overflow: 'hidden'
            }}
            onClick={() => setContextMenu(null)}
        >
            {/* Table Header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 0.5fr 1.5fr 1fr',
                padding: '10px 16px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                fontWeight: 600,
                fontSize: '13px',
                userSelect: 'none'
            }}>
                <div onClick={() => handleSort('title')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    Title {sortField === 'title' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
                <div onClick={() => handleSort('authors')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    Authors {sortField === 'authors' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
                <div onClick={() => handleSort('year')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    Year {sortField === 'year' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
                <div onClick={() => handleSort('journal')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    Journal {sortField === 'journal' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
                <div onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    Date Added {sortField === 'createdAt' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
            </div>

            {/* Table Body */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {sortedPapers.map(paper => (
                    <div
                        key={paper.id}
                        onClick={(e) => handleRowClick(e, paper.id!)}
                        onDoubleClick={() => onOpenReader(paper.id!)}
                        onContextMenu={(e) => handleContextMenu(e, paper.id!)}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1.5fr 0.5fr 1.5fr 1fr',
                            padding: '8px 16px',
                            borderBottom: '1px solid var(--border-color)',
                            fontSize: '13px',
                            cursor: 'default',
                            backgroundColor: selectedIds.has(paper.id!) ? 'var(--bg-selection)' : 'transparent',
                            color: selectedIds.has(paper.id!) ? '#fff' : 'inherit'
                        }}
                    >
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '10px' }}>
                            {paper.title}
                        </div>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '10px' }}>
                            {paper.authors.join(', ')}
                        </div>
                        <div>{paper.year}</div>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '10px' }}>
                            {paper.journal}
                        </div>
                        <div>{format(paper.createdAt, 'yyyy-MM-dd')}</div>
                    </div>
                ))}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div style={{
                    position: 'fixed',
                    top: contextMenu.y,
                    left: contextMenu.x,
                    backgroundColor: '#252526',
                    border: '1px solid #454545',
                    borderRadius: '4px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    minWidth: '150px'
                }}>
                    <div
                        onClick={() => onOpenReader(contextMenu.paperId)}
                        style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}
                        className="hover:bg-[#37373d]"
                    >
                        <FileText size={14} /> Open Reader
                    </div>
                    <div style={{ height: '1px', backgroundColor: '#454545', margin: '4px 0' }} />
                    <div
                        onClick={() => handleDelete(contextMenu.paperId)}
                        style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#ff6b6b' }}
                        className="hover:bg-[#37373d]"
                    >
                        <Trash2 size={14} /> Delete
                    </div>
                </div>
            )}
        </div>
    );
}
