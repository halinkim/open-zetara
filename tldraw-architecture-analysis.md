# tldraw Architecture Analysis

Based on direct source code examination of `tldraw-reference` repository.

## 1. Core Shape System

### 1.1 TLBaseShape Pattern

**Location**: `packages/tlschema/src/shapes/TLBaseShape.ts`

```ts
export interface TLBaseShape<Type extends string, Props extends object> {
  // Base record members
  readonly id: TLShapeId              // 'shape:abc123'
  readonly typeName: 'shape'
  
  // Shape properties
  type: Type                          // 'text' | 'arrow' | 'rect' etc.
  x: number
  y: number
  rotation: number
  index: IndexKey                     // for z-order
  parentId: TLParentId               // 'page:main' or 'shape:frame1'
  isLocked: boolean
  opacity: TLOpacityType             // 0-1
  
  // Type-specific properties
  props: Props
  
  // User metadata
  meta: JsonObject
}
```

**Key Insight**: ALL shapes share this exact structure. Type-specific data goes in `props`.

### 1.2 Shape Definition Example: Text

**Location**: `packages/tlschema/src/shapes/TLTextShape.ts`

```ts
// 1. Define props interface
export interface TLTextShapeProps {
  color: TLDefaultColorStyle
  size: TLDefaultSizeStyle
  font: TLDefaultFontStyle
  textAlign: TLDefaultTextAlignStyle
  w: number
  richText: TLRichText
  scale: number
  autoSize: boolean
}

// 2. Create shape type
export type TLTextShape = TLBaseShape<'text', TLTextShapeProps>

// 3. Define validators for runtime validation
export const textShapeProps: RecordProps<TLTextShape> = {
  color: DefaultColorStyle,
  size: DefaultSizeStyle,
  font: DefaultFontStyle,
  textAlign: DefaultTextAlignStyle,
  w: T.nonZeroNumber,
  richText: richTextValidator,
  scale: T.nonZeroNumber,
  autoSize: T.boolean,
}
```

### 1.3 Arrow Shape with Bindings

**Location**: `packages/tlschema/src/shapes/TLArrowShape.ts`

```ts
export interface TLArrowShapeProps {
  kind: 'arc' | 'elbow'
  labelColor: TLDefaultColorStyle
  color: TLDefaultColorStyle
  fill: TLDefaultFillStyle
  dash: TLDefaultDashStyle
  size: TLDefaultSizeStyle
  arrowheadStart: TLArrowShapeArrowheadStyle
  arrowheadEnd: TLArrowShapeArrowheadStyle
  font: TLDefaultFontStyle
  
  // Connection points
  start: VecModel              // { x, y } - always points, not bindings
  end: VecModel                // { x, y }
  
  bend: number
  richText: TLRichText
  labelPosition: number
  scale: number
  elbowMidPoint: number
}
```

**CRITICAL**: Arrow bindings are NOT stored in the arrow shape props. They are separate `Binding` records that reference the arrow shape. This keeps the data model clean.

## 2. ShapeUtil Pattern

###2.1 ShapeUtil Base Class

**Location**: `packages/tldraw/src/lib/shapes/text/TextShapeUtil.tsx`

```ts
export class TextShapeUtil extends ShapeUtil<TLTextShape> {
  // Static metadata
  static override type = 'text' as const
  static override props = textShapeProps
  static override migrations = textShapeMigrations
  
  // Configuration
  override options: TextShapeOptions = {
    extraArrowHorizontalPadding: 10,
  }
  
  // Default props when creating new shape
  getDefaultProps(): TLTextShape['props'] {
    return {
      color: 'black',
      size: 'm',
      w: 8,
      font: 'draw',
      textAlign: 'start',
      autoSize: true,
      scale: 1,
      richText: toRichText(''),
    }
  }
  
  // Geometry for hit testing, bounds calculation
  getGeometry(shape: TLTextShape, opts: TLGeometryOpts) {
    const { scale } = shape.props
    const { width, height } = this.getMinDimensions(shape)
    return new Rectangle2d({
      x: 0,
      width: width * scale,
      height: height * scale,
      isFilled: true,
      isLabel: true,
    })
  }
  
  // Rendering (React component)
  component(shape: TLTextShape) {
    const { id, props: { font, size, richText, color, scale, textAlign } } = shape
    const { width, height } = this.getMinDimensions(shape)
    const isSelected = shape.id === this.editor.getOnlySelectedShapeId()
    const theme = useDefaultColorTheme()
    const handleKeyDown = useTextShapeKeydownHandler(id)
    
    return (
      <RichTextLabel
        shapeId={id}
        font={font}
        fontSize={FONT_SIZES[size]}
        align={textAlign}
        richText={richText}
        labelColor={getColorValue(theme, color, 'solid')}
        isSelected={isSelected}
        textWidth={width}
        textHeight={height}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        onKeyDown={handleKeyDown}
      />
    )
  }
  
  // Selection indicator
  indicator(shape: TLTextShape) {
    const bounds = this.editor.getShapeGeometry(shape).bounds
    return <rect width={bounds.width} height={bounds.height} />
  }
  
  // SVG export
  override toSvg(shape: TLTextShape, ctx: SvgExportContext) {
    // ... export logic
  }
  
  // Resize handling
  override onResize(shape: TLTextShape, info: TLResizeInfo<TLTextShape>) {
    const { scaleX, handle } = info
    
    if (info.mode === 'scale_shape' || (handle !== 'right' && handle !== 'left')) {
      return { ...resizeScaled(shape, info) }
    } else {
      const nextWidth = Math.max(1, Math.abs(initialBounds.width * scaleX))
      return {
        id: shape.id,
        type: shape.type,
        x: newX,
        y: newY,
        props: {
          w: nextWidth / initialShape.props.scale,
          autoSize: false,
        },
      }
    }
  }
  
  // Lifecycle hooks
  override canEdit() { return true }
  override onEditEnd(shape: TLTextShape) {
    const trimmedText = renderPlaintextFromRichText(this.editor, shape.props.richText).trimEnd()
    if (trimmedText.length === 0) {
      this.editor.deleteShapes([shape.id])
    }
  }
  override onBeforeUpdate(prev: TLTextShape, next: TLTextShape) {
    // Auto-sizing logic...
  }
}
```

### 2.2 ShapeUtil Registry

All ShapeUtils are registered in the `Editor` configuration. The editor dynamically calls the appropriate util based on shape type.

## 3. Editor Architecture

### 3.1 Editor Class

The `Editor` class is the central API for all canvas operations:

```ts
class Editor {
  // State access
  getShape(id: TLShapeId): Shape | undefined
  getCurrentPageShapes(): Shape[]
  getSelectedShapes(): Shape[]
  
  // Shape operations
  createShape(shape: Partial<TLShape>): void
  updateShape(id: TLShapeId, partial: Partial<TLShape>): void
  deleteShapes(ids: TLShapeId[]): void
  
  // Selection
  setSelectedShapes(ids: TLShapeId[]): void
  selectAll(): void
  selectNone(): void
  
  // Editing
  setEditingShape(id: TLShapeId | null): void
  getEditingShapeId(): TLShapeId | null
  
  // Camera
  setCamera(camera: Partial<TLCamera>): void
  zoomIn() / zoomOut() / zoomToFit() / resetZoom()
  screenToPage(point: VecLike): Vec
  pageToScreen(point: VecLike): Vec
  
  // Geometry
  getShapeGeometry(shape: TLShape): Geometry2d
  getShapeUtil(shape: TLShape | TLShapeId): ShapeUtil
  
  // History
  undo() / redo() / canUndo() / canRedo()
  
  // and many more...
}
```

###3.2 State Management

tldraw uses a custom `Store` system (similar to a reactive database):

- Shapes, pages, assets, bindings are all "records"
- Changes trigger reactivity (React re-renders)
- History is built-in via transactions
- Migration system for schema evolution

## 4. Asset System

**Location**: `packages/tlschema/src/assets`

```ts
type TLAsset = TLImageAsset | TLVideoAsset | TLBookmarkAsset

type TLImageAsset = {
  id: TLAssetId
  typeName: 'asset'
  type: 'image'
  props: {
    w: number
    h: number
    name: string
    isAnimated: boolean
    mimeType: string | null
    src: string  // blob URL or data URL
  }
  meta: JsonObject
}
```

Image shapes reference assets by `assetId`:

```ts
type TLImageShape = TLBaseShape<'image', {
  assetId: TLAssetId | null
  w: number
  h: number
  crop: BoxModel | null
  flipX: boolean
  flipY: boolean
}>
```

**For zetara**: We can use this exact pattern for PDF pointers. Create an `Asset` with `type: 'pointer-snapshot'` that stores the image + PDF metadata.

## 5. Bindings System

**Location**: `packages/tlschema/src/bindings`

Bindings are SEPARATE records that connect shapes:

```ts
type TLBinding = {
  id: TLBindingId
  typeName: 'binding'
  type: string  // 'arrow' for arrow bindings
  fromId: TLShapeId  // arrow shape
  toId: TLShapeId    // target shape
  props: BindingProps
  meta: JsonObject
}

type TLArrowBinding = TLBinding & {
  type: 'arrow'
  props: {
    terminal: 'start' | 'end'
    normalizedAnchor: VecModel  // { x: 0.5, y: 0.5 } for center
    isExact: boolean
    isPrecise: boolean
  }
}
```

When an arrow is "bound" to a shape, two things exist:
1. The arrow shape with `start: { x, y }` and `end: { x, y }` as regular points
2. Binding records that say "arrow's start is bound to shape X at anchor Y"

The ArrowShapeUtil uses bindings to calculate actual arrow endpoints dynamically.

## 6. Migration System

tldraw has a comprehensive migration system for schema evolution:

```ts
export const textShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions.RemoveJustify,
      up: (props) => {
        if (props.align === 'justify') {
          props.align = 'start'
        }
      },
      down: 'retired',  // Can't go back
    },
    {
      id: Versions.AddTextAlign,
      up: (props) => {
        props.textAlign = props.align
        delete props.align
      },
      down: (props) => {
        props.align = props.textAlign
        delete props.textAlign
      },
    },
    // more migrations...
  ],
})
```

**For zetara**: We'll need a simple migration to convert old `CanvasItem[]` to new `shapes: Record<string, Shape>` format.

## 7. Tools (Not in `editor` package)

Tools are implemented at the `tldraw` package level, not in the core `editor`:

- `SelectTool` - handles selection, dragging, resizing
- `TextTool` - creates text shapes
- `DrawTool` - creates draw shapes
- etc.

Tools use the `StateNode` pattern (state machine):

```ts
class TextTool extends StateNode {
  static id = 'text'
  
  onEnter() {
    // Tool activated
  }
  
  onPointerDown(info: TLPointerEventInfo) {
    // Create text shape
    this.editor.createShape({
      type: 'text',
      x: info.point.x,
      y: info.point.y,
      props: this.editor.getShapeUtil('text').getDefaultProps(),
    })
  }
  
  onExit() {
    // Tool deactivated
  }
}
```

## 8. Key Takeaways for Zetara

### Phase 1: Type System
1. Create `Shape` type as `TLBaseShape<Type, Props>`
2. Define specific shapes: `TextShape`, `RectShape`, `ArrowShape`, `PointerShape`, `ImageShape`
3. Keep all type-specific data in `props`, not in base

### Phase 2: ShapeUtil Pattern
1. Create `ShapeUtil` base class with:
   - `render(shape)` → React component
   - `getGeometry(shape)` → bounds, hit test
   - `getDefaultProps()` → defaults for new shapes
   - `onResize()`, `canEdit()`, etc.
2. Implement one util per shape type
3. Registry: `{ text: TextShapeUtil, rect: RectShapeUtil, ... }`

### Phase 3: Editor Class
1. Central API for all operations
2. Encapsulates state (`shapes: Record<string, Shape>`)
3. Provides helper methods: `createShape`, `updateShape`, `deleteShape`, `setSelection`
4. Camera transforms: `screenToWorld`, `worldToScreen`

### Phase 4: Asset System
1. Separate `assets: Record<string, Asset>` from shapes
2. PDF pointers: Asset with `type: 'pointer-snapshot'`, `meta: { pdfId, page, rect }`
3. User images: Asset with `type: 'image'`
4. PointerShape/ImageShape reference `assetId`

### Phase 5: Bindings (Optional for MVP)
- For advanced arrow-to-shape connections
- Separate `Binding` records
- Can start with simple arrows (point-to-point) and add later

### Phase 6: Tools
- Extract from `CanvasBoard`
- Each tool is a class with `onPointerDown/Move/Up` methods
- Tools call `editor` methods to mutate state
- `CanvasBoard` just delegates to current tool

### Differences from tldraw

**Simplifications for zetara:**
- No complex state machine (StateNode) → simple tool classes
- No elaborate store/history initially → simple React state + occasional snapshots
- No bindings system initially → simple arrows
- No complex geometries → basic shapes only
- No collaborative features

**zetara-specific:**
- PDF pointer asset type
- Navigation to PDF on pointer click
- Paper group node shape (future)

## 9. Recommended Implementation Order

1. **Types** - `Shape`, `Asset`, props interfaces
2. **Editor** (simple version) - state + CRUD methods
3. **ShapeUtil** - pattern + text/rect utils
4. **Refactor CanvasBoard** - delegate to editor + shapeUtils for rendering
5. **Asset system** - migrate pointers to use assets
6. **Tools** - extract SelectTool, TextTool, RectTool
7. **UX polish** - snap, guides, shortcuts
8. **History** - undo/redo via snapshots

This keeps each phase deliverable and testable.
