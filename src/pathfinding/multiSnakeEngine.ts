import { ContributionDay } from '../fetch/github';

export interface GridPoint {
  col: number; // 0 to 52
  row: number; // 0 to 6
}

export interface SnakePathStep {
  timeStep: number;
  position: GridPoint;
  eatenCell?: ContributionDay;
  isCombo: boolean;
  streakCount: number;
}

export interface SnakeRoute {
  id: number;
  name: string;
  color: string;
  steps: SnakePathStep[];
  eatenTotal: number;
  comboCount: number;
}

export interface MultiSnakeSimulationResult {
  snakes: SnakeRoute[];
  totalSteps: number;
  totalEaten: number;
  particleEvents: { timeStep: number; point: GridPoint; level: number; color: string }[];
}

export function runMultiSnakeSimulation(
  days: ContributionDay[],
  snakeCount: number = 3,
  comboThreshold: number = 3
): MultiSnakeSimulationResult {
  const maxCols = 53;
  const maxRows = 7;

  // Filter target cells (cells with activity)
  const activeCells = new Set<string>();
  const cellMap = new Map<string, ContributionDay>();

  days.forEach(d => {
    const key = `${d.col},${d.row}`;
    cellMap.set(key, d);
    if (d.level > 0) {
      activeCells.add(key);
    }
  });

  // Role weights: [intensityWeight, distanceWeight]
  const snakeWeights = [
    { name: 'Alpha (Hunter)', intensity: 5.0, distance: 1.0, color: '#a855f7', startCol: 0, startRow: 0 },
    { name: 'Beta (Explorer)', intensity: 1.0, distance: 3.0, color: '#06b6d4', startCol: maxCols - 1, startRow: maxRows - 1 },
    { name: 'Gamma (Streak Cleaner)', intensity: 2.5, distance: 2.0, color: '#f59e0b', startCol: 0, startRow: maxRows - 1 }
  ].slice(0, snakeCount);

  // Time-indexed occupancy map: "col,row,timeStep" -> true
  const occupancyMap = new Set<string>();

  const snakeRoutes: SnakeRoute[] = snakeWeights.map((w, index) => ({
    id: index + 1,
    name: w.name,
    color: w.color,
    steps: [],
    eatenTotal: 0,
    comboCount: 0
  }));

  const particleEvents: { timeStep: number; point: GridPoint; level: number; color: string }[] = [];

  // Track state per snake
  const currentPositions: GridPoint[] = snakeWeights.map(w => ({ col: w.startCol, row: w.startRow }));
  const streaks: number[] = snakeWeights.map(() => 0);

  // Max simulation frames
  const maxFrames = Math.max(activeCells.size * 3, 100);
  let frame = 0;

  while (activeCells.size > 0 && frame < maxFrames) {
    let anyMoved = false;

    for (let i = 0; i < snakeCount; i++) {
      const weights = snakeWeights[i];
      const pos = currentPositions[i];
      const route = snakeRoutes[i];

      // Reserve current position
      occupancyMap.add(`${pos.col},${pos.row},${frame}`);

      // Evaluate candidates in activeCells
      let bestCellKey: string | null = null;
      let bestScore = -Infinity;
      let bestPoint: GridPoint | null = null;

      for (const key of activeCells) {
        const [c, r] = key.split(',').map(Number);
        const day = cellMap.get(key)!;
        const dist = Math.abs(pos.col - c) + Math.abs(pos.row - r);

        if (dist === 0) continue;

        // Weighted utility score
        let score = (weights.intensity * day.level) - (weights.distance * dist);

        // Streak bonus
        if (streaks[i] >= comboThreshold) {
          score += 5.0;
        }

        if (score > bestScore) {
          bestScore = score;
          bestCellKey = key;
          bestPoint = { col: c, row: r };
        }
      }

      // Move 1 step towards bestPoint
      let nextPos: GridPoint = { ...pos };

      if (bestPoint) {
        const dCol = Math.sign(bestPoint.col - pos.col);
        const dRow = Math.sign(bestPoint.row - pos.row);

        // Prefer axis with larger distance
        if (Math.abs(bestPoint.col - pos.col) >= Math.abs(bestPoint.row - pos.row) && dCol !== 0) {
          nextPos = { col: pos.col + dCol, row: pos.row };
        } else if (dRow !== 0) {
          nextPos = { col: pos.col, row: pos.row + dRow };
        } else if (dCol !== 0) {
          nextPos = { col: pos.col + dCol, row: pos.row };
        }
      }

      // Check collision
      const nextKey = `${nextPos.col},${nextPos.row}`;
      const occupancyKey = `${nextPos.col},${nextPos.row},${frame + 1}`;

      if (occupancyMap.has(occupancyKey)) {
        // Fallback: try adjacent orthogonal steps to prevent collision
        const neighbors: GridPoint[] = [
          { col: pos.col + 1, row: pos.row },
          { col: pos.col - 1, row: pos.row },
          { col: pos.col, row: pos.row + 1 },
          { col: pos.col, row: pos.row - 1 }
        ].filter(p => p.col >= 0 && p.col < maxCols && p.row >= 0 && p.row < maxRows)
         .filter(p => !occupancyMap.has(`${p.col},${p.row},${frame + 1}`));

        if (neighbors.length > 0) {
          nextPos = neighbors[0];
        } else {
          nextPos = { ...pos }; // Hold position
        }
      }

      // Record step
      let eatenDay: ContributionDay | undefined = undefined;
      let isCombo = false;

      if (activeCells.has(nextKey)) {
        eatenDay = cellMap.get(nextKey);
        activeCells.delete(nextKey);
        route.eatenTotal++;
        streaks[i]++;

        if (streaks[i] >= comboThreshold || (eatenDay && eatenDay.level >= 3)) {
          isCombo = true;
          route.comboCount++;
        }

        if (eatenDay) {
          particleEvents.push({
            timeStep: frame + 1,
            point: { col: nextPos.col, row: nextPos.row },
            level: eatenDay.level,
            color: weights.color
          });
        }
      } else {
        if (nextPos.col !== pos.col || nextPos.row !== pos.row) {
          streaks[i] = Math.max(0, streaks[i] - 1);
        }
      }

      currentPositions[i] = nextPos;
      occupancyMap.add(`${nextPos.col},${nextPos.row},${frame + 1}`);

      route.steps.push({
        timeStep: frame + 1,
        position: nextPos,
        eatenCell: eatenDay,
        isCombo,
        streakCount: streaks[i]
      });

      anyMoved = true;
    }

    if (!anyMoved) break;
    frame++;
  }

  const totalEaten = snakeRoutes.reduce((sum, r) => sum + r.eatenTotal, 0);

  return {
    snakes: snakeRoutes,
    totalSteps: frame,
    totalEaten,
    particleEvents
  };
}
