'use client';

import React from 'react';
import { ActivityItem } from '@/lib/server/activity';
import { subDays, format, startOfWeek, addDays } from 'date-fns';

interface ContributionGraphProps {
    data: { [date: string]: ActivityItem[] };
    selectedDate: string | null;
    onSelectDate: (date: string) => void;
}

export function ContributionGraph({ data, selectedDate, onSelectDate }: ContributionGraphProps) {
    // Generate last 365 days
    const today = new Date();
    const startDate = subDays(today, 364); // Approx 1 year

    // Align to start of week (Sunday)
    const calendarStart = startOfWeek(startDate);

    const weeks: Date[][] = [];
    let currentDay = calendarStart;

    // Generate 53 weeks to cover the year
    for (let i = 0; i < 53; i++) {
        const week: Date[] = [];
        for (let j = 0; j < 7; j++) {
            week.push(currentDay);
            currentDay = addDays(currentDay, 1);
        }
        weeks.push(week);
    }

    const getLevel = (count: number) => {
        if (count === 0) return 0;
        if (count <= 2) return 1;
        if (count <= 5) return 2;
        if (count <= 9) return 3;
        return 4;
    };

    const getColor = (level: number) => {
        // Warm palette based on user image (Yellow -> Orange -> Red)
        switch (level) {
            case 0: return 'var(--bg-secondary)'; // Empty
            case 1: return '#fdd835'; // Yellow
            case 2: return '#ff9800'; // Orange
            case 3: return '#f44336'; // Red
            case 4: return '#d32f2f'; // Darker Red
            default: return 'var(--bg-secondary)';
        }
    };

    const CELL_SIZE = 12;
    const CELL_GAP = 3;
    const WEEK_WIDTH = CELL_SIZE + CELL_GAP;

    // Calculate month labels
    const monthLabels: { label: string, weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, weekIndex) => {
        const firstDayOfWeek = week[0];
        const month = firstDayOfWeek.getMonth();
        if (month !== lastMonth) {
            monthLabels.push({
                label: format(firstDayOfWeek, 'MMM'),
                weekIndex
            });
            lastMonth = month;
        }
    });

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div style={{ overflowX: 'auto', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
                {/* Day Labels */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${CELL_GAP}px`, paddingTop: '0' }}>
                    {weekDays.map((day, i) => (
                        <div key={i} style={{
                            height: `${CELL_SIZE}px`,
                            fontSize: '10px',
                            lineHeight: `${CELL_SIZE}px`,
                            color: 'var(--text-secondary)',
                            textAlign: 'center',
                            width: '15px'
                        }}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div>
                    <div style={{ display: 'flex', gap: `${CELL_GAP}px` }}>
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: `${CELL_GAP}px` }}>
                                {week.map((day, dayIndex) => {
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const activities = data[dateStr] || [];
                                    const count = activities.length;
                                    const level = getLevel(count);
                                    const isSelected = selectedDate === dateStr;
                                    const isFuture = day > today;

                                    if (isFuture) return <div key={dateStr} style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }} />;

                                    return (
                                        <div
                                            key={dateStr}
                                            onClick={() => onSelectDate(dateStr)}
                                            title={`${count} activities on ${dateStr}`}
                                            style={{
                                                width: `${CELL_SIZE}px`,
                                                height: `${CELL_SIZE}px`,
                                                backgroundColor: getColor(level),
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                border: isSelected ? '1px solid var(--text-primary)' : '1px solid transparent',
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Month Labels */}
                    <div style={{ position: 'relative', height: '20px', marginTop: '8px' }}>
                        {monthLabels.map((item, i) => (
                            <div key={i} style={{
                                position: 'absolute',
                                left: `${item.weekIndex * WEEK_WIDTH}px`,
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                                whiteSpace: 'nowrap'
                            }}>
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div style={{
                marginTop: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
            }}>
                <span>Less</span>
                <div style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, backgroundColor: getColor(0), borderRadius: '3px' }} />
                <div style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, backgroundColor: getColor(1), borderRadius: '3px' }} />
                <div style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, backgroundColor: getColor(2), borderRadius: '3px' }} />
                <div style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, backgroundColor: getColor(3), borderRadius: '3px' }} />
                <div style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, backgroundColor: getColor(4), borderRadius: '3px' }} />
                <span>More</span>
            </div>
        </div>
    );
}
