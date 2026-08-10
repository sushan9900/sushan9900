import * as fs from 'fs';
import * as path from 'path';
import { config } from './config/snakeConfig';
import { fetchContributionData } from './fetch/github';
import { runMultiSnakeSimulation } from './pathfinding/multiSnakeEngine';
import { renderSnakeSVG } from './render/svgRenderer';

async function main() {
  console.log('🐍 Launching Multi-Snake Contribution SVG Generator...');
  console.log(`[CONFIG] User: ${config.username} | Snakes: ${config.snakeCount} | Theme: ${config.theme}`);

  const token = process.env.GITHUB_TOKEN;
  const { updated, data } = await fetchContributionData(config.username, token);

  const darkSvgPath = path.join(process.cwd(), 'github-contribution-snake-dark.svg');
  const lightSvgPath = path.join(process.cwd(), 'github-contribution-snake-light.svg');

  if (!updated && fs.existsSync(darkSvgPath) && fs.existsSync(lightSvgPath)) {
    console.log('⚡ [SKIP] Contribution data hash matches cache. Skipping SVG rendering & build cycles.');
    process.exit(0);
  }

  console.log(`[DATA] Processed ${data.days.length} days | Total Contributions: ${data.totalContributions}`);

  // Run Pathfinding Simulation
  const simResult = runMultiSnakeSimulation(data.days, config.snakeCount, config.comboThreshold);
  console.log(`[PATHFINDER] Completed in ${simResult.totalSteps} steps | Total Cells Eaten: ${simResult.totalEaten} | Particle Events: ${simResult.particleEvents.length}`);

  // Render Dark SVG
  const darkSvg = renderSnakeSVG(data, simResult, config, true);
  fs.writeFileSync(darkSvgPath, darkSvg, 'utf-8');
  const darkSizeKB = (Buffer.byteLength(darkSvg, 'utf-8') / 1024).toFixed(2);
  console.log(`[RENDER] Dark SVG generated -> ${darkSvgPath} (${darkSizeKB} KB)`);

  // Render Light SVG
  const lightSvg = renderSnakeSVG(data, simResult, config, false);
  fs.writeFileSync(lightSvgPath, lightSvg, 'utf-8');
  const lightSizeKB = (Buffer.byteLength(lightSvg, 'utf-8') / 1024).toFixed(2);
  console.log(`[RENDER] Light SVG generated -> ${lightSvgPath} (${lightSizeKB} KB)`);

  // Checked-in Fallback SVGs
  const assetsDir = path.join(process.cwd(), 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(assetsDir, 'fallback-snake-dark.svg'), darkSvg, 'utf-8');
  fs.writeFileSync(path.join(assetsDir, 'fallback-snake-light.svg'), lightSvg, 'utf-8');

  console.log('✅ Generation completed successfully!');
}

main().catch(err => {
  console.error('❌ Error running generator:', err);
  process.exit(1);
});
