'use client';

import { useState, useEffect, memo } from 'react';
import { FaTwitter, FaTelegram, FaGlobe, FaCheckCircle } from 'react-icons/fa';
import { formatNumber } from '../utils/misc';
import { useBotContext } from '../contexts/BotContext';
import QuickSwap from './QuickSwap';
import { toast } from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';

const getStableDate = (timestamp: number) => {
  if (!timestamp) return 'Just Listed';
  const normalizedTime = timestamp > 1700000000000 ? Math.floor(timestamp / 1000) : timestamp;
  return new Date(normalizedTime * 1000).toISOString();
};

interface TokenCardProps {
  token: any;
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
  selectedBot: string;
  swapSettings?: {
    quickSwapPresets: number[];
    slippage: number;
    speed: string;
    tip: number;
  };
}

const TokenCard = memo(({ 
  token, 
  isKOTH = false,
  isBoosted = false,
  kothRank = 1, 
  darkMode,
  timeframe,
  title,
  onTokenClick,
  settings,
  selectedBot,
  swapSettings
}: TokenCardProps) => {
  const { selectedBot: contextSelectedBot } = useBotContext();
  const [copied, setCopied] = useState(false);
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState(false);

  // Don't render if token is invalid or doesn't meet boost requirements
  if (!token || (isBoosted && (!token.boost_count || token.boost_count <= 0))) {
    return null;
  }


  const getTimeframeData = () => {
    if (!timeframe) return null;
    
    // Get volume and swaps based on timeframe
    const volume = token[`volume_${timeframe}`] || token.volume || 0;
    const swaps = token[`swaps_${timeframe}`] || token.swaps || 0;
    const priceChange = token[`price_change_${timeframe}`] || token.price_change_percent || 0;
    
    return {
      volume,
      swaps,
      priceChange: parseFloat(priceChange).toFixed(2)
    };
  };

  const timeframeData = getTimeframeData();

  const formatTransactions = (txns: any): number => {
    if (typeof txns === 'number') return txns;
    
    // If it's an object with buys/sells
    if (txns && typeof txns === 'object') {
      const buys = parseInt(txns.buys || '0');
      const sells = parseInt(txns.sells || '0');
      return buys + sells;
    }

    return 0;
  };

  const displayTransactions = formatTransactions(token.swaps_24h || token.txns_24h || token.transactions_24h || 0);

  const handleCopy = async () => {
    if (token.address || token.mint) {
      await navigator.clipboard.writeText(token.address || token.mint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const time = token.boost_timestamp || 
                 token.last_boost_timestamp ||
                 token.created_timestamp || 
                 token.pool_creation_timestamp || 
                 token.open_timestamp || 
                 token.last_trade_timestamp;

    if (!time) {
      setFormattedDate('Just Listed');
      return;
    }

    const normalizedTime = time > 1700000000000 ? Math.floor(time / 1000) : time;
    const date = new Date(normalizedTime * 1000);
    
    const formatted = date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    setFormattedDate(formatted);
  }, [token]);

  const getMarketCap = (token: any) => {
    if (token.total_supply && token.price) {
      return (Number(token.total_supply) * Number(token.price)).toFixed(2);
    }
    return token.usd_market_cap || token.marketCap || token.market_cap || 0;
  };

  const stableDate = getStableDate(
    token.boost_timestamp || 
    token.last_boost_timestamp ||
    token.created_timestamp || 
    token.pool_creation_timestamp || 
    token.open_timestamp || 
    token.last_trade_timestamp
  );

  const handleQuickSwap = async (amount: number) => {
    if (!authenticated) {
      toast.error('Please connect your wallet first');
      login();
      return;
    }
    window.location.href = `/swap?inputMint=${token.mint}&amount=${amount}`;
  };

  return (
    <div className={`
      w-full rounded-2xl overflow-hidden 
      dark:bg-[#1c1d25] bg-white/70 dark:border-[#2e2f3b] border-gray-200/50
      border shadow-sm backdrop-blur-sm
      ${isKOTH ? 'border-yellow-400' : ''}
      ${token.boost_count > 0 ? 'border-[#00ff9d]' : ''}
    `}>
      {isKOTH && (
        <div className="bg-yellow-400 px-3 py-1.5 text-center relative">
          <span className="text-black text-md">
            <span className="shadow-sm">👑</span> 
            King of The Hill #{kothRank}
          </span>
          {token.isDexPaid && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-800">
              <FaCheckCircle className="text-sm" />
              <span className="text-xs font-medium">DEX</span>
            </span>
          )}
        </div>
      )}

      {token.boost_count > 0 && (
        <div className={`px-3 py-1.5 text-center
          ${darkMode
            ? 'bg-gradient-to-r from-[#00ff9d]/10 to-[#00ff9d]/20'
            : 'bg-gradient-to-r from-green-900 via-green-800 to-green-900'}`}>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#00ff9d] text-md font-bold flex items-center gap-1">
              <span className="text-lg">🚀</span>
              <span>{token.boost_count}</span>
            </span>
            <span className="text-[#00ff9d]/80 text-sm">
              {parseInt(token.boost_count) === 1 ? 'Boost' : 'Boosts'}
            </span>
          </div>
        </div>
      )}

      <div className="p-3 space-y-2">
        <div className="flex flex-row justify-between">
          <div className="aspect-square w-1/2 rounded-2xl overflow-hidden">
            <img
              src={token.logo || `https://image.bullx.io/1399811149/${token.mint || ''}`}
              alt={token.symbol || 'Token'}
              className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = `https://placehold.co/200x200/1c1d25/00ff9d?text=${token.symbol || 'Token'}`;
              }}
            />
          </div>

          <div className="w-1/2 space-y-2 items-center justify-center px-1 truncate">
            <span className={`text-[13px] py-1 font-bold text-center w-full block
              ${darkMode ? 'text-white' : 'text-gray-700'}`}
              suppressHydrationWarning
            >
              {formattedDate || stableDate}
            </span>

            <div className="w-full flex flex-col items-center text-center truncate">
              <button 
                onClick={handleCopy}
                className="flex flex-col items-center w-full transition-all duration-200 hover:opacity-80 truncate"
              >
                <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'} truncate`}>
                  {token.symbol}
                </span>
                <div className="flex items-center gap-1 w-full justify-center truncate">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                    {token.name}
                  </span>
                </div>
                
                {copied && (
                  <span className={`text-xs mt-0.5 ${darkMode ? 'text-[#00ff9d]' : 'text-green-600'}`}>
                    Copied
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              {token.twitter && (
                <a 
                  href={token.twitter.startsWith('http') ? token.twitter : `https://twitter.com/${token.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-lg ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <FaTwitter />
                </a>
              )}
              {token.telegram && (
                <a 
                  href={token.telegram.startsWith('http') ? token.telegram : `https://t.me/${token.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-lg ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <FaTelegram />
                </a>
              )}
              {token.website && (
                <a 
                  href={token.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-lg ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <FaGlobe />
                </a>
              )}
            </div>
          </div>
        </div>

        {timeframe && (
          <>
            <div className="flex items-center justify-between">
              <span className={`text-md font-bold ${darkMode ? 'text-gray-400' : 'text-gray-900'}`}>
                Market Cap
              </span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded 
                ${darkMode 
                  ? 'bg-[#00ff9d]/10 text-[#00ff9d]' 
                  : 'bg-gray-800 text-[#00ff9d]'}`}>
                ${formatNumber(getMarketCap(token))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-md font-bold ${darkMode ? 'text-gray-400' : 'text-gray-900'}`}>
                Volume (24hr)
              </span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded 
                ${darkMode 
                  ? 'bg-[#00ff9d]/10 text-[#00ff9d]' 
                  : 'bg-gray-800 text-[#00ff9d]'}`}>
                ${formatNumber(token.volume_24h || token.volume || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-md font-bold ${darkMode ? 'text-gray-400' : 'text-gray-900'}`}>
                Transactions (24hr)
              </span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded 
                ${darkMode 
                  ? 'bg-[#00ff9d]/10 text-[#00ff9d]' 
                  : 'bg-gray-800 text-[#00ff9d]'}`}>
                {formatTransactions(token.swaps_24h || token.txns_24h || token.transactions_24h || 0)}
              </span>
            </div>
          </>
        )}

        {selectedBot === 'stalkswap' ? (
          <QuickSwap
            token={token}
            selectedBot={selectedBot}
            darkMode={darkMode}
          />
        ) : (
          <div className="mt-4">
            <button
              onClick={onTokenClick}
              className="w-full py-2 px-4 rounded-lg font-medium text-base text-center transition-colors bg-[#1a472a] text-[#00ff9d] hover:bg-[#1a572a]"
            >
              Buy with {selectedBot.charAt(0).toUpperCase() + selectedBot.slice(1)}
            </button>
          </div>
        )}
      </div>

      {title?.toLowerCase() === 'trending' && timeframe && (
        <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/20 px-3 py-1.5 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-purple-500 text-md font-bold flex items-center gap-1">
              <span className="text-lg">📈</span>
              <span>{timeframeData?.priceChange || '0.00'}%</span>
            </span>
            <span className="text-purple-500/80 text-sm">
              {timeframe.toUpperCase()} Stats
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

TokenCard.displayName = 'TokenCard';

export default TokenCard; 