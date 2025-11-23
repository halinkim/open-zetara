import { useCallback, useState } from 'react';
import { extractPdfMetadata, fetchCrossrefMetadata } from '@/lib/metadataUtils';
import { useAppStore } from '@/lib/store';
import { Paper } from '@/db/schema';
import { api } from '@/lib/api';

export function useFileDrop() {
    const [processing, setProcessing] = useState(false);
    const { setSelectedPaperId } = useAppStore();

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const files = Array.from(e.dataTransfer.files);
        const pdfs = files.filter(f => f.type === 'application/pdf');

        if (pdfs.length === 0) return;

        setProcessing(true);
        try {
            for (const file of pdfs) {
                // 1. Extract basic metadata from PDF
                let metadata = await extractPdfMetadata(file);

                // 2. If DOI exists, fetch from Crossref and merge
                if (metadata.doi) {
                    try {
                        const crossrefData = await fetchCrossrefMetadata(metadata.doi);
                        metadata = { ...metadata, ...crossrefData };
                    } catch (err) {
                        console.warn(`Failed to fetch Crossref data for DOI ${metadata.doi}`, err);
                    }
                }

                // 3. Save to API
                const paper: Paper = {
                    title: metadata.title || file.name.replace('.pdf', ''),
                    authors: metadata.authors || ['Unknown'],
                    journal: metadata.journal,
                    year: metadata.year,
                    doi: metadata.doi,
                    url: metadata.url,
                    tags: [],
                    isFavorite: false,
                    pdfBlob: file,
                    createdAt: Date.now()
                };

                const savedPaper = await api.papers.create(file, paper);

                // Select the new paper
                if (savedPaper.id) {
                    setSelectedPaperId(savedPaper.id);
                    useAppStore.getState().triggerUpdate();
                }
            }
        } catch (error) {
            console.error('Error processing PDF:', error);
        } finally {
            setProcessing(false);
        }
    }, [setSelectedPaperId]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    return {
        handleDrop,
        handleDragOver,
        processing
    };
}
