"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * WorkBuddy 式应用壳（琥珀橙主题）：浅灰侧栏 + 纯白画布。
 * P1 只有「对标」主链路；雷达/达人/我的 为后续模块占位。
 */

const NAV = [
  { href: "/", label: "雷达", icon: MIconRadar },
  { href: "/match", label: "对标", icon: MIconTarget },
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-surface lg:flex">
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
            M
          </span>
          <span className="text-[15px] font-bold tracking-tight text-ink-900">Mirror 增长台</span>
        </div>

        <nav className="mt-1 space-y-1 px-3">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm transition ${
                  active
                    ? "bg-white font-semibold text-ink-900 shadow-sm"
                    : "font-medium text-ink-600 hover:bg-white/60"
                }`}
              >
                <item.icon active={active} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-3 pb-4">
          {(["热点雷达", "达人关注", "账号体检"] as const).map((label) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm text-ink-400"
              title="P3+ 模块，建设中"
            >
              <span className="h-[18px] w-[18px] rounded border border-dashed border-ink-400/50" />
              {label}
              <span className="ml-auto rounded-full bg-white px-1.5 py-0.5 text-[10px] text-ink-400">
                P3+
              </span>
            </div>
          ))}
          <div className="mt-4 rounded-2xl bg-white p-3.5 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-semibold text-ink-900">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              本地工作区
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
              内容池与分析全部存在浏览器本地，数据不出设备。
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-3 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
              M
            </span>
            <span className="text-sm font-bold text-ink-900">Mirror 增长台</span>
          </Link>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

/* 18px、1.8 描边的极简线性图标（currentColor） */
function iconCls(active: boolean) {
  return `h-[18px] w-[18px] ${active ? "text-brand-600" : "text-ink-400"}`;
}

function MIconRadar({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconCls(active)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12l6.5-6.5" strokeLinecap="round" />
    </svg>
  );
}

function MIconTarget({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconCls(active)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
