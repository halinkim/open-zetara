import React, { useState, useEffect } from 'react';
import { Plus, Folder, Trash2, Edit2, Check, X } from 'lucide-react';
import { api } from '@/lib/api';

interface PaperGroup {
    id: string;
    title: string;
    updatedAt: number;
}

interface GroupListProps {
    selectedGroupId: string | null;
    onSelectGroup: (id: string | null) => void;
}

export function GroupList({ selectedGroupId, onSelectGroup }: GroupListProps) {
    const [groups, setGroups] = useState<PaperGroup[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            const data = await api.groups.list();
            setGroups(data);
        } catch (error) {
            console.error('Failed to load groups:', error);
        }
    };

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        try {
            const newGroup = await api.groups.create(newTitle);
            setGroups([...groups, newGroup]);
            setNewTitle('');
            setIsCreating(false);
            onSelectGroup(newGroup.id);
        } catch (error) {
            console.error('Failed to create group:', error);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editTitle.trim()) return;
        try {
            await api.groups.update(id, { title: editTitle });
            setGroups(groups.map(g => g.id === id ? { ...g, title: editTitle } : g));
            setEditingId(null);
        } catch (error) {
            console.error('Failed to update group:', error);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this group?')) return;
        try {
            await api.groups.delete(id);
            setGroups(groups.filter(g => g.id !== id));
            if (selectedGroupId === id) {
                onSelectGroup(null);
            }
        } catch (error) {
            console.error('Failed to delete group:', error);
        }
    };

    return (
        <div style={{
            width: '250px',
            height: '100%',
            backgroundColor: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{
                padding: '16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h2 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Groups</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    style={{
                        padding: '4px',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent'
                    }}
                    title="Create Group"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {isCreating && (
                    <div style={{
                        padding: '8px',
                        marginBottom: '8px',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '4px',
                        border: '1px solid var(--primary)'
                    }}>
                        <input
                            autoFocus
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Group Name"
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                marginBottom: '8px',
                                outline: 'none'
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                            <button onClick={() => setIsCreating(false)} style={{ padding: '2px', color: 'var(--text-secondary)' }}>
                                <X size={14} />
                            </button>
                            <button onClick={handleCreate} style={{ padding: '2px', color: 'var(--primary)' }}>
                                <Check size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {groups.map(group => (
                    <div
                        key={group.id}
                        onClick={() => onSelectGroup(group.id)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: selectedGroupId === group.id ? 'var(--bg-active)' : 'transparent',
                            color: selectedGroupId === group.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '2px',
                            fontSize: '13px'
                        }}
                    >
                        <Folder size={14} />
                        {editingId === group.id ? (
                            <input
                                autoFocus
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdate(group.id);
                                    if (e.key === 'Escape') setEditingId(null);
                                }}
                                onBlur={() => handleUpdate(group.id)}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'inherit',
                                    outline: 'none',
                                    minWidth: 0
                                }}
                            />
                        ) : (
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {group.title}
                            </span>
                        )}

                        {selectedGroupId === group.id && !editingId && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingId(group.id);
                                        setEditTitle(group.title);
                                    }}
                                    style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', padding: '2px' }}
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(group.id, e)}
                                    style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', padding: '2px' }}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
