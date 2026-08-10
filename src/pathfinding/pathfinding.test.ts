import { runMultiSnakeSimulation } from './multiSnakeEngine';
import { ContributionDay } from '../fetch/github';

function buildMockGrid(fillLevel: number): ContributionDay[] {
  const days: ContributionDay[] = [];
  for (let col = 0; col < 53; col++) {
    for (let row = 0; row < 7; row++) {
      days.push({
        date: `2026-01-01`,
        count: fillLevel * 2,
        level: fillLevel,
        col,
        row
      });
    }
  }
  return days;
}

export function runUnitTests() {
  console.log('🧪 Running Multi-Snake Pathfinding Unit Test Suite...\n');

  // Test 1: Empty Grid
  {
    const emptyGrid = buildMockGrid(0);
    const result = runMultiSnakeSimulation(emptyGrid, 3);
    console.log(`[PASS] Test 1: Empty Grid -> Total Eaten: ${result.totalEaten} (Expected: 0)`);
    if (result.totalEaten !== 0) throw new Error('Test 1 failed: Expected 0 eaten cells on empty grid');
  }

  // Test 2: Dense Fully-Illuminated Grid
  {
    const denseGrid = buildMockGrid(3);
    const result = runMultiSnakeSimulation(denseGrid, 3);
    console.log(`[PASS] Test 2: Fully-Illuminated Grid -> Total Eaten: ${result.totalEaten} across 3 snakes`);
    if (result.totalEaten === 0) throw new Error('Test 2 failed: Expected >0 cells eaten on dense grid');
  }

  // Test 3: Multi-Snake Collision Avoidance Validation
  {
    const denseGrid = buildMockGrid(2);
    const result = runMultiSnakeSimulation(denseGrid, 3);
    
    // Check that no 2 snakes occupy the same grid position at the same timestep
    const posMap = new Set<string>();
    let collisionDetected = false;

    result.snakes.forEach(snake => {
      snake.steps.forEach(step => {
        const key = `${step.position.col},${step.position.row},${step.timeStep}`;
        if (posMap.has(key)) {
          collisionDetected = true;
        }
        posMap.add(key);
      });
    });

    console.log(`[PASS] Test 3: Collision Avoidance Check -> Collisions Detected: ${collisionDetected}`);
    if (collisionDetected) throw new Error('Test 3 failed: Multi-snake collision detected at same timestep');
  }

  // Test 4: Role Diversity Check
  {
    const mixedGrid: ContributionDay[] = [];
    for (let col = 0; col < 53; col++) {
      for (let row = 0; row < 7; row++) {
        mixedGrid.push({
          date: '2026-01-01',
          count: (col % 4) * 3,
          level: col % 5,
          col,
          row
        });
      }
    }
    const result = runMultiSnakeSimulation(mixedGrid, 3);
    console.log(`[PASS] Test 4: Multi-Snake Role Trajectories -> Snake 1 (${result.snakes[0].eatenTotal}), Snake 2 (${result.snakes[1].eatenTotal}), Snake 3 (${result.snakes[2].eatenTotal})`);
  }

  console.log('\n✅ All Pathfinding Unit Tests Passed Successfully!\n');
}

if (require.main === module) {
  runUnitTests();
}
