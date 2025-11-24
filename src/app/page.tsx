'use client';

import { useState } from 'react';
import { useI18n } from "@/lib/i18n/context";
import { DropZone } from "@/components/library/DropZone";
import { PaperList } from "@/components/library/PaperList";
import { LibraryTable } from "@/components/library/LibraryTable";
import { MetadataPanel } from "@/components/library/MetadataPanel";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import { useAppStore } from "@/lib/store";
import { CanvasBoard } from '@/components/canvas/CanvasBoard';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { ResizableSplitPane } from '@/components/layout/ResizableSplitPane';
import { Files, Settings, GitBranch, Loader2, Edit2 } from 'lucide-react';
import { useFileDrop } from '@/hooks/useFileDrop';

export default function Home() {
  const { t } = useI18n();
  const { sidebarOpen, selectedPaperId, setSelectedPaperId } = useAppStore();
  // Unified view state: 'library' | 'canvas' | 'settings'
  const [activeView, setActiveView] = useState<'library' | 'canvas' | 'settings'>('library');
  const [selectedLibraryPaperIds, setSelectedLibraryPaperIds] = useState<number[]>([]);
  const { handleDrop, handleDragOver, processing } = useFileDrop();

  const handleOpenReader = (paperId: number) => {
    setSelectedPaperId(paperId);
    setActiveView('canvas');
  };

  // Derived state for metadata panel
  const activePaperIdForMetadata = selectedLibraryPaperIds.length === 1 ? selectedLibraryPaperIds[0] : null;

  return (
    <main
      className="app-main"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {processing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <Loader2 className="animate-spin" size={48} />
          <div style={{ fontSize: '18px', fontWeight: 500 }}>Processing PDF...</div>
        </div>
      )}

      {/* Activity Bar */}
      <aside className="activity-bar">
        <div
          className={`activity-icon ${activeView === 'library' ? 'active' : ''}`}
          onClick={() => setActiveView('library')}
          style={{ cursor: 'pointer' }}
          title="Library"
        >
          <Files size={24} />
        </div>
        <div
          className={`activity-icon ${activeView === 'canvas' ? 'active' : ''}`}
          onClick={() => setActiveView('canvas')}
          style={{ cursor: 'pointer' }}
          title="Canvas / Reader"
        >
          <Edit2 size={24} />
        </div>
        <div
          className={`activity-icon ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
          style={{ cursor: 'pointer' }}
          title="Settings"
        >
          <Settings size={24} />
        </div>
      </aside>

      {/* Sidebar - Show PaperList in Canvas mode (for quick switching) */}
      {sidebarOpen && activeView === 'canvas' && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <span className="sidebar-title">
              {t.library.title}
            </span>
          </div>
          <div className="sidebar-content">
            <PaperList />
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="editor-area" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header / Toolbar for Library View */}
        {activeView === 'library' && (
          <div style={{
            padding: '10px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Library</h2>
            {/* Search bar could go here */}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {activeView === 'settings' ? (
            <div style={{ padding: '20px', width: '100%', overflowY: 'auto' }}>
              <SettingsPanel />
            </div>
          ) : activeView === 'library' ? (
            <div style={{ display: 'flex', width: '100%', height: '100%' }}>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <LibraryTable
                  onOpenReader={handleOpenReader}
                  onSelectionChange={setSelectedLibraryPaperIds}
                />
              </div>
              {activePaperIdForMetadata && (
                <MetadataPanel
                  paperId={activePaperIdForMetadata}
                  onClose={() => {
                    setSelectedLibraryPaperIds([]);
                  }}
                />
              )}
            </div>
          ) : (
            /* Canvas / Reader View */
            <ResizableSplitPane
              storageKey="reader-split-layout"
              left={
                <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                  {selectedPaperId ? <PdfViewer /> : <DropZone />}
                </div>
              }
              right={
                <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                  <CanvasBoard />
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <footer className="status-bar">
        <div className="status-item">
          <GitBranch size={12} />
          <span>main</span>
        </div>
        <div className="status-item">
          <span>{activeView === 'canvas' ? 'Reading' : activeView === 'library' ? 'Library' : 'Settings'}</span>
        </div>
      </footer>
    </main>
  );
}
