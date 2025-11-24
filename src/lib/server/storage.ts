import fs from 'fs/promises';
import path from 'path';
import { Paper, Canvas } from '@/db/schema';
import { getConfig } from '@/config';
import { ActivityService } from './activity';

export class StorageService {
    public static getPaths() {
        const config = getConfig();
        const STORAGE_ROOT = config.dataDir;
        return {
            STORAGE_ROOT,
            PAPERS_DIR: path.join(STORAGE_ROOT, 'papers'),
            PDFS_DIR: path.join(STORAGE_ROOT, 'pdfs'),
            CANVAS_DIR: path.join(STORAGE_ROOT, 'canvas')
        };
    }

    static async ensureDirs() {
        const { STORAGE_ROOT, PAPERS_DIR, PDFS_DIR, CANVAS_DIR } = this.getPaths();
        await fs.mkdir(STORAGE_ROOT, { recursive: true });
        await fs.mkdir(PAPERS_DIR, { recursive: true });
        await fs.mkdir(PDFS_DIR, { recursive: true });
        await fs.mkdir(CANVAS_DIR, { recursive: true });
    }

    static async savePaper(paper: Paper, pdfBuffer: Buffer): Promise<Paper> {
        await this.ensureDirs();
        const { PAPERS_DIR, PDFS_DIR } = this.getPaths();

        const id = paper.id || Date.now();
        const newPaper = { ...paper, id };

        // Save PDF
        const pdfPath = path.join(PDFS_DIR, `${id}.pdf`);
        await fs.writeFile(pdfPath, pdfBuffer);

        // Save Metadata (exclude blob for JSON storage)
        const { pdfBlob, ...paperData } = newPaper;
        const jsonPath = path.join(PAPERS_DIR, `${id}.json`);
        await fs.writeFile(jsonPath, JSON.stringify(paperData, null, 2));

        // Log activity
        await ActivityService.logActivity('paper_added', {
            paperId: id,
            title: paper.title
        });

        return newPaper;
    }

    static async getPapers(): Promise<Paper[]> {
        await this.ensureDirs();
        const { PAPERS_DIR } = this.getPaths();
        const files = await fs.readdir(PAPERS_DIR);
        const papers: Paper[] = [];

        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            try {
                const content = await fs.readFile(path.join(PAPERS_DIR, file), 'utf-8');
                const paper = JSON.parse(content);
                papers.push(paper as Paper);
            } catch (e) {
                console.error(`Failed to read paper ${file}:`, e);
            }
        }

        return papers.sort((a, b) => b.createdAt - a.createdAt);
    }

    static async getPaper(id: number): Promise<{ paper: Paper, pdfPath: string } | null> {
        await this.ensureDirs();
        const { PAPERS_DIR, PDFS_DIR } = this.getPaths();
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
        const { PAPERS_DIR, PDFS_DIR, CANVAS_DIR } = this.getPaths();
        const jsonPath = path.join(PAPERS_DIR, `${id}.json`);
        const pdfPath = path.join(PDFS_DIR, `${id}.pdf`);
        const canvasPath = path.join(CANVAS_DIR, `${id}.json`);

        await fs.unlink(jsonPath).catch(() => { });
        await fs.unlink(pdfPath).catch(() => { });
        await fs.unlink(canvasPath).catch(() => { });
    }

    static async updatePaper(paper: Paper) {
        await this.ensureDirs();
        const { PAPERS_DIR } = this.getPaths();
        if (!paper.id) throw new Error("Paper ID required for update");

        const { pdfBlob, ...paperData } = paper;
        const jsonPath = path.join(PAPERS_DIR, `${paper.id}.json`);
        await fs.writeFile(jsonPath, JSON.stringify(paperData, null, 2));
    }

    static async saveCanvas(paperId: number, elements: string) {
        await this.ensureDirs();
        const { CANVAS_DIR } = this.getPaths();
        const canvasPath = path.join(CANVAS_DIR, `${paperId}.json`);
        const data: Canvas = {
            paperId,
            elements,
            updatedAt: Date.now()
        };
        await fs.writeFile(canvasPath, JSON.stringify(data, null, 2));

        // Get paper title for log
        const paperData = await this.getPaper(paperId);
        const title = paperData?.paper.title || 'Unknown Paper';

        // Log activity
        await ActivityService.logActivity('canvas_edited', {
            paperId,
            title
        });
    }

    static async getCanvas(paperId: number): Promise<Canvas | null> {
        await this.ensureDirs();
        const { CANVAS_DIR } = this.getPaths();
        const canvasPath = path.join(CANVAS_DIR, `${paperId}.json`);
        try {
            const content = await fs.readFile(canvasPath, 'utf-8');
            return JSON.parse(content);
        } catch (e) {
            return null;
        }
    }

    static getStorageRoot() {
        return this.getPaths().STORAGE_ROOT;
    }
}
