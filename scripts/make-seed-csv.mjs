// 生成种子 CSV：从 _ref/xhs-pool.json（小红书搜索采集 149 条）清洗归一后输出。
// 用法: node scripts/make-seed-csv.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const SRC = new URL("../../_ref/xhs-pool.json", import.meta.url);
const OUT = new URL("../data/samples/jingsai-shengxue-pool.csv", import.meta.url);

const pool = JSON.parse(readFileSync(SRC, "utf8"));

// '1.2万' → 12000
const parseCn = (s) => {
  if (!s) return 0;
  const m = String(s).match(/^([\d.]+)(万)?$/);
  return m ? Math.round(parseFloat(m[1]) * (m[2] ? 10000 : 1)) : 0;
};

// 日期归一（采集日 2026-11-25）：'2025-11-21' / '11-10'(年内省年) / '4天前' / '3小时前' / '昨天'
const TODAY = new Date("2026-11-25T12:00:00+08:00");
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function normDate(d) {
  if (!d) return "";
  let m;
  if ((m = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  if ((m = d.match(/^(\d{1,2})-(\d{1,2})$/))) return `2026-${pad(m[1])}-${pad(m[2])}`;
  if ((m = d.match(/^(\d+)\s*天前$/))) return ymd(new Date(TODAY - 86400000 * m[1]));
  if ((m = d.match(/^(\d+)\s*小时前$/))) return ymd(new Date(TODAY - 3600000 * m[1]));
  if ((m = d.match(/^(\d+)\s*分钟前$/))) return ymd(new Date(TODAY - 60000 * m[1]));
  if (d === "今天") return ymd(TODAY);
  if (d === "昨天") return ymd(new Date(TODAY - 86400000));
  return "";
}

const q = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;

const rows = pool.map((r) => ({
  note_id: r.id,
  keyword: r.keywords.join("|"),
  title: (r.title || "").replace(/\s+/g, " ").trim(),
  note_type: r.type === "video" ? "video" : "image_text",
  author: r.author,
  author_id: r.authorId,
  likes: parseCn(r.likedCount),
  collects: parseCn(r.collectedCount),
  comments: parseCn(r.commentCount),
  shares: parseCn(r.sharedCount),
  publish_date: normDate(r.publishTime),
  publish_time_raw: r.publishTime,
}));

// 清洗校验
const bad = rows.filter((r) => !r.note_id || !r.author);
const dup = rows.length - new Set(rows.map((r) => r.note_id)).size;
const noDate = rows.filter((r) => !r.publish_date).length;
console.log(`rows=${rows.length} bad=${bad.length} dup=${dup} noDate=${noDate}`);
if (bad.length) process.exit(1);

const header = "note_id,keyword,title,note_type,author,author_id,likes,collects,comments,shares,publish_date,publish_time_raw";
const csv = [header, ...rows.map((r) =>
  [r.note_id, q(r.keyword), q(r.title), r.note_type, q(r.author), r.author_id,
   r.likes, r.collects, r.comments, r.shares, r.publish_date, q(r.publish_time_raw)].join(",")
)].join("\n");

mkdirSync(new URL("../data/samples/", import.meta.url), { recursive: true });
writeFileSync(OUT, "\ufeff" + csv);
console.log(`written: ${OUT.pathname} (${(csv.length / 1024).toFixed(1)} KB)`);
