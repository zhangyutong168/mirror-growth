import Link from "next/link";
import { loadPool } from "@/lib/source";
import { detectHot } from "@/lib/radar";

/**
 * 热点雷达（P3）：谁在自己基线/赛道上爆了 + 窗口期判断。
 * 单批降级模式：赛道基线（p90 异常）。多批采集后自动叠加增速信号。
 */
export default function RadarPage() {
  const notes = loadPool();
  const radar = detectHot([{ batchId: "t0", fetchedAt: "2026-11-25", notes }]);

  const fresh = radar.items.filter((i) => i.window === "fresh");
  const rising = radar.items.filter((i) => i.window === "rising");
  const closing = radar.items.filter((i) => i.window === "closing");

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
        热点 · P3 建设中（首版：单批快照降级模式）
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900">热点雷达</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
        热点的定义不是「绝对数据高」，而是<b className="text-ink-900">超过作者自己平时的水位</b>
        （基线倍数）。一个 200 赞的号发出 2000 赞，比百万号的十万赞更像热点。
        {radar.notice}
      </p>

      {/* 窗口期统计 */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <WindowStat label="可跟（≤2 天）" count={fresh.length} tone="go" />
        <WindowStat label="换角度（3-7 天）" count={rising.length} tone="careful" />
        <WindowStat label="过窗（>7 天）" count={closing.length} tone="stop" />
      </div>

      {radar.items.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-[0_6px_24px_-16px_rgba(16,20,24,0.18)]">
          <p className="text-ink-500">本批快照里没有检测到异常内容。</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {radar.items.map((it) => (
            <li
              key={it.note.noteId}
              className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_6px_24px_-16px_rgba(16,20,24,0.18)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-ink-900">
                      {it.note.title || "（无标题图文，封面即内容）"}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        it.window === "fresh"
                          ? "bg-brand-500 text-white"
                          : it.window === "rising"
                            ? "bg-brand-100 text-brand-700"
                            : "bg-surface text-ink-500"
                      }`}
                    >
                      {it.window === "fresh" ? "可跟" : it.window === "rising" ? "换角度" : "过窗"}
                    </span>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] text-ink-400 ring-1 ring-gray-200">
                      {it.hookLabel}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-ink-400">
                    {it.note.author} ·{" "}
                    {it.baselineMode === "author"
                      ? `作者基线 ${it.authorMedian} · `
                      : "赛道基线（p90 异常）· "}
                    {it.ratio}× · 赞 {it.note.likes} 藏 {it.note.collects} 评 {it.note.comments} 享{" "}
                    {it.note.shares}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-ink-500">{it.windowLabel}</p>
                </div>
                <div
                  className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${
                    it.hotScore >= 80
                      ? "bg-brand-500 text-white"
                      : it.hotScore >= 60
                        ? "bg-brand-100 text-brand-700"
                        : "bg-surface text-ink-500"
                  }`}
                >
                  <span className="text-lg font-bold tabular-nums leading-none">{it.hotScore}</span>
                  <span className="mt-0.5 text-[9px] leading-none opacity-80">热度</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 数据局限的诚实说明 + 下一步 */}
      <div className="mt-8 rounded-3xl bg-surface p-5">
        <p className="text-xs font-semibold text-ink-900">为什么现在全是「过窗」？</p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
          本批快照来自搜索「综合」排序，天然偏老笔记；且多数作者在池内只有 1 条，
          基线只能用赛道兜底。要让雷达真正好用，需要两步：
        </p>
        <ol className="mt-2 space-y-1 text-xs leading-relaxed text-ink-600">
          <li>1. 搜索切换「最新」排序再采一批 —— 拿到近 7 天新内容，窗口期判断才有对象；</li>
          <li>
            2. 隔 2-3 天对同一批关键词再采 —— 同一笔记的互动增量 = 真实增速，
            作者基线也会随样本变厚自动升级。
          </li>
        </ol>
        <p className="mt-2 text-[11px] text-ink-400">
          采集走浏览器内 T2 路线（登录态手动滚动），单会话 ≤8 个关键词 ——
          见「方案 · 数据三层」。
        </p>
      </div>

      <Link href="/match" className="mt-6 inline-block text-xs text-brand-600 hover:underline">
        ← 先去对标台看稳态榜单
      </Link>
    </div>
  );
}

function WindowStat({ label, count, tone }: { label: string; count: number; tone: "go" | "careful" | "stop" }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 text-center shadow-[0_6px_24px_-16px_rgba(16,20,24,0.18)]">
      <p
        className={`text-2xl font-bold tabular-nums ${
          tone === "go" ? "text-brand-600" : tone === "careful" ? "text-ink-700" : "text-ink-400"
        }`}
      >
        {count}
      </p>
      <p className="mt-1 text-[11px] text-ink-400">{label}</p>
    </div>
  );
}
