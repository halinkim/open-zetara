export type CanvasItemType = 'pointer' | 'text' | 'shape' | 'connector';

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

export type CanvasItem = PointerItem | TextItem | ShapeItem | ConnectorItem;

export interface CanvasState {
    items: CanvasItem[];
    scale: number;
    offset: { x: number; y: number };
}
