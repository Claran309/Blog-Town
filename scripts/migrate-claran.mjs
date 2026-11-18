import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import sharp from 'sharp';

const srcRoot = 'D:/CodeStudy/GoProjects/src/AstroClaranBlog/mizuki';
const destRoot = 'D:/CodeStudy/GoProjects/src/AstroClaranBlog/town-personal';
const srcPosts = path.join(srcRoot, 'src/content/posts');
const destPosts = path.join(destRoot, 'src/content/posts');
const coverSrc = path.join(srcRoot, 'src/content/posts/cover');
const coverDest = path.join(destRoot, 'public/assets/posts/covers');

fs.mkdirSync(destPosts, { recursive: true });
fs.mkdirSync(coverDest, { recursive: true });

const files = fs.readdirSync(srcPosts).filter((name) => name.endsWith('.md'));
const coverNames = new Set();
const bodyReferences = new Set();
const missing = [];
const posts = [];

const convertRawHeadings = (body) => body
  .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g)
  .map((part, index) => index % 2 === 1 ? part : part.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g, (_match, level, text) => `${'#'.repeat(Number(level))} ${text.trim()}`))
  .join('');

const normalizeBody = (body) => {
  let next = body
    .replaceAll('/images/albums/blogAlbum/%E5%9F%BA%E5%8C%BB/', '/images/img/%E5%9F%BA%E5%8C%BB/')
    .replaceAll('/images/albums/blogAlbum/基医/', '/images/img/基医/');
  next = convertRawHeadings(next);
  return next;
};

for (const file of files) {
  const raw = fs.readFileSync(path.join(srcPosts, file), 'utf8');
  const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!frontmatter) {
    missing.push(`NO FRONTMATTER: ${file}`);
    continue;
  }
  const meta = YAML.parse(frontmatter[1]) ?? {};
  const body = normalizeBody(raw.slice(frontmatter[0].length));
  const sourcePermalink = String(meta.permalink || path.basename(file, '.md'));
  const townId = sourcePermalink === 'go-viper&zap' ? 'go-viper-zap' : sourcePermalink;
  const rawDate = meta.date || meta.published;
  const date = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : String(rawDate);

  let cover;
  if (typeof meta.image === 'string' && meta.image.trim()) {
    const image = meta.image.trim();
    if (image.startsWith('./cover/')) {
      const base = path.basename(image, path.extname(image));
      cover = `/assets/posts/covers/${base}.webp`;
      coverNames.add(base);
    } else if (image.startsWith('/')) {
      cover = image;
    } else {
      missing.push(`UNSUPPORTED COVER ${file}: ${image}`);
    }
  }

  const nextMeta = {
    townId,
    title: meta.title,
    description: meta.description || '',
    category: meta.category || '未分类',
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    date,
    draft: Boolean(meta.draft),
    ...(cover ? { cover, coverAlt: meta.title } : {}),
    ...(meta.updatedAt ? { updatedAt: meta.updatedAt } : {}),
  };

  fs.writeFileSync(
    path.join(destPosts, file),
    `---\n${YAML.stringify(nextMeta, { lineWidth: 0 })}---\n${body}`,
    'utf8',
  );
  posts.push({ file, townId, draft: nextMeta.draft, date, cover: cover || '' });

  for (const match of body.matchAll(/!\[[^\]]*\]\((\/[^)\s]+)\)/g)) bodyReferences.add(match[1].split('?')[0]);
  for (const match of body.matchAll(/(?:src|href)=["'](\/[^"']+)["']/g)) bodyReferences.add(match[1].split('?')[0]);
}

let coverBefore = 0;
let coverAfter = 0;
for (const base of coverNames) {
  const source = ['.png', '.jpg', '.jpeg', '.webp']
    .map((extension) => path.join(coverSrc, `${base}${extension}`))
    .find((candidate) => fs.existsSync(candidate));
  if (!source) {
    missing.push(`MISSING COVER: ${base}`);
    continue;
  }
  const output = path.join(coverDest, `${base}.webp`);
  await sharp(source)
    .resize({ width: 1280, height: 720, fit: 'cover', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(output);
  coverBefore += fs.statSync(source).size;
  coverAfter += fs.statSync(output).size;
}

let copied = 0;
let copiedBytes = 0;
for (const reference of bodyReferences) {
  let decoded;
  try {
    decoded = decodeURIComponent(reference);
  } catch {
    missing.push(`INVALID URL: ${reference}`);
    continue;
  }
  const relative = decoded.replace(/^\//, '').replaceAll('/', path.sep);
  let source = path.join(srcRoot, 'public', relative);
  let destination = path.join(destRoot, 'public', relative);

  if (reference === '/images/albums/blogAlbum/observability9.png') {
    source = path.join(srcRoot, 'public/assets/home/observability9.png');
    destination = path.join(destRoot, 'public/images/albums/blogAlbum/observability9.png');
  }

  if (!fs.existsSync(source)) {
    missing.push(`MISSING BODY IMAGE: ${reference}`);
    continue;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  copied += 1;
  copiedBytes += fs.statSync(source).size;
}

const report = {
  posts: posts.length,
  drafts: posts.filter((post) => post.draft).length,
  published: posts.filter((post) => !post.draft).length,
  uniqueTownIds: new Set(posts.map((post) => post.townId)).size,
  covers: coverNames.size,
  coverBeforeMB: +(coverBefore / 1048576).toFixed(1),
  coverAfterMB: +(coverAfter / 1048576).toFixed(1),
  bodyImagesCopied: copied,
  bodyImagesMB: +(copiedBytes / 1048576).toFixed(1),
  missing,
};

fs.writeFileSync(path.join(destRoot, 'migration-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
