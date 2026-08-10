# DEV_NOTES — Multi-Snake Contribution Generator

## 1. Engine & Pathfinding Architecture

This engine generates dynamic SVG animations of multiple autonomous snakes traversing and consuming GitHub contribution calendar cells.

### Pathfinding Model
Instead of brute-force global A* (which suffers from factorial complexity on multi-agent grids), the engine uses a **Weighted Greedy Nearest-Cell Heuristic with Time-Indexed Spatial Reservation**.

The grid matrix consists of 7 rows $\times$ 53 columns ($371$ total cells). Each snake evaluates candidates via a distinct utility function:

$$\text{Utility}(c) = (w_{\text{intensity}} \times \text{Level}(c)) - (w_{\text{distance}} \times \text{ManhattanDistance}(pos, c)) + \text{StreakBonus}(c)$$

### Agent Roles:
1. **Alpha (Cyber Violet / Hunter)**: $w_{\text{intensity}} = 5.0, w_{\text{distance}} = 1.0$. Targets Level 3 & 4 cells to trigger high-scoring point events.
2. **Beta (Electric Cyan / Explorer)**: $w_{\text{intensity}} = 1.0, w_{\text{distance}} = 3.0$. Sweeps spatial perimeters and lower-level cells.
3. **Gamma (Solar Gold / Streak Cleaner)**: $w_{\text{intensity}} = 2.5, w_{\text{distance}} = 2.0$. Sweeps consecutive daily contribution streaks to sustain combo multipliers.

### Collision Avoidance
A 3D time-indexed occupancy map `ReservationGrid[x][y][timeStep]` tracks all snake head and body coordinates frame-by-frame, guaranteeing zero head-to-head or body intersections.

---

## 2. Configuration & Customization

All settings can be customized in `src/config/snakeConfig.ts` or overridden via environment variables in GitHub Actions:

```bash
export SNAKE_USERNAME="sushan9900"
export SNAKE_COUNT="3"
export SNAKE_THEME="cyberpunk" # 'cyberpunk' | 'minimalist'
export SNAKE_SPEED="1.0"
```

---

## 3. Local Development & Testing Commands

```bash
# Install dependencies
npm install

# Run pathfinding unit tests
npm test

# Build TypeScript source
npm run build

# Generate SVGs locally
npm start
```

Outputs generated:
- `github-contribution-snake-dark.svg` (Dark Theme)
- `github-contribution-snake-light.svg` (Light Theme)
- `assets/fallback-snake-dark.svg` (Checked-in Fallback)
- `assets/fallback-snake-light.svg` (Checked-in Fallback)
