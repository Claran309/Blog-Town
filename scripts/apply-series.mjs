import fs from 'node:fs';
import path from 'node:path';

const postsDir = 'src/content/posts';
const groups = new Map([
  ['走进AI.md', ['Agent 与 RAG', 0]],
  ['RAG详解.md', ['Agent 与 RAG', 1]],
  ['AIM项目总结.md', ['Agent 与 RAG', 2]],
  ['Agent开发者指南.md', ['Agent 与 RAG', 3]],

  ['Go-基础语法知识.md', ['Go 语言基础', 0]],
  ['Go-常用包与函数.md', ['Go 语言基础', 1]],
  ['Go-接口与面向对象.md', ['Go 语言基础', 2]],
  ['Go-错误的处理和传递.md', ['Go 工程实践', 0]],
  ['Go-测试及常见异常.md', ['Go 工程实践', 1]],
  ['Go-项目结构规范&面向接口与依赖注入思想.md', ['Go 工程实践', 2]],

  ['Go-计网，http，JSON和Gin框架.md', ['Go Web 入门', 0]],
  ['Go-hertz框架.md', ['Go Web 入门', 1]],
  ['Go-鉴权与JWT.md', ['Go Web 进阶', 0]],
  ['Go-反向代理和API网关.md', ['Go Web 进阶', 1]],

  ['Go-微服务和kitex框架.md', ['Go 微服务基础', 0]],
  ['微服务注册中心和etcd.md', ['Go 微服务基础', 1]],
  ['Go-服务治理：负载均衡、熔断、限流、服务降级.md', ['Go 微服务基础', 2]],
  ['Go-数据一致性和分布式事务.md', ['Go 分布式实践', 0]],
  ['Go-消息队列.md', ['Go 分布式实践', 1]],

  ['Go-MySQL、gorm和其他关系型数据库.md', ['Go 数据与存储', 0]],
  ['Go-Redis、缓存策略和常见缓存问题.md', ['Go 数据与存储', 1]],
  ['MinIO：完美的对象存储.md', ['Go 数据与存储', 2]],

  ['网盘后端项目的相关功能思路&实现.md', ['Go 项目与架构', 0]],
  ['Go-Demo：用户注册与登录系统.md', ['Go 项目与架构', 1]],
  ['Go-走进领域驱动设计（DDD架构）.md', ['Go 项目与架构', 2]],

  ['Go-goroutine，channel & sync包.md', ['Go 并发', 0]],
  ['Go-协程池.md', ['Go 并发', 1]],

  ['Zap&Viper：标准化日志和配置管理.md', ['Go 日志与可观测', 0]],
  ['Go-可观测性.md', ['Go 日志与可观测', 1]],
  ['Docker基础.md', ['开发环境与工具', 0]],
  ['linux与WSL.md', ['开发环境与工具', 1]],
  ['email包：在Go项目中发送邮件.md', ['开发环境与工具', 2]],

  ['diary1.md', ['大学生活随笔 I', 0]],
  ['diary2.md', ['大学生活随笔 I', 1]],
  ['diary3.md', ['大学生活随笔 I', 2]],
  ['diary4.md', ['大学生活随笔 I', 3]],
  ['diary5.md', ['大学生活随笔 I', 4]],
  ['diary6.md', ['大学生活随笔 II', 0]],
  ['diary7.md', ['大学生活随笔 II', 1]],
  ['diary8.md', ['大学生活随笔 II', 2]],
  ['diary9.md', ['大学生活随笔 II', 3]],

  ['Java-基础语法知识.md', ['Java 入门', 0]],
  ['Java-面向对象与类.md', ['Java 入门', 1]],
]);

const files = fs.readdirSync(postsDir).filter((name) => name.endsWith('.md'));
const seen = new Map();
for (const [file, [series, index]] of groups) {
  const key = `${series}#${index}`;
  if (seen.has(key)) throw new Error(`Duplicate seriesIndex ${key}: ${seen.get(key)} and ${file}`);
  seen.set(key, file);
}

const applied = [];
for (const file of files) {
  const group = groups.get(file);
  if (!group) continue;
  const fullPath = path.join(postsDir, file);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) throw new Error(`Missing frontmatter: ${file}`);
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = match[1].split(/\r?\n/).filter((line) => !/^series(?:Index)?\s*:/.test(line));
  const categoryIndex = lines.findIndex((line) => /^category\s*:/.test(line));
  const insertAt = categoryIndex >= 0 ? categoryIndex + 1 : lines.length;
  lines.splice(insertAt, 0, `series: ${JSON.stringify(group[0])}`, `seriesIndex: ${group[1]}`);
  applied.push({ file, series: group[0], seriesIndex: group[1] });
  fs.writeFileSync(fullPath, `---${eol}${lines.join(eol)}${eol}---${eol}${raw.slice(match[0].length)}`);
}

const standalone = files.filter((file) => !groups.has(file));
console.log(JSON.stringify({ applied: applied.length, standalone, seriesCount: new Set(applied.map((item) => item.series)).size }, null, 2));
