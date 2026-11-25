// 内容池：CSV 导入 → Note[] + 池级统计（供匹配度打分的分位数）。
// 纯函数，浏览器与 Node（precompute）共用。
import Papa from "papaparse";
import type { Note, EngageShape } from "./types.ts";

export function parseCsv(text: string): { notes: Note[]; errors: string[] } {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^\ufeff/, ""), {
    header: true,
    skipEmptyLines: true,
  });
  const errors: string[] = (parsed.errors ?? []).map(
    (e) => `row ${e.row ?? "?"}: ${e.message}`,
  );
  const notes: Note[] = [];
  for (const [i, r] of (parsed.data ?? []).entries()) {
    const noteId = (r.note_id ?? "").trim();
    if (!noteId) {
      errors.push(`row ${i + 2}: missing note_id`);
      continue;
    }
    notes.push({
      noteId,
      keyword: (r.keyword ?? "").trim(),
      title: (r.title ?? "").replace(/\s+/g, " ").trim(),
      noteType: r.note_type === "video" ? "video" : "image_text",
      author: (r.author ?? "").trim(),
      authorId: (r.author_id ?? "").trim(),
      likes: num(r.likes),
      collects: num(r.collects),
      comments: num(r.comments),
      shares: num(r.shares),
      publishDate: (r.publish_date ?? "").trim(),
      publishTimeRaw: r.publish_time_raw?.trim() || undefined,
    });
  }
  return { notes, errors };
}

function num(s: string | undefined): number {
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

/** 互动结构比。like+1 防止零赞笔记全是 Infinity/NaN */
export function engageShape(n: Note): EngageShape {
  const likeBase = n.likes + 1;
  return {
    collectPerLike: n.collects / likeBase,
    commentPerLike: n.comments / likeBase,
    sharePerLike: n.shares / likeBase,
    totalEngage: n.likes + n.collects + n.comments + n.shares,
  };
}

/** 池内分位（0-100）：value 在 values 中的位置。用于匹配度的表现强度 */
export function percentileRank(values: number[], v: number): number {
  if (values.length === 0) return 0;
  const below = values.filter((x) => x <= v).length;
  return Math.round((below / values.length) * 100);
}

export interface PoolStats {
  count: number;
  medianEngage: number;
  /** totalEngage 列表，打分用 */
  engageValues: number[];
  /** 互动效率 = totalEngage / (author 池内总互动)。作者中位档 */
  authorEngage: Map<string, number>;
}

export function poolStats(notes: Note[]): PoolStats {
  const engageValues = notes.map((n) => engageShape(n).totalEngage).sort((a, b) => a - b);
  const authorEngage = new Map<string, number>();
  for (const n of notes) {
    authorEngage.set(n.authorId, (authorEngage.get(n.authorId) ?? 0) + engageShape(n).totalEngage);
  }
  return {
    count: notes.length,
    medianEngage: engageValues.length
      ? engageValues[Math.floor(engageValues.length / 2)]
      : 0,
    engageValues,
    authorEngage,
  };
}
