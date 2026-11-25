// P1 引擎冒烟测试：node --experimental-strip-types scripts/smoke-engine.mts
import { readFileSync } from "node:fs";
import { parseCsv, poolStats } from "../lib/pool.ts";
import { rankPool } from "../lib/match.ts";
import { classifyHook, HOOK_LABELS, shapeVerdict } from "../lib/hooks.ts";
import type { RankKey } from "../lib/types.ts";

const { notes, errors } = parseCsv(
  readFileSync(new URL("../data/samples/jingsai-shengxue-pool.csv", import.meta.url), "utf8"),
);
console.log("notes:", notes.length, "errors:", errors.length);
const stats = poolStats(notes);
console.log("pool count:", stats.count, "medianEngage:", stats.medianEngage);

const KEYS: RankKey[] = ["likes", "collects", "comments", "efficiency", "collectRatio"];
for (const key of KEYS) {
  const ranked = rankPool(notes, key);
  console.log(`\n== ${key} ==`);
  for (const r of ranked.slice(0, 3)) {
    console.log(
      `  #${r.rank} ${(r.title || "(无标题)").slice(0, 18)} [match:${r.matchScore} strength:${r.matchBreakdown.strength} copy:${r.matchBreakdown.copyability}]`,
    );
  }
}

const ranked = rankPool(notes, "efficiency");
const byMatch = [...ranked].sort((a, b) => b.matchScore - a.matchScore);
console.log("\n== 匹配度 TOP5（产品核心输出）==");
for (const r of byMatch.slice(0, 5)) {
  const hook = classifyHook(r.title || "");
  console.log(
    `  ${r.matchScore}分 | ${(r.title || "(无标题)").slice(0, 24)} |${HOOK_LABELS[hook]} | ${r.author} | 赞${r.likes} 藏${r.collects} 评${r.comments}`,
  );
  console.log("    ", shapeVerdict(r.engage));
}

const dist: Record<string, number> = {};
for (const r of notes) {
  const h = classifyHook(r.title || "");
  dist[HOOK_LABELS[h]] = (dist[HOOK_LABELS[h]] ?? 0) + 1;
}
console.log("\nhook dist:", JSON.stringify(dist));
