// P2 归因深化引擎：钩子效能（哪类钩子在这个赛道真的爆）+
// 选题 Gap（哪个方向供给少需求大）+ 选题清单（下周拍什么）。
// 全部规则驱动，无 LLM 也能跑。
import { engageShape } from "./pool.ts";
import { classifyHook, HOOK_LABELS, type HookType } from "./hooks.ts";
import { rankPool } from "./match.ts";
import type { Note } from "./types.ts";

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** 数组分位（0-100） */
function percentile(values: number[], v: number): number {
  if (!values.length) return 0;
  const below = values.filter((x) => x <= v).length;
  return Math.round((below / values.length) * 100);
}

// ---------- 钩子效能 ----------

export interface HookPerf {
  hook: HookType;
  label: string;
  count: number;
  /** 组内互动中位数（总互动 = 赞+藏+评+享） */
  medianEngage: number;
  /** 平均收藏/点赞比 —— 高则适合干货攻略 */
  collectTilt: number;
  /** 平均评论/点赞比 —— 高则适合观点争议 */
  commentTilt: number;
  /** 一句话用法建议 */
  verdict: string;
}

export function hookPerformance(notes: Note[]): HookPerf[] {
  const groups = new Map<HookType, Note[]>();
  for (const n of notes) {
    const h = classifyHook(n.title);
    const arr = groups.get(h) ?? [];
    arr.push(n);
    groups.set(h, arr);
  }
  const out: HookPerf[] = [];
  for (const [hook, arr] of groups) {
    const shapes = arr.map((n) => engageShape(n));
    const collectTilt = shapes.reduce((s, e) => s + e.collectPerLike, 0) / shapes.length;
    const commentTilt = shapes.reduce((s, e) => s + e.commentPerLike, 0) / shapes.length;
    out.push({
      hook,
      label: HOOK_LABELS[hook],
      count: arr.length,
      medianEngage: median(shapes.map((e) => e.totalEngage)),
      collectTilt,
      commentTilt,
      verdict: hookVerdict(arr.length, collectTilt, commentTilt),
    });
  }
  return out.sort((a, b) => b.medianEngage - a.medianEngage);
}

function hookVerdict(count: number, c: number, m: number): string {
  if (count < 4) return `样本少（${count} 条），谨慎参考`;
  if (m >= 0.45) return "评论互动强 —— 适合观点/争议型切入";
  if (c >= 0.8) return "收藏转化强 —— 适合攻略/清单型切入";
  return "均衡型 —— 配情绪共鸣封面更稳";
}

// ---------- 选题 Gap ----------

export interface KeywordGap {
  keyword: string;
  count: number;
  medianEngage: number;
  /** 组内最好一条的总互动 */
  topEngage: number;
  /** 需求分位：互动中位数在全部方向中的位置 */
  demand: number;
  /** 供给分位：内容条数在全部方向中的位置 */
  saturation: number;
  status: "saturated" | "opportunity" | "balanced";
}

export function keywordGaps(notes: Note[]): KeywordGap[] {
  const groups = new Map<string, Note[]>();
  for (const n of notes) {
    for (const kw of n.keyword.split("|").filter(Boolean)) {
      const arr = groups.get(kw) ?? [];
      arr.push(n);
      groups.set(kw, arr);
    }
  }
  const rows: KeywordGap[] = [];
  for (const [keyword, arr] of groups) {
    const engages = arr.map((n) => engageShape(n).totalEngage);
    rows.push({
      keyword,
      count: arr.length,
      medianEngage: median(engages),
      topEngage: Math.max(...engages),
      demand: 0,
      saturation: 0,
      status: "balanced",
    });
  }
  const demands = rows.map((r) => r.medianEngage);
  const counts = rows.map((r) => r.count);
  for (const r of rows) {
    r.demand = percentile(demands, r.medianEngage);
    r.saturation = percentile(counts, r.count);
    r.status =
      r.saturation >= 70 && r.demand <= 50
        ? "saturated"
        : r.demand >= 60 && r.saturation <= 50
          ? "opportunity"
          : "balanced";
  }
  return rows.sort((a, b) => b.demand - a.demand);
}

// ---------- 选题清单 ----------

export const HOOK_ADVICE: Record<HookType, string> = {
  number: "标题前置数字：「8 条隐藏通道」「2026 赛事大盘」，数量承诺驱动点击",
  suspense: "留缺口：「还不知道 72h 后…」式半掩信息，封面配悬念表情",
  identity: "点名人群开头：「竞赛生家长必看」「普娃也能…」，让读者对号入座",
  contrast: "反常识切入：「劝你别学信奥赛」「竞赛 ≠ 升学保险」，用冲突换评论",
  authority: "背书词前置 6 字：清北 / 金牌 / 省一 / 官方，蹭确定性",
  howto: "干货承诺：「一图看懂」「全汇总」「速码」，配可收藏的清单封面",
  plain: "避免平铺直叙 —— 同赛道 1/3 内容无钩子，加一层即可跳出同质化",
};

export interface TopicIdea {
  keyword: string;
  hook: HookType;
  hookLabel: string;
  advice: string;
  reason: string;
  priority: "高" | "中" | "低";
  score: number;
  reference: { title: string; author: string; matchScore: number; engage: string } | null;
}

export function buildTopics(notes: Note[], topN = 6): TopicIdea[] {
  const gaps = keywordGaps(notes);
  const globalHooks = hookPerformance(notes).filter((h) => h.count >= 4);
  const bestGlobal = globalHooks[0]?.hook ?? "number";
  const ranked = rankPool(notes, "efficiency");

  const eligible = gaps
    .filter((g) => g.status !== "saturated")
    .sort((a, b) => b.demand - a.demand);

  return eligible.slice(0, topN).map((g) => {
    const kwNotes = notes.filter((n) => n.keyword.split("|").includes(g.keyword));
    const kwHooks = hookPerformance(kwNotes).filter((h) => h.count >= 3);
    const hook = kwHooks[0]?.hook ?? bestGlobal;
    const kwRanked = ranked.filter(
      (r) => r.keyword.split("|").includes(g.keyword) && r.noteType === "image_text",
    );
    const ref = kwRanked.sort((a, b) => b.matchScore - a.matchScore)[0] ?? null;
    return {
      keyword: g.keyword,
      hook,
      hookLabel: HOOK_LABELS[hook],
      advice: HOOK_ADVICE[hook],
      reason: `方向互动中位数 ${g.medianEngage}（全赛道第 ${g.demand} 分位），现有内容仅 ${g.count} 条 —— 需求有验证、供给不拥挤。此方向下「${HOOK_LABELS[hook]}」开场效果最好。`,
      priority: g.demand >= 70 ? "高" : g.demand >= 45 ? "中" : "低",
      score: g.demand,
      reference: ref
        ? {
            title: ref.title || "（无标题图文）",
            author: ref.author,
            matchScore: ref.matchScore,
            engage: `赞 ${ref.likes} · 藏 ${ref.collects} · 评 ${ref.comments}`,
          }
        : null,
    };
  });
}
