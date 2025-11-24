'use client';

import React, { useState, useEffect } from 'react';
import { ContributionGraph } from './ContributionGraph';
import { ActivityList } from './ActivityList';
import { ActivityItem, ActivityLog } from '@/lib/server/activity';
import { format } from 'date-fns';

export function StatisticsPanel() {
    const [data, setData] = useState<ActivityLog>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const res = await fetch('/api/activity');
            if (res.ok) {
                const log = await res.json();
                setData(log);
            }
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            overflow: 'auto',
            padding: '30px 40px'
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <h2 style={{
                    fontSize: '20px',
                    fontWeight: 500,
                    marginBottom: '30px',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '10px'
                }}>
                    Statistics
                </h2>

                <div style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '20px',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '15px' }}>
                        Contribution Graph
                    </h3>
                    {loading ? (
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading...</div>
                    ) : (
                        <ContributionGraph
                            data={data}
                            selectedDate={selectedDate}
                            onSelectDate={setSelectedDate}
                        />
                    )}
                </div>

                {selectedDate && (
                    <ActivityList
                        date={selectedDate}
                        activities={data[selectedDate] || []}
                    />
                )}
            </div>
        </div>
    );
}
