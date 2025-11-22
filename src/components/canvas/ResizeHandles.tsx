import React from 'react'
import { BaseShape } from '@/lib/canvas/shapes/types'

interface ResizeHandlesProps {
    shape: BaseShape<any, any>
    zoom: number
    onResizeStart: (e: React.MouseEvent, handle: string, shape: BaseShape<any, any>) => void
}

export function ResizeHandles({ shape, zoom, onResizeStart }: ResizeHandlesProps) {
    const handles = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']
    const handleSize = 8 / zoom
    const strokeWidth = 1 / zoom

    return (
        <>
            {handles.map(handle => {
                let x = shape.x
                let y = shape.y

                if (handle.includes('e')) x = shape.x + shape.width
                else if (handle.includes('w')) x = shape.x
                else x = shape.x + shape.width / 2

                if (handle.includes('s')) y = shape.y + shape.height
                else if (handle.includes('n')) y = shape.y
                else y = shape.y + shape.height / 2

                return (
                    <rect
                        key={handle}
                        x={x - handleSize / 2}
                        y={y - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        fill="white"
                        stroke="#0d99ff"
                        strokeWidth={strokeWidth}
                        style={{ cursor: `${handle}-resize`, pointerEvents: 'all' }}
                        onMouseDown={(e) => onResizeStart(e, handle, shape)}
                    />
                )
            })}
        </>
    )
}
