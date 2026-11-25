// 榜单口径与文案（集中于此，page 与 tab 组件共用）
import type { RankKey } from "@/lib/types";

export type { RankKey, RankKey as RankKeyLiteral };

export const RANK_LABELS: Record<RankKey, string> = {
  likes: "点赞榜",
  collects: "收藏榜",
  comments: "评论榜",
  efficiency: "互动效率榜",
  collectRatio: "藏赞比榜",
};

export const RANK_DESCS: Record<RankKey, string> = {
  likes: "绝对声量最大，但多为头部大号",
  collects: "被当作工具收藏的内容 = 长尾流量",
  comments: "争议/提问型选题，参与感强",
  efficiency: "总互动量（赞+藏+评+享），综合表现",
  collectRatio: "收藏÷点赞高 = 干货攻略型信号",
};

export const RANK_KEYS: RankKey[] = ["likes", "collects", "comments", "efficiency", "collectRatio"];
