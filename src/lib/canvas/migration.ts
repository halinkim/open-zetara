/**
 * Data Migration Utilities
 * 
 * Convert between old CanvasItem format and new Shape format.
 * Enables backward compatibility during migration.
 */

import { CanvasItem, PointerItem, TextItem, ShapeItem, ImageItem } from './types'
import { Shape, createShape, ShapeId } from './shapes'
import { Asset, createAssetId } from './assets'

/**
 * Convert old CanvasItem array to new Shape format
 */
export function migrateOldToNew(oldItems: CanvasItem[]): {
    shapes: Record<ShapeId, Shape>
    assets: Record<string, Asset>
} {
    const shapes: Record<ShapeId, Shape> = {}
    const assets: Record<string, Asset> = {}

    oldItems.forEach(item => {
        if (item.type === 'connector') {
            // Skip connectors for now
            return
        }

        const shape = convertItemToShape(item, assets)
        if (shape) {
            shapes[shape.id] = shape
        }
    })

    return { shapes, assets }
}

/**
 * Convert a single old item to new shape
 */
function convertItemToShape(item: CanvasItem, assets: Record<string, Asset>): Shape | null {
    const baseProps = {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
    }

    switch (item.type) {
        case 'text': {
            const textItem = item as TextItem
            const shape = createShape('text', {
                ...baseProps,
                props: {
                    text: textItem.content,
                    fontSize: textItem.fontSize,
                    color: textItem.color,
                },
            })
            return { ...shape, id: item.id }
        }

        case 'shape': {
            const shapeItem = item as ShapeItem

            if (shapeItem.shapeType === 'rectangle') {
                const shape = createShape('rect', {
                    ...baseProps,
                    opacity: shapeItem.opacity || 1,
                    props: {
                        stroke: shapeItem.color,
                        color: shapeItem.color,
                        fill: shapeItem.fill || 'none',
                        dash: (shapeItem.dash as any) || 'draw',
                        size: (shapeItem.size as any) || 'm',
                        strokeWidth: shapeItem.strokeWidth || 2,
                    },
                })
                return { ...shape, id: item.id }
            }

            if (shapeItem.shapeType === 'circle') {
                const shape = createShape('circle', {
                    ...baseProps,
                    opacity: shapeItem.opacity || 1,
                    props: {
                        stroke: shapeItem.color,
                        color: shapeItem.color,
                        fill: shapeItem.fill || 'none',
                        dash: (shapeItem.dash as any) || 'draw',
                        size: (shapeItem.size as any) || 'm',
                        strokeWidth: shapeItem.strokeWidth || 2,
                    },
                })
                return { ...shape, id: item.id }
            }

            if (shapeItem.shapeType === 'arrow') {
                const shape = createShape('arrow', {
                    ...baseProps,
                    opacity: shapeItem.opacity || 1,
                    props: {
                        start: shapeItem.start || { x: 0, y: item.height / 2 },
                        end: shapeItem.end || { x: item.width, y: item.height / 2 },
                        color: shapeItem.color,
                        dash: (shapeItem.dash as any) || 'draw',
                        size: (shapeItem.size as any) || 'm',
                        strokeWidth: shapeItem.strokeWidth || 2,
                        bend: shapeItem.bend || 0,
                        arrowheadStart: (shapeItem.arrowheadStart as any) || 'none',
                        arrowheadEnd: (shapeItem.arrowheadEnd as any) || 'arrow',
                    },
                })
                return { ...shape, id: item.id }
            }

            return null
        }

        case 'pointer': {
            const pointerItem = item as PointerItem
            const assetId = createAssetId()

            if (pointerItem.image) {
                assets[assetId] = {
                    id: assetId,
                    type: 'pointer-snapshot',
                    src: pointerItem.image,
                    width: item.width,
                    height: item.height,
                    meta: {
                        pdfId: typeof pointerItem.pdfId === 'number' ? pointerItem.pdfId : parseInt(pointerItem.pdfId as string, 10),
                        page: pointerItem.page,
                        rect: pointerItem.rect,
                    },
                }
            }

            const shape = createShape('pointer', {
                ...baseProps,
                props: {
                    assetId: assetId,
                },
            })
            return { ...shape, id: item.id }
        }

        case 'image': {
            const imageItem = item as ImageItem
            const assetId = createAssetId()

            assets[assetId] = {
                id: assetId,
                type: 'image',
                src: imageItem.image,
                width: item.width,
                height: item.height,
                meta: {
                    name: 'Image',
                    mimeType: 'image/png' // Default assumption
                }
            }

            const shape = createShape('image', {
                ...baseProps,
                props: {
                    assetId: assetId,
                },
            })
            return { ...shape, id: item.id }
        }

        default:
            return null
    }
}

/**
 * Convert new Shape format back to old CanvasItem format
 */
export function migrateNewToOld(
    shapes: Record<ShapeId, Shape>,
    assets: Record<string, Asset>
): CanvasItem[] {
    return Object.values(shapes).map(shape => {
        return convertShapeToItem(shape, assets)
    }).filter(Boolean) as CanvasItem[]
}

/**
 * Convert a single shape to old item format
 */
function convertShapeToItem(shape: Shape, assets: Record<string, Asset>): CanvasItem | null {
    const baseItem = {
        id: shape.id,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
    }

    switch (shape.type) {
        case 'text':
            return {
                ...baseItem,
                type: 'text',
                content: shape.props.text,
                fontSize: shape.props.fontSize,
                color: shape.props.color,
            } as TextItem

        case 'rect':
            return {
                ...baseItem,
                type: 'shape',
                shapeType: 'rectangle',
                color: shape.props.color || shape.props.stroke,
                fill: shape.props.fill,
                dash: shape.props.dash,
                size: shape.props.size,
                strokeWidth: shape.props.strokeWidth,
                opacity: shape.opacity,
            } as ShapeItem

        case 'circle':
            return {
                ...baseItem,
                type: 'shape',
                shapeType: 'circle',
                color: shape.props.color || shape.props.stroke,
                fill: shape.props.fill,
                dash: shape.props.dash,
                size: shape.props.size,
                strokeWidth: shape.props.strokeWidth,
                opacity: shape.opacity,
            } as ShapeItem

        case 'arrow':
            return {
                ...baseItem,
                type: 'shape',
                shapeType: 'arrow',
                color: shape.props.color,
                dash: shape.props.dash,
                size: shape.props.size,
                strokeWidth: shape.props.strokeWidth,
                opacity: shape.opacity,
                start: shape.props.start,
                end: shape.props.end,
                bend: shape.props.bend,
                arrowheadStart: shape.props.arrowheadStart,
                arrowheadEnd: shape.props.arrowheadEnd,
            } as ShapeItem

        case 'pointer': {
            const asset = assets[shape.props.assetId]
            if (!asset || asset.type !== 'pointer-snapshot') {
                return null
            }
            return {
                ...baseItem,
                type: 'pointer',
                pdfId: asset.meta.pdfId,
                page: asset.meta.page,
                rect: asset.meta.rect,
                image: asset.src,
            } as PointerItem
        }

        case 'image': {
            const asset = assets[shape.props.assetId]
            if (!asset || asset.type !== 'image') {
                return null
            }
            return {
                ...baseItem,
                type: 'image',
                image: asset.src,
            } as ImageItem
        }

        default:
            return null
    }
}
