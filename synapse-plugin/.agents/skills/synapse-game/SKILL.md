---
name: synapse-game
description: |-
  Game Engineering Core Skill: Advanced programming paradigms, physics models, frame updates, and memory optimization for interactive games.

  MANDATORY: Execute when developing, configuring, or debugging game mechanics, engines, logic, and visual assets.

  Trigger immediately for:
    - game development
    - game mechanics
    - canvas rendering
    - physics loop
    - sprite animation
    - game loop

  DO NOT trigger for:
    - General business logic.
    - Standard database CRUD operations.
    - Administrative panels.
---

# 🎮 synapse-game — Game Engineering Core Skill

This skill equips the Agent with advanced programming paradigms, physics models, frame updates, and memory optimization guidelines for building interactive games and real-time simulations.

---

## 🌟 CORE PRINCIPLES

1. **Frame Rate Consistency (30/60/120 FPS)**: The game loop must never block. Frame processing budgets are critical (16.6ms for 60 FPS).
2. **Zero-Allocation Game Loop**: Avoid heap allocations (`new`, dynamic lists, string concatenation) inside execution loops to prevent runtime stutter caused by Garbage Collection (GC) pauses.
3. **Determinism & Delta Time**: Always scale displacements and animations using elapsed frame delta time to ensure identical speeds regardless of actual hardware framerate.
4. **GPU Efficiency**: Keep draw calls and state changes to a minimum through asset batching, texture atlases, and shader optimization.

---

## 🏗️ ARCHITECTURAL PLAYBOOKS

### 1. Game Loop & State Machines

#### A. The Core Game Loop

Every system must integrate cleanly into the standard cyclic execution:

```
[Input Handling] ➡️ [Game State Updates] ➡️ [Physics / Collisions] ➡️ [Animation / Render]
```

- Always separate rendering updates (variable frame time) from physics calculations (fixed/deterministic time intervals).

#### B. Finite State Machines (FSM)

- Manage complex entity actions (Idle, Run, Jump, Attack, Die) using State patterns or state machine systems rather than nested `if-else` blocks in main updates.

---

### 2. Game Engines & Web Frameworks

#### A. Unity & C# Game Engineering

- **Physics Rule**: Put physics updates and velocity modifications exclusively inside `FixedUpdate()`. Use `Time.fixedDeltaTime`.
- **GC Prevention in Update**:
  - Never use `GetComponent()` or `Find()` inside `Update()` or `FixedUpdate()`. Cache references in `Awake()` or `Start()`.
  - Never instantiate objects (`Instantiate()`) dynamically during intense gameplay.
  - Avoid `foreach` loops on native arrays or collections that trigger garbage allocations.
- **ScriptableObjects**: Use ScriptableObjects for data-driven configuration, item registries, and stateless events to reduce memory consumption.

#### B. HTML5 / WebGL Canvas Engines (Phaser & Three.js)

- **Phaser (2D)**: Rely on Phaser's native physics managers (Arcade/Matter.js). Batch sprite rendering using Sprite Sheets and Texture Atlases.
- **Three.js (3D)**:
  - Re-use standard `Geometry` and `Material` structures across multiple meshes to conserve GPU memory.
  - Clean up and `dispose()` geometries, materials, and textures from memory when scenes or meshes are destroyed.
  - Use `requestAnimationFrame` for loop pacing.

---

## ⚡ PERFORMANCE OPTIMIZATION CHEATSHEET

### 1. Object Pooling

- Pre-instantiate and pool reusable game objects (bullets, particles, enemies, damage popups).
- Implement an `Active` / `Inactive` state management protocol to avoid expensive heap creation and destruction cycles.

### 2. Rendering & GPU Optimization

- **Texture Atlasing**: Consolidate multiple individual sprites/textures into a single atlas file to maximize dynamic batching efficiency.
- **Draw Call Batching**: Use static and dynamic batching inside Unity or customized draw calls in WebGL engines.
- **LOD (Level of Detail)**: Swap complex high-polygon 3D meshes with simpler low-polygon variants when positioned far from the camera.

---

## 🧪 GAMEPLAY TESTING & AUDITS

- **Performance Profiling**: Monitor frame duration, CPU thread usage, GPU draw call counts, and memory allocations.
- **GC Alloc Inspection**: Trace garbage collection frequencies; aim for zero bytes allocated during runtime gameplay.
- **Collision Stress Tests**: Automate hundreds of active entities to verify physics stability and prevent colliders from clipping through static walls.

* [ ] **Frame Rate Stability**: Ensure target FPS is maintained across low-end mobile devices and high-end desktops.
* [ ] **Clean Memory Garbage**: Validate heap allocation stays flat after 10+ minutes of playing the game loop.
