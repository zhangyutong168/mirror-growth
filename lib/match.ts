// 匹配度引擎：最火 ≠ 最适合模仿。
// matchScore = 表现强度 40% × 可复制性 60%（方案 §3 M1）。
import { engageShape, percentileRank, poolStats, type PoolStats } from "./pool.ts";
import type { Note, RankedNote, RankKey, MatchBreakdown } from "./types.ts";

const RANK_METRICS: Record<RankKey, (e: ReturnType<typeof engageShape>, n: Note) => number> = {
  likes: (_e, n) => n.likes,
  collects: (_e, n) => n.collects,
  comments: (_e, n) => n.comments,
  efficiency: (e) => e.totalEngage,
  collectRatio: (e) => e.collectPerLike,
};

export const RANK_LABELS_DEPRECATED = true; // 文案见 lib/rankkeys.ts

export const RANK_DESCS: Record<RankKey, string> = {
  likes: "绝对声量最大，但多为头部大号",
  collects: "被当作工具收藏的内容 = 长尾流量",
  comments: "争议/提问型选题，参与感强",
  efficiency: "总互动量（赞+藏+评+享），综合表现",
  collectRatio: "收藏÷点赞高 = 干货攻略型信号",
};

/**
 * 可复制性三因子（0-100 各自）：
 * - authorScaleFit  作者体量与我接近：池内"中小作者"（互动总量低于池 75 分位）发的爆款才学得来
 * - formatFeasible  形态可行：图文 > 视频（一个人做图文成本低）
 * - topicRelevance  赛道相关：种子池本身就是赛道内，按关键词命中广度微调
 */
export function matchBreakdown(
  n: Note,
  stats: PoolStats,
  opts: { preferVideo?: boolean } = {},
): MatchBreakdown {
  const e = engageShape(n);
  const strength = percentileRank(stats.engageValues, e.totalEngage);

  const authorTotal = stats.authorEngage.get(n.authorId) ?? 0;
  const authorP75 = percentileRank(
    [...stats.authorEngage.values()].sort((a, b) => a - b),
    authorTotal,
  );
  // 作者越"小"越可复制：75 分位以下都算接近，之后线性衰减
  const authorScaleFit = Math.max(0, Math.round(100 - Math.max(0, authorP75 - 75) * 4));

  const formatFeasible = n.noteType === "video"
    ? (opts.preferVideo ? 80 : 45)
    : (opts.preferVideo ? 60 : 95);

  // 命中越多关键词 = 赛道核心选题
  const kwCount = n.keyword.split("|").filter(Boolean).length;
  const topicRelevance = Math.min(100, 60 + kwCount * 15);

  const copyability = Math.round(
    authorScaleFit * 0.45 + formatFeasible * 0.35 + topicRelevance * 0.2,
  );
  return { strength, copyability, authorScaleFit, formatFeasible, topicRelevance };
}

/** 主入口：给池子打分 + 按指定维度出榜 */
export function rankPool(
  notes: Note[],
  key: RankKey,
  opts: { preferVideo?: boolean } = {},
): RankedNote[] {
  const stats = poolStats(notes);
  const metric = RANK_METRICS[key];
  const scored = notes.map((n) => {
    const e = engageShape(n);
    const matchBreakdown_ = matchBreakdown(n, stats, opts);
    return {
      ...n,
      engage: e,
      rankValue: metric(e, n),
      rank: 0,
      matchScore: Math.round(matchBreakdown_.strength * 0.4 + matchBreakdown_.copyability * 0.6),
      matchBreakdown: matchBreakdown_,
    };
  });
  scored.sort((a, b) => b.rankValue - a.rankValue);
  scored.forEach((r, i) => (r.rank = i + 1));
  return scored;
}
