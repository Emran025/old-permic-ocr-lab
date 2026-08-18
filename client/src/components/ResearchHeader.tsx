import React from "react";
import { BookMarked, History, Images, ScanSearch, Sparkles, Wand2 } from "lucide-react";
import { Link, useLocation } from "wouter";

const links = [
  { href: "/", label: "التحليل", icon: ScanSearch },
  { href: "/sources", label: "المصادر", icon: Images },
  { href: "/synthetic", label: "الصناعي", icon: Wand2 },
  { href: "/generator-notebook", label: "دفتر التوليد", icon: BookMarked },
  { href: "/history", label: "السجل", icon: History },
];

export default function ResearchHeader() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-[#ded7c9]/70 bg-[#f8f5ef]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-[#2b332b]" aria-label="مختبر البرمية القديمة">
          <span className="grid size-9 place-items-center rounded-xl bg-[#2b4b40] text-[#f6e8c7] shadow-[0_6px_18px_rgba(43,75,64,0.18)]">
            <Sparkles className="size-4" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-xs font-medium tracking-[0.18em] text-[#a56b37]">ARCHIVAL VISION LAB</span>
            <span className="block text-sm font-semibold">مختبر البرمية القديمة</span>
          </span>
        </Link>

        <nav className="mx-2 flex min-w-0 items-center gap-1 overflow-x-auto rounded-full border border-[#e0d8c9] bg-white/70 p-1" aria-label="التنقل الرئيسي">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                location === href ? "bg-[#2b4b40] text-[#fffaf0]" : "text-[#686b61] hover:bg-[#eee9de] hover:text-[#2b4b40]"
              }`}
            >
              <Icon className="size-3.5" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </nav>

	      </div>
    </header>
  );
}
