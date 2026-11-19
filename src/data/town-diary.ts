export type DiaryMood = '平静' | '开心' | '疲惫' | '期待' | '感慨';

export interface DiaryEntry {
  id: string;
  /** ISO date, used for ordering and grouping by month. */
  date: string;
  content: string;
  images?: { src: string; alt: string; width: number; height: number }[];
  location?: string;
  mood?: DiaryMood;
}

/**
 * Short notes, kept deliberately separate from articles: they never become
 * town buildings, never enter the article archive, and never appear in RSS.
 * Migrated from the classic blog's diary page.
 */
export const diaryEntries: DiaryEntry[] = [
  {
    id: 'diary-1',
    date: '2025-10-17',
    content: '博客搭好啦！目前是 Hexo + Next 主题。',
    images: [{ src: '/assets/diary/old-blog.webp', alt: '第一版博客的首页截图', width: 1280, height: 800 }],
    mood: '开心',
  },
  {
    id: 'diary-2',
    date: '2025-12-17',
    content: '开始摆了……',
    mood: '平静',
  },
  {
    id: 'diary-3',
    date: '2026-02-01',
    content: '回来了！',
    mood: '开心',
  },
  {
    id: 'diary-4',
    date: '2026-02-28',
    content: '把博客迁移到了 Astro & Mizuki 下，现在不仅界面更美观，功能更多，性能也更高了~ ^v^',
    images: [{ src: '/assets/diary/new-blog.webp', alt: '迁移到 Astro 后的博客首页', width: 1280, height: 725 }],
    mood: '期待',
  },
  {
    id: 'diary-5',
    date: '2026-03-02',
    content: '汪神 mo 神 T 神 Met 神欧神还有隐藏大神们各路神仙都已经飞天遁地了，只有我才刚开始微服务的学习，加油吧😭',
    mood: '疲惫',
  },
  {
    id: 'diary-6',
    date: '2026-04-03',
    content: '搞了一个 astrbot，部署完了放在舟友群当赛博女鬼（普瑞赛斯），先租一个月服务器再说。',
    mood: '开心',
  },
  {
    id: 'diary-7',
    date: '2026-04-07',
    content: 'JetBrains 学生认证没了，转 VSCode 了，各种感觉都比较新奇。',
    mood: '平静',
  },
  {
    id: 'diary-8',
    date: '2026-05-07',
    content: '音律联觉之旅将成为我这一生中最重要的回忆之一……',
    images: [{ src: '/assets/diary/ark-music.webp', alt: '音律联觉现场', width: 1280, height: 960 }],
    location: '上海',
    mood: '感慨',
  },
  {
    id: 'diary-9',
    date: '2026-05-20',
    content: '1 元 = 10 刀的中转站还是太香了，这价格还要啥非注水模型，猛蹬 10 亿 Token（Vibe Coding 就是冰有没有懂得）。',
    images: [{ src: '/assets/diary/billion-token.webp', alt: '十亿 Token 用量截图', width: 1280, height: 144 }],
    mood: '感慨',
  },
];

export const sortedDiaryEntries = () =>
  [...diaryEntries].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

export const groupDiaryByMonth = (entries: DiaryEntry[]) => {
  const groups: { key: string; label: string; entries: DiaryEntry[] }[] = [];
  for (const entry of entries) {
    const date = new Date(entry.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`;
    const last = groups.at(-1);
    if (last?.key === key) last.entries.push(entry);
    else groups.push({ key, label, entries: [entry] });
  }
  return groups;
};
