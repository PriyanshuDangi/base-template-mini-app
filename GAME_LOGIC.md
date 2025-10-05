# SmashKarts Game Logic Documentation

## Overview

SmashKarts is a top-down combat racing game where players control cars that can move around an arena and shoot at opponents. The last car standing wins the match.

## Table of Contents

1. [Game Architecture](#game-architecture)
2. [Core Game Loop](#core-game-loop)
3. [Physics & Movement](#physics--movement)
4. [Combat System](#combat-system)
5. [AI Behavior](#ai-behavior)
6. [Collision Detection](#collision-detection)
7. [Game States](#game-states)
8. [Win Conditions](#win-conditions)
9. [Constants & Configuration](#constants--configuration)

---

## Game Architecture

### Data Structures

#### Car Interface
```typescript
interface Car {
  x: number;           // X position on canvas
  y: number;           // Y position on canvas
  angle: number;       // Rotation angle (radians)
  speed: number;       // Current speed
  health: number;      // Health points (0-100)
  score: number;       // Kill count
  color: string;       // Visual color identifier
  isPlayer: boolean;   // True for player, false for AI
  name: string;        // Display name
}
```

#### Bullet Interface
```typescript
interface Bullet {
  x: number;           // X position
  y: number;           // Y position
  vx: number;          // X velocity
  vy: number;          // Y velocity
  owner: number;       // Index of car that fired the bullet
  color: string;       // Color matching the owner's car
}
```

### Game State Management

The game uses React state and refs for efficient rendering:

- **State Variables:**
  - `gameState`: "menu" | "playing" | "gameover"
  - `winner`: Name of the winning car
  - `mounted`: Client-side mount check for Next.js hydration

- **Refs (Mutable without re-render):**
  - `carsRef`: Array of all cars in the game
  - `bulletsRef`: Array of active bullets
  - `keysRef`: Object tracking pressed keys
  - `lastShotRef`: Timestamp of last shot fired
  - `animationIdRef`: RequestAnimationFrame ID
  - `canvasRef`: Canvas DOM element reference

---

## Core Game Loop

The game loop runs at ~60 FPS using `requestAnimationFrame`:

### Game Loop Sequence

1. **Clear Canvas** - Fill background and draw grid
2. **Update Player Car** - Process input and apply physics
3. **Update AI Cars** - Run AI logic for each bot
4. **Update Bullets** - Move bullets and check for out-of-bounds
5. **Check Collisions** - Bullet-car collision detection
6. **Render Everything** - Draw bullets, cars, UI elements
7. **Check Win Condition** - Determine if game should end
8. **Schedule Next Frame** - Call requestAnimationFrame

### Rendering Order

1. Background (dark theme)
2. Grid lines (for visual depth)
3. Bullets (drawn under cars)
4. Cars (with health bars and names)
5. UI overlays (scores, controls)

---

## Physics & Movement

### Player Controls

| Input | Action |
|-------|--------|
| W / ↑ | Accelerate forward |
| S / ↓ | Accelerate backward |
| A / ← | Rotate left |
| D / → | Rotate right |
| Space | Shoot |

### Movement Physics

#### Acceleration
```typescript
// Forward acceleration
if (keyPressed('w')) {
  car.speed = Math.min(car.speed + ACCELERATION, MAX_SPEED);
}

// Backward acceleration (half max speed)
if (keyPressed('s')) {
  car.speed = Math.max(car.speed - ACCELERATION, -MAX_SPEED / 2);
}
```

**Constants:**
- `ACCELERATION = 0.3` - Speed increase per frame
- `MAX_SPEED = 5` - Maximum forward speed
- `MAX_SPEED / 2 = 2.5` - Maximum reverse speed

#### Friction
```typescript
car.speed *= FRICTION; // 0.95
```

Friction is applied every frame to gradually slow down the car when no input is given.

#### Rotation
```typescript
if (keyPressed('a')) {
  car.angle -= TURN_SPEED; // 0.08 radians
}
if (keyPressed('d')) {
  car.angle += TURN_SPEED;
}
```

#### Position Update
```typescript
car.x += Math.cos(car.angle) * car.speed;
car.y += Math.sin(car.angle) * car.speed;
```

Position is updated using polar-to-cartesian conversion based on angle and speed.

#### Edge Wrapping
```typescript
if (car.x < 0) car.x = CANVAS_WIDTH;
if (car.x > CANVAS_WIDTH) car.x = 0;
if (car.y < 0) car.y = CANVAS_HEIGHT;
if (car.y > CANVAS_HEIGHT) car.y = 0;
```

Cars wrap around screen edges for continuous gameplay.

---

## Combat System

### Shooting Mechanics

#### Bullet Creation
```typescript
const bullet: Bullet = {
  x: car.x + Math.cos(car.angle) * CAR_SIZE,  // Spawn in front of car
  y: car.y + Math.sin(car.angle) * CAR_SIZE,
  vx: Math.cos(car.angle) * BULLET_SPEED,     // Direction-based velocity
  vy: Math.sin(car.angle) * BULLET_SPEED,
  owner: carIndex,                             // Track who shot it
  color: car.color
};
```

#### Cooldown System
```typescript
const now = Date.now();
if (now - lastShot < SHOOT_COOLDOWN) return; // 300ms cooldown
lastShot = now;
```

Prevents rapid-fire by enforcing a 300ms delay between shots.

#### Bullet Physics
```typescript
// Update position each frame
bullet.x += bullet.vx;
bullet.y += bullet.vy;

// Remove if out of bounds
if (bullet.x < 0 || bullet.x > CANVAS_WIDTH || 
    bullet.y < 0 || bullet.y > CANVAS_HEIGHT) {
  removeBullet(bullet);
}
```

Bullets travel in straight lines and are removed when they leave the arena.

### Damage System

- **Damage per hit:** 20 HP
- **Total health:** 100 HP
- **Hits to kill:** 5 direct hits
- **Kill reward:** +1 score for shooter

---

## AI Behavior

### AI Decision Making

The AI uses a behavior tree approach with three main behaviors:

#### 1. Target Selection
```typescript
// Prioritize player if alive, otherwise target another bot
let target = player.health > 0 ? player : findAliveBot();
```

#### 2. Movement Strategy

**Distance-based behavior:**

| Distance | Behavior |
|----------|----------|
| > 200px | Advance towards target |
| 150-200px | Maintain distance |
| < 150px | Retreat |

```typescript
const distance = calculateDistance(car, target);

if (distance > 200) {
  // Close the gap
  car.speed = Math.min(car.speed + ACCELERATION, MAX_SPEED);
} else if (distance < 150) {
  // Back up
  car.speed = Math.max(car.speed - ACCELERATION, -MAX_SPEED / 2);
} else {
  // Maintain position
  car.speed *= FRICTION;
}
```

#### 3. Aiming & Shooting

```typescript
// Calculate angle to target
const dx = target.x - car.x;
const dy = target.y - car.y;
const targetAngle = Math.atan2(dy, dx);

// Normalize angle difference
let angleDiff = targetAngle - car.angle;
while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

// Turn towards target
if (Math.abs(angleDiff) > 0.1) {
  car.angle += Math.sign(angleDiff) * TURN_SPEED;
}

// Shoot if aimed correctly and in range
if (Math.abs(angleDiff) < 0.2 && distance < 400) {
  shoot();
}
```

**AI Shooting Logic:**
- Only shoots when aimed within ~11 degrees (0.2 radians) of target
- Only shoots when target is within 400px range
- Adds random delay (0-200ms) to humanize behavior

---

## Collision Detection

### Bullet-Car Collision

Uses circular collision detection:

```typescript
const dx = bullet.x - car.x;
const dy = bullet.y - car.y;
const distance = Math.sqrt(dx * dx + dy * dy);

if (distance < CAR_SIZE / 2) {
  // Collision detected!
  car.health -= 20;
  if (car.health <= 0) {
    car.health = 0;
    cars[bullet.owner].score += 1; // Award kill
  }
  removeBullet(bullet);
}
```

**Collision Rules:**
- Bullets cannot hit their owner
- Dead cars (health <= 0) don't take damage
- Each bullet can only hit one car

### Collision Radius

- **Car collision radius:** 15px (CAR_SIZE / 2)
- **Bullet size:** 5px
- **Effective hit detection:** ~20px total

---

## Game States

### State Machine

```
┌──────┐  Start Game   ┌─────────┐  Last Car    ┌──────────┐
│ Menu │──────────────>│ Playing │────────────>│ GameOver │
└──────┘               └─────────┘              └──────────┘
   ^                                                  |
   |                    ┌──────────────────────────────┘
   └────────────────────┘ Return to Menu / Play Again
```

### Menu State
- **Display:** Title, controls, start button
- **Actions:** 
  - Show game instructions
  - Start new game

### Playing State
- **Display:** Canvas with game rendering
- **Actions:**
  - Process player input
  - Run game loop
  - Update physics
  - Check win conditions

### GameOver State
- **Display:** Winner announcement, final scores
- **Actions:**
  - Play Again (restart game)
  - Main Menu (return to menu)

---

## Win Conditions

### Victory Check

Performed every frame during gameplay:

```typescript
const aliveCars = cars.filter(c => c.health > 0);

if (aliveCars.length === 1) {
  // One car remaining
  setWinner(aliveCars[0].name);
  setGameState("gameover");
} else if (aliveCars.length === 0) {
  // All died simultaneously
  setWinner("Draw");
  setGameState("gameover");
}
```

### Scoring System

- **Primary objective:** Be the last car standing
- **Secondary metric:** Kill count (shown on scoreboard)
- **Kill award:** +1 score per enemy destroyed

---

## Constants & Configuration

### Canvas Settings
```typescript
CANVAS_WIDTH = 800    // Arena width in pixels
CANVAS_HEIGHT = 600   // Arena height in pixels
```

### Entity Sizes
```typescript
CAR_SIZE = 30        // Car dimensions (square)
BULLET_SIZE = 5      // Bullet radius
```

### Physics Constants
```typescript
MAX_SPEED = 5        // Maximum forward speed
ACCELERATION = 0.3   // Speed increase per frame
FRICTION = 0.95      // Speed decay multiplier
TURN_SPEED = 0.08    // Rotation speed (radians/frame)
```

### Combat Constants
```typescript
BULLET_SPEED = 8         // Bullet travel speed
SHOOT_COOLDOWN = 300     // Milliseconds between shots
DAMAGE_PER_HIT = 20      // HP lost per bullet hit
MAX_HEALTH = 100         // Starting health
```

### AI Parameters
```typescript
APPROACH_DISTANCE = 200  // Distance to start advancing
RETREAT_DISTANCE = 150   // Distance to start retreating
AIM_THRESHOLD = 0.2      // Radians of acceptable aim error
SHOOT_RANGE = 400        // Maximum shooting distance
```

### Player Setup
```typescript
Player: {
  position: (100, 100)
  color: "#00ff88" (green)
  name: "You"
}

AI Bots: [
  { position: (700, 100), color: "#ff4444", name: "Red Bot" },
  { position: (700, 500), color: "#4444ff", name: "Blue Bot" },
  { position: (100, 500), color: "#ffaa00", name: "Orange Bot" }
]
```

---

## Technical Implementation Notes

### Performance Optimizations

1. **Ref Usage:** Mutable game state stored in refs to avoid re-renders
2. **Canvas Rendering:** Direct 2D context manipulation (no DOM updates)
3. **Single RAF Loop:** One requestAnimationFrame per frame
4. **Efficient Collision:** Square distance check before sqrt for optimization

### Next.js Integration

- **Client-Side Only:** Uses mounted check to prevent hydration errors
- **Dynamic Import:** Loaded with `ssr: false` flag
- **Event Cleanup:** Proper cleanup in useEffect return function

### Browser Compatibility

- **Canvas API:** All modern browsers
- **RequestAnimationFrame:** 60 FPS rendering
- **Keyboard Events:** Standard WASD + Arrow keys
- **Responsive:** Fixed canvas size for consistent gameplay

---

## Game Balance

### Difficulty Tuning

Current settings provide:
- **Moderate AI:** Bots are competent but beatable
- **Fast-paced Combat:** Quick TTK (Time To Kill) of ~5 hits
- **Skill-based:** Aiming and positioning matter
- **Forgiving:** Edge wrapping prevents cheap deaths

### Suggested Modifications

To make the game **harder:**
- Increase `MAX_SPEED` for AI cars
- Decrease `SHOOT_COOLDOWN` for AI
- Increase `AIM_THRESHOLD` (AI has better aim)
- Add more AI opponents

To make the game **easier:**
- Decrease AI `BULLET_SPEED`
- Increase `SHOOT_COOLDOWN` for AI
- Reduce `MAX_HEALTH` for AI cars
- Reduce number of AI opponents

---

## Future Enhancement Ideas

### Potential Features

1. **Power-ups:** Health packs, speed boosts, shield
2. **Weapons:** Different bullet types (spread, laser, rockets)
3. **Maps:** Multiple arenas with obstacles
4. **Multiplayer:** Real-time PvP via WebSockets
5. **Progression:** Unlockable cars and skins
6. **Leaderboard:** Track high scores on-chain
7. **Mobile Controls:** Touch-based joystick
8. **Sound Effects:** Shooting, collision, engine sounds
9. **Particle Effects:** Explosions, bullet trails
10. **Game Modes:** Team battles, capture the flag, race mode

### Blockchain Integration

- **NFT Cars:** Custom car designs as NFTs
- **Token Rewards:** Earn tokens for wins
- **Tournaments:** On-chain tournament brackets
- **Betting:** Wager tokens on matches
- **Leaderboards:** Store rankings on-chain

---

## Conclusion

SmashKarts is a fully-featured arcade combat game built with React and HTML5 Canvas. The physics-based movement, intelligent AI, and fast-paced combat create an engaging gameplay experience. The modular architecture makes it easy to extend with new features, modes, and blockchain integrations.

For questions or contributions, refer to the main README.md file.

