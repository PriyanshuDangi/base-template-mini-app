# SmashKarts Game Architecture

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Component Architecture](#component-architecture)
4. [Data Structures](#data-structures)
5. [State Management](#state-management)
6. [Data Flow](#data-flow)
7. [Rendering Pipeline](#rendering-pipeline)
8. [Event System](#event-system)
9. [Module Dependencies](#module-dependencies)
10. [Performance Architecture](#performance-architecture)
11. [Mobile Responsiveness](#mobile-responsiveness)
12. [Next.js Integration](#nextjs-integration)
13. [Security & Validation](#security--validation)
14. [Future Architecture Considerations](#future-architecture-considerations)

---

## System Overview

SmashKarts is a real-time, browser-based combat racing game built as a Farcaster mini-app. The architecture follows a component-based design using React for UI management and HTML5 Canvas for high-performance 2D rendering.

```
┌─────────────────────────────────────────────────────────┐
│                    Farcaster Mini App                    │
├─────────────────────────────────────────────────────────┤
│                      Next.js App                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              React Component Layer                │  │
│  │  ├─ App.tsx (Entry Point)                        │  │
│  │  ├─ Providers (Wagmi, MiniApp)                   │  │
│  │  └─ SmashKarts.tsx (Game Component)              │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Game Engine Layer                    │  │
│  │  ├─ Physics Engine (Movement, Collision)         │  │
│  │  ├─ AI System (Bot Logic)                        │  │
│  │  ├─ Combat System (Shooting, Damage)             │  │
│  │  └─ Render Engine (Canvas 2D)                    │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Browser APIs                         │  │
│  │  ├─ Canvas 2D Context                            │  │
│  │  ├─ RequestAnimationFrame                        │  │
│  │  └─ Keyboard Events                              │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Framework
- **Next.js 15** - React framework with SSR/SSG capabilities
- **React 19** - UI component library
- **TypeScript** - Type-safe development

### Rendering
- **HTML5 Canvas API** - 2D graphics rendering
- **RequestAnimationFrame** - 60 FPS game loop

### State Management
- **React Hooks** - useState, useRef, useEffect
- **Refs** - High-frequency state without re-renders

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Custom CSS Variables** - Theme-based colors

### Integration
- **@neynar/react** - Farcaster integration
- **Wagmi** - Ethereum wallet connection
- **@farcaster/frame-sdk** - Frame SDK integration

---

## Component Architecture

### Component Hierarchy

```
App (app.tsx)
  └─ Providers (providers.tsx)
      ├─ WagmiProvider
      └─ MiniAppProvider
          └─ SmashKarts (SmashKarts.tsx)
              ├─ Menu Screen
              ├─ Game Canvas
              └─ GameOver Screen
```

### Component Responsibilities

#### **App.tsx**
- **Purpose:** Entry point and component loader
- **Responsibilities:**
  - Dynamic import of SmashKarts with SSR disabled
  - Provides app-level configuration
- **Dependencies:** Next.js dynamic imports

#### **Providers.tsx**
- **Purpose:** Context providers for the application
- **Responsibilities:**
  - Wallet connection (Wagmi)
  - Farcaster integration (MiniApp)
  - Analytics setup
- **Dependencies:** @neynar/react, wagmi

#### **SmashKarts.tsx**
- **Purpose:** Main game component
- **Responsibilities:**
  - Game state management
  - Canvas rendering
  - Physics calculations
  - AI logic
  - User input handling
  - UI rendering (menu, HUD, game over)
- **Dependencies:** React hooks, Canvas API

---

## Data Structures

### Core Entities

#### **Car Entity**
```typescript
interface Car {
  // Position
  x: number;              // X coordinate (0-800)
  y: number;              // Y coordinate (0-600)
  angle: number;          // Rotation in radians (0-2π)
  
  // Physics
  speed: number;          // Current velocity (-2.5 to 5)
  
  // Status
  health: number;         // HP (0-100)
  score: number;          // Kill count
  
  // Meta
  color: string;          // HEX color code
  isPlayer: boolean;      // Player vs AI flag
  name: string;           // Display name
}
```

**Memory Layout:**
- Size: ~80 bytes per car
- Count: 4 cars (1 player + 3 AI)
- Total: ~320 bytes

#### **Bullet Entity**
```typescript
interface Bullet {
  // Position
  x: number;              // X coordinate
  y: number;              // Y coordinate
  
  // Velocity
  vx: number;             // X velocity component
  vy: number;             // Y velocity component
  
  // Meta
  owner: number;          // Car index that fired
  color: string;          // Owner's color
}
```

**Memory Layout:**
- Size: ~48 bytes per bullet
- Max Count: ~20 bullets on screen
- Total: ~960 bytes max

### Supporting Structures

#### **Input State**
```typescript
interface KeyState {
  [key: string]: boolean;  // Key -> pressed state mapping
}

interface TouchControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
}
```

**Tracked Keys:**
- Movement: 'w', 's', 'a', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
- Action: ' ' (space)

**Touch Controls (Mobile):**
- D-pad buttons for movement and turning
- Fire button for shooting

#### **Game Configuration**
```typescript
// Constants (compile-time)
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const CAR_SIZE = 30;
const BULLET_SIZE = 5;
const BULLET_SPEED = 8;
const MAX_SPEED = 5;
const ACCELERATION = 0.3;
const FRICTION = 0.95;
const TURN_SPEED = 0.08;
const SHOOT_COOLDOWN = 300;
```

---

## State Management

### State Architecture

```
┌─────────────────────────────────────────────────┐
│             React State (useState)               │
│  - Triggers re-renders on change                │
│  - Used for UI state only                       │
├─────────────────────────────────────────────────┤
│  • gameState: "menu" | "playing" | "gameover"   │
│  • winner: string                                │
│  • mounted: boolean                              │
│  • isMobile: boolean                             │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              React Refs (useRef)                 │
│  - No re-renders on change                      │
│  - Used for high-frequency game state           │
├─────────────────────────────────────────────────┤
│  • carsRef: Car[]                                │
│  • bulletsRef: Bullet[]                          │
│  • keysRef: KeyState                             │
│  • touchControlsRef: TouchControls               │
│  • lastShotRef: number (timestamp)               │
│  • animationIdRef: number (RAF ID)               │
│  • canvasRef: HTMLCanvasElement                  │
└─────────────────────────────────────────────────┘
```

### State Update Patterns

#### **UI State (Re-render required)**
```typescript
// Menu → Playing transition
const startGame = () => {
  initGame();                    // Initialize game state
  setGameState("playing");       // Trigger re-render
};
```

#### **Game State (No re-render)**
```typescript
// High-frequency updates (60 FPS)
const updateCar = () => {
  carsRef.current[0].x += velocity;  // Direct mutation
  // No re-render triggered
};
```

### State Lifecycle

```
Initialization → Playing → Cleanup
     │              │          │
     ▼              ▼          ▼
  initGame()   gameLoop()   cleanup()
     │              │          │
  Setup cars    Update       Remove
  Setup bullets  Render      listeners
  Reset state   Collisions   Cancel RAF
```

---

## Data Flow

### Input → Processing → Output Flow

```
┌──────────────────────────────┐
│ User Input                   │
│ • Keyboard (Desktop)         │
│ • Touch Controls (Mobile)    │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Event Handlers               │
│ • keydown → keysRef[key] = T │
│ • keyup → keysRef[key] = F   │
│ • touchstart → controls = T  │
│ • touchend → controls = F    │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Game Loop (60 FPS)           │
│ ┌──────────────────────────┐ │
│ │ 1. Process Input         │ │
│ │ 2. Update Physics        │ │
│ │ 3. Update AI             │ │
│ │ 4. Update Bullets        │ │
│ │ 5. Check Collisions      │ │
│ │ 6. Check Win Conditions  │ │
│ └──────────────────────────┘ │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Rendering Pipeline           │
│ • Clear canvas               │
│ • Draw background            │
│ • Draw entities              │
│ • Draw UI                    │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────┐
│ Display      │
│ (Canvas)     │
└──────────────┘
```

### System Communication

```
┌─────────────┐         ┌──────────────┐
│   Physics   │────────▶│  Collision   │
│   Engine    │         │  Detection   │
└─────────────┘         └──────┬───────┘
       │                       │
       │                       ▼
       │                ┌──────────────┐
       │                │   Combat     │
       │                │   System     │
       │                └──────┬───────┘
       │                       │
       ▼                       ▼
┌─────────────┐         ┌──────────────┐
│  AI System  │────────▶│  Game State  │
└─────────────┘         └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Renderer   │
                        └──────────────┘
```

---

## Rendering Pipeline

### Frame Rendering Sequence

```
Frame Start (requestAnimationFrame)
  │
  ├─ 1. Clear Canvas (fillRect)
  │    └─ Fill background color
  │
  ├─ 2. Draw Grid
  │    └─ Draw reference lines
  │
  ├─ 3. Update Game State
  │    ├─ Process player input
  │    ├─ Update car positions
  │    ├─ Update bullet positions
  │    ├─ Check collisions
  │    └─ Update AI logic
  │
  ├─ 4. Draw Bullets
  │    └─ For each bullet: arc()
  │
  ├─ 5. Draw Cars
  │    ├─ For each car:
  │    │   ├─ Save context
  │    │   ├─ Translate to position
  │    │   ├─ Rotate to angle
  │    │   ├─ Draw car body
  │    │   ├─ Draw direction indicator
  │    │   ├─ Restore context
  │    │   ├─ Draw health bar
  │    │   └─ Draw name
  │
  ├─ 6. Draw UI Overlay
  │    ├─ Draw scoreboard
  │    └─ Draw controls hint
  │
  ├─ 7. Check Win Condition
  │    └─ If game over: stop loop
  │
  └─ 8. Schedule Next Frame
       └─ requestAnimationFrame(gameLoop)
```

### Canvas Context Operations

```typescript
// Efficient rendering pattern
ctx.save();                              // Save state
ctx.translate(car.x, car.y);            // Move origin
ctx.rotate(car.angle);                  // Rotate
ctx.fillRect(-w/2, -h/2, w, h);        // Draw centered
ctx.restore();                          // Restore state
```

**Performance Considerations:**
- Save/restore minimizes state management
- Translation/rotation for easier car rendering
- Batch operations where possible
- No DOM manipulation during render

---

## Event System

### Event Flow

```
Browser Event
    │
    ├─ addEventListener
    │     │
    │     ▼
    ├─ Event Handler
    │     │
    │     ├─ keydown → Update keysRef
    │     ├─ keyup → Update keysRef
    │     └─ preventDefault (space)
    │
    └─ Game Loop reads keysRef
          │
          └─ Apply actions
```

### Event Handlers

#### **Input Events**
```typescript
// Keyboard Events (Desktop)
useEffect(() => {
  // Setup
  const handleKeyDown = (e: KeyboardEvent) => {
    keysRef.current[e.key] = true;
    if (e.key === ' ') e.preventDefault();
  };
  
  const handleKeyUp = (e: KeyboardEvent) => {
    keysRef.current[e.key] = false;
  };
  
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  // Cleanup
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}, [gameState]);

// Touch Events (Mobile)
// Handled via button event handlers:
// onTouchStart={() => touchControlsRef.current.forward = true}
// onTouchEnd={() => touchControlsRef.current.forward = false}
```

#### **Animation Loop**
```typescript
useEffect(() => {
  if (gameState !== "playing") return;
  
  // Start loop
  animationIdRef.current = requestAnimationFrame(gameLoop);
  
  // Cleanup
  return () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
  };
}, [gameState]);
```

---

## Module Dependencies

### Dependency Graph

```
SmashKarts.tsx
  ├─ react
  │   ├─ useEffect
  │   ├─ useRef
  │   └─ useState
  │
  ├─ Browser APIs
  │   ├─ HTMLCanvasElement
  │   ├─ CanvasRenderingContext2D
  │   ├─ requestAnimationFrame
  │   ├─ cancelAnimationFrame
  │   └─ KeyboardEvent
  │
  └─ TypeScript Interfaces
      ├─ Car
      └─ Bullet

App.tsx
  ├─ next/dynamic
  ├─ ~/lib/constants
  └─ ~/components/SmashKarts

Providers.tsx
  ├─ @neynar/react (MiniAppProvider)
  ├─ ~/components/providers/WagmiProvider
  └─ react
```

### External Dependencies

| Package | Purpose | Usage |
|---------|---------|-------|
| `react` | UI framework | Component structure, hooks |
| `next` | App framework | SSR, routing, optimization |
| `typescript` | Type safety | Interfaces, type checking |
| `@neynar/react` | Farcaster | Mini-app integration |
| `wagmi` | Ethereum | Wallet connection |

### Internal Dependencies

| Module | Exports | Used By |
|--------|---------|---------|
| `SmashKarts.tsx` | SmashKarts component | App.tsx |
| `app.tsx` | App component | page.tsx |
| `providers.tsx` | Providers component | layout.tsx |
| `constants.ts` | App configuration | Multiple |

---

## Performance Architecture

### Optimization Strategies

#### **1. Rendering Optimization**

```
Separation of Concerns:
┌─────────────────┐
│ UI State (React)│ ← Infrequent updates (menu, game over)
└─────────────────┘
┌─────────────────┐
│ Game State(Refs)│ ← High-frequency updates (60 FPS)
└─────────────────┘
```

**Benefits:**
- React only re-renders on state transitions
- Game loop mutates refs without triggering renders
- UI and game loop are decoupled

#### **2. Memory Management**

```
Fixed-size Arrays:
• cars: [4 elements] → 320 bytes
• bullets: [~20 elements] → 960 bytes
• keys: [~10 entries] → 160 bytes
─────────────────────────────────
Total game state: ~1.5 KB
```

**Garbage Collection:**
- Bullets removed when out of bounds
- No new object allocation in game loop
- Reuse existing arrays

#### **3. Computation Optimization**

```typescript
// Distance check (cheap)
const dx = b.x - c.x;
const dy = b.y - c.y;
const distSquared = dx * dx + dy * dy;

// Only sqrt if needed
if (distSquared < RADIUS * RADIUS) {
  const dist = Math.sqrt(distSquared);
  // Collision logic
}
```

#### **4. Frame Budget**

```
60 FPS = 16.67ms per frame

Breakdown:
├─ Input processing: ~0.1ms
├─ Physics update: ~1ms
├─ AI logic: ~2ms
├─ Collision detection: ~1ms
├─ Rendering: ~5ms
└─ Browser overhead: ~7ms
──────────────────────────────
Total: ~16ms (within budget)
```

### Scalability Considerations

#### **Current Limits**
- **Cars:** 4 (1 player + 3 AI)
- **Bullets:** ~20 concurrent
- **Canvas:** 800x600 (480,000 pixels)
- **Frame rate:** 60 FPS target

#### **Scaling Possibilities**
- **More cars:** Linear complexity (O(n))
- **Collision checks:** O(n×m) where n=cars, m=bullets
- **Larger canvas:** GPU-limited (minimal impact)

---

## Mobile Responsiveness

### Responsive Design Strategy

The game implements a mobile-first responsive design that adapts to different screen sizes and input methods.

#### **Device Detection**
```typescript
useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

#### **Canvas Scaling**
```typescript
// Canvas maintains aspect ratio while fitting screen
<canvas
  width={CANVAS_WIDTH}
  height={CANVAS_HEIGHT}
  style={{
    maxHeight: isMobile ? '50vh' : '80vh',
    width: 'auto',
    height: 'auto',
  }}
/>
```

### Mobile Controls

#### **Touch Control Layout**
```
┌─────────────────────────────────────┐
│         Game Canvas (50vh)          │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  D-Pad (Left)      Fire (Right)     │
│     ▲                  🔫           │
│   ◀ ▼ ▶                             │
└─────────────────────────────────────┘
```

#### **Control Features**
- **D-Pad Controls:**
  - 4-directional buttons (▲ ▼ ◀ ▶)
  - Positioned bottom-left
  - 56px × 56px buttons with 160px container
  - Semi-transparent background (80% opacity)

- **Fire Button:**
  - Circular button (80px diameter)
  - Positioned bottom-right
  - Red/destructive color scheme
  - Gun emoji indicator (🔫)

- **Touch Handling:**
  - `onTouchStart` - Activate control
  - `onTouchEnd` - Deactivate control
  - `onMouseDown/Up` - Desktop testing support
  - Prevents default touch behaviors

#### **Responsive UI Elements**

| Element | Mobile | Desktop |
|---------|--------|---------|
| Title | `text-3xl` | `text-5xl` |
| Buttons | Full width | Auto width |
| Padding | `p-2` | `p-4` |
| Canvas Border | `border-2` | `border-4` |
| Controls | Touch buttons | Keyboard |

### Accessibility

- **Active States:** `active:scale-95` for touch feedback
- **Pointer Events:** Proper event handling for touch and mouse
- **Visual Feedback:** Button press animations
- **Responsive Text:** Scales with viewport using Tailwind breakpoints

---

## Next.js Integration

### Hydration Strategy

```typescript
// Client-side only rendering
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return <div>Loading...</div>;
}

return <GameComponent />;
```

**Purpose:** Prevents hydration mismatch errors by ensuring the component only renders on the client after mount.

### Dynamic Import Pattern

```typescript
// app.tsx
const SmashKarts = dynamic(
  () => import("~/components/SmashKarts"),
  { ssr: false }
);
```

**Benefits:**
- No server-side rendering of game component
- Reduced initial bundle size
- Canvas API only runs client-side

---

## Security & Validation

### Input Validation
- **Keyboard events:** Browser-sanitized
- **Key state:** Boolean values only
- **User actions:** Rate-limited by cooldowns

### State Integrity
- **Health:** Clamped to [0, 100]
- **Speed:** Clamped to [-2.5, 5]
- **Position:** Wrapped to canvas bounds
- **Bullets:** Owner validation before damage

### Next.js Security
- **CSP headers:** Content Security Policy enabled
- **XSS protection:** React auto-escaping
- **Type safety:** TypeScript validation

---

## Future Architecture Considerations

### Potential Enhancements

#### **1. Multiplayer Architecture**
```
Client (Browser) ←→ WebSocket ←→ Game Server
     │                             │
     └─ Send inputs                └─ Authoritative state
     └─ Predict locally            └─ Broadcast updates
     └─ Reconcile state            └─ Resolve conflicts
```

#### **2. Blockchain Integration**
```
Game Client
     │
     ├─ Smart Contract (Base)
     │     ├─ NFT Cars
     │     ├─ Token Rewards
     │     └─ Leaderboard
     │
     └─ IPFS Storage
           └─ Game Assets
```

#### **3. State Management Evolution**
```
Current: React State + Refs
Future: Redux Toolkit or Zustand
    │
    ├─ Time-travel debugging
    ├─ State persistence
    └─ Better dev tools
```

---

## Conclusion

The SmashKarts architecture follows a clean separation between UI state (React) and game state (Refs), enabling high-performance 60 FPS gameplay while maintaining React's declarative paradigm. The modular design allows for easy extension with new features, game modes, and blockchain integrations.

### Key Architectural Strengths

✅ **Performance:** Optimized rendering and state management  
✅ **Maintainability:** Clear separation of concerns  
✅ **Scalability:** Modular design supports growth  
✅ **Type Safety:** Full TypeScript coverage  
✅ **Browser Compatibility:** Standard Web APIs  
✅ **Mobile Responsive:** Touch controls and adaptive UI  
✅ **Cross-Platform:** Works on desktop and mobile devices  

### Design Patterns Used

- **Component Pattern:** React component hierarchy
- **Observer Pattern:** Event listeners and state updates
- **State Pattern:** Game state machine (menu/playing/gameover)
- **Strategy Pattern:** AI behavior strategies
- **Object Pool:** Bullet management (implicit)

For implementation details, see [GAME_LOGIC.md](./GAME_LOGIC.md).

