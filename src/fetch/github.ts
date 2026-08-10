import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as https from 'https';

export interface ContributionDay {
  date: string;
  count: number;
  level: number; // 0, 1, 2, 3, 4
  col: number;   // 0 to 52
  row: number;   // 0 to 6
}

export interface ContributionData {
  username: string;
  totalContributions: number;
  days: ContributionDay[];
  weeks: ContributionDay[][];
  hash: string;
}

export async function fetchContributionData(username: string, token?: string): Promise<{ updated: boolean; data: ContributionData }> {
  let rawDays: { date: string; count: number; level: number }[] = [];

  if (token) {
    try {
      rawDays = await queryGitHubGraphQL(username, token);
    } catch (err) {
      console.warn(`[WARN] GraphQL fetch failed (${err}). Falling back to mock generator.`);
      rawDays = generateMockContributions();
    }
  } else {
    console.log(`[INFO] No GITHUB_TOKEN provided. Generating structured contribution dataset for ${username}.`);
    rawDays = generateMockContributions();
  }

  // Format into 7x53 grid (Sunday=row 0, Saturday=row 6)
  const days: ContributionDay[] = [];
  const weeks: ContributionDay[][] = [];

  // Group by week (up to 53 weeks)
  let currentWeek: ContributionDay[] = [];
  let colIndex = 0;

  rawDays.forEach((day, index) => {
    const d = new Date(day.date);
    const row = d.getDay(); // 0-6

    const cDay: ContributionDay = {
      date: day.date,
      count: day.count,
      level: Math.min(Math.max(day.level, 0), 4),
      col: colIndex,
      row: row
    };

    currentWeek.push(cDay);
    days.push(cDay);

    if (row === 6 || index === rawDays.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
      colIndex++;
    }
  });

  const totalContributions = days.reduce((sum, d) => sum + d.count, 0);

  // Compute SHA-256 Hash for change detection
  const hash = crypto.createHash('sha256').update(JSON.stringify(days)).digest('hex');

  // Check cache
  const cacheDir = path.join(process.cwd(), '.cache');
  const cacheFile = path.join(cacheDir, 'last_contributions_hash.txt');
  
  let updated = true;
  if (fs.existsSync(cacheFile)) {
    const lastHash = fs.readFileSync(cacheFile, 'utf-8').trim();
    if (lastHash === hash) {
      updated = false;
    }
  }

  if (updated) {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(cacheFile, hash, 'utf-8');
  }

  const data: ContributionData = {
    username,
    totalContributions,
    days,
    weeks,
    hash
  };

  return { updated, data };
}

function queryGitHubGraphQL(username: string, token: string): Promise<{ date: string; count: number; level: number }[]> {
  const query = JSON.stringify({
    query: `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                  contributionLevel
                }
              }
            }
          }
        }
      }
    `,
    variables: { username }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'User-Agent': 'Node.js-Snake-Generator',
        'Authorization': `bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(query)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.errors) {
            return reject(json.errors[0].message);
          }
          const weeks = json.data.user.contributionsCollection.contributionCalendar.weeks;
          const result: { date: string; count: number; level: number }[] = [];
          const levelMap: Record<string, number> = {
            'NONE': 0, 'FIRST_QUARTILE': 1, 'SECOND_QUARTILE': 2, 'THIRD_QUARTILE': 3, 'FOURTH_QUARTILE': 4
          };

          weeks.forEach((w: any) => {
            w.contributionDays.forEach((d: any) => {
              result.push({
                date: d.date,
                count: d.contributionCount,
                level: levelMap[d.contributionLevel] || (d.contributionCount > 0 ? 2 : 0)
              });
            });
          });
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(query);
    req.end();
  });
}

export function generateMockContributions(): { date: string; count: number; level: number }[] {
  const days: { date: string; count: number; level: number }[] = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 364);

  // Generate 52 weeks (365 days) with random pseudo-activity
  for (let i = 0; i < 365; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    // Create realistic clusters & streaks
    const rand = Math.random();
    let level = 0;
    let count = 0;

    if (rand > 0.45) {
      level = Math.floor(Math.random() * 4) + 1;
      count = level * 3 + Math.floor(Math.random() * 3);
    }

    days.push({
      date: currentDate.toISOString().split('T')[0],
      count,
      level
    });
  }
  return days;
}
