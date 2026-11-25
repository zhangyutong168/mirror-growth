// 标题钩子分类（洞察：标题是爆款的第一引擎）。
// 规则词库优先——无 LLM 也能跑，后续配 key 后可增强。
export type HookType =
  | "number" // 数字盘点：8条渠道/3个方法/5分钟看懂
  | "suspense" // 悬念缺口：藏在…/原来…/竟然
  | "identity" // 身份代入：竞赛生的/家长必看/学姐现身说法
  | "contrast" // 反差冲突：X却Y/不是…而是…/别再
  | "authority" // 权威背书：官方/保送/清北/金牌
  | "howto" // 干货承诺：如何/怎么/攻略/指南/汇总
  | "plain"; // 无明显钩子

export const HOOK_LABELS: Record<HookType, string> = {
  number: "数字盘点",
  suspense: "悬念缺口",
  identity: "身份代入",
  contrast: "反差冲突",
  authority: "权威背书",
  howto: "干货承诺",
  plain: "平铺直叙",
};

const RULES: Array<{ type: HookType; re: RegExp }> = [
  { type: "number", re: /[一二两三四五六七八九十百千\d]+\s*(条|个|招|步|种|大|篇|分钟|天|年|倍|期|届|条|道|题|岁)/ },
  { type: "suspense", re: /隐藏|竟然|居然|原来|真相|秘密|内幕|没人告诉你|低调|藏在|潜规则|不知道|万万没想到|没想到/ },
  { type: "identity", re: /竞赛生|家长|学姐|学长|过来人|亲历|现身说法|我当年|娃|孩子|普娃|牛娃|陪读|陪考|初三|高一|高二|高三|初二|小升初|中考生/ },
  { type: "contrast", re: /别再|不要|却|其实|根本|≠|并不|不是.{0,12}而是|劝退|避坑|踩坑|后悔|误导|骗局|浪费|白学|没必要|大跌眼镜|逆天|吐槽/ },
  { type: "authority", re: /官方|保送|清北|北大|清华|金牌|省一|省队|国集|CMO|IMO|IOI|NOI|CSP|强基|联赛|奥赛|国赛|复赛|跌破|获奖|名单|分数线|放榜/ },
  { type: "howto", re: /如何|怎么|攻略|指南|汇总|整理|盘点|收藏|干货|科普|路线|规划|途径|渠道|入门|看懂|解析|说明|介绍|有哪些|什么|哪些/ },
];

export function classifyHook(title: string): HookType {
  if (!title.trim()) return "plain";
  for (const { type, re } of RULES) {
    if (re.test(title)) return type;
  }
  return "plain";
}

/** 一句话点评互动结构（赞/藏/评的真实含义）。阈值按小红书实际分布校准 */
export function shapeVerdict(opts: {
  collectPerLike: number;
  commentPerLike: number;
  sharePerLike: number;
}): string {
  const { collectPerLike: c, commentPerLike: m, sharePerLike: s } = opts;
  if (c >= 1.2) return "强收藏型：被当工具存下来，长尾流量好，适合攻略清单类选题";
  if (m >= 0.5) return "高讨论型：评论区活跃，适合争议/提问/站队类选题";
  if (s >= 0.4) return "强传播型：被转发到群聊/朋友圈，适合标签化、可炫示的内容";
  if (c >= 0.7) return "中收藏型：干货有余味，标题可以更明确承诺「存了有用」";
  if (m >= 0.25) return "轻讨论型：有一定评论互动，话题带观点更容易引评论";
  return "泛共鸣型：靠标题和封面赢得点赞，适合情绪/观点类内容";
}
