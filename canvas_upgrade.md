지금 코드 상태는 “잘 만든 프로토타입” 느낌이고, 파워포인트 / tldraw 급으로 끌어올리려면 **UX 스펙을 먼저 고정 → 그걸 뒷받침할 내부 구조를 정리 → 개별 기능(텍스트, 이미지, 화살표, 커넥터)을 다듬는 순서**로 가는 게 좋아요.

아래는 그 방향성 + tldraw가 어떻게 풀고 있는지 정리한 거예요.

---

## 1. 먼저 “완성형 캔버스”의 목표 UX를 명확히

zetara 입장에서 좋은 캔버스는 대략 이런 느낌이면 됩니다:

1. **도구 전환이 직관적**

   * `V`(Select), `T`(Text), `R`(Rect), `O`(Circle), `A`(Arrow), `C`(Connector) 같은 단축키.
   * 툴바 아이콘 hover 시 간단한 설명/단축키도 UI에 보여주기.

2. **조작이 예상 가능한 느낌**

   * 클릭: 선택
   * 드래그: 이동
   * 더블클릭: 텍스트 편집 진입
   * Alt+드래그: 복제
   * Shift: 각도/비율 고정, 정렬 도움
   * Space(또는 중클릭): 손도구(패닝)

3. **텍스트·도형·화살표가 하나의 일관된 시스템**

   * 모두 동일한 “선택/이동/리사이즈/회전” 패턴을 공유.
   * 같은 스타일 패널(선색, 두께, 채우기, 글꼴, 정렬 등)을 공유.

4. **커넥터/화살표가 “지능적으로” 붙어 있음**

   * 노드를 움직이면 화살표가 자동으로 다시 붙고, 앵커 위치가 자연스럽게 이동.
   * 노드를 회전해도 화살표가 어색하게 꼬이지 않게.

5. **이미지(특히 PDF 포인터)와 일반 이미지가 자연스럽게 섞임**

   * 유저 임의 이미지 붙여넣기, 드래그&드랍 → 이미지 노드로 생성.
   * PDF 포인터 스냅샷도 결국 “이미지 + 메타데이터(pdfId, page, rect)”로 취급.
   * 이미지 더블클릭시 확대, 클릭시 PDF 위치로 점프 등.

6. **기본적인 편집 편의 기능**

   * 다중 선택, 그룹/언그룹.
   * 정렬/분배(Smart guides, Snap).
   * Undo/Redo, 복사/붙여넣기(캔버스 안에서 + 논문 간).

지금 코드도 기본적인 것들은 거의 다 들어가 있어요. 문제는 **“각 기능이 제각각 구현되어 있어서 전체적인 일관성과 손맛이 부족한 것”**이라서, 구조화가 핵심입니다.

---

## 2. tldraw가 취하는 큰 구조 – 이걸 축소판으로 가져오면 좋음

tldraw는 “도형 + 툴 + 에디터(스토어)” 구조를 아주 깔끔하게 잡아놓습니다.([tldraw.dev][1])

### 2-1. 모든 오브젝트는 “Shape(JSON)” 하나로 수렴

tldraw에서는 **모든 캔버스 요소를 `shape`라는 JSON 객체**로 표현해요. 예:

```ts
type ShapeBase = {
  id: string
  type: 'text' | 'rect' | 'arrow' | 'image' | 'pointer' | ...
  x: number
  y: number
  rotation?: number
  opacity?: number
  // ...
}

type TextShape = ShapeBase & {
  type: 'text'
  props: {
    text: string
    fontSize: number
    color: string
  }
}

type ImageShape = ShapeBase & {
  type: 'image'
  props: {
    assetId: string
    w: number
    h: number
  }
}

type ArrowShape = ShapeBase & {
  type: 'arrow'
  props: {
    start: { type: 'point' | 'shape'; shapeId?: string }
    end: { type: 'point' | 'shape'; shapeId?: string }
    bend: number
  }
}
```

**핵심 포인트**

* **CanvasItem/ConnectorItem를 한 단계 더 일반화해서 “Shape”라는 공통 타입으로 묶기.**
* 각 타입별 추가 정보는 `props` 안에만 담기 (PDF 포인터 메타데이터도 마찬가지로 `props`에).
* 이렇게 해야 **저장/백업/내보내기 형식이 단순**해지고, 캔버스·논문 그룹·다른 뷰에서 재사용하기 쉬워집니다.

tldraw도 `TLBaseShape<'card', { w: number; h: number; text: string }>` 이런 식으로, type + props 구조를 강제하죠.([tldraw.dev][1])

---

### 2-2. ShapeUtil: 도형별 로직을 한곳에

tldraw는 `ShapeUtil`이라는 클래스로 도형별 로직을 묶습니다.([tldraw.dev][1])

* `component(shape)` – React 컴포넌트 렌더링
* `getGeometry(shape)` – hit test / boundary box 계산
* `onResize`, `onTranslate` 등 – 조작 시 동작 정의
* `indicator(shape)` – 선택 테두리 등

zetara에서도 굳이 클래스로 안 가도 되지만, 구조는 비슷하게 만드는 걸 추천:

```ts
type ShapeUtil<T extends Shape> = {
  render: (shape: T) => React.ReactNode       // 실제 렌더링
  getBounds: (shape: T) => { x: number; y: number; w: number; h: number }
  hitTest: (shape: T, point: Vec2) => boolean
  // optional: onResize / onDoubleClick / onClick 등
}

const shapeUtils = {
  text: textShapeUtil,
  rect: rectShapeUtil,
  arrow: arrowShapeUtil,
  image: imageShapeUtil,
  pointer: pointerShapeUtil,
}
```

이렇게 하면:

* `CanvasBoard`는 **“모든 shape를 그냥 렌더하고, 이벤트를 Editor/ShapeUtil에 던지는 역할만”** 하게 되어서 깔끔해집니다.
* 나중에 논문 그룹용 “PaperNodeShape” 추가할 때도 shapeUtils에만 추가하면 됨.

---

### 2-3. Tool 시스템: 툴 = 작은 상태머신

tldraw는 각 도구(Select, Draw, Text 등)를 **작은 state machine**으로 구현합니다.([tldraw.dev][2])

우리도 지금 `currentTool` state는 이미 있으니, 구조만 정리해주면 됩니다:

```ts
type ToolId = 'select' | 'text' | 'rect' | 'circle' | 'arrow' | 'connector'

type Tool = {
  onPointerDown: (info, editor) => void
  onPointerMove: (info, editor) => void
  onPointerUp: (info, editor) => void
  onKeyDown?: (e, editor) => void
}
```

* `Editor`는 “도형 생성/수정/삭제/선택/히스토리” API를 가진 상태 관리자.
* `CanvasBoard`는 `onMouseDown/Move/Up`에서 현재 툴에게 이벤트를 넘김.
* 툴은 Editor를 사용해 `editor.createShape`, `editor.updateShape`, `editor.setSelection` 등을 호출.

지금은 `CanvasBoard` 안에서 모든 로직이 섞여 있어서, 기능이 늘어날수록 스파게티로 가기 쉽습니다.
**툴별 파일 분리**(예: `SelectTool.ts`, `TextTool.ts`, `ConnectorTool.ts`)만 해도 코드 품질이 확 올라가요.

---

### 2-4. Editor/Store: undo/redo + 직렬화의 중심

tldraw는 `Editor`가 내부적으로 store(문서/페이지/shape/asset)를 가지고 있고, 모든 조작은 **operation** 단위로 쌓아서 undo/redo 합니다.([GitHub][3])

zetara도:

* `items` state를 React 컴포넌트 안에 두기보다는,
* `useCanvasStore(paperId)` 같은 훅으로 **Stroage + Undo/Redo + Autosave**를 한 곳에 모으는 걸 추천.

간단히:

```ts
type CanvasState = {
  shapes: Record<string, Shape>
  selectedIds: string[]
  camera: { x: number; y: number; zoom: number }
  history: { past: CanvasState[]; future: CanvasState[] }
}
```

지금 IndexedDB에 `elements: JSON.stringify(items)`로 저장하는 구조는 그대로 두되,
캔버스 컴포넌트에서는 store만 바라보게 만드는 게 좋습니다.

---

## 3. 이미지 / 텍스트 / 화살표를 “제대로” 만드는 방법

### 3-1. 사용자 정의 이미지 & PDF 포인터: Asset 시스템으로 통일

tldraw는 이미지·비디오 등 외부 리소스를 shape에서 직접 들고 있지 않고, **Asset store**에 분리해서 관리합니다.([tldraw.dev][4])

이 패턴을 그대로 가져오면 좋아요:

1. `assets` 테이블(or 배열) 추가

   ```ts
   type Asset = {
     id: string
     type: 'image' | 'pointer-image'
     src: string  // blob url or data url
     meta?: {
       pdfId?: number
       page?: number
       rect?: { x: number; y: number; w: number; h: number }
     }
   }
   ```

2. `ImageShape` / `PointerShape`는 `assetId`만 참조

   ```ts
   type ImageShape = ShapeBase & {
     type: 'image'
     props: { assetId: string; w: number; h: number }
   }

   type PointerShape = ShapeBase & {
     type: 'pointer'
     props: { assetId: string }
   }
   ```

3. 붙여넣기/드래그&드랍 흐름

   * `paste`/`drop` 이벤트에서 `File`/Clipboard Data 읽기 → Asset 생성 → ImageShape 생성.
   * PDF에서 영역 캡처 → Asset(type='pointer-image', meta에 pdf 정보) 생성 → PointerShape 생성.
   * PointerShape 클릭 시 `asset.meta`를 보고 `setSelectedPaperId`, `setNavigationTarget` 호출.

이렇게 하면:

* 나중에 “논문 그룹 캔버스에서 해당 pointer를 복사 → 개별 논문 캔버스에도 붙여넣기” 같은 것도 자연스럽게 됩니다.
* 백업/내보내기에서도 `shapes + assets` 두 덩어리만 내보내면 끝.

---

### 3-2. 텍스트 상자: “편집 상태”를 도형 시스템에 흡수

지금 코드는 `editingTextId`에 따라 textarea `pointerEvents`를 껐다 켰다 하는데, 이게 UX를 조금 어색하게 만들 수 있어요.

tldraw는 텍스트 도형을 더블클릭하면 “텍스트 편집 모드”로 전환하고, 그 상태에서만 키보드를 shape 텍스트에 바인딩합니다.([tldraw.dev][1])

추천 패턴:

* 도형 레벨에서:

  * `TextShapeUtil`의 `onDoubleClick`에서 `editor.setEditingId(shape.id)` 호출.
* UI 레벨에서:

  * editing 상태일 때만 `textarea` 렌더 + autoFocus.
  * esc / enter 시 편집 종료 (enter는 줄바꿈 vs 종료를 옵션으로).

또 하나, UX 레벨에서 중요한 점:

* **“텍스트 도형”과 “텍스트가 들어간 도형(사각형+텍스트)”를 나누기**

  * Text Tool: 바로 텍스트만 있는 shape 생성.
  * Rect/Circle 등은 내부 텍스트를 옵션으로 (지금은 필요 없다면 나중에).

---

### 3-3. 화살표 & 커넥터: “바인딩”과 “지오메트리”

tldraw의 화살표는 단순히 `(x1, y1) -> (x2, y2)`가 아니라:

* 시작/끝이 다른 shape에 “바인딩(binding)” 되어 있고,([tldraw.dev][1])
* 각 shape의 경계(geometry)를 계산해서 “어디에 붙을지” 자동으로 결정합니다.

zetara에서도:

1. 화살표 shape 구조를 조금 바꾸기

   ```ts
   type ArrowShape = ShapeBase & {
     type: 'arrow'
     props: {
       from: { shapeId?: string; anchor?: ConnectionAnchor; x?: number; y?: number }
       to:   { shapeId?: string; anchor?: ConnectionAnchor; x?: number; y?: number }
       bend: number
       strokeWidth: number
       color: string
     }
   }
   ```

2. `ArrowShapeUtil.getGeometry`에서:

   * from/to가 shape를 가리키면 `getAnchorPosition(targetShape, anchor)`를 사용해 실제 좌표 계산.
   * 직접 포인트(자유 화살표)일 때는 그대로 사용.

3. 바인딩/앵커 UI

   * 이미 구현하신 `ANCHOR_POSITIONS`, `getAnchorPosition`, `hoveredAnchor`는 매우 좋은 출발점.
   * 다만 **“커넥터 모드일 때만 앵커가 보인다”**는 규칙과
   * 앵커를 클릭할 때마다 `ArrowShape.props.from/to`를 채우는 식으로 툴 로직을 정리하면 깔끔합니다.

tldraw의 좋은 점은 **도형 회전/리사이즈 시 화살표가 자연스럽게 보정**된다는 건데, 이것도 `getGeometry`/`getBounds` 기반으로 연결되어 있어요. zetara도 shapeUtil 레벨에서 좌표계/회전을 한번에 처리하게 만들면 이런 디테일을 따라가기 좋습니다.

---

## 4. 상호작용·손맛 개선을 위한 디테일

지금 `CanvasBoard`를 기준으로 바로 적용할 수 있는 개선 포인트들입니다.

### 4-1. 이벤트 구조 리팩터링

현재:

* container의 `onMouseDown`에서 item hit-test까지 다 하고 있음.
* 각 item div의 `onMouseDown`은 사실상 비어 있음.

추천:

* **container는 “빈 공간”과 관련된 인터랙션만 담당**

  * 배경 클릭 → 선택 해제
  * Space/Alt+드래그 → 패닝
  * 휠 → 줌/패닝
* shape 컴포넌트는 자기 이벤트를 직접 처리

  * `onMouseDown` → `editor.setSelection(id)` + Drag 시작
  * `onDoubleClick` → 편집 모드 진입 (텍스트, 커넥터 등)

이렇게 하면 hit-test 로직도 대부분 shapeUtil로 옮길 수 있고, container 코드가 가벼워집니다.

---

### 4-2. 스냅 및 정렬 가이드

tldraw가 주는 “고급스럽다”는 느낌 대부분은 **스냅/가이드**에서 옵니다.([tldraw.dev][5])

기본 스펙:

* Grid Snap: 이미 배경 그리드를 쓰고 계시니, 드래그/리사이즈 시 `step` 단위로 좌표를 스냅.
* Object Snap:

  * 다른 도형의 center/edge에 가까우면 x/y 축만 스냅.
  * 스냅이 일어나면 보조선(guide line)을 얇게 표시.

구현 아이디어:

* 드래그 중인 shape의 임시 위치를 계산할 때,
  다른 shape들의 `getBounds`를 훑어보면서
  `|myCenterX - otherCenterX| < threshold` 같은 조건으로 보정.

퍼포먼스는 초기에 도형 수가 많지 않을 것이므로 직관적인 O(n²)에서도 버텨질 가능성이 큽니다.

---

### 4-3. 카메라(패닝/줌) UX

이미 offset/scale 구현은 잘 되어 있어요. 살짝 다듬으면:

* Space 누르고 드래그 → 손도구 (중클릭/Alt와 같이 쓰거나 교체).
* 줌 기준점: 현재는 휠 위치 기준으로 줌이 안 맞을 가능성 있음.
  tldraw는 휠 포인터 위치를 기준으로 줌 pivot을 맞추도록 하고, 이를 위해 **캔버스 좌표계 ↔ 화면 좌표계 변환**을 일관되게 관리합니다.([tldraw.dev][6])

수식 관점에서:

```ts
// screen -> world
worldX = (clientX - rect.left - offset.x) / scale
worldY = (clientY - rect.top - offset.y) / scale
```

줌 변경 시:

1. 현재 마우스 위치(worldX, worldY)를 구해 두고
2. scale 변경 후, 같은 world 좌표가 같은 screen 위치에 남도록 offset 보정

이 과정을 한 번만 정리해두면 줌이 매우 자연스러워집니다.

---

### 4-4. 키보드/단축키 시스템

좋은 캔버스는 키보드가 자연스럽게 먹어야 합니다.

* Delete/Backspace → 삭제 (이미 있음)
* Ctrl/Cmd + A → 전체 선택
* Ctrl/Cmd + D or Alt+Drag → 복제
* Ctrl/Cmd + Z / Shift+Z → undo/redo (Editor에 history 붙이면 자연스럽게 가능)
* 방향키 → nudge 이동, Shift+방향키 → 큰 이동
* ESC → 편집 모드 취소 / 선택 해제

지금은 전역 `keydown`에서 삭제만 처리하고 있는데,
**“현재 포커스가 캔버스인지”** 판단하는 레이어를 하나 두고, 그 안에서만 단축키를 처리하면 다른 입력창과의 충돌을 줄일 수 있습니다.

---

## 5. zetara 맥락에서의 단계별 로드맵

실제 적용 순서로 정리해보면:

### 1단계 – 모델/스토어 정리

* `CanvasItem`/`ConnectorItem` → `Shape` + `props` 구조로 재정의.
* `items` → `shapes: Record<string, Shape>` 형태로 변경.
* IndexedDB 저장 포맷도 `shapes + assets`로 앞으로 확장 가능하게 살짝 정리.

### 2단계 – Tool / ShapeUtil 분리

* `CanvasBoard`에서 툴 로직을 `tools/SelectTool.ts`, `tools/TextTool.ts`, `tools/ConnectorTool.ts` 등으로 분리.
* shape별 렌더링/히트테스트를 `shapeUtils`로 분리.
* `CanvasBoard`는 정말로 **렌더 + camera + 이벤트 라우팅**만 담당하도록 다이어트.

### 3단계 – 이미지 & PDF 포인터를 Asset 시스템으로 통합

* 현재 `pointer` item이 직접 `image`, `pdfId`, `page`, `rect`를 들고 있는데,

  * 이걸 `asset`으로 분리하고
  * Image/Poi nter shape는 `assetId`만 들도록.
* 유저 드래그&드랍/붙여넣기 시 일반 이미지도 같은 흐름으로 처리.

### 4단계 – 텍스트/도형/화살표 UX 정교화

* 텍스트 편집 모드 개선 (더블클릭 → 편집, ESC/blur → 종료).
* 화살표/커넥터의 from/to 구조를 고도화해서,

  * 도형 이동/리사이즈 시 자연스럽게 재계산.
* 스냅/가이드 최소 버전 도입.

### 5단계 – 논문 그룹 캔버스 재사용

* 논문 그룹은 “PaperNodeShape + ArrowShape + 일반 도형”의 또 다른 캔버스일 뿐이므로,
* 지금 만든 캔버스 엔진을 그대로 이용하고,
* PaperNodeShape의 `props`에 `paperId`, `previewThumbAssetId` 등을 넣어서 구현.

---

## 6. tldraw에서 참고하기 좋은 문서/예시

마지막으로, 직접 라이브러리를 쓰지 않더라도 **아키텍처 아이디어를 훔쳐오기 좋은** tldraw 문서들:

* **Shapes & ShapeUtil 구조**: 기본 shape 데이터 모델과 ShapeUtil 개념 설명([tldraw.dev][1])
* **Custom shape + custom tool 예시**: 도형과 도구를 분리하는 방법([tldraw.dev][2])
* **Custom asset & content management**: 붙여넣기/이미지/에셋 스토어 설계 아이디어([tldraw.dev][4])
* **Drawing & canvas interactions**: 줌/패닝/스냅 등 상호작용 관련 개략적인 설계 포인트([tldraw.dev][5])

---

요약하면:

* 지금 구현한 방식(HTML div + SVG + React state)은 방향 자체는 이미 좋고,
* **“도형/툴/스토어”를 분리해서 구조화 + 이미지/포인터를 asset 시스템으로 통합 + 스냅·카메라·단축키 디테일**만 잡아주면
* 파워포인트·tldraw 같은 “고급스럽고 자연스러운 캔버스”에 꽤 가깝게 갈 수 있습니다.

[1]: https://tldraw.dev/docs/shapes?utm_source=chatgpt.com "Shapes • tldraw Docs"
[2]: https://tldraw.dev/examples/custom-config?utm_source=chatgpt.com "Custom shape and tool"
[3]: https://github.com/tldraw/tldraw?utm_source=chatgpt.com "tldraw/tldraw: very good whiteboard SDK / infinite canvas ..."
[4]: https://tldraw.dev/features/customization/custom-asset-and-content-management?utm_source=chatgpt.com "Custom asset and content management"
[5]: https://tldraw.dev/features/composable-primitives/drawing-and-canvas-interactions?utm_source=chatgpt.com "Drawing and canvas interactions"
[6]: https://tldraw.dev/examples/image-annotator?utm_source=chatgpt.com "Image annotator"

===

https://github.com/tldraw/tldraw