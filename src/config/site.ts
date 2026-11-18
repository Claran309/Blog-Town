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
  siteUrl: 'https://claran-blog.work/',
  classicUrl: 'https://classic.claran-blog.work/',
  logo: '/assets/profile/logo.webp',
  language: 'zh-CN', // 必填：HTML lang 值，例如 zh-CN、en-US。
  townSeed: 'claran-town-v1',
  profile: {
    name: 'Claran',
    avatar: '/assets/profile/avatar.webp',
    headline: '接受所有改变，继续心中祈愿',
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
  // 可选：友链。每位友邻单独占一行；启用时删除行首 //，并把头像或站点 Logo 放入 public/assets/friends/。
  // { id: 'friend-id', nickname: '友邻名称', avatar: '/assets/friends/friend-id.png', url: 'https://friend.example.com/', description: '可选的友邻简介' },
];
