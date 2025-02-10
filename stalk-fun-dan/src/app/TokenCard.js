import React, { useEffect, useState, useRef, useMemo } from 'react';
import { formatCompactNumber } from '../../utils/formatters';
import { TokenServiceContext } from '../../contexts/TokenServiceContext';
import { useContext } from 'react';
import { useBotContext } from '../../contexts/BotContext';
import QuickSwap from '../QuickSwap';
import { useSendTransaction, useSolanaWallets } from '@privy-io/react-auth/solana';
import { Connection, PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { showTransactionToast } from '../../utils/toastUtils';


const ensureValidLabel = (label, address, fallback = 'Unknown') => {
  if (typeof label === 'string' && label.trim()) return label.trim();
  if (typeof address === 'string' && address.trim()) return `Trader ${address.slice(0, 4)}`;
  return fallback;
};

const KolTooltip = ({ kolPositions, price = 0 }) => {
  if (!kolPositions || Object.keys(kolPositions).length === 0) return null;

  // Only show positions that have a positive amount
  const validPositions = Object.entries(kolPositions).filter(([kol, pos]) =>
    kol && pos && typeof pos.amount === 'number' && pos.amount > 0 && pos.lastAction !== 'sell'
  );

  if (validPositions.length === 0) return null;

  return (
    <div className="absolute z-50 bg-[#1E1F25] border border-[#2C2D33] rounded-lg p-3 shadow-lg min-w-[200px] -translate-y-full -translate-x-1/2 mt-2">
      <div className="text-sm font-medium text-white mb-2">Current KOL Positions:</div>
      <div className="space-y-1">
        {validPositions.map(([kol, position]) => {
          const { amount = 0, lastAction = '', timestamp, address } = position;
          const usdValue = amount * price;
          const displayLabel = ensureValidLabel(kol, address);

          // Format amount with 2 decimal places and K/M suffix
          const formatAmount = (value) => {
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(2)}M`;
            }
            if (value >= 1000) {
              return `${(value / 1000).toFixed(2)}K`;
            }
            return value.toFixed(2);
          };

          // Format USD value with $ and 2 decimal places
          const formatUSD = (value) => {
            if (value >= 1000000) {
              return `$${(value / 1000000).toFixed(2)}M`;
            }
            if (value >= 1000) {
              return `$${(value / 1000).toFixed(2)}K`;
            }
            return `$${value.toFixed(2)}`;
          };

          return (
            <div key={displayLabel} className="flex justify-between text-sm">
              <span className="text-[#7C7D82]">{displayLabel}:</span>
              <div className="text-right">
                <span className={`${lastAction === 'sell' ? 'text-red-500' : 'text-[#00ff9d]'}`}>
                  {formatAmount(amount)}
                </span>
                <span className="text-[#7C7D82] ml-1">({formatUSD(usdValue)})</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-0 border-b-[#2C2D33]" />
    </div>
  );
};

const formatAmount = (value) => {
  if (!value) return '0';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(2);
};

const formatUSD = (value) => {
  if (!value) return '$0';
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
};

const TokenStatRow = ({ label, value, change }) => (
  <div className="flex items-center justify-between">
    <span className="text-[#7C7D82] text-base">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-white text-base font-medium">
        {label.includes('Market Cap') || label.includes('Volume')
          ? formatUSD(value)
          : formatAmount(value)
        }
      </span>
      {change !== undefined && (
        <span className={`text-base font-medium ${change >= 0 ? 'text-[#00ff9d]' : 'text-red-500'}`}>
          {change > 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      )}
    </div>
  </div>
);

const TokenTitle = ({ name, mint, onCopyMint }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [fontSize, setFontSize] = useState('text-2xl');
  const titleRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (titleRef.current && containerRef.current) {
      const titleWidth = titleRef.current.scrollWidth;
      const containerWidth = containerRef.current.offsetWidth - 70; // Space for kolCount

      if (titleWidth > containerWidth) {
        setFontSize('text-xl');
      } else {
        setFontSize('text-2xl');
      }
    }
  }, [name]);

  const handleClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    setPopupPosition({
      x: e.clientX,
      y: rect.bottom + window.scrollY + 5
    });
    setShowPopup(true);
    navigator.clipboard.writeText(mint);
    setTimeout(() => setShowPopup(false), 1000);
  };

  return (
    <div ref={containerRef} className="w-full pr-16">
      <h3
        ref={titleRef}
        onClick={handleClick}
        className={`font-bold ${fontSize} text-white truncate hover:text-[#00ff9d] transition-colors cursor-pointer`}
      >
        {name}
      </h3>
      {showPopup && (
        <div
          className="fixed bg-[#2A2B31] text-[#00ff9d] px-2 py-1 rounded text-xs font-medium shadow-lg z-50 pointer-events-none animate-quick-fade"
          style={{
            left: popupPosition.x + 'px',
            top: popupPosition.y + 'px',
            transform: 'translateX(-50%)'
          }}
        >
          Copied!
        </div>
      )}
    </div>
  );
};

const KolActivity = ({ kolTracker, formatTime }) => {
  if (!kolTracker?.length) return null;

  // Sort and filter invalid entries
  const sortedTransactions = [...kolTracker]
    .filter(tx => tx && (
      tx.label?.trim() ||
      tx.address?.trim() ||
      tx.trader?.label?.trim() ||
      tx.trader?.address?.trim()
    ))
    .sort((a, b) => {
      const getTime = (tx) => {
        if (!tx?.timestamp) return 0;
        if (typeof tx.timestamp === 'string' && tx.timestamp.includes('T')) {
          return new Date(tx.timestamp).getTime();
        }
        const ts = typeof tx.timestamp === 'string' ? parseInt(tx.timestamp) : tx.timestamp;
        return ts > 2000000000 ? ts : ts * 1000;
      };
      return getTime(b) - getTime(a);
    });

  // Get unique traders with valid labels and their latest positions
  const uniqueTraders = new Map();
  sortedTransactions.forEach(tx => {
    const label = ensureValidLabel(
      tx.label || tx.trader?.label,
      tx.address || tx.trader?.address
    );

    if (!uniqueTraders.has(label)) {
      uniqueTraders.set(label, {
        ...tx,
        label,
        position: parseFloat(tx.position || 0),
        amount: parseFloat(tx.amount || tx.position || 0)
      });
    }
  });

  const recentTraders = Array.from(uniqueTraders.values())
    .filter(tx => tx.amount > 0)
    .slice(0, 2);

  return (
    <div className="text-[10px] text-[#7C7D82] mt-1">
      {recentTraders.map((interaction, idx) => {
        const displayLabel = ensureValidLabel(
          interaction.label || interaction.trader?.label,
          interaction.address || interaction.trader?.address
        );
        const amount = formatCompactNumber(interaction.amount).replace('$', '');

        return (
          <div key={idx} className="flex items-center gap-1">
            <span className={interaction.txType === 'sell' ? 'text-red-500' : 'text-[#00ff9d]'}>
              {displayLabel}
            </span>
            <span className="text-[#7C7D82]">•</span>
            <span className={interaction.txType === 'sell' ? 'text-red-500' : 'text-[#00ff9d]'}>
              {interaction.txType === 'sell' ? '-' : '+'}{amount}
            </span>
            <span className="text-[#7C7D82]">•</span>
            <span>{formatTime(interaction.timestamp)}</span>
          </div>
        );
      })}
    </div>
  );
};

const findMatchingTrader = (timestamp, kolTracker = [], recentTransactions = []) => {
  if (!timestamp) return null;

  // Normalize timestamp to milliseconds
  const targetTime = timestamp > 2000000000000 ? timestamp : timestamp * 1000;

  // First try to find in kolTracker
  const matchingKol = kolTracker.find(kol => {
    if (!kol?.timestamp) return false;
    const kolTime = kol.timestamp > 2000000000000 ? kol.timestamp : kol.timestamp * 1000;
    return Math.abs(kolTime - targetTime) < 1000; // Within 1 second
  });

  if (matchingKol?.label) {
    return {
      label: matchingKol.label,
      txType: matchingKol.txType || 'buy'
    };
  }

  // Then try recentTransactions
  const matchingTx = recentTransactions.find(tx => {
    if (!tx?.timestamp) return false;
    const txTime = tx.timestamp > 2000000000000 ? tx.timestamp : tx.timestamp * 1000;
    return Math.abs(txTime - targetTime) < 1000;
  });

  if (matchingTx?.trader) {
    return {
      label: matchingTx.trader,
      txType: matchingTx.txType || 'buy'
    };
  }

  return null;
};

// Add getBuyUrl helper function
const getBuyUrl = (tokenAddress, selectedBot = 'neo') => {
  switch(selectedBot) {
    case 'gmgn':
      return `https://gmgn.ai/sol/token/ZoMLz7FD_${tokenAddress}`;
    case 'trojan':
      return `https://t.me/paris_trojanbot?start=r-dangelo352-${tokenAddress}`;
    case 'photon':
      return `https://photon-sol.tinyastro.io/en/r/@DanTheMan/${tokenAddress}`;
    case 'nova':
      return `https://t.me/TradeonNovaBot?start=r-DanTheMan-${tokenAddress}`;
    case 'bullx':
      return `https://bullx.io/terminal?chainId=1399811149&address=${tokenAddress}&r=GY21GEJFAG7`;
    case 'neo':
    default:
      return `https://neo.bullx.io/terminal?chainId=1399811149&address=${tokenAddress}&r=GY21GEJFAG7`;
  }
};

const calculatePositions = (kolTracker) => {
  if (!kolTracker?.length) return {};

  const positions = {};
  const walletTransactions = {};

  // Group transactions by wallet/label
  kolTracker.forEach(tx => {
    if (!tx) return;
    const label = tx.label?.trim() || tx.trader?.trim() || '';
    if (!label) return;

    if (!walletTransactions[label]) {
      walletTransactions[label] = [];
    }

    // Get the absolute position value
    const positionValue = Math.abs(parseFloat(tx.position || 0));
    if (positionValue > 0) {
      walletTransactions[label].push({
        ...tx,
        position: positionValue,
        timestamp: tx.timestamp,
        txType: tx.txType || 'buy'
      });
    }
  });

  // Process each wallet's transactions chronologically
  Object.entries(walletTransactions).forEach(([label, transactions]) => {
    let currentPosition = 0;
    let lastAction = '';
    let lastTimestamp = 0;

    // Sort transactions chronologically
    const chronologicalTxs = transactions.sort((a, b) => {
      const getTime = (tx) => {
        if (tx.timestamp instanceof Date) return tx.timestamp.getTime();
        if (typeof tx.timestamp === 'string' && tx.timestamp.includes('T')) {
          return new Date(tx.timestamp).getTime();
        }
        const ts = typeof tx.timestamp === 'string' ? parseInt(tx.timestamp) : tx.timestamp;
        return ts > 2000000000 ? ts : ts * 1000;
      };
      return getTime(a) - getTime(b);
    });

    // Process transactions in order
    chronologicalTxs.forEach(tx => {
      const positionValue = Math.abs(parseFloat(tx.position || 0));
      if (positionValue <= 0) return;

      // Update position based on transaction type
      if (tx.txType === 'buy') {
        currentPosition += positionValue;
      } else if (tx.txType === 'sell') {
        currentPosition = Math.max(0, currentPosition - positionValue);
      }

      // Update last action info
      let txTimestamp;
      if (tx.timestamp instanceof Date) {
        txTimestamp = tx.timestamp.getTime();
      } else if (typeof tx.timestamp === 'string' && tx.timestamp.includes('T')) {
        txTimestamp = new Date(tx.timestamp).getTime();
      } else {
        const ts = typeof tx.timestamp === 'string' ? parseInt(tx.timestamp) : tx.timestamp;
        txTimestamp = ts > 2000000000 ? ts : ts * 1000;
      }

      if (txTimestamp > lastTimestamp) {
        lastAction = tx.txType;
        lastTimestamp = txTimestamp;
      }
    });

    // Only add to positions if there's a current balance and last action was buy
    if (currentPosition > 0 && lastAction === 'buy') {
      positions[label] = {
        amount: currentPosition,
        lastAction,
        timestamp: lastTimestamp
      };
    }
  });

  return positions;
};

const TokenCard = ({
  token,
  isKOTH = false,
  kothRank = 1,
  darkMode,
  firstSeen,
  lastUpdated,
  timeframe,
  getBuyUrl,
  onBuy = () => {},
  isBoosted = false
}) => {
  if (!token || (isBoosted && !token.boost_count)) {
    return null;
  }

  // Early return if no token or no valid trader label
  if (!token) return null;

  // Check if we have a valid trader label
  const hasValidTrader = token.lastTrader?.trim() ||
    token.kolTracker?.some(kol => kol.label?.trim()) ||
    token.recentTransactions?.some(tx => tx.trader?.trim());

  // Don't render the card if we can't find a valid trader
  if (!hasValidTrader) return null;

  const [tokenData, setTokenData] = useState(() => {
    return {...token};
  });

  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState({});
  const [settings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('swapSettings') || '') || {
        slippage: 1,
        speed: 'fast',
        tip: 0
      };
    } catch {
      return {
        slippage: 1,
        speed: 'fast',
        tip: 0
      };
    }
  });

  useEffect(() => {
    if (token) {
      setTokenData(token);
    }
  }, [token]);

  const handleCopyMint = () => {
    navigator.clipboard.writeText(tokenData.mint);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const stats = tokenData.stats?.[timeframe] || {};
  const priceChange = stats.priceChangePercentage || tokenData.priceChange24h || 0;

  // Format the time for display
  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    try {
      let date;

      // Handle ISO string format (2024-12-22T21:19:20.819+00:00)
      if (typeof timestamp === 'string' && timestamp.includes('T')) {
        date = new Date(timestamp);
      } else {
        // Handle numeric timestamps
        const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
        if (isNaN(ts)) return '';

        // Convert to seconds if in milliseconds
        const timeInSeconds = ts > 2000000000 ? ts / 1000 : ts;
        date = new Date(timeInSeconds * 1000);
      }

      if (isNaN(date.getTime())) return '';

      // Get current time
      const now = new Date();
      const diffMinutes = Math.floor((now - date) / (1000 * 60));

      // If less than 60 minutes ago, show "X min ago"
      if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
      }

      // Otherwise show time
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const handleTraderHover = (e) => {
    const rect = e.target.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + (rect.width / 2),
      y: rect.top
    });
    setShowTooltip(true);
  };

  // Add safe KOL data handling
  const safeKolData = React.useMemo(() => {
    if (!token) return { count: 0, positions: {} };

    // Ensure kolTracker is an array and has valid labels
    const validKols = (token.kolTracker || []).filter(kol =>
      kol && (kol.label?.trim() || kol.address?.trim())
    );

    // Create positions object with fallback labels
    const positions = {};
    validKols.forEach(kol => {
      const label = kol.label?.trim() || kol.address?.trim() || 'Unknown KOL';
      positions[label] = {
        amount: kol.position || 0,
        lastAction: kol.txType || '',
        timestamp: kol.timestamp
      };
    });

    return {
      count: validKols.length,
      positions
    };
  }, [token]);

  // Update the KOL count display
  const renderKolCount = () => {
    if (!safeKolData.count) return null;
    return (
      <span className={`text-[10px] ${darkMode ? 'text-[#00ff9d]/80' : 'text-green-600'}`}>
        ({safeKolData.count} KOL{safeKolData.count > 1 ? 's' : ''})
      </span>
    );
  };

  const [positions, setPositions] = useState({});

  useEffect(() => {
    if (token?.kolTracker) {
      // Calculate positions from kolTracker which comes from either Kol or Trader model
      const calculatedPositions = calculatePositions(token.kolTracker);
      setPositions(calculatedPositions);
    }
  }, [token?.kolTracker]);

  // Add image loading state
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Create memoized image URL to prevent re-renders
  const imageUrl = useMemo(() => {
    if (imageError) return '/default-token.png'; // Fallback image
    const address = tokenData.mint || tokenData.address;
    return `https://image.bullx.io/1399811149/${address}`;
  }, [tokenData.mint, tokenData.address, imageError]);

  const { selectedBot } = useBotContext();
  const { sendTransaction } = useSendTransaction();
  const { ready, wallets } = useSolanaWallets();
  const wallet = useMemo(() => {
    if (!ready || !wallets.length) return null;
    return wallets.find(w => w.walletClientType === 'privy') || wallets[0];
  }, [ready, wallets]);

  const handleSell = async (token, percentage) => {
    const loadingKey = `${token.mint}-${percentage}`;
    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    let sellAmount = 0;
    let pendingToast;

    try {
      if (!wallet?.address) {
        throw new Error('Wallet not connected');
      }

      // Calculate exact percentage of token amount without rounding
      const exactAmount = token.amount * (percentage / 100);
      sellAmount = exactAmount;

      // Show pending toast
      pendingToast = showTransactionToast({
        type: 'pending',
        inputAmount: sellAmount,
        inputSymbol: token.symbol,
        outputSymbol: 'SOL',
        txSignature: '',
        tip: settings.tip
      });

      // Execute swap
      const swapResponse = await axios.post(`/api/swap`, {
        chain_uid: 'solana',
        wallet: wallet.address,
        buy_token: 'So11111111111111111111111111111111111111112',
        sell_token: token.mint,
        amount: exactAmount.toString(),
        slippage: settings.slippage,
        speed: settings.speed,
        tip: settings.tip.toString(),
        fee_address: '8PzqBRQps2dx9X6CVi9V5fixf7CKwPMpJAVUdVQMLbTT'
      });

      if (!swapResponse?.data?.transaction?.message) {
        throw new Error('Invalid swap response');
      }

      // Create versioned transaction
      const messageV0 = new TransactionMessage({
        payerKey: new PublicKey(wallet.address),
        recentBlockhash: swapResponse.data.transaction.message.recentBlockhash,
        instructions: swapResponse.data.transaction.message.compiledInstructions.map(ix => ({
          programId: new PublicKey(swapResponse.data.transaction.message.staticAccountKeys[ix.programIdIndex]),
          keys: ix.accountKeyIndexes.map(index => ({
            pubkey: new PublicKey(swapResponse.data.transaction.message.staticAccountKeys[index]),
            isSigner: index === 0,
            isWritable: true
          })),
          data: Buffer.from(ix.data.data)
        }))
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);

      // Send transaction
      const connection = new Connection(HELIUS_RPC, 'confirmed');
      const txReceipt = await sendTransaction({
        transaction,
        connection,
        uiOptions: {
          skipPreflight: true,
          maxRetries: 3,
          commitment: 'confirmed'
        }
      });

      if (!txReceipt?.signature) {
        throw new Error('Transaction failed - no signature received');
      }

      // Dismiss pending toast
      if (pendingToast) toast.dismiss(pendingToast);

      // Show success toast
      showTransactionToast({
        type: 'success',
        inputAmount: sellAmount,
        inputSymbol: token.symbol,
        outputAmount: formatNumber(Number(swapResponse.data.quote.amount_out) / 1e9),
        outputSymbol: 'SOL',
        txSignature: txReceipt.signature,
        tip: settings.tip
      });

    } catch (error) {
      console.error('Swap error:', error);
      if (pendingToast) toast.dismiss(pendingToast);
      showTransactionToast({
        type: 'error',
        inputAmount: sellAmount,
        inputSymbol: token.symbol,
        outputSymbol: 'SOL',
        outputAmount: 0,
        txSignature: '',
        tip: settings.tip
      });
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  return (
    <div className="bg-[#1E1F25] rounded-2xl p-4 relative">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden">
          {!imageLoaded && !imageError && (
            <div className="w-16 h-16 bg-gray-800 animate-pulse" />
          )}
          <img
            src={imageUrl}
            alt={tokenData.name}
            className={`w-16 h-16 object-cover ${!imageLoaded ? 'hidden' : ''}`}
            onError={() => {
              if (!imageError) {
                setImageError(true);
              }
            }}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="absolute top-4 right-4">
            <div
              className={`px-2.5 py-1 text-xs font-bold rounded-md z-10 cursor-pointer ${
                tokenData.lastTxType === 'sell'
                  ? 'bg-[#1E1F25] text-red-500 ring-1 ring-red-500/20'
                  : 'bg-[#1E1F25] text-[#00ff9d] ring-1 ring-[#00ff9d]/20'
              }`}
              onMouseEnter={handleTraderHover}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {Object.keys(positions).length || 0}
            </div>
          </div>

          <div>
            <TokenTitle
              name={tokenData.name}
              mint={tokenData.mint}
              onCopyMint={handleCopyMint}
            />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[#7C7D82] text-base">{tokenData.symbol}</span>
              {priceChange !== 0 && (
                <span className={`text-base font-medium ${priceChange >= 0 ? 'text-[#00ff9d]' : 'text-red-500'}`}>
                  {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              )}
            </div>
            <KolActivity kolTracker={tokenData.kolTracker} formatTime={formatTime} />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <TokenStatRow
          label="Market Cap"
          value={parseFloat(tokenData.marketCap)}
        />
        <TokenStatRow
          label={`Volume (${timeframe.replace('h', '').replace('m', '')}${timeframe.startsWith('h') ? 'h' : 'm'})`}
          value={parseFloat(stats.volume?.total || tokenData.volume24h || 0)}
        />

        <div className="flex items-center justify-between h-6">
          <span
            className={`text-base font-medium ${
              tokenData.lastTxType === 'sell' ? 'text-red-500' : 'text-[#00ff9d]'
            } relative cursor-pointer`}
            onMouseEnter={handleTraderHover}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {ensureValidLabel(tokenData.lastTrader, tokenData.lastTraderAddress)}
            {showTooltip && Object.keys(positions).length > 0 && (
              <div
                style={{
                  position: 'fixed',
                  left: tooltipPosition.x,
                  top: tooltipPosition.y,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <KolTooltip
                  kolPositions={positions}
                  price={token.price || 0}
                />
              </div>
            )}
          </span>
          <span className="text-[#7C7D82] text-sm">
            {formatTime(tokenData.lastTxTime)}
          </span>
        </div>

        {stats.buys !== undefined && stats.sells !== undefined && (
          <div className="flex justify-between text-sm text-[#7C7D82]">
            <div>Buys: <span className="text-[#00ff9d]">{stats.buys}</span></div>
            <div>Sells: <span className="text-red-500">{stats.sells}</span></div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        {selectedBot !== 'stalkswap' && (
          <a
            href={getBuyUrl(tokenData.mint || tokenData.address)}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-2 px-4 rounded-lg font-medium text-base text-center transition-colors ${
              selectedBot === 'photon'
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600'
                : selectedBot === 'neo'
                ? 'bg-[#1a472a] text-[#00ff9d] hover:bg-[#1a572a]'
                : selectedBot === 'trojan'
                ? 'bg-indigo-900 text-white hover:bg-indigo-800'
                : selectedBot === 'nova'
                ? 'bg-purple-900 text-white hover:bg-purple-800'
                : selectedBot === 'gmgn'
                ? 'bg-blue-900 text-white hover:bg-blue-800'
                : 'bg-[#1a472a] text-[#00ff9d] hover:bg-[#1a572a]'
            }`}
          >
            Buy with {selectedBot.charAt(0).toUpperCase() + selectedBot.slice(1)}
          </a>
        )}
      </div>

      {/* QuickSwap Integration */}
      {selectedBot === 'stalkswap' && (
        <div>
          <QuickSwap
            token={token}
            selectedBot={selectedBot}
            darkMode={true}
          />
        </div>
      )}
    </div>
  );
};

export default TokenCard;
