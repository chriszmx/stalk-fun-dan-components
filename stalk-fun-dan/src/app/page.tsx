"use client";

import UnifiedTokenCard from "./components/UnifiedTokenCard";
import { BotProvider } from "./contexts/BotContext";

// DEX Collection
const dexTokens = [
    {
        contract_address: "H3d5FoPiuTHC2W37zFfT2eZ3KTC4WfoUEzHpZhSepump",
        decimals: 6,
        liquidity: 27090.80008214414,
        marketCap: 51196.17465711447,
        mint: "H3d5FoPiuTHC2W37zFfT2eZ3KTC4WfoUEzHpZhSepump",
        name: "PUSSY NEEDS LIQUIDITY",
        price: 0.00005119617481737134,
        symbol: "PNL",
        volume24h: 608758.1244029683,
        total_txns: 6285,
    },
];

// Kings of The Hill Collection
const kothTokens = [
    {
        mint: "2uCXPWohVXv3Wc44xQi5Bv9Y8f9a2ZXkkF1r6DYipump",
        name: "Official Chapu Daniel Token",
        symbol: "CHAPU",
        image_uri:
            "https://ipfs.io/ipfs/QmRREPrAUsJ9pLcZ7TivujdM4W4VLWBNjrEGQL57p6cfsL",
        twitter: "https://x.com/ChapuDanielgov",
        market_cap: 28.077274297,
        usd_market_cap: 5531.223036509,
        king_of_the_hill_timestamp: 1739155552000,
    },
];

// Smart Pump Collection
const smartPumpTokens = [
    {
        _id: {
            $oid: "67a6ca4452242f01868981b0",
        },
        mint: "FasH397CeZLNYWkd3wWK9vrmjd1z93n3b59DssRXpump",
        buys: 246422,
        sells: 169343,
        image: "https://image.solanatracker.io/proxy?url=https%3A%2F%2Fipfs-forward.solanatracker.io%2Fipfs%2FQmVfhGnJmuUoJ8wdnEfRP1RaCg8GQ9WJgotiXVj5ARNGFd",
        kolCount: 8,
        kolTracker: [
            {
                label: "@traderpow",
                txType: "buy",
                timestamp: "2025-02-08T23:44:30.639Z",
                position: 1957613.492069997,
            },
            {
                label: "@DanTheMan",
                txType: "buy",
                timestamp: "2025-02-08T23:44:30.639Z",
                position: 195927613.492069997,
            },
        ],
        lastTrader: "@Poe_Ether",
        lastTxTime: "1739136463935",
        lastTxType: "sell",
        liquidity: 776958.4955174674,
        marketCap: 6529660.920848933,
        name: "The Next Bitcoin",
        price: 0.006535244662929306,
        priceChange24h: -44.960698746985386,
        symbol: "BUTTCOIN",
        txns: 415765,
        volume24h: 9209063.572280439,
        socials: {
            twitter: "btc",
            telegram: "bitcoin",
        },
    },
];

// Boosted Tokens Collection
const boostedTokens = [
    {
        mint: "GasH397CeZLNYWkd3wWK9vrmjd1z93n3b59DssRXpump",
        buys: 146422,
        sells: 89343,
        image: "https://image.solanatracker.io/proxy?url=https%3A%2F%2Fipfs-forward.solanatracker.io%2Fipfs%2FQmVfhGnJmuUoJ8wdnEfRP1RaCg8GQ9WJgotiXVj5ARNGFd",
        kolCount: 12,
        kolTracker: [
            {
                label: "@whale_alert",
                txType: "buy",
                timestamp: "2025-02-08T23:45:30.639Z",
                position: 2957613.492069997,
            },
            {
                label: "@cryptoking",
                txType: "sell",
                timestamp: "2025-02-08T23:46:30.639Z",
                position: 957613.492069997,
            },
        ],
        lastTrader: "@whale_alert",
        lastTxTime: Date.now().toString(),
        lastTxType: "buy",
        liquidity: 576958.4955174674,
        marketCap: 4529660.920848933,
        name: "Boosted Token #2",
        price: 0.005535244662929306,
        priceChange24h: -14.96,
        symbol: "BOOST2",
        txns: 235765,
        volume24h: 7209063.572280439,
        boost_count: 3,
        socials: {
            twitter: "boost2",
            telegram: "boost2chat",
            website: "https://boost2.com",
        },
        timestamp: Date.now(),
    },
];

// Trending Tokens Collection
const trendingTokens = [
    {
        mint: "H3d5FoPiuTHC2W37zFfT2eZ3KTC4WfoUEzHpZhSepump",
        name: "Trending Token #1",
        symbol: "TREND1",
        marketCap: 51196.17465711447,
        volume24h: 608758.1244029683,
        total_txns: 6285,
        priceChange24h: 125.5,
        timestamp: Date.now(),
    },
    {
        mint: "I3d5FoPiuTHC2W37zFfT2eZ3KTC4WfoUEzHpZhSepump",
        name: "Trending Token #2",
        symbol: "TREND2",
        marketCap: 41196.17465711447,
        volume24h: 508758.1244029683,
        total_txns: 5285,
        priceChange24h: 95.5,
        timestamp: Date.now(),
    },
];

export default function TestPage() {
    return (
        <BotProvider>
            <div className="min-h-screen bg-gray-900 p-4 sm:p-6 md:p-8 select-">
                <div className="max-w-[1920px] mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
                        Token Collections
                    </h1>

                    <div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
                        justify-items-center content-start"
                    >
                        {/* Kings of The Hill Column */}
                        <div className="w-full max-w-[340px] space-y-6">
                            <h2 className="text-xl font-semibold text-white">
                                👑 Kings of The Hill
                            </h2>
                            {kothTokens.map((token, index) => (
                                <UnifiedTokenCard
                                    key={token.mint}
                                    data={token}
                                    darkMode={true}
                                    timeframe="24h"
                                    isKOTH={true}
                                    kothRank={index + 1}
                                />
                            ))}
                        </div>

                        {/* Smart Pump Column */}
                        <div className="w-full max-w-[340px] space-y-6">
                            <h2 className="text-xl font-semibold text-white">
                                🎯 Smart Pump
                            </h2>
                            {smartPumpTokens.map((token) => (
                                <UnifiedTokenCard
                                    key={token.mint}
                                    data={token}
                                    darkMode={true}
                                    timeframe="24h"
                                />
                            ))}
                        </div>

                        {/* Boosted Tokens Column */}
                        <div className="w-full max-w-[340px] space-y-6">
                            <h2 className="text-xl font-semibold text-white">
                                🚀 Boosted Tokens
                            </h2>
                            {boostedTokens.map((token) => (
                                <UnifiedTokenCard
                                    key={token.mint}
                                    data={token}
                                    darkMode={true}
                                    timeframe="24h"
                                    isBoosted={true}
                                />
                            ))}
                        </div>

                        {/* Trending Tokens Column */}
                        <div className="w-full max-w-[340px] space-y-6">
                            <h2 className="text-xl font-semibold text-white">
                                📈 Trending Tokens
                            </h2>
                            {trendingTokens.map((token) => (
                                <UnifiedTokenCard
                                    key={token.mint}
                                    data={token}
                                    darkMode={true}
                                    timeframe="24h"
                                    title="Trending"
                                />
                            ))}
                        </div>

                        {/* Dex Tokens Column */}
                        <div className="w-full max-w-[340px] space-y-6">
                            <h2 className="text-xl font-semibold text-white">
                                Dex Tokens
                            </h2>
                            {dexTokens.map((token) => (
                                <UnifiedTokenCard
                                    key={token.mint}
                                    data={token}
                                    darkMode={true}
                                    timeframe="24h"
                                    title="Trending"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </BotProvider>
    );
}
