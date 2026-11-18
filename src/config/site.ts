export interface ProfileLink {
  id: string;
  label: string;
  url: string;
  logo: string;
}

export interface FriendLink {
  id: string;
  nickname: string;
  avatar: string;
  url: string;
  description?: string;
  tags?: string[];
}

interface SiteConfig {
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  siteUrl: string;
  classicUrl: string;
  logo: string;
  language: string;
  townSeed: string;
  profile: {
    name: string;
    avatar: string;
    headline: string;
    bio: string;
    links: ProfileLink[];
  };
  copyright: string;
}

export const siteConfig: SiteConfig = {
  title: "Claran's Blog",
  shortTitle: 'Claran',
  tagline: 'My little home',
  description: 'Claran 的个人博客，记录后端、Agent 与计算机基础。',
  siteUrl: 'https://www.claran-blog.work/',
  classicUrl: 'https://classic.claran-blog.work/',
  logo: '/assets/profile/logo.webp',
  language: 'zh-CN', // 必填：HTML lang 值，例如 zh-CN、en-US。
  townSeed: 'claran-town-v1',
  profile: {
    name: 'Claran',
    avatar: '/assets/profile/avatar.webp',
    headline: '即使愚蠢如我，明天也会到来',
    bio: '一个在写 Go、后端与 Agent 的学生。',
    links: [
      { id: 'github', label: 'GitHub', url: 'https://github.com/Claran309', logo: '/assets/links/github.svg' },
      { id: 'bilibili', label: '哔哩哔哩', url: 'https://space.bilibili.com/313591854', logo: '/assets/links/bilibili.svg' },
      { id: 'rss', label: 'RSS', url: '/rss.xml', logo: '/assets/links/rss.svg' },
    ],
  },
  copyright: '© 2025–2026 Claran',
};

export const friendLinks: FriendLink[] = [
  {
    id: 'maomeng',
    nickname: '猫梦',
    avatar: 'https://avatars.githubusercontent.com/u/221867781?v=4',
    url: 'https://maomengblog.vercel.app/',
    description: '我喜欢你',
    tags: ['Go'],
  },
  {
    id: 'hunxing',
    nickname: '魂星',
    avatar: 'https://avatars.githubusercontent.com/u/223064579?v=4',
    url: 'https://starlight-fall-library.vercel.app/',
    description: '仰望，会有满天繁星',
    tags: ['Go'],
  },
  {
    id: 'rinai',
    nickname: 'Rinai',
    avatar: 'https://avatars.githubusercontent.com/u/185916106?v=4',
    url: 'https://blog.g-rinai.cn/',
    description: '只是一个计算机爱好者',
    tags: ['Go'],
  },
  {
    id: 'canl',
    nickname: 'CanL',
    avatar: 'https://avatars.githubusercontent.com/u/239789803?v=4',
    url: 'https://www.canl-blog.top/',
    description: '向各位大佬靠近中',
    tags: ['Java'],
  },
  {
    id: 'journey-midpoint',
    nickname: '旅途的中点',
    avatar: 'https://avatars.githubusercontent.com/u/218602491?v=4',
    url: 'https://blog.fsui51552.workers.dev/',
    description: '路漫漫，唯有前行',
    tags: ['AI'],
  },
  {
    id: 'buluoge',
    nickname: '补络阁',
    avatar: 'https://avatars.githubusercontent.com/u/122974688?v=4',
    url: 'https://blog.tuf3i.cc/',
    description: '咕咕嘎嘎，咕咕嘎嘎...',
    tags: ['Go', '运维'],
  },
  {
    id: 'sky-garden',
    nickname: '空中花园',
    avatar: 'https://q1.qlogo.cn/g?b=qq&nk=2023270753&s=640',
    url: 'http://blog-manmu.top',
    description: '漫随天外云舒云卷',
    tags: ['Java', 'Go'],
  },
  {
    id: 'heavens-door',
    nickname: '黑蚊子的门',
    avatar: 'https://avatars.githubusercontent.com/u/230580333?v=4',
    url: 'https://www.heavensdoor1.top/',
    description: '真不是蚊子QAQ',
    tags: ['Go', 'Agent'],
  },
  {
    id: 'met-terminator',
    nickname: 'MeTerminator',
    avatar: 'https://blog.met6.top:444/upload/MeT-HEAD_Watermark.jpg?width=800',
    url: 'https://blog.met6.top:444/',
    description: 'Stay Hungry. Stay Foolish. 求知若渴，大智若愚。',
    tags: ['全栈', 'Geek'],
  },
];
