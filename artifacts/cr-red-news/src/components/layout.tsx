import { Link } from "wouter";
import { useGetTicker, getGetTickerQueryKey } from "@workspace/api-client-react";
import { Tv } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { data: ticker } = useGetTicker({
    query: { queryKey: getGetTickerQueryKey() }
  });

  return (
    <div className="min-h-screen bg-background flex flex-col pb-12">

      {/* ── Contact Strip (scrolling) ─────────────────── */}
      <div className="bg-black text-yellow-400 text-xs sm:text-sm font-semibold overflow-hidden whitespace-nowrap border-b border-yellow-600">
        <div className="animate-contact-strip inline-block py-1.5">
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          📞 <strong>Khushi Law, Reporter</strong> — वेबसाइट देखने का इशू या अन्य समस्या या वेबसाइट बनवाने के लिए संपर्क करें — Call / WhatsApp: <strong>8114417436</strong>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          📞 <strong>Khushi Law, Reporter</strong> — वेबसाइट देखने का इशू या अन्य समस्या या वेबसाइट बनवाने के लिए संपर्क करें — Call / WhatsApp: <strong>8114417436</strong>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          📞 <strong>Khushi Law, Reporter</strong> — वेबसाइट देखने का इशू या अन्य समस्या या वेबसाइट बनवाने के लिए संपर्क करें — Call / WhatsApp: <strong>8114417436</strong>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
      </div>

      {/* ── Header ───────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md border-b-4 border-black">
        <div className="w-full px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">

          {/* Logo + Channel Name */}
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <img
              src="/logo2.png"
              alt="CR RED NEWS India Official TV"
              className="h-10 w-10 sm:h-13 sm:w-13 object-cover rounded-full border-2 border-yellow-400 shadow-lg bg-white shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-black text-sm sm:text-lg leading-tight tracking-tight truncate">CR RED NEWS</span>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-widest leading-none opacity-90 truncate">INDIA OFFICIAL TV</span>
              <span className="text-[8px] sm:text-[9px] font-medium tracking-wider text-yellow-300 opacity-80 truncate">Khushi Law, Reporter</span>
            </div>
          </Link>

          {/* Nav Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <a
              href="https://chamaktarajasthan.in/epaper/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center bg-black hover:bg-neutral-800 text-white px-3 py-1.5 rounded text-xs sm:text-sm font-bold transition-colors"
            >
              E-PAPER
            </a>
            <Link
              href="/social"
              className="text-[10px] sm:text-xs font-semibold bg-yellow-500 hover:bg-yellow-400 text-black px-2 sm:px-3 py-1.5 rounded transition-colors"
            >
              Social
            </Link>
            <Link
              href="/admin"
              className="text-[10px] sm:text-xs font-semibold bg-white/10 hover:bg-white/20 px-2 sm:px-3 py-1.5 rounded transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* ── Page Content ─────────────────────────────── */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* ── Breaking News Ticker (fixed bottom) ──────── */}
      <div className="fixed bottom-0 left-0 right-0 h-12 bg-black text-white flex items-center z-50 border-t-2 border-primary overflow-hidden">
        <div className="bg-primary text-primary-foreground h-full flex items-center px-4 font-bold z-10 whitespace-nowrap uppercase tracking-wider shrink-0 shadow-[4px_0_10px_rgba(0,0,0,0.5)] flex gap-2">
          <Tv className="w-4 h-4 animate-pulse" />
          Breaking
        </div>
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="animate-ticker whitespace-nowrap font-semibold text-lg absolute w-full tracking-wide">
            {ticker?.text || "Welcome to CR RED NEWS INDIA OFFICIAL TV | सच्ची खबरें, सच्चा अंदाज़"}
          </div>
        </div>
      </div>

    </div>
  );
}
