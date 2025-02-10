// UnifiedTokenCard.tsx
import React, { useState, useEffect } from "react";
import { FaTwitter, FaTelegram, FaGlobe, FaCheckCircle } from "react-icons/fa";
import { formatNumber } from "../utils/misc";
import { useBotContext } from "../contexts/BotContext";
import QuickSwap from "./QuickSwap";
import { toast } from "react-hot-toast";
import {
    normalizeTokenData,
    type NormalizedTokenData,
} from "../utils/normalizeTokenData";
import CopyNotification from "./CopyNotification";

interface UnifiedTokenCardProps {
    data: any;
    isKOTH?: boolean;
    isBoosted?: boolean;
    kothRank?: number;
    darkMode?: boolean;
    timeframe?: string;
    title?: string;
    onTokenClick?: () => void;
    settings?: {
        quickSwapPresets: number[];
        slippage: number;
        speed: string;
        tip: number;
    };
    selectedBot?: string;
}

// Add formatKolTime helper
const formatKolTime = (timestamp: string) => {
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60)
        );

        // If less than 60 minutes ago, show "Xm ago"
        if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        }

        // Otherwise show time in AM/PM format
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "UTC",
        });
    } catch {
        return "Invalid Date";
    }
};

// Update KolTooltip to only show buys
const KolTooltip: React.FC<{ kols: any[] }> = ({ kols }) => {
    // Filter to only show buy positions
    const buyPositions = kols.filter((kol) => kol.txType === "buy");

    return (
        <div
            className="bg-[#1c1d25] border border-gray-800 rounded-xl shadow-xl
            p-4 min-w-[300px] backdrop-blur-sm"
        >
            <div className="text-white font-semibold mb-3">KOL Positions</div>
            <div className="space-y-3">
                {buyPositions.map((kol, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400">#{i + 1}</span>
                                <span className="text-white font-medium">
                                    {kol.label}
                                </span>
                            </div>
                            <span className="text-green-400 font-medium">
                                +{formatNumber(kol.position)}K
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">
                                {formatKolTime(kol.timestamp)}
                            </span>
                        </div>
                        {i < buyPositions.length - 1 && (
                            <div className="border-t border-gray-800/50 mt-2" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const UnifiedTokenCard: React.FC<UnifiedTokenCardProps> = ({
    data,
    isKOTH = false,
    isBoosted = false,
    kothRank = 1,
    darkMode = true,
    timeframe = "24h",
    title,
    onTokenClick,
    settings,
    selectedBot = "stalkswap",
}) => {
    const [normalizedData, setNormalizedData] =
        useState<NormalizedTokenData | null>(null);
    const [copied, setCopied] = useState(false);
    const { selectedBot: contextSelectedBot } = useBotContext();
    const actualBot = selectedBot || contextSelectedBot;
    const [activeKol, setActiveKol] = useState<number | null>(null);
    const [showCopyNotification, setShowCopyNotification] = useState(false);

    useEffect(() => {
        if (data) {
            setNormalizedData(normalizeTokenData(data));
        }
    }, [data]);

    if (!normalizedData) return null;
    if (
        isBoosted &&
        (!normalizedData.boost_count || normalizedData.boost_count <= 0)
    )
        return null;

    const handleCopy = async () => {
        if (normalizedData.mint) {
            try {
                await navigator.clipboard.writeText(normalizedData.mint);
                setShowCopyNotification(true);
                setTimeout(() => setShowCopyNotification(false), 2000);
            } catch (err) {
                toast.error("Failed to copy address");
            }
        }
    };

    const timeframeData = normalizedData.timeframes?.[timeframe];

    const formatTime = (timestamp: number | string | null | undefined) => {
        if (!timestamp) return "Invalid Date";
        try {
            const date = new Date(
                typeof timestamp === "string" ? parseInt(timestamp) : timestamp
            );
            if (isNaN(date.getTime())) return "Invalid Date";

            const now = new Date();
            const diffInMinutes = Math.floor(
                (now.getTime() - date.getTime()) / (1000 * 60)
            );

            // If less than 60 minutes ago, show "Xm ago"
            if (diffInMinutes < 60) {
                return `${diffInMinutes}m ago`;
            }

            // Otherwise show date and time in MM/DD, HH:MM AM/PM format
            return (
                date.toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                }) +
                ", " +
                date.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "UTC",
                })
            );
        } catch {
            return "Invalid Date";
        }
    };

    return (
        <>
            <CopyNotification
                isVisible={showCopyNotification}
                address={normalizedData?.mint || ""}
                onClose={() => setShowCopyNotification(false)}
            />

            <div
                className={`
                relative w-full min-w-[320px] max-w-[340px] rounded-lg overflow-hidden
                bg-zinc-900 border shadow-lg
                transition-all duration-300
                sm:hover:shadow-2xl sm:hover:scale-[1.02] sm:hover:-translate-y-1 select-none
                ${
                    isKOTH
                        ? "border-yellow-500/50 hover:border-yellow-400"
                        : "border-gray-700/50 hover:border-gray-600"
                }
                ${
                    normalizedData.boost_count > 0
                        ? "border-[#00ff9d]/30 hover:border-[#00ff9d]/50"
                        : ""
                }
            `}
            >
                {/* KOTH Banner */}
                {isKOTH && (
                    <div
                        className="bg-gradient-to-r from-yellow-500/20 via-yellow-400/30 to-yellow-500/20
                        px-4 py-2 text-center relative backdrop-blur-sm"
                    >
                        <span className="text-yellow-300 text-lg font-bold tracking-wide">
                            👑 King of The Hill #{kothRank}
                        </span>
                    </div>
                )}

                {/* Boost Banner */}
                {normalizedData.boost_count > 0 && (
                    <div
                        className="bg-gradient-to-r from-[#00ff9d]/5 via-[#00ff9d]/20 to-[#00ff9d]/5
                        px-4 py-2.5 text-center backdrop-blur-sm"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-[#00ff9d] text-lg font-bold tracking-wide flex items-center gap-2">
                                <span className="text-xl">🚀</span>
                                {normalizedData.boost_count}
                                <span className="text-[#00ff9d]/80 font-medium">
                                    {normalizedData.boost_count === 1
                                        ? "Boost"
                                        : "Boosts"}
                                </span>
                            </span>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="p-4 space-y-3">
                    {/* Top section with image and info - keep horizontal spacing but reduce vertical */}
                    <div className="flex gap-6">
                        {/* Keep image size but reduce padding */}
                        <div
                            className="w-[100px] h-[100px] rounded-xl overflow-hidden ring-1 ring-gray-700/50
                            bg-gray-800/50 backdrop-blur-sm flex-shrink-0"
                        >
                            <img
                                src={
                                    normalizedData.logo ||
                                    `https://image.bullx.io/1399811149/${normalizedData.mint}`
                                }
                                alt={normalizedData.symbol}
                                className="w-full h-full object-cover pointer-events-none"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = `https://placehold.co/200x200/1c1d25/00ff9d?text=${normalizedData.symbol}`;
                                }}
                            />
                        </div>

                        {/* Token Info - reduce vertical spacing */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <button
                                    onClick={handleCopy}
                                    className="group text-left"
                                >
                                    <h3
                                        className="text-2xl font-bold text-white group-hover:text-[#00ff9d]
                                        transition-colors"
                                    >
                                        {normalizedData.symbol}
                                    </h3>
                                    <p className="text-base text-gray-400 mt-0.5">
                                        {normalizedData.name}
                                    </p>
                                </button>
                            </div>

                            {/* Social Links - reduced top margin */}
                            <div className="flex gap-4 mt-2">
                                {normalizedData.twitter && (
                                    <a
                                        href={normalizedData.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-500 hover:text-[#00ff9d] transition-colors"
                                    >
                                        <FaTwitter size={22} />
                                    </a>
                                )}
                                {normalizedData.telegram && (
                                    <a
                                        href={
                                            normalizedData.telegram.startsWith(
                                                "http"
                                            )
                                                ? normalizedData.telegram
                                                : `https://t.me/${normalizedData.telegram}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-500 hover:text-[#00ff9d] transition-colors"
                                    >
                                        <FaTelegram size={22} />
                                    </a>
                                )}
                                {normalizedData.website && (
                                    <a
                                        href={normalizedData.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-500 hover:text-[#00ff9d] transition-colors"
                                    >
                                        <FaGlobe size={22} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid - reduce padding */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#1c1d25] rounded-xl p-3">
                            <div className="text-gray-400 text-sm mb-1">
                                Market Cap
                            </div>
                            <div className="text-[#00ff9d] text-xl font-bold">
                                ${formatNumber(normalizedData.marketCap)}
                            </div>
                        </div>

                        <div className="bg-[#1c1d25] rounded-xl p-3">
                            <div className="text-gray-400 text-sm mb-1">
                                Volume (24h)
                            </div>
                            <div className="text-[#00ff9d] text-xl font-bold">
                                ${formatNumber(normalizedData.volume24h)}
                            </div>
                        </div>

                        <div className="bg-[#1c1d25] rounded-xl p-3">
                            <div className="text-gray-400 text-sm mb-1">
                                Price Change (24h)
                            </div>
                            <div
                                className={`text-sm font-bold ${
                                    normalizedData.priceChange24h >= 0
                                        ? "text-green-400"
                                        : "text-red-400"
                                }`}
                            >
                                {normalizedData.priceChange24h > 0 ? "+" : ""}
                                {normalizedData.priceChange24h?.toFixed(2)}%
                            </div>
                        </div>

                        <div className="bg-[#1c1d25] rounded-xl p-3">
                            <div className="text-gray-400 text-sm mb-1">
                                Transactions
                            </div>
                            <div className="flex flex-col">
                                <div className="text-[#00ff9d] text-xl font-bold">
                                    {formatNumber(
                                        normalizedData.transactions24h
                                    )}
                                </div>
                                {normalizedData.buys &&
                                    normalizedData.sells && (
                                        <div className="flex items-center gap-2 text-xs mt-1">
                                            <span className="text-green-400">
                                                {formatNumber(
                                                    normalizedData.buys
                                                )}{" "}
                                                buys
                                            </span>
                                            <span className="text-red-400">
                                                {formatNumber(
                                                    normalizedData.sells
                                                )}{" "}
                                                sells
                                            </span>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>

                    {/* KOL and timestamp info */}
                    <div className="flex items-center justify-between text-sm">
                        {(normalizedData.kolCount ||
                            normalizedData.kolTracker?.length > 0) && (
                            <div className="flex items-center gap-2 relative group">
                                <span className="text-gray-400">KOL</span>
                                <span
                                    className="text-[#00ff9d] font-medium px-2 py-0.5 rounded-md
                                    bg-[#00ff9d]/10 border border-[#00ff9d]/20"
                                >
                                    {normalizedData.kolTracker?.filter(
                                        (kol) => kol.txType === "buy"
                                    ).length || 0}
                                </span>

                                {/* Show up to 2 KOL names stacked */}
                                {normalizedData.kolTracker &&
                                    normalizedData.kolTracker.length > 0 && (
                                        <>
                                            <span className="text-gray-400">
                                                •
                                            </span>
                                            <div className="flex flex-col justify-center -space-y-0.5">
                                                <span className="text-gray-400">
                                                    {
                                                        normalizedData
                                                            .kolTracker[0].label
                                                    }
                                                </span>
                                                {normalizedData.kolTracker[1] &&
                                                    normalizedData.kolTracker[1]
                                                        .txType === "buy" && (
                                                        <span className="text-gray-400">
                                                            {
                                                                normalizedData
                                                                    .kolTracker[1]
                                                                    .label
                                                            }
                                                        </span>
                                                    )}
                                            </div>
                                        </>
                                    )}

                                {/* Hover tooltip with all details */}
                                <div
                                    className="absolute opacity-0 group-hover:opacity-100
                                    transition-opacity duration-200
                                    bottom-full md:left-[-0.5rem] mb-2
                                    z-[100]"
                                >
                                    <KolTooltip
                                        kols={normalizedData.kolTracker}
                                    />
                                </div>
                            </div>
                        )}

                        {normalizedData.timestamp &&
                            formatTime(normalizedData.timestamp) !==
                                "Invalid Date" && (
                                <span className="text-gray-400">
                                    {formatTime(normalizedData.timestamp)}
                                </span>
                            )}
                    </div>

                    {/* Top Trader Info */}
                    {normalizedData.topTrader && (
                        <div className="mt-3 p-3 bg-[#1c1d25] rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-yellow-400 text-sm">
                                        Top Trader #
                                        {normalizedData.topTrader.rank}
                                    </span>
                                    <span className="text-[#00ff9d] text-sm font-medium">
                                        $
                                        {formatNumber(
                                            parseFloat(
                                                normalizedData.topTrader.amount
                                            )
                                        )}
                                    </span>
                                </div>
                                <span className="text-gray-400 text-sm">
                                    {formatTime(
                                        normalizedData.topTrader.timestamp
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Quick Swap Section */}
                    {actualBot === "stalkswap" ? (
                        <QuickSwap
                            token={normalizedData}
                            selectedBot={actualBot}
                            darkMode={true}
                        />
                    ) : (
                        <button
                            onClick={onTokenClick}
                            className="w-full py-2.5 px-4 mt-2 rounded-lg font-medium text-sm
                                bg-gradient-to-r from-[#1a472a] to-[#1a572a]
                                text-[#00ff9d] hover:from-[#1a572a] hover:to-[#1a672a]
                                transition-all duration-300 transform hover:scale-[1.02]"
                        >
                            Buy with{" "}
                            {actualBot.charAt(0).toUpperCase() +
                                actualBot.slice(1)}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

UnifiedTokenCard.displayName = "UnifiedTokenCard";

export default UnifiedTokenCard;
