import { loadPool } from "@/lib/source";
import { rankPool } from "@/lib/match";
import { RANK_KEYS, RANK_LABELS, RANK_DESCS } from "@/lib/rankkeys";
import MatchBoard from "./MatchBoard";

/**
 * 对标台：服务端算好五维榜单（构建期完成，页面秒开），
 * MatchBoard（client）做 tab 切换与卡片渲染。
 */
export default function MatchPage() {
  const notes = loadPool();
  const boards = Object.fromEntries(
    RANK_KEYS.map((k) => [k, rankPool(notes, k).slice(0, 20)]),
  ) as Record<(typeof RANK_KEYS)[number], ReturnType<typeof rankPool>>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">对标台</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
        五个口径看同一个内容池（{notes.length} 条）。每张卡带「为什么火」拆解：标题钩子 +
        互动结构 + 匹配度（表现强度 40% × 可复制性 60% —— 最火的不一定最适合你模仿）。
      </p>
      <MatchBoard
        boards={boards}
        keys={RANK_KEYS}
        labels={RANK_LABELS}
        descs={RANK_DESCS}
      />
    </div>
  );
}
