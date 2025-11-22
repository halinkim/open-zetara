import Dexie, { Table } from 'dexie';

export interface Paper {
    id?: number;
    title: string;
    authors: string[];
    journal?: string;
    year?: string;
    doi?: string;
    url?: string;
    tags?: string[];
    isFavorite?: boolean;
    pdfBlob: Blob;
    createdAt: number;
}

export interface Canvas {
    id?: number;
    paperId: number;
    elements: string; // JSON string of canvas elements
    updatedAt: number;
}

export class ZetaraDatabase extends Dexie {
    papers!: Table<Paper>;
    canvases!: Table<Canvas>;

    constructor() {
        super('ZetaraDB');
        this.version(1).stores({
            papers: '++id, title, year, createdAt',
            canvases: '++id, paperId'
        });

        // Version 2: Add metadata fields
        this.version(2).stores({
            papers: '++id, title, year, createdAt, *authors, *tags, isFavorite',
            canvases: '++id, paperId'
        });
    }
}

export const db = new ZetaraDatabase();
