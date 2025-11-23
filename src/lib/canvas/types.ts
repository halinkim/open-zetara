export type CanvasItemType = 'pointer' | 'text' | 'shape' | 'connector' | 'image';

export interface BaseCanvasItem {
    id: string;
    type: CanvasItemType;
    x: number;
    y: number;
    width: number;
    height: number;
    selected?: boolean;
}

export interface PointerItem extends BaseCanvasItem {
    type: 'pointer';
    pdfId: string | number;
    page: number;
    rect: { x: number; y: number; width: number; height: number }; // Normalized coordinates (0-1)
    image?: string; // Base64 snapshot (optional)
}

export interface TextItem extends BaseCanvasItem {
    type: 'text';
    content: string;
    fontSize: number;
    color: string;
}

export interface ShapeItem extends BaseCanvasItem {
    type: 'shape';
    shapeType: 'rectangle' | 'circle' | 'arrow';
    color: string;
    fill?: string;
    dash?: string;
    size?: string;
    strokeWidth?: number;
    opacity?: number;
    // Arrow specific
    start?: { x: number, y: number };
    end?: { x: number, y: number };
    bend?: number;
    arrowheadStart?: string;
    arrowheadEnd?: string;
}

export type ConnectionAnchor = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface ConnectorItem extends BaseCanvasItem {
    type: 'connector';
    connectorType: 'bezier' | 'straight' | 'orthogonal';
    fromItemId: string;
    fromAnchor: ConnectionAnchor;
    toItemId: string;
    toAnchor: ConnectionAnchor;
    color: string;
    strokeWidth: number;
}

export interface ImageItem extends BaseCanvasItem {
    type: 'image';
    image: string; // Base64 or URL
}

export type CanvasItem = PointerItem | TextItem | ShapeItem | ConnectorItem | ImageItem;

export interface CanvasState {
    items: CanvasItem[];
    scale: number;
    offset: { x: number; y: number };
}
