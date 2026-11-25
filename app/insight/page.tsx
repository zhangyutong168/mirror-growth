import { loadPool } from "@/lib/source";
import { hookPerformance, keywordGaps, buildTopics } from "@/lib/insight";

/**
 * 洞察页（P2）：钩子效能表 + 选题 Gap 排布 + 选题清单。
 * 全部构建期预计算，静态输出。
 */
export default function InsightPage() {
  const notes = loadPool();
  const hooks = hookPerformance(notes);
  const gaps = keywordGaps(notes);
  const topics = buildTopics(notes);
  const maxMedian = Math.max(...hooks.map((h) => h.medianEngage), 1);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">选题洞察</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
        回答一个问题：<b className="text-ink-900">下周拍什么、标题怎么起。</b>
        基于内容池 {notes.length} 条的真实表现统计 —— 哪类钩子真的爆、哪个方向供给少需求大。
      </p>

      {/* 选题清单 */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-ink-900">选题清单（按机会优先级）</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {topics.map((t) => (
            <li
              key={t.keyword}
              className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_6px_24px_-16px_rgba(16,20,24,0.18)]"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    t.priority === "高"
                      ? "bg-brand-500 text-white"
                      : t.priority === "中"
                        ? "bg-brand-100 text-brand-700"
                        : "bg-surface text-ink-500"
                  }`}
                >
                  {t.priority}
                </span>
                <h3 className="truncate text-[15px] font-semibold text-ink-900">
                  {t.keyword} × {t.hookLabel}
                </h3>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-ink-500">{t.reason}</p>
              <p className="mt-2 rounded-2xl bg-brand-50 p-3 text-xs leading-relaxed text-ink-700">
                <b>怎么起标题：</b>{t.advice}
              </p>
              {t.reference && (
                <p className="mt-2.5 text-[11px] text-ink-400">
                  对标：「{t.reference.title.slice(0, 22)}」@{t.reference.author}（
                  {t.reference.engage} · 匹配度 {t.reference.matchScore}）
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* 钩子效能 */}
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_6px_24px_-16px_rgba(16,20,24,0.18)]">
          <h2 className="text-sm font-semibold text-ink-900">钩子效能榜</h2>
          <p className="mt-1 text-xs text-ink-400">
            按组内互动中位数排序。样本 &lt;4 的钩子仅供参考。
          </p>
          <div className="mt-4 space-y-3">
            {hooks.map((h) => (
              <div key={h.hook}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-ink-700">
                    {h.label}
                    <span className="ml-1.5 text-ink-400">×{h.count}</span>
                  </span>
                  <span className="text-[11px] tabular-nums text-ink-400">
                    中位 {h.medianEngage} · 藏/赞 {h.collectTilt.toFixed(2)} · 评/赞{" "}
                    {h.commentTilt.toFixed(2)}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className={`h-full rounded-full ${h.count < 4 ? "bg-ink-400/40" : "bg-brand-400"}`}
                    style={{ width: `${Math.max(3, (h.medianEngage / maxMedian) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink-400">{h.verdict}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 选题 Gap */}
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_6px_24px_-16px_rgba(16,20,24,0.18)]">
          <h2 className="text-sm font-semibold text-ink-900">方向需求 × 供给</h2>
          <p className="mt-1 text-xs text-ink-400">
            需求 = 互动中位数分位；供给 = 内容条数分位。右上=又热又挤，左上=蓝海。
          </p>
          <div className="relative mt-5 h-56 rounded-2xl border border-gray-100 bg-surface/60">
            {/* 象限分割线 */}
            <div className="absolute left-1/2 top-0 h-full w-px bg-gray-200" />
            <div className="absolute top-1/2 h-px w-full bg-gray-200" />
            <span className="absolute left-2 top-1.5 text-[10px] text-ink-400">蓝海（需求高·供给少）</span>
            <span className="absolute right-2 top-1.5 text-[10px] text-ink-400">红海（热且挤）</span>
            {gaps.map((g) => (
              <div
                key={g.keyword}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${8 + (g.saturation / 100) * 84}%`,
                  top: `${92 - (g.demand / 100) * 84}%`,
                }}
                title={`${g.keyword}：${g.count} 条 · 互动中位 ${g.medianEngage}`}
              >
                <span
                  className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    g.status === "opportunity"
                      ? "bg-brand-500 text-white"
                      : g.status === "saturated"
                        ? "bg-white text-ink-500 shadow-sm"
                        : "bg-brand-100 text-brand-700"
                  }`}
                >
                  {g.keyword}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
            本池所有方向条数相同（采集设计所致），饱和度区分失真 ——
            需求分位仍有效：「学科竞赛 / 强基计划 / 物理竞赛」互动显著高于均值。
            真实供给分析需多页采集（P2 采集助手）。
          </p>
        </section>
      </div>
    </div>
  );
}
