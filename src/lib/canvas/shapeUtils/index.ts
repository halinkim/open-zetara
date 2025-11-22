/**
 * ShapeUtils - Main exports and registry setup
 */

export * from './ShapeUtil'
export * from './TextShapeUtil'
export * from './RectShapeUtil'
export * from './CircleShapeUtil'
export * from './ArrowShapeUtil'
export * from './ImageShapeUtil'
export * from './PointerShapeUtil'

import { ShapeUtilRegistry } from './ShapeUtil'
import { TextShapeUtil } from './TextShapeUtil'
import { RectShapeUtil } from './RectShapeUtil'
import { CircleShapeUtil } from './CircleShapeUtil'
import { ArrowShapeUtil } from './ArrowShapeUtil'
import { ImageShapeUtil } from './ImageShapeUtil'
import { PointerShapeUtil } from './PointerShapeUtil'

/**
 * Create and populate the default shape util registry
 */
export function createShapeUtilRegistry(): ShapeUtilRegistry {
    const registry = new ShapeUtilRegistry()

    registry.register(new TextShapeUtil())
    registry.register(new RectShapeUtil())
    registry.register(new CircleShapeUtil())
    registry.register(new ArrowShapeUtil())
    registry.register(new ImageShapeUtil())
    registry.register(new PointerShapeUtil())

    return registry
}

/**
 * Default shape util registry instance
 */
export const defaultShapeUtils = createShapeUtilRegistry()
