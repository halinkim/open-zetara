import fs from 'fs/promises';
import path from 'path';
import { StorageService } from './storage';
import { v4 as uuidv4 } from 'uuid';

export interface PaperGroup {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    elements: string; // JSON string of canvas elements
}

const GROUPS_FILE = 'groups.json';

export class GroupService {
    private static async getFilePath() {
        const { STORAGE_ROOT } = StorageService.getPaths();
        return path.join(STORAGE_ROOT, GROUPS_FILE);
    }

    private static async readGroups(): Promise<PaperGroup[]> {
        const filePath = await this.getFilePath();
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    private static async writeGroups(groups: PaperGroup[]) {
        const filePath = await this.getFilePath();
        await fs.writeFile(filePath, JSON.stringify(groups, null, 2));
    }

    static async getAll(): Promise<PaperGroup[]> {
        const groups = await this.readGroups();
        // Return without elements to save bandwidth for list view
        return groups.map(({ elements, ...rest }) => ({ ...rest, elements: '[]' }));
    }

    static async get(id: string): Promise<PaperGroup | null> {
        const groups = await this.readGroups();
        return groups.find(g => g.id === id) || null;
    }

    static async create(title: string): Promise<PaperGroup> {
        const groups = await this.readGroups();
        const newGroup: PaperGroup = {
            id: uuidv4(),
            title,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            elements: JSON.stringify({
                shapes: {},
                assets: {},
                selectedIds: [],
                editingId: null,
                camera: { x: 0, y: 0, zoom: 1 }
            })
        };
        groups.push(newGroup);
        await this.writeGroups(groups);
        return newGroup;
    }

    static async update(id: string, updates: Partial<Pick<PaperGroup, 'title' | 'elements'>>): Promise<PaperGroup | null> {
        const groups = await this.readGroups();
        const index = groups.findIndex(g => g.id === id);
        if (index === -1) return null;

        const updatedGroup = {
            ...groups[index],
            ...updates,
            updatedAt: Date.now()
        };
        groups[index] = updatedGroup;
        await this.writeGroups(groups);
        return updatedGroup;
    }

    static async delete(id: string): Promise<boolean> {
        const groups = await this.readGroups();
        const filtered = groups.filter(g => g.id !== id);
        if (filtered.length === groups.length) return false;

        await this.writeGroups(filtered);
        return true;
    }
}
