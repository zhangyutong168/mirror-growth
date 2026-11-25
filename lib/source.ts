// 内容池数据源。P1：种子 CSV 直接打进 bundle（构建期内联，页面秒开）。
// P2+：换 IndexedDB（浏览器采集器写入），此模块对 UI 屏蔽来源差异。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsv } from "./pool";
import type { Note } from "./types";

let cached: Note[] | null = null;

/** 全量内容池（P1 = 种子数据，149 条竞赛升学赛道） */
export function loadPool(): Note[] {
  if (cached) return cached;
  // Next.js 构建期/服务端执行；Turbopack 会改写 import.meta.url，用 cwd 定位 repo 内文件
  const csvPath = join(process.cwd(), "data", "samples", "jingsai-shengxue-pool.csv");
  const { notes, errors } = parseCsv(readFileSync(csvPath, "utf8"));
  if (errors.length) console.warn("[pool] csv parse warnings:", errors.slice(0, 5));
  cached = notes;
  return notes;
}
