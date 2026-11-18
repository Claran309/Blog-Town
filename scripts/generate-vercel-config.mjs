import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const srcRoot = 'D:/CodeStudy/GoProjects/src/AstroClaranBlog/mizuki';
const srcPosts = path.join(srcRoot, 'src/content/posts');
const oldDistPosts = path.join(srcRoot, 'dist/posts');
const classic = 'https://classic.claran-blog.work';

const files = fs.readdirSync(srcPosts).filter((name) => name.endsWith('.md'));
const sourceByFile = new Map();
for (const file of files) {
  const raw = fs.readFileSync(path.join(srcPosts, file), 'utf8');
  const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) continue;
  const meta = YAML.parse(frontmatter[1]) ?? {};
  if (meta.draft) continue;
  const permalink = String(meta.permalink || path.basename(file, '.md'));
  const townId = permalink === 'go-viper&zap' ? 'go-viper-zap' : permalink;
  sourceByFile.set(path.basename(file, '.md').toLowerCase(), { permalink, townId });
}

const redirects = [];
const seen = new Set();
const addRedirect = (source, destination) => {
  if (!source || !destination || source === destination || seen.has(source)) return;
  seen.add(source);
  redirects.push({ source, destination, permanent: true });
};

for (const { permalink, townId } of sourceByFile.values()) {
  addRedirect(`/${encodeURIComponent(permalink)}/`, `/posts/${encodeURIComponent(townId)}/`);
  if (permalink !== encodeURIComponent(permalink)) {
    addRedirect(`/${permalink}/`, `/posts/${encodeURIComponent(townId)}/`);
  }
}

if (fs.existsSync(oldDistPosts)) {
  for (const directory of fs.readdirSync(oldDistPosts, { withFileTypes: true })) {
    if (!directory.isDirectory()) continue;
    const mapped = sourceByFile.get(directory.name.toLowerCase());
    if (mapped) addRedirect(`/posts/${encodeURIComponent(directory.name)}/`, `/posts/${encodeURIComponent(mapped.townId)}/`);
  }
}

for (const feature of ['albums', 'anime', 'diary', 'devices', 'projects', 'about', 'friends', 'links']) {
  addRedirect(`/${feature}`, `${classic}/${feature}/`);
  addRedirect(`/${feature}/`, `${classic}/${feature}/`);
  addRedirect(`/${feature}/:path*`, `${classic}/${feature}/:path*`);
}

addRedirect('/archive/', '/posts/');
addRedirect('/atom.xml', '/rss.xml');
addRedirect('/atom/', '/rss.xml');
addRedirect('/rss/', '/rss.xml');
addRedirect('/sitemap-index.xml', '/sitemap.xml');

const config = {
  framework: 'astro',
  buildCommand: 'npm run build',
  installCommand: 'npm ci',
  outputDirectory: 'dist',
  trailingSlash: true,
  headers: [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
    {
      source: '/_astro/(.*)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/assets/(.*)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=604800' }],
    },
    {
      source: '/rss-assets/(.*)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
  ],
  redirects,
};

fs.writeFileSync('vercel.json', `${JSON.stringify(config, null, 2)}\n`);
console.log(JSON.stringify({ redirects: redirects.length, first: redirects.slice(0, 5) }, null, 2));
