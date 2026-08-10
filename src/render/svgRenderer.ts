import { ContributionData, ContributionDay } from '../fetch/github';
import { MultiSnakeSimulationResult, GridPoint } from '../pathfinding/multiSnakeEngine';
import { themes, ThemeColors } from '../theme/themes';
import { SnakeConfig } from '../config/snakeConfig';

export function renderSnakeSVG(
  data: ContributionData,
  simResult: MultiSnakeSimulationResult,
  config: SnakeConfig,
  isDark: boolean = true
): string {
  const themeGroup = themes[config.theme] || themes['cyberpunk'];
  const colors: ThemeColors = isDark ? themeGroup.dark : themeGroup.light;

  const cellWidth = 10;
  const cellHeight = 10;
  const cellGap = 3;
  const originX = 15;
  const originY = 25;

  const svgWidth = 850;
  const svgHeight = 150;

  // Compute coordinate conversion helpers
  const getX = (col: number) => originX + col * (cellWidth + cellGap);
  const getY = (row: number) => originY + row * (cellHeight + cellGap);

  // Map levels to fill colors
  const levelColors: Record<number, string> = {
    0: colors.gridEmpty,
    1: colors.gridL1,
    2: colors.gridL2,
    3: colors.gridL3,
    4: colors.gridL4
  };

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">\n`;
  
  // Embedded SMIL / CSS style definitions
  svg += `  <style>\n`;
  svg += `    .bg { fill: ${colors.background}; rx: 8px; stroke: ${colors.border}; stroke-width: 1px; }\n`;
  svg += `    .header-text { fill: ${colors.text}; font-family: monospace; font-size: 11px; font-weight: bold; }\n`;
  svg += `    .stat-text { fill: ${colors.snake1Head}; font-family: monospace; font-size: 11px; font-weight: bold; }\n`;
  svg += `  </style>\n\n`;

  // Defs & Filters
  svg += `  <defs>\n`;
  svg += `    <filter id="glow-violet" x="-20%" y="-20%" width="140%" height="140%">\n`;
  svg += `      <feGaussianBlur stdDeviation="2" result="blur" />\n`;
  svg += `      <feComposite in="SourceGraphic" in2="blur" operator="over" />\n`;
  svg += `    </filter>\n`;
  svg += `    <circle id="particle" r="2.5" fill="${colors.snake1Head}" />\n`;
  svg += `  </defs>\n\n`;

  // Background card
  svg += `  <rect class="bg" width="${svgWidth}" height="${svgHeight}" />\n\n`;

  // Header Title
  svg += `  <text x="15" y="16" class="header-text">${data.username.toUpperCase()} • MULTI-SNAKE CONTRIBUTION ENGINE</text>\n`;
  svg += `  <text x="${svgWidth - 15}" y="16" class="stat-text" text-anchor="end">${data.totalContributions} CONTRIBUTIONS IN LAST YEAR</text>\n\n`;

  // Contribution Grid Base
  svg += `  <g id="grid">\n`;
  data.days.forEach(day => {
    const x = getX(day.col);
    const y = getY(day.row);
    const fill = levelColors[day.level] || colors.gridEmpty;
    svg += `    <rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${fill}" rx="2">\n`;
    
    // Cell consumption fade effect if cell is eaten in simulation
    const particle = simResult.particleEvents.find(p => p.point.col === day.col && p.point.row === day.row);
    if (particle) {
      const startTime = (particle.timeStep * 0.15 * config.speedMultiplier).toFixed(2);
      svg += `      <animate attributeName="fill" to="${colors.gridEmpty}" begin="${startTime}s" dur="0.3s" fill="freeze" />\n`;
    }
    svg += `    </rect>\n`;
  });
  svg += `  </g>\n\n`;

  // Render Snakes with SMIL animateMotion Paths
  const animDur = (simResult.totalSteps * 0.15 * config.speedMultiplier).toFixed(1);

  simResult.snakes.forEach((snake, idx) => {
    if (snake.steps.length === 0) return;

    const headColor = idx === 0 ? colors.snake1Head : idx === 1 ? colors.snake2Head : colors.snake3Head;
    const bodyColor = idx === 0 ? colors.snake1Body : idx === 1 ? colors.snake2Body : colors.snake3Body;

    // Construct motion SVG path d attribute
    let pathD = `M ${getX(snake.steps[0].position.col) + 5} ${getY(snake.steps[0].position.row) + 5}`;
    for (let s = 1; s < snake.steps.length; s++) {
      const px = getX(snake.steps[s].position.col) + 5;
      const py = getY(snake.steps[s].position.row) + 5;
      pathD += ` L ${px} ${py}`;
    }

    svg += `  <!-- Snake ${snake.id}: ${snake.name} -->\n`;
    svg += `  <path id="snake-path-${snake.id}" d="${pathD}" fill="none" stroke="none" />\n`;

    // Snake Body Segments
    for (let segment = 3; segment >= 1; segment--) {
      const segSize = Math.max(4, 9 - segment * 1.5);
      const segOpacity = (1 - segment * 0.2).toFixed(2);
      
      svg += `  <rect x="-${segSize/2}" y="-${segSize/2}" width="${segSize}" height="${segSize}" fill="${bodyColor}" opacity="${segOpacity}" rx="2">\n`;
      svg += `    <animateMotion path="${pathD}" dur="${animDur}s" repeatCount="indefinite" begin="${(segment * 0.08).toFixed(2)}s" />\n`;
      svg += `  </rect>\n`;
    }

    // Snake Head
    svg += `  <rect x="-5" y="-5" width="10" height="10" fill="${headColor}" rx="3" filter="url(#glow-violet)">\n`;
    svg += `    <animateMotion path="${pathD}" dur="${animDur}s" repeatCount="indefinite" />\n`;
    svg += `    <animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="0.8s" repeatCount="indefinite" />\n`;
    svg += `  </rect>\n\n`;
  });

  // Render Particle Burst Effects for Eaten Contribution Cells
  svg += `  <!-- Particle Explosion Bursts -->\n`;
  simResult.particleEvents.slice(0, 40).forEach(pe => {
    const px = getX(pe.point.col) + 5;
    const py = getY(pe.point.row) + 5;
    const startTime = (pe.timeStep * 0.15 * config.speedMultiplier).toFixed(2);

    svg += `  <g transform="translate(${px}, ${py})">\n`;
    svg += `    <circle r="1" fill="${pe.color}">\n`;
    svg += `      <animate attributeName="r" values="1;8" begin="${startTime}s" dur="0.4s" fill="freeze" />\n`;
    svg += `      <animate attributeName="opacity" values="1;0" begin="${startTime}s" dur="0.4s" fill="freeze" />\n`;
    svg += `    </circle>\n`;
    svg += `  </g>\n`;
  });

  svg += `</svg>\n`;
  return svg;
}
