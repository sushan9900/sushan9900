export interface ThemeColors {
  background: string;
  gridEmpty: string;
  gridL1: string;
  gridL2: string;
  gridL3: string;
  gridL4: string;
  snake1Head: string;
  snake1Body: string;
  snake2Head: string;
  snake2Body: string;
  snake3Head: string;
  snake3Body: string;
  particleColors: string[];
  border: string;
  text: string;
}

export const themes: Record<string, { dark: ThemeColors; light: ThemeColors }> = {
  cyberpunk: {
    dark: {
      background: '#0d1117',
      gridEmpty: '#161b22',
      gridL1: '#0e4429',
      gridL2: '#006d32',
      gridL3: '#26a641',
      gridL4: '#39d353',
      snake1Head: '#a855f7', // Cyber Violet
      snake1Body: '#7c3aed',
      snake2Head: '#06b6d4', // Electric Cyan
      snake2Body: '#0891b2',
      snake3Head: '#f59e0b', // Solar Amber
      snake3Body: '#d97706',
      particleColors: ['#a855f7', '#06b6d4', '#39d353', '#f59e0b'],
      border: '#3b0764',
      text: '#cbd5e1'
    },
    light: {
      background: '#ffffff',
      gridEmpty: '#ebedf0',
      gridL1: '#9be9a8',
      gridL2: '#40c463',
      gridL3: '#30a14e',
      gridL4: '#216e39',
      snake1Head: '#9333ea',
      snake1Body: '#c084fc',
      snake2Head: '#0284c7',
      snake2Body: '#38bdf8',
      snake3Head: '#d97706',
      snake3Body: '#fbbf24',
      particleColors: ['#9333ea', '#0284c7', '#216e39', '#d97706'],
      border: '#e2e8f0',
      text: '#1e293b'
    }
  },
  minimalist: {
    dark: {
      background: '#0f172a',
      gridEmpty: '#1e293b',
      gridL1: '#334155',
      gridL2: '#475569',
      gridL3: '#64748b',
      gridL4: '#94a3b8',
      snake1Head: '#38bdf8',
      snake1Body: '#0284c7',
      snake2Head: '#818cf8',
      snake2Body: '#4f46e5',
      snake3Head: '#f472b6',
      snake3Body: '#db2777',
      particleColors: ['#38bdf8', '#818cf8', '#f472b6'],
      border: '#334155',
      text: '#f8fafc'
    },
    light: {
      background: '#f8fafc',
      gridEmpty: '#e2e8f0',
      gridL1: '#cbd5e1',
      gridL2: '#94a3b8',
      gridL3: '#64748b',
      gridL4: '#334155',
      snake1Head: '#0284c7',
      snake1Body: '#38bdf8',
      snake2Head: '#4f46e5',
      snake2Body: '#818cf8',
      snake3Head: '#db2777',
      snake3Body: '#f472b6',
      particleColors: ['#0284c7', '#4f46e5', '#db2777'],
      border: '#cbd5e1',
      text: '#0f172a'
    }
  }
};
