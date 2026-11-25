import Link from "next/link";
import { loadPool } from "@/lib/source";
import { poolStats } from "@/lib/pool";
import { rankPool } from "@/lib/match";
import { classifyHook, HOOK_LABELS } from "@/lib/hooks";

/**
 * 首页「雷达」：P1 先做赛道总览（内容池 KPI + 信号速读），
 * P3 热点雷达（基线偏离 + 窗口期）在此页扩展。
 */
export default function Home() {
  const notes = loadPool();
  const stats = poolStats(notes);
  const ranked = rankPool(notes, "efficiency");

  const totalEngage = notes.reduce(
    (s, n) => s + n.likes + n.collects + n.comments + n.shares,
    0,
  );
  const videoCount = notes.filter((n) => n.noteType === "video").length;
  const authors = new Set(notes.map((n) => n.authorId)).size;

  // 互动结构信号：收藏≥点赞的条数（干货型信号）
  const toolCount = notes.filter((n) => n.collects >= n.likes).length;
  // 高讨论：评论≥赞一半
  const discussCount = notes.filter((n) => n.comments * 2 >= n.likes && n.comments >= 10).length;

  // 匹配度冠军（非头部账号的、可复制的）
  const byMatch = [...ranked].sort((a, b) => b.matchScore - a.matchScore);
  const topPick = byMatch[0];

  const hookDist: Record<string, number> = {};
  for (const n of notes) {
    const h = HOOK_LABELS[classifyHook(n.title)];
    hookDist[h] = (hookDist[h] ?? 0) + 1;
  }
  const hookRows = Object.entries(hookDist).sort((a, b) => b[1] - a[1]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
        赛道 · 竞赛升学（小红书）
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900">
        内容池总览
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
        8 个关键词采集的 {stats.count} 条真实笔记。所有数字来自平台公开展示，
        在你的浏览器内本地计算。
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="内容池" value={String(stats.count)} sub="条笔记" />
        <Kpi label="总互动量" value={fmt(totalEngage)} sub="赞+藏+评+享" />
        <Kpi label="独立作者" value={String(authors)} sub={videoCount ? `视频 ${videoCount} 条` : ""} />
        <Kpi label="互动中位数" value={fmt(stats.medianEngage)} sub="单条总互动" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* 信号速读 */}
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_6px_24px_-16px_rgba(16,20,24,0.18)]">
          <h2 className="text-sm font-semibold text-ink-900">赛道信号速读</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-600">
            <li className="flex gap-2.5">
              <Dot />
              <span>
                <b className="text-ink-900">{toolCount} 条</b>
                内容收藏 ≥ 点赞 —— 干货攻略型选题在这个赛道被「存下来」，
                长尾流量可观。
              </span>
            </li>
            <li className="flex gap-2.5">
              <Dot />
              <span>
                <b className="text-ink-900">{discussCount} 条</b>
                内容评论活跃（评论 ≥ 赞的一半且 ≥10）——
                争议/提问型选题有稳定讨论场。
              </span>
            </li>
            <li className="flex gap-2.5">
              <Dot />
              <span>
                头条「{ranked[0]?.title?.slice(0, 16)}…」总互动{" "}
                {fmt(ranked[0]?.engage.totalEngage ?? 0)}，
                是中位数（{fmt(stats.medianEngage)}）的{" "}
                {Math.max(1, Math.round((ranked[0]?.engage.totalEngage ?? 0) / Math.max(1, stats.medianEngage)))}{" "}
                倍 —— 头部集中明显，跟头部拼不过，学中小爆款。
              </span>
            </li>
          </ul>

          {topPick && (
            <div className="mt-5 rounded-2xl bg-brand-50 p-4">
              <p className="text-xs font-semibold text-brand-700">今日最佳对标（匹配度 {topPick.matchScore}）</p>
              <p className="mt-1.5 text-sm font-medium leading-snug text-ink-900">
                「{(topPick.title || "（无标题图文）").slice(0, 26)}」
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">
                {topPick.author} · 赞 {topPick.likes} 藏 {topPick.collects} 评 {topPick.comments} ——
                表现强度 {topPick.matchBreakdown.strength}，可复制性 {topPick.matchBreakdown.copyability}
                （中小作者、图文形态、赛道核心词）
              </p>
            </div>
          )}

          <Link
            href="/match"
            className="mt-5 inline-block rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            进对标台看五维榜单 →
          </Link>
        </section>

        {/* 标题钩子分布 */}
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_6px_24px_-16px_rgba(16,20,24,0.18)]">
          <h2 className="text-sm font-semibold text-ink-900">标题钩子分布</h2>
          <p className="mt-1 text-xs text-ink-400">
            标题是爆款的第一引擎。点进对标页看每条的钩子归类。
          </p>
          <div className="mt-4 space-y-2.5">
            {hookRows.map(([label, count]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs text-ink-500">{label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-brand-400"
                    style={{ width: `${Math.max(4, (count / notes.length) * 100)}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs tabular-nums text-ink-500">
                  {count}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-surface p-3.5 text-xs leading-relaxed text-ink-500">
            读法：「权威背书 + 数字盘点」是这个赛道的主流开场，
            「悬念缺口/反差冲突」用得少 —— 竞争小，用了更容易跳出同质化。
          </p>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_6px_24px_-16px_rgba(16,20,24,0.18)]">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-ink-900">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] text-ink-400">{sub}</p>}
    </div>
  );
}

function Dot() {
  return <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />;
}

function fmt(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万` : String(n);
}
