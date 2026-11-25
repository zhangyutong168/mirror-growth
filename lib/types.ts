// 内容池核心类型。一条 Note = 一篇小红书笔记的公开数据快照。
// P0 种子 CSV（data/samples/jingsai-shengxue-pool.csv）与浏览器采集器共用此结构。

export type NoteType = "video" | "image_text";

export interface Note {
  /** 小红书笔记 ID（24 hex），内容池主键 */
  noteId: string;
  /** 采集来源关键词（多个用 | 连接） */
  keyword: string;
  title: string;
  noteType: NoteType;
  author: string;
  authorId: string;
  likes: number;
  collects: number;
  comments: number;
  shares: number;
  /** YYYY-MM-DD；采集时未知则为 "" */
  publishDate: string;
  /** 平台展示的原始时间文案（"4天前" 等），备查 */
  publishTimeRaw?: string;
}

/** 单条内容的互动结构比（洞察 3：结构即内容类型信号） */
export interface EngageShape {
  collectPerLike: number; // 收藏/点赞 → 工具型Content
  commentPerLike: number; // 评论/点赞 → 争议/参与型
  sharePerLike: number; // 分享/点赞 → 传播型
  totalEngage: number; // 赞+藏+评+享 绝对值
}

/** 五维榜单口径 */
export type RankKey = "likes" | "collects" | "comments" | "efficiency" | "collectRatio";

export interface RankedNote extends Note {
  engage: EngageShape;
  /** 当前榜单维度的原始值 */
  rankValue: number;
  /** 在当前榜单中的名次（1 起） */
  rank: number;
  /** 匹配度 0-100（与榜单口径无关，永远给出） */
  matchScore: number;
  matchBreakdown: MatchBreakdown;
}

export interface MatchBreakdown {
  /** 表现强度 0-100：totalEngage 在池内的分位 */
  strength: number;
  /** 可复制性 0-100 = 体量接近 × 形态可行 × 赛道相关 */
  copyability: number;
  /** 三个可复制性子项，UI 逐条展示 */
  authorScaleFit: number; // 作者体量与我接近（默认按池内中位互动档估算）
  formatFeasible: number; // 内容形态可复刻（图文 > 视频，视频成本高）
  topicRelevance: number; // 关键词命中度
}
