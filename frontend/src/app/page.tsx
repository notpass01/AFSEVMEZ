import Link from "next/link";

const GAMES = [
  { href: "/slots",    icon: "🎰", title: "Slots",      desc: "Spin 3 reels — hit 💎💎💎 for 15x jackpot", badge: "NEW" },
  { href: "/roulette", icon: "🎡", title: "Roulette",   desc: "Choose a range (0–36) and spin the wheel" },
  { href: "/dice",     icon: "🎲", title: "Dice",       desc: "Pick a number 1–6 and roll" },
  { href: "/coinflip", icon: "🪙", title: "Coin Flip",  desc: "Heads or tails — double or nothing" },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center px-4 py-16">
      {/* Hero */}
      <h1 className="font-display text-5xl md:text-7xl font-bold text-gold-gradient mb-4 text-center">
        WinWin Casino
      </h1>
      <p className="text-gray-400 text-lg mb-12 text-center max-w-xl">
        Provably fair crypto casino. No wallet needed — just deposit and play.
        Play with BNB, USDT, ETH or BTC.
      </p>

      {/* Game cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl">
        {GAMES.map((g) => (
          <Link key={g.href} href={g.href}>
            <div className="card p-8 flex flex-col items-center gap-4 cursor-pointer relative
                            hover:border-yellow-500 hover:shadow-[0_0_24px_rgba(212,175,55,0.2)]
                            transition-all duration-200 group">
              {g.badge && (
                <span className="absolute top-3 right-3 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full tracking-wider">
                  {g.badge}
                </span>
              )}
              <span className="text-6xl group-hover:scale-110 transition-transform">{g.icon}</span>
              <h2 className="text-xl font-bold text-gold-gradient">{g.title}</h2>
              <p className="text-gray-400 text-sm text-center">{g.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Info */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl text-center">
        {[
          { label: "House Edge", value: "2%" },
          { label: "Randomness", value: "Chainlink VRF" },
          { label: "Supported Chains", value: "BNB Chain" },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-2xl font-bold text-gold-gradient">{s.value}</p>
            <p className="text-gray-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
