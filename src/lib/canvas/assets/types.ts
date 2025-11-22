/**
 * Canvas Asset Type System
 * 
 * Assets store binary data (images, PDF snapshots) separately from shapes.
 * Shapes reference assets by ID.
 */

export type AssetId = string // 'asset:abc123'
export type AssetType = 'image' | 'pointer-snapshot'

/**
 * Base asset interface
 */
export interface BaseAsset<Type extends AssetType, Meta extends object = object> {
    id: AssetId
    type: Type

    // Image data
    src: string // blob URL or data URL
    width: number
    height: number

    // Type-specific metadata
    meta: Meta
}

/**
 * Regular image asset (user uploaded or pasted)
 */
export interface ImageAsset extends BaseAsset<'image'> {
    meta: {
        name?: string
        mimeType?: string
    }
}

/**
 * PDF pointer snapshot asset
 * Contains both the image and PDF reference metadata
 */
export interface PointerSnapshotAsset extends BaseAsset<'pointer-snapshot'> {
    meta: {
        pdfId: number
        page: number
        rect: {
            x: number
            y: number
            width: number
            height: number
        }
    }
}

/**
 * Union type for all assets
 */
export type Asset = ImageAsset | PointerSnapshotAsset

/**
 * Asset metadata type map
 */
export type AssetMetaMap = {
    image: ImageAsset['meta']
    'pointer-snapshot': PointerSnapshotAsset['meta']
}
