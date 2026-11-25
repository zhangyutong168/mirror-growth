// P3 热点雷达引擎：
// 热点 = 这条内容的表现超过「它作者自己的基线」N 倍（洞察 2：绝对数据高 ≠ 热点）。
// 单批快照即可出「相对热点」（作者内对比）；多批快照后可叠加「增速信号」。
import { engageShape } from "./pool.ts";
import { classifyHook, HOOK_LABELS, type HookType } from "./hooks.ts";
import type { Note } from "./types.ts";

/** 单批快照（一次采集 = 一个 batch。批次间隔 ≥1 天才能算增速） */
export interface Batch {
  batchId: string; // "2026-11-25"
  fetchedAt: string; // ISO date
  notes: Note[];
}

export interface HotItem {
  note: Note;
  /** 基线模式：author = 作者自身基线（可信）；track = 赛道兜底（单批降级） */
  baselineMode: "author" | "track";
  /** 基线值（作者中位或赛道中位） */
  baseline: number;
  /** 作者池内总互动（author 模式下有值） */
  authorTotal?: number;
  /** 作者池内单条中位互动 */
  authorMedian?: number;
  /** 本条 / 基线 的倍数 */
  ratio: number;
  /** 该作者在池内有几条（基数太小的倍数不可信） */
  authorNoteCount: number;
  /** 钩子归类 */
  hook: HookType;
  hookLabel: string;
  /** 热点分 0-100：log 倍数 × 基数可信度加权 */
  hotScore: number;
  /** 窗口期：发布日距今 */
  ageDays: number | null;
  window: "fresh" | "rising" | "closing";
  windowLabel: string;
}

export interface RadarResult {
  items: HotItem[];
  /** 参与基线计算的作者数 */
  authorsConsidered: number;
  /** 因样本不足被排除的作者数（只有 1 条且 0 互动等） */
  authorsSkipped: number;
  /** 批次信息（单批 = 无增速信号） */
  batchCount: number;
  latestBatchDate: string;
  notice: string;
}

const NOW = new Date("2026-11-25T12:00:00+08:00");

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function ageInDays(publishDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishDate)) return null;
  const d = new Date(publishDate + "T12:00:00+08:00");
  const diff = (NOW.getTime() - d.getTime()) / 86400000;
  return diff >= 0 ? Math.round(diff) : 0;
}

function windowOf(ageDays: number | null): { window: HotItem["window"]; label: string } {
  if (ageDays === null) return { window: "rising", label: "时间未知 · 按跟进中处理" };
  if (ageDays <= 2) return { window: "fresh", label: `首发 ${ageDays} 天内 · 可跟（越快越好）` };
  if (ageDays <= 7) return { window: "rising", label: `已 ${ageDays} 天 · 须换角度再进场` };
  return { window: "closing", label: `已 ${ageDays} 天 · 过窗，留选题不追热点` };
}

/**
 * 从 1..n 个批次中检测热点。
 * 单批：热点 = 作者内倍数异常；多批：优先算跨批增速（新增互动 / 存量互动）。
 */
export function detectHot(batches: Batch[], minRatio = 3, topN = 12): RadarResult {
  // 合并去重（同一笔记多次采集取最新批次的数字；快照 diff 在 P3-2 扩展）
  const byId = new Map<string, Note>();
  const batchDates = batches.map((b) => b.fetchedAt).sort();
  for (const b of batches) {
    for (const n of b.notes) {
      const prev = byId.get(n.noteId);
      if (!prev || n.likes + n.collects + n.comments + n.shares >=
          prev.likes + prev.collects + prev.comments + prev.shares) {
        byId.set(n.noteId, n);
      }
    }
  }
  const notes = [...byId.values()];

  // 作者基线
  const byAuthor = new Map<string, Note[]>();
  for (const n of notes) {
    if (!n.authorId) continue;
    const arr = byAuthor.get(n.authorId) ?? [];
    arr.push(n);
    byAuthor.set(n.authorId, arr);
  }

  const items: HotItem[] = [];
  let authorsSkipped = 0;
  let authorsWithBaseline = 0;
  const covered = new Set<string>(); // 已按作者基线输出的笔记
  for (const [, arr] of byAuthor) {
    if (arr.length < 2) {
      authorsSkipped++;
      continue; // 单条笔记无法建立作者基线
    }
    const engages = arr.map((n) => {
      const e = engageShape(n);
      return e.totalEngage;
    });
    const authorMedian = median(engages);
    if (authorMedian <= 0) {
      authorsSkipped++;
      continue;
    }
    authorsWithBaseline++;
    const authorTotal = engages.reduce((s, x) => s + x, 0);
    for (const n of arr) {
      const total = engageShape(n).totalEngage;
      const ratio = total / authorMedian;
      if (ratio < minRatio) continue;
      covered.add(n.noteId);
      const ageDays = ageInDays(n.publishDate);
      const w = windowOf(ageDays);
      items.push({
        note: n,
        baselineMode: "author",
        baseline: authorMedian,
        authorTotal,
        authorMedian,
        ratio: Math.round(ratio * 10) / 10,
        authorNoteCount: arr.length,
        hook: classifyHook(n.title),
        hookLabel: HOOK_LABELS[classifyHook(n.title)],
        hotScore: Math.min(100, Math.round(Math.log2(ratio) * 18 + Math.min(arr.length, 6) * 2)),
        ageDays,
        window: w.window,
        windowLabel: w.label,
      });
    }
  }

  // 赛道兜底（单批 + 作者样本不足时的降级）：
  // 剩余笔记（作者无基线的）按赛道整体分布找「绝对异常」—— p90 以上的高互动 + 高结构信号。
  const needFallback = authorsWithBaseline === 0 || items.length < 4;
  if (needFallback) {
    const trackEngages = notes.map((n) => engageShape(n).totalEngage).sort((a, b) => a - b);
    const p90 = trackEngages[Math.floor(trackEngages.length * 0.9)] ?? 0;
    const trackMedian = median(trackEngages);
    for (const n of notes) {
      if (covered.has(n.noteId)) continue;
      const total = engageShape(n).totalEngage;
      if (p90 <= 0 || total < p90) continue;
      const ratio = total / Math.max(1, trackMedian);
      const ageDays = ageInDays(n.publishDate);
      const w = windowOf(ageDays);
      items.push({
        note: n,
        baselineMode: "track",
        baseline: trackMedian,
        ratio: Math.round(ratio * 10) / 10,
        authorNoteCount: byAuthor.get(n.authorId)?.length ?? 1,
        hook: classifyHook(n.title),
        hookLabel: HOOK_LABELS[classifyHook(n.title)],
        hotScore: Math.min(100, Math.round(Math.log2(Math.max(1, ratio)) * 14 + 20)),
        ageDays,
        window: w.window,
        windowLabel: w.label,
      });
    }
  }
  items.sort((a, b) => b.hotScore - a.hotScore);

  const batchCount = batches.length;
  const notice =
    authorsWithBaseline === 0
      ? "本批快照里没有作者的 ≥2 条笔记，无法建立作者基线 —— 已降级为「赛道基线」（互动 p90 异常）。多批采集 + 同作者多次出现后自动升级。"
      : needFallback
        ? `${authorsWithBaseline} 位作者建立了自身基线，但异常条目不足 4 条 —— 本页热点已改用「赛道基线」兜底（p90 异常）。多批采集后自动升级。`
        : `${authorsWithBaseline} 位作者建立了自身基线${authorsSkipped ? `，${authorsSkipped} 位样本不足跳过` : ""}。`;
  return {
    items: items.slice(0, topN),
    authorsConsidered: authorsWithBaseline,
    authorsSkipped,
    batchCount,
    latestBatchDate: batchDates[batchDates.length - 1] ?? "",
    notice,
  };
}
