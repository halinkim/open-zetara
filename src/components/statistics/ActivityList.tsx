'use client';

import React from 'react';
import { ActivityItem } from '@/lib/server/activity';
import { FileText, Edit3, Clock } from 'lucide-react';

interface ActivityListProps {
    date: string;
    activities: ActivityItem[];
}

export function ActivityList({ date, activities }: ActivityListProps) {
    if (!activities || activities.length === 0) {
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '13px'
            }}>
                No activity recorded on {date}.
            </div>
        );
    }

    // Sort by timestamp descending
    const sorted = [...activities].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div style={{ marginTop: '20px' }}>
            <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '15px',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                Activity on {date}
                <span style={{
                    fontSize: '11px',
                    fontWeight: 400,
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '2px 6px',
                    borderRadius: '10px'
                }}>
                    {activities.length}
                </span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sorted.map((item) => (
                    <div key={item.id} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{
                            marginTop: '2px',
                            color: item.type === 'paper_added' ? '#4caf50' : '#2196f3'
                        }}>
                            {item.type === 'paper_added' ? <FileText size={16} /> : <Edit3 size={16} />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                {item.type === 'paper_added' ? 'Added Paper' : 'Edited Canvas'}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {item.details.title || 'Untitled Paper'}
                            </div>
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <Clock size={12} />
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
