# Implementation Plan

Replace the custom-built physics engine in `fruktspleis.html` with the Rapier2D physics engine used in `subak-game`, while preserving the existing visual design, canvas-based rendering, and overall game feel.

The current `fruktspleis.html` uses a hand-rolled physics system with manual collision detection, impulse resolution, sleep states, and sub-stepping. The `subak-game` project uses the professional-grade `@dimforge/rapier2d-compat` physics library, which provides more accurate and stable physics simulation including proper rigid body dynamics, collision detection, and constraint solving.

The goal is to port the Rapier-based physics approach from `subak-game` into the standalone HTML5 canvas game `fruktspleis.html`, adapting the physics constants, coordinate systems, and game logic to match the existing game's dimensions and behavior.

## Key Differences Between the Two Systems

| Aspect | fruktspleis.html (current) | subak-game (target) |
|--------|---------------------------|---------------------|
| Physics Engine | Custom hand-rolled | Rapier2D (@dimforge/rapier2d-compat) |
| Coordinate System | Pixels (CANVAS_W=410, CANVAS_H=560) | Meters (GAME_WIDTH=0.6, GAME_HEIGHT=0.9) |
| Gravity | 0.55 per frame (sub-stepped 6x) | 9.86 * 0.15 m/s² |
| Collision | Manual impulse-based with friction/spin | Rapier's built-in collider system |
| Bounce | FRUIT_BOUNCE=0.10 | Restitution=0.25 |
| Fruit Mass | radius² * 0.0015 | Fixed 0.1 |
| Merge Trigger | Distance + speed check in handleMerges() | Rapier collision events in checkCollisions() |
| Sleep System | Custom rest frame counting | Rapier's built-in sleeping (not explicitly used in subak) |
| Rendering | Canvas 2D with custom drawing | Svelte components (but we keep canvas) |
| Game Over | Fruit above WALL_TOP for 55 frames | Fruit above GAME_OVER_HEIGHT with isOutOfBounds() check |

## Approach

Since `fruktspleis.html` is a standalone HTML file with canvas rendering (not a Svelte app), we will:
1. Add Rapier2D as a CDN dependency
2. Create a lightweight Fruit class similar to subak-game's but adapted for canvas rendering
3. Create a Boundary class for walls
4. Replace the physics step, collision detection, and merge logic with Rapier-based equivalents
5. Convert between pixel coordinates (for rendering) and meter coordinates (for physics)
6. Preserve the existing visual design, fruit types, scoring, particles, and UI

[Types]  
Define TypeScript-like type structures for the new physics-based system.

```typescript
// Fruit physics body data
interface FruitPhysicsBody {
    id: number;
    body: RigidBody;
    collider: Collider;
    fruitIndex: number;
    radius: number;
}

// Fruit state for rendering (pixel coordinates)
interface FruitRenderState {
    id: number;
    x: number;           // pixels
    y: number;           // pixels
    rotation: number;
    fruitIndex: number;
    radius: number;      // pixels
    scale: number;
    scaleTarget: number;
    merging: boolean;
}

// Merge effect data
interface MergeEffect {
    x: number;
    y: number;
    radius: number;
    maxR: number;
    color: string;
    life: number;
}

// Particle data (unchanged)
interface Particle {
    x: number; y: number;
    vx: number; vy: number;
    life: number; decay: number;
    radius: number; color: string;
}
```

Key constants to adapt from subak-game:
- Gravity: `new Vector2(0.0, 9.86 * 0.15)` ≈ `Vector2(0, 1.479)`
- Restitution (bounce): `0.25` (vs current `0.10`)
- Friction: `0.35` (vs current `0.14`)
- Linear damping: `0.2`
- Angular damping: `0.4`
- Solver iterations: `8`

Coordinate conversion:
- Physics world: 0.6m wide × 0.9m tall
- Canvas: 410px × 560px
- Scale factor X: `410 / 0.6 ≈ 683.33 px/m`
- Scale factor Y: `560 / 0.9 ≈ 622.22 px/m`
- Or we could match the physics world to the canvas aspect ratio exactly

[Files]
Only one file needs to be modified: `fruktspleis.html`. No new files will be created.

### `fruktspleis.html` — Complete rewrite of the `<script>` section

**Changes:**
1. **Add Rapier2D CDN script** — Insert `<script src="https://cdn.jsdelivr.net/npm/@dimforge/rapier2d-compat@0.16.1/rapier.combat.min.js"></script>` in the `<head>` or before the main script
2. **Replace the entire game script** with a new version that:
   - Initializes Rapier physics world asynchronously
   - Creates Fruit and Boundary classes modeled after subak-game's implementations
   - Converts between pixel coordinates (canvas) and meter coordinates (physics)
   - Uses Rapier's event queue for collision detection and merge triggers
   - Maintains the existing canvas rendering pipeline (drawFruits, drawParticles, etc.)
   - Preserves all existing visual elements (fruit shapes, emojis, particles, merge effects)
   - Keeps the same fruit types, scoring system, and game over logic
3. **Remove the following custom physics functions** (replaced by Rapier):
   - `applyPhysics()` — replaced by `physicsWorld.step()`
   - `solveBoundaries()` — replaced by Rapier's wall colliders
   - `solveFruitCollisions()` — replaced by Rapier's collision system
   - `handleMerges()` — replaced by collision event-based merging
   - `updateSleepState()` — Rapier handles sleeping internally (or we can skip sleeping entirely)
   - `isFruitSupported()`, `wakeFruit()` — no longer needed
4. **Adapt the following existing functions** to work with the new physics:
   - `makeFruit()` — now creates a Rapier rigid body + collider
   - `spawnFruit()` — drops fruit at the top of the physics world
   - `checkactivityOver()` — checks if any fruit body is above the game-over line
   - `activityLoop()` — updated to step physics and sync render states
5. **Update constants** to match the physics world scale:
   - Define `PHYSICS_WIDTH = 0.6`, `PHYSICS_HEIGHT = 0.9` (meters)
   - Define pixel-to-meter conversion functions
   - Adjust fruit radii to be proportional in the physics world

[Functions]
New and modified functions for the physics integration.

### New Functions

- **`async initPhysics()`** — Asynchronously loads and initializes Rapier, creates the physics world with gravity, sets solver iterations, creates boundary walls, and starts the game
- **`createWalls()`** — Creates three fixed rigid bodies (left wall, right wall, floor) using Rapier's `Boundary` class pattern
- **`pixelsToMetersX(px)`** / **`pixelsToMetersY(px)`** — Convert pixel coordinates to physics world meters
- **`metersToPixelsX(m)`** / **`metersToPixelsY(m)`** — Convert physics world meters to pixel coordinates
- **`createFruitBody(fruitIndex, x, y)`** — Creates a Rapier dynamic rigid body with circle collider for a fruit, returns the body/collider handles
- **`syncFruitsToRenderState()`** — Reads all fruit rigid body positions/rotations from the physics world and updates the render state array
- **`handleCollisionEvents()`** — Processes Rapier collision events to detect same-type fruit collisions and queue merges
- **`mergeFruits(fruitA, fruitB)`** — Removes two colliding fruits from physics world, creates a new merged fruit at the midpoint, updates score, spawns effects

### Modified Functions

- **`makeFruit(x, y, type)`** — Now creates both a render-state object AND a physics body. Returns the render-state object with a reference to the physics body ID.
- **`spawnFruit(x)`** — Converts pixel X to meter X, creates fruit at the top of the physics world (y ≈ GAME_OVER_HEIGHT/2 in meters)
- **`checkactivityOver()`** — Iterates through physics bodies and checks if any fruit's top edge is above the game-over line (using meter coordinates)
- **`activityLoop()`** — Calls `physicsWorld.step(eventQueue)`, then `handleCollisionEvents()`, then `syncFruitsToRenderState()`, then renders
- **`drawFruits()`** — Now reads from the render state array (pixel coordinates) instead of directly from physics bodies
- **`drawDropGuide()`** — Converts mouse pixel position to meter position for preview

### Removed Functions

- **`applyPhysics()`** — Replaced by `physicsWorld.step()`
- **`solveBoundaries()`** — Replaced by Rapier's fixed wall colliders
- **`solveFruitCollisions()`** — Replaced by Rapier's collision detection
- **`handleMerges()`** — Replaced by event-driven `handleCollisionEvents()` + `mergeFruits()`
- **`updateSleepState()`** — Rapier handles body sleeping internally
- **`isFruitSupported()`** — No longer needed
- **`wakeFruit()`** — No longer needed (Rapier auto-wakes on collision)
- **`getFruitCollisionRadius()`** — No longer needed (radius is on the collider)

[Classes]
New classes to introduce.

### `class Fruit` (new)
Encapsulates a fruit's physics body and metadata. Modeled after subak-game's `Fruit.ts`.

```javascript
class Fruit {
    constructor(fruitIndex, x, y, physicsWorld, RAPIER) {
        this.id = ++currentId;
        this.fruitIndex = fruitIndex;
        this.radius = FRUIT_DATA[fruitIndex].physicsRadius;
        this.points = FRUIT_DATA[fruitIndex].points;
        this.physicsWorld = physicsWorld;

        const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, y)
            .setLinearDamping(0.2)
            .setAngularDamping(0.4);
        this.body = physicsWorld.createRigidBody(bodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.ball(this.radius)
            .setRestitution(0.25)
            .setFriction(0.35)
            .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
        this.collider = physicsWorld.createCollider(colliderDesc, this.body);

        // Store reference for collision event lookup
        this.body.userData = { fruitInstance: this };
    }

    isOutOfBounds(gameOverHeight) {
        const topY = this.body.translation().y - this.radius;
        if (topY < gameOverHeight) {
            if (this.startOutOfBounds && performance.now() - this.startOutOfBounds > 1000) {
                return true;
            }
            if (!this.startOutOfBounds) {
                this.startOutOfBounds = performance.now();
            }
        } else {
            this.startOutOfBounds = null;
        }
        return false;
    }

    destroy() {
        if (this.body && this.collider) {
            this.physicsWorld.removeCollider(this.collider, false);
            this.physicsWorld.removeRigidBody(this.body);
        }
    }
}
```

### `class Boundary` (new)
Creates fixed wall colliders. Modeled after subak-game's `Boundary.ts`.

```javascript
class Boundary {
    constructor(x, y, width, height, physicsWorld, RAPIER) {
        const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y);
        this.body = physicsWorld.createRigidBody(bodyDesc);
        const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2);
        this.collider = physicsWorld.createCollider(colliderDesc, this.body);
    }
}
```

[Dependencies]
Add one new external dependency via CDN.

- **`@dimforge/rapier2d-compat` v0.16.1** — Loaded from `https://cdn.jsdelivr.net/npm/@dimforge/rapier2d-compat@0.16.1/rapier.combat.min.js`

This is the same version used in subak-game. The `-compat` variant is used for broader browser compatibility (uses WebAssembly fallback).

No npm/package.json changes needed since this is a standalone HTML file.

[Testing]
Manual testing approach since this is a standalone HTML game with no existing test suite.

1. **Visual regression testing** — Open `fruktspleis.html` in a browser and verify:
   - Fruits fall with realistic gravity and bounce
   - Fruits collide and roll naturally
   - Same-type fruits merge on contact
   - Game over triggers when fruits pile too high
   - Particles and merge effects display correctly
   - Score tracking works
   - Restart functionality works

2. **Edge case testing:**
   - Rapid fruit dropping
   - Fruits landing on uneven surfaces
   - Multiple simultaneous merges
   - Largest fruit (watermelon) behavior
   - Browser resize handling

3. **Comparison testing** — Compare the feel of the new physics against the old implementation to ensure the game still feels fun and responsive.

[Implementation Order]
The implementation should proceed in this logical sequence to minimize conflicts and ensure each step builds on the previous one.

1. **Add Rapier2D CDN script** to the HTML head section
2. **Define physics constants and conversion functions** (PHYSICS_WIDTH, PHYSICS_HEIGHT, pixel↔meter converters)
3. **Create the Fruit and Boundary classes** (copied and adapted from subak-game)
4. **Adapt fruit type data** — Add `physicsRadius` to FRUIT_TYPES based on proportional sizing in the physics world
5. **Create `initPhysics()` function** — Async initialization of Rapier, world creation, wall creation
6. **Create `createWalls()` function** — Set up left, right, and floor boundaries
7. **Rewrite `makeFruit()`** — Now creates both physics body and render state
8. **Rewrite `spawnFruit()`** — Drop fruit from pixel position converted to physics world
9. **Create `syncFruitsToRenderState()`** — Copy physics positions to render state each frame
10. **Create `handleCollisionEvents()`** — Process Rapier collision events for merging
11. **Create `mergeFruits()`** — Handle the merge logic (destroy old, create new, score, effects)
12. **Rewrite `checkactivityOver()`** — Use physics body positions for game over detection
13. **Rewrite `activityLoop()`** — Integrate physics stepping into the render loop
14. **Remove obsolete functions** — Delete `applyPhysics`, `solveBoundaries`, `solveFruitCollisions`, `handleMerges`, `updateSleepState`, etc.
15. **Test and tune** — Adjust physics constants (restitution, friction, gravity) to match the desired game feel
16. **Clean up** — Remove unused variables and ensure no memory leaks (proper cleanup on game over/restart)