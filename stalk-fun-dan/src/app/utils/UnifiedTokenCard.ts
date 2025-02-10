// utils/normalizeTokenData.ts
export interface NormalizedTokenData {
    name: string;
    symbol: string;
    mint: string;
    price: number;
    marketCap: number;
    volume24h: number;
    priceChange24h: number;
    swaps24h?: number;
    transactions24h?: number;
    logo?: string;
    twitter?: string;
    telegram?: string;
    website?: string;
    boost_count?: number;
    kolTracker?: any[];
    lastTrader?: string;
    lastTxType?: "buy" | "sell";
    lastTxTime?: string | number;
    timeframes?: {
        [key: string]: {
            volume?: number;
            swaps?: number;
            priceChange?: number;
            buys?: number;
            sells?: number;
        };
    };
}

export const normalizeTokenData = (data: any): NormalizedTokenData => {
    // Helper to safely get nested values
    const get = (obj: any, path: string, defaultValue: any = undefined) => {
        const travel = (regexp: RegExp) =>
            String.prototype.split
                .call(path, regexp)
                .filter(Boolean)
                .reduce(
                    (res, key) =>
                        res !== null && res !== undefined ? res[key] : res,
                    obj
                );
        const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
        return result === undefined || result === null ? defaultValue : result;
    };

    // Get timeframe data if available
    const timeframes: any = {};
    const intervals = ["1m", "5m", "15m", "30m", "1h", "2h", "3h", "4h", "24h"];

    intervals.forEach((interval) => {
        const timeframeData =
            get(data, `stats.${interval}`) ||
            get(data, interval) ||
            get(data, `stats_${interval}`);
        if (timeframeData) {
            timeframes[interval] = {
                volume:
                    get(timeframeData, "volume.total") ||
                    get(timeframeData, "volume"),
                swaps:
                    get(timeframeData, "transactions") ||
                    get(timeframeData, "swaps"),
                priceChange:
                    get(timeframeData, "priceChangePercentage") ||
                    get(timeframeData, "price_change_percent"),
                buys: get(timeframeData, "buys"),
                sells: get(timeframeData, "sells"),
            };
        }
    });

    return {
        name: get(data, "name") || get(data, "stats.token.name", ""),
        symbol: get(data, "symbol") || get(data, "stats.token.symbol", ""),
        mint: get(data, "mint") || get(data, "contract_address", ""),
        price: Number(get(data, "price", 0)),
        marketCap: Number(
            get(data, "marketCap") ||
                get(data, "market_cap") ||
                get(data, "usd_market_cap", 0)
        ),
        volume24h: Number(
            get(data, "volume24h") ||
                get(data, "stats.24h.volume.total") ||
                get(data, "stats_24h.volume.total", 0)
        ),
        priceChange24h: Number(
            get(data, "priceChange24h") ||
                get(data, "stats.24h.priceChangePercentage") ||
                get(data, "price_change_percent", 0)
        ),
        swaps24h: Number(
            get(data, "swaps_24h") ||
                get(data, "stats.24h.transactions") ||
                get(data, "stats_24h.transactions", 0)
        ),
        transactions24h: Number(
            get(data, "total_txns") ||
                get(data, "txns") ||
                get(data, "stats.24h.transactions", 0)
        ),
        logo:
            get(data, "logo") ||
            get(data, "image") ||
            get(data, "stats.token.image", ""),
        twitter:
            get(data, "twitter") ||
            get(data, "socials.twitter") ||
            get(data, "stats.token.twitter", ""),
        telegram:
            get(data, "telegram") ||
            get(data, "socials.telegram") ||
            get(data, "stats.token.telegram", ""),
        website: get(data, "website") || get(data, "stats.token.website", ""),
        boost_count: Number(get(data, "boost_count", 0)),
        kolTracker: get(data, "kolTracker", []),
        lastTrader: get(data, "lastTrader", ""),
        lastTxType: get(data, "lastTxType"),
        lastTxTime: get(data, "lastTxTime"),
        timeframes,
    };
};

