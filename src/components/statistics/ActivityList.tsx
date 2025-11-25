'use client';

import React, { useState } from 'react';
import { ActivityItem } from '@/lib/server/activity';
import { FileText, Edit3, Clock, ChevronDown, ChevronRight } from 'lucide-react';

interface ActivityListProps {
    date: string;
    activities: ActivityItem[];
}

interface GroupedActivity {
    type: 'single' | 'group';
    item: ActivityItem;
    count: number;
    firstTimestamp: number;
    lastTimestamp: number;
    items: ActivityItem[];
}

function groupConsecutiveEvents(activities: ActivityItem[]): GroupedActivity[] {
    if (activities.length === 0) return [];

    const groups: GroupedActivity[] = [];
    let currentGroup: ActivityItem[] = [activities[0]];

    for (let i = 1; i < activities.length; i++) {
        const current = activities[i];
        const previous = activities[i - 1];

        // Check if current event should be grouped with previous
        const isSameType = current.type === previous.type;
        const isSamePaper = current.details.paperId === previous.details.paperId;
        const isSameTitle = current.details.title === previous.details.title;

        if (isSameType && isSamePaper && isSameTitle) {
            currentGroup.push(current);
        } else {
            // Finalize current group and start new one
            groups.push(createGroupedActivity(currentGroup));
            currentGroup = [current];
        }
    }

    // Don't forget the last group
    groups.push(createGroupedActivity(currentGroup));

    return groups;
}

function createGroupedActivity(items: ActivityItem[]): GroupedActivity {
    return {
        type: items.length > 1 ? 'group' : 'single',
        item: items[0],
        count: items.length,
        firstTimestamp: items[0].timestamp,
        lastTimestamp: items[items.length - 1].timestamp,
        items
    };
}

export function ActivityList({ date, activities }: ActivityListProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

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
    const grouped = groupConsecutiveEvents(sorted);

    const toggleGroup = (index: number) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedGroups(newExpanded);
    };

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
                {grouped.map((group, index) => {
                    const isExpanded = expandedGroups.has(index);
                    const isGroup = group.type === 'group';

                    return (
                        <div key={index}>
                            {/* Main group item */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '12px',
                                    padding: '12px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    cursor: isGroup ? 'pointer' : 'default'
                                }}
                                onClick={() => isGroup && toggleGroup(index)}
                            >
                                {isGroup && (
                                    <div style={{
                                        marginTop: '2px',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </div>
                                )}
                                <div style={{
                                    marginTop: '2px',
                                    color: group.item.type === 'paper_added' ? '#4caf50' : '#2196f3'
                                }}>
                                    {group.item.type === 'paper_added' ? <FileText size={16} /> : <Edit3 size={16} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: 'var(--text-primary)',
                                        marginBottom: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        {group.item.type === 'paper_added' ? 'Added Paper' : 'Edited Canvas'}
                                        {isGroup && (
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                backgroundColor: 'var(--bg-primary)',
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                × {group.count}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        {group.item.details.title || 'Untitled Paper'}
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
                                    {isGroup ? (
                                        <span>
                                            {new Date(group.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {' - '}
                                            {new Date(group.firstTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    ) : (
                                        new Date(group.item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    )}
                                </div>
                            </div>

                            {/* Expanded items */}
                            {isGroup && isExpanded && (
                                <div style={{
                                    marginTop: '8px',
                                    marginLeft: '28px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px'
                                }}>
                                    {group.items.map((item) => (
                                        <div key={item.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '8px 12px',
                                            backgroundColor: 'var(--bg-primary)',
                                            borderRadius: '4px',
                                            border: '1px solid var(--border-color)',
                                            fontSize: '12px',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            <Clock size={12} />
                                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
