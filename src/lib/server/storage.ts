import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Paper, Canvas } from '@/db/schema';

const STORAGE_ROOT = path.join(os.homedir(), '.zetara');
const PAPERS_DIR = path.join(STORAGE_ROOT, 'papers');
const PDFS_DIR = path.join(STORAGE_ROOT, 'pdfs');
const CANVAS_DIR = path.join(STORAGE_ROOT, 'canvas');

export class StorageService {
    static async ensureDirs() {
        await fs.mkdir(STORAGE_ROOT, { recursive: true });
        await fs.mkdir(PAPERS_DIR, { recursive: true });
        await fs.mkdir(PDFS_DIR, { recursive: true });
        await fs.mkdir(CANVAS_DIR, { recursive: true });
    }

    static async savePaper(paper: Paper, pdfBuffer: Buffer): Promise<Paper> {
        await this.ensureDirs();

        const id = paper.id || Date.now();
        const newPaper = { ...paper, id };

        // Save PDF
        const pdfPath = path.join(PDFS_DIR, `${id}.pdf`);
        await fs.writeFile(pdfPath, pdfBuffer);

        // Save Metadata (exclude blob for JSON storage)
        const { pdfBlob, ...paperData } = newPaper;
        const jsonPath = path.join(PAPERS_DIR, `${id}.json`);
        await fs.writeFile(jsonPath, JSON.stringify(paperData, null, 2));

        return newPaper;
    }

    static async getPapers(): Promise<Paper[]> {
        await this.ensureDirs();
        const files = await fs.readdir(PAPERS_DIR);
        const papers: Paper[] = [];

        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            try {
                const content = await fs.readFile(path.join(PAPERS_DIR, file), 'utf-8');
                const paper = JSON.parse(content);
                // We don't load the blob here to keep it light. 
                // The frontend will request the PDF separately or we handle it via a specific route.
                // For compatibility with the interface, we might need a placeholder or change the interface.
                // For now, we'll cast it.
                papers.push(paper as Paper);
            } catch (e) {
                console.error(`Failed to read paper ${file}:`, e);
            }
        }

        return papers.sort((a, b) => b.createdAt - a.createdAt);
    }

    static async getPaper(id: number): Promise<{ paper: Paper, pdfPath: string } | null> {
        await this.ensureDirs();
        const jsonPath = path.join(PAPERS_DIR, `${id}.json`);
        const pdfPath = path.join(PDFS_DIR, `${id}.pdf`);

        try {
            const content = await fs.readFile(jsonPath, 'utf-8');
            const paper = JSON.parse(content);
            return { paper, pdfPath };
        } catch (e) {
            return null;
        }
    }

    static async deletePaper(id: number) {
        await this.ensureDirs();
        const jsonPath = path.join(PAPERS_DIR, `${id}.json`);
        const pdfPath = path.join(PDFS_DIR, `${id}.pdf`);
        const canvasPath = path.join(CANVAS_DIR, `${id}.json`);

        await fs.unlink(jsonPath).catch(() => { });
        await fs.unlink(pdfPath).catch(() => { });
        await fs.unlink(canvasPath).catch(() => { });
    }

    static async updatePaper(paper: Paper) {
        await this.ensureDirs();
        if (!paper.id) throw new Error("Paper ID required for update");

        const { pdfBlob, ...paperData } = paper;
        const jsonPath = path.join(PAPERS_DIR, `${paper.id}.json`);
        await fs.writeFile(jsonPath, JSON.stringify(paperData, null, 2));
    }

    static async saveCanvas(paperId: number, elements: string) {
        await this.ensureDirs();
        const canvasPath = path.join(CANVAS_DIR, `${paperId}.json`);
        const data: Canvas = {
            paperId,
            elements,
            updatedAt: Date.now()
        };
        await fs.writeFile(canvasPath, JSON.stringify(data, null, 2));
    }

    static async getCanvas(paperId: number): Promise<Canvas | null> {
        await this.ensureDirs();
        const canvasPath = path.join(CANVAS_DIR, `${paperId}.json`);
        try {
            const content = await fs.readFile(canvasPath, 'utf-8');
            return JSON.parse(content);
        } catch (e) {
            return null;
        }
    }

    static getStorageRoot() {
        return STORAGE_ROOT;
    }
}
