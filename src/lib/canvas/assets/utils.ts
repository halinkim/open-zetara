/**
 * Utility functions for working with assets
 */

import { Asset, AssetId, ImageAsset, PointerSnapshotAsset } from './types'

/**
 * Generate a unique asset ID
 */
export function createAssetId(): AssetId {
    return `asset:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create an image asset from a File or Blob
 */
export async function createImageAsset(
    file: File | Blob,
    name?: string
): Promise<ImageAsset> {
    // Create blob URL
    const src = URL.createObjectURL(file)

    // Get dimensions by loading the image
    const { width, height } = await getImageDimensions(src)

    return {
        id: createAssetId(),
        type: 'image',
        src,
        width,
        height,
        meta: {
            name: name || (file instanceof File ? file.name : undefined),
            mimeType: file.type || undefined,
        },
    }
}

/**
 * Create a pointer snapshot asset
 */
export function createPointerSnapshotAsset(
    src: string,
    width: number,
    height: number,
    pdfMetadata: {
        pdfId: number
        page: number
        rect: { x: number; y: number; width: number; height: number }
    }
): PointerSnapshotAsset {
    return {
        id: createAssetId(),
        type: 'pointer-snapshot',
        src,
        width,
        height,
        meta: pdfMetadata,
    }
}

/**
 * Get image dimensions from a URL
 */
function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.onerror = reject
        img.src = src
    })
}

/**
 * Type guard functions
 */
export function isImageAsset(asset: Asset): asset is ImageAsset {
    return asset.type === 'image'
}

export function isPointerSnapshotAsset(asset: Asset): asset is PointerSnapshotAsset {
    return asset.type === 'pointer-snapshot'
}

/**
 * Clean up blob URLs to prevent memory leaks
 */
export function revokeAssetUrl(asset: Asset): void {
    if (asset.src.startsWith('blob:')) {
        URL.revokeObjectURL(asset.src)
    }
}
