"use client";

import { useState } from "react";
import { classifyHook, HOOK_LABELS, shapeVerdict } from "@/lib/hooks";
import type { RankedNote, RankKey } from "@/lib/types";

/**
 * 榜单 tab + 卡片列表。boards 由服务端预计算传入，本组件只做显隐。
 */
export default function MatchBoard({
  boards,
  keys,
  labels,
  descs,
}: {
  boards: Record<RankKey, RankedNote[]>;
  keys: RankKey[];
  labels: Record<RankKey, string>;
  descs: Record<RankKey, string>;
  hookLabels?: unknown;
}) {
  const [tab, setTab] = useState<RankKey>("likes");
  const ranked = boards[tab] ?? [];

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === k
                ? "bg-brand-500 text-white shadow-sm"
                : "border border-gray-200 bg-white text-ink-600 hover:bg-surface"
            }`}
          >
            {labels[k]}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-400">{descs[tab]}</p>

      <ul className="mt-5 space-y-3">
        {ranked.map((r) => (
          <NoteCard key={r.noteId} r={r} />
        ))}
      </ul>
      <p className="mt-6 text-center text-xs text-ink-400">
        只展示前 20 条 · 全池已在本地内容池
      </p>
    </div>
  );
}

function NoteCard({ r }: { r: RankedNote }) {
  const hook = HOOK_LABELS[classifyHook(r.title)];
  const verdict = shapeVerdict(r.engage);
  const m = r.matchBreakdown;
  const displayTitle = r.title || "（无标题图文，封面即内容）";

  return (
    <li className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_6px_24px_-16px_rgba(16,20,24,0.18)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${
                r.rank <= 3 ? "bg-brand-500 text-white" : "bg-surface text-ink-500"
              }`}
            >
              {r.rank}
            </span>
            <h3 className="truncate text-[15px] font-semibold text-ink-900" title={displayTitle}>
              {displayTitle}
            </h3>
            <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
              {hook}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-ink-400">
            {r.author} ·{" "}
            {r.noteType === "video" ? "视频" : "图文"} · 赞 {r.likes} · 藏 {r.collects} · 评{" "}
            {r.comments} · 享 {r.shares}
            {r.publishDate && ` · ${r.publishDate}`}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-500">{verdict}</p>
        </div>

        {/* 匹配度环 */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] leading-none text-ink-400">表现强度</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink-700">{m.strength}</p>
            <p className="mt-1.5 text-[10px] leading-none text-ink-400">可复制性</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink-700">{m.copyability}</p>
          </div>
          <div
            className={`flex h-14 w-14 flex-col items-center justify-center rounded-2xl ${
              r.matchScore >= 80
                ? "bg-brand-500 text-white"
                : r.matchScore >= 60
                  ? "bg-brand-100 text-brand-700"
                  : "bg-surface text-ink-500"
            }`}
            title={`表现强度 ${m.strength} × 0.4 + 可复制性 ${m.copyability} × 0.6`}
          >
            <span className="text-lg font-bold tabular-nums leading-none">{r.matchScore}</span>
            <span className="mt-0.5 text-[9px] leading-none opacity-80">匹配度</span>
          </div>
        </div>
      </div>
    </li>
  );
}
