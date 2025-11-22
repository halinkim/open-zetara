'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useFileDrop } from '@/hooks/useFileDrop';
import { Loader2 } from 'lucide-react';

export function DropZone() {
    const { t } = useI18n();
    const { handleDrop, handleDragOver, processing } = useFileDrop();

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-secondary)'
            }}
        >
            {processing ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Processing PDF metadata...</span>
                </div>
            ) : (
                t.library.emptyState
            )}
        </div>
    );
}
