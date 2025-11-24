import React, { useState } from 'react';
import { GroupList } from './GroupList';
import { GroupCanvasBoard } from '@/components/canvas/GroupCanvasBoard';

export function GroupPanel() {
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    return (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            <GroupList
                selectedGroupId={selectedGroupId}
                onSelectGroup={setSelectedGroupId}
            />
            <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                {selectedGroupId ? (
                    <GroupCanvasBoard groupId={selectedGroupId} />
                ) : (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--text-tertiary)',
                        fontSize: '14px'
                    }}>
                        Select a group to view its canvas
                    </div>
                )}
            </div>
        </div>
    );
}
