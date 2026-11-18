type CommentConfig = {
  enabled: boolean;
  envId: string;
  language: string;
};

export const commentConfig: CommentConfig = {
  enabled: true,
  envId: 'https://blog-twikoo-snowy.vercel.app/',
  language: 'zh-CN',
};
