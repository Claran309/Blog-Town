import { useEffect, useRef, useState, type RefObject } from 'react';
import { commentConfig } from '../config/comments';

type Status = 'waiting' | 'ready' | 'error';
type TwikooInstance = {
  init: (options: {
    envId: string;
    el: HTMLElement;
    path: string;
    lang: string;
  }) => Promise<void>;
};
type TwikooWindow = Window & { twikoo?: TwikooInstance };

let twikooScript: Promise<TwikooInstance> | undefined;

function loadTwikoo() {
  const current = (window as TwikooWindow).twikoo;
  if (current) return Promise.resolve(current);
  if (twikooScript) return twikooScript;

  twikooScript = new Promise<TwikooInstance>((resolve, reject) => {
    const finish = () => {
      const twikoo = (window as TwikooWindow).twikoo;
      if (twikoo) resolve(twikoo);
      else reject(new Error('Twikoo did not initialize'));
    };
    const existing = document.querySelector<HTMLScriptElement>('script[data-twikoo-loader]');
    if (existing) {
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener('error', () => reject(new Error('Twikoo failed to load')), { once: true });
      if ((window as TwikooWindow).twikoo) finish();
      return;
    }
    const script = document.createElement('script');
    script.src = '/assets/js/twikoo.all.min.js';
    script.async = true;
    script.dataset.twikooLoader = 'true';
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => reject(new Error('Twikoo failed to load')), { once: true });
    document.head.append(script);
  }).catch((error) => {
    twikooScript = undefined;
    throw error;
  });

  return twikooScript;
}

type Props = {
  postId: string;
  commentPath?: string;
  title: string;
  colorMode?: 'day' | 'night';
  scrollRoot?: RefObject<HTMLElement | null>;
  heading?: string;
  intro?: string;
};

export default function ArticleComments({ postId, commentPath, title, colorMode = 'day', scrollRoot, heading = '评论', intro = '欢迎留下想法或问题。这里承接旧站已有评论。' }: Props) {
  const containerRef = useRef<HTMLElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('waiting');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const mount = mountRef.current;
    if (!commentConfig.enabled || !container || !mount) return;

    let disposed = false;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      setStatus('waiting');
      mount.replaceChildren();
      void loadTwikoo()
        .then((twikoo) => twikoo.init({
          envId: commentConfig.envId,
          el: mount,
          path: commentPath ?? `/${postId}`,
          lang: commentConfig.language,
        }))
        .then(() => {
          if (!disposed) setStatus('ready');
        })
        .catch(() => {
          if (!disposed) setStatus('error');
        });
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        start();
      }
    }, { root: scrollRoot?.current ?? null, rootMargin: '400px 0px' });
    observer.observe(container);

    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [attempt, commentPath, postId, scrollRoot]);

  if (!commentConfig.enabled) return null;
  return <section ref={containerRef} id="article-comments" className="article-comments" data-color-mode={colorMode} aria-labelledby="article-comments-title">
    <header className="article-comments-heading"><h2 id="article-comments-title">{heading}</h2><a href="https://github.com/Claran309" target="_blank" rel="noreferrer noopener">留言与讨论 <span aria-hidden="true">↗</span></a></header>
    <p className="article-comments-intro">{intro}</p>
    <div className="article-comments-widget" aria-busy={status === 'waiting'}>
      {status === 'waiting' && <p className="article-comments-status" role="status">正在加载评论…</p>}
      {status === 'error' && <div className="article-comments-status" role="status"><p>评论暂时无法加载，请稍后重试。</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>重新加载</button></div>}
      <div ref={mountRef} className="twikoo-mount" aria-label={`${title} 的评论`} style={{ opacity: status === 'ready' ? 1 : 0, pointerEvents: status === 'ready' ? undefined : 'none' }} />
    </div>
  </section>;
}
