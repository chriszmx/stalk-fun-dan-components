export interface NormalizedTokenData {
  name: string;
  symbol: string;
  mint: string;
  price: number | null;
  marketCap: number | null;
  volume24h: number | null;
  priceChange24h: number | null;
  swaps24h?: number | null;
  transactions24h?: number | null;
  logo?: string | null;
  twitter?: string | null;
  telegram?: string | null;
  website?: string | null;
  boost_count?: number | null;
  kolTracker?: any[] | null;
  lastTrader?: string | null;
  lastTxType?: 'buy' | 'sell' | null;
  lastTxTime?: string | number | null;
  timeframes?: {
    [key: string]: {
      volume?: number | null;
      swaps?: number | null;
      priceChange?: number | null;
      buys?: number | null;
      sells?: number | null;
    };
  } | null;
  kolCount?: number | null;
  timestamp?: number | null;  // Unix timestamp in milliseconds
  stats?: {
    "1m": {
      priceChange: number;
      volume: number;
      transactions: number;
    }
  };
  buys?: number;
  sells?: number;
  quickSwapEnabled?: boolean;
  topTrader?: {
    rank: number;
    amount: string;
    timestamp: string;
  };
}

export const normalizeTokenData = (data: any): NormalizedTokenData => {
  // Helper to safely get nested values with type conversion
  const get = (obj: any, path: string, defaultValue: any = null) => {
    try {
      const travel = (regexp: RegExp) =>
        String.prototype.split
          .call(path, regexp)
          .filter(Boolean)
          .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
      const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
      return result === undefined || result === null ? defaultValue : result;
    } catch {
      return defaultValue;
    }
  };

  // Helper to safely convert to number
  const toNumber = (value: any, defaultValue: number | null = null): number | null => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Helper to normalize timestamp to milliseconds
  const normalizeTimestamp = (value: any): number | null => {
    if (!value) return null;
    const timestamp = Number(value);
    if (isNaN(timestamp)) return null;
    // Convert seconds to milliseconds if needed (timestamps before 2000)
    return timestamp < 946684800000 ? timestamp * 1000 : timestamp;
  };

  // Get timeframe data if available
  const timeframes: any = {};
  const intervals = ['1m', '5m', '15m', '30m', '1h', '2h', '3h', '4h', '24h'];

  intervals.forEach(interval => {
    const timeframeData = get(data, `stats.${interval}`) || get(data, interval) || get(data, `stats_${interval}`);
    if (timeframeData) {
      timeframes[interval] = {
        volume: toNumber(get(timeframeData, 'volume.total') || get(timeframeData, 'volume')),
        swaps: toNumber(get(timeframeData, 'transactions') || get(timeframeData, 'swaps')),
        priceChange: toNumber(get(timeframeData, 'priceChangePercentage') || get(timeframeData, 'price_change_percent')),
        buys: toNumber(get(timeframeData, 'buys')),
        sells: toNumber(get(timeframeData, 'sells'))
      };
    }
  });

  // Handle social links with multiple possible locations
  const twitter = get(data, 'twitter') ||
                 get(data, 'socials.twitter') ||
                 get(data, 'stats.token.twitter');

  const telegram = get(data, 'telegram') ||
                  get(data, 'socials.telegram') ||
                  get(data, 'stats.token.telegram');

  // Handle transactions with multiple possible names
  const transactions = toNumber(
    get(data, 'total_txns') ||
    get(data, 'txns') ||
    get(data, 'transactions') ||
    get(data, 'stats.24h.transactions')
  );

  return {
    name: get(data, 'name') || get(data, 'stats.token.name', ''),
    symbol: get(data, 'symbol') || get(data, 'stats.token.symbol', ''),
    mint: get(data, 'mint') || get(data, 'contract_address', ''),
    price: toNumber(get(data, 'price')),
    marketCap: toNumber(
      get(data, 'marketCap') ||
      get(data, 'market_cap') ||
      get(data, 'usd_market_cap')
    ),
    volume24h: toNumber(
      get(data, 'volume24h') ||
      get(data, 'stats.24h.volume.total') ||
      get(data, 'stats_24h.volume.total')
    ),
    priceChange24h: toNumber(
      get(data, 'priceChange24h') ||
      get(data, 'stats.24h.priceChangePercentage') ||
      get(data, 'price_change_percent')
    ),
    swaps24h: toNumber(
      get(data, 'swaps_24h') ||
      get(data, 'stats.24h.transactions') ||
      get(data, 'stats_24h.transactions')
    ),
    transactions24h: transactions,
    logo: get(data, 'logo') || get(data, 'image') || get(data, 'image_uri') || get(data, 'stats.token.image'),
    twitter: twitter?.startsWith('http') ? twitter : twitter ? `https://twitter.com/${twitter}` : null,
    telegram: telegram?.startsWith('http') ? telegram : telegram ? `https://t.me/${telegram}` : null,
    website: get(data, 'website') || get(data, 'stats.token.website'),
    boost_count: toNumber(get(data, 'boost_count')),
    kolTracker: get(data, 'kolTracker') || get(data, 'kol_tracker') || [],
    lastTrader: get(data, 'lastTrader') || get(data, 'last_trader'),
    lastTxType: get(data, 'lastTxType') || get(data, 'last_tx_type'),
    lastTxTime: get(data, 'lastTxTime') || get(data, 'last_tx_time'),
    timeframes: Object.keys(timeframes).length > 0 ? timeframes : null,
    kolCount: toNumber(get(data, 'kolCount')),
    timestamp: normalizeTimestamp(
      get(data, 'timestamp') ||
      get(data, 'time') ||
      get(data, 'king_of_the_hill_timestamp') ||
      get(data, 'last_update') ||
      get(data, 'lastTxTime')
    ),
    stats: {
      "1m": {
        priceChange: toNumber(get(data, 'stats.1m.priceChangePercentage') || get(data, 'stats.1m.price_change_percent')),
        volume: toNumber(get(data, 'stats.1m.volume.total') || get(data, 'stats.1m.volume')),
        transactions: toNumber(get(data, 'stats.1m.transactions') || get(data, 'stats.1m.swaps'))
      }
    },
    buys: toNumber(get(data, 'buys')),
    sells: toNumber(get(data, 'sells')),
    quickSwapEnabled: get(data, 'quickSwapEnabled'),
    topTrader: get(data, 'topTrader') ? {
      rank: toNumber(get(data, 'topTrader.rank')),
      amount: get(data, 'topTrader.amount'),
      timestamp: get(data, 'topTrader.timestamp')
    } : undefined,
  };
};
