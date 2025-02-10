'use client';

import { useState, useEffect, useMemo } from 'react';
import { Connection, PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { useSendTransaction, useSolanaWallets } from '@privy-io/react-auth/solana';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { showTransactionToast } from '../utils/toastUtils';
import { formatNumber } from '../utils/misc';
// import { useBalances } from '../hooks/useBalances';


interface QuickSwapProps {
  token: any;
  selectedBot: string;
  darkMode?: boolean;
}

const QuickSwap = ({ token, selectedBot, darkMode = true }: QuickSwapProps) => {
  const { sendTransaction } = useSendTransaction();
  const { ready, wallets } = useSolanaWallets();
  // const { getPositions } = useBalances();
  const [loading, setLoading] = useState<{[key: number]: boolean}>({});
  const [quote, setQuote] = useState<any>(null);
  const [isSellMode, setIsSellMode] = useState(false);

  // Default presets
  const DEFAULT_BUY_PRESETS = [0.01, 0.5, 2];
  const DEFAULT_SELL_PRESETS = [25, 50, 100];

  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('swapSettings') || '') || {
        quickSwapPresets: DEFAULT_BUY_PRESETS,
        sellPresets: DEFAULT_SELL_PRESETS,
        slippage: 5,
        speed: 'fast',
        tip: 0
      };
    } catch {
      return {
        quickSwapPresets: DEFAULT_BUY_PRESETS,
        sellPresets: DEFAULT_SELL_PRESETS,
        slippage: 5,
        speed: 'fast',
        tip: 0
      };
    }
  });

  // Listen for settings updates
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      setSettings(event.detail);
    };

    window.addEventListener('swapSettingsUpdate', handleSettingsUpdate as EventListener);
    return () => window.removeEventListener('swapSettingsUpdate', handleSettingsUpdate as EventListener);
  }, []);

  // Get the embedded wallet
  const wallet = useMemo(() => {
    if (!ready || !wallets.length) return null;
    return wallets.find(w => w.walletClientType === 'privy') || wallets[0];
  }, [ready, wallets]);

  // Get current positions
  // const positions = useMemo(() => {
  //   if (!wallet?.address) return null;
  //   return getPositions(wallet.address);
  // }, [wallet?.address, getPositions]);

  // Create Helius connection
  const connection = useMemo(() => new Connection(HELIUS_RPC, 'confirmed'), []);

  // Get quote for amount
  const getQuote = async (amount: number) => {
    try {
      const response = await axios.get(`https://quote-api.jup.ag/v6/quote`, {
        params: {
          inputMint: 'So11111111111111111111111111111111111111112',
          outputMint: token.mint,
          amount: Math.floor(amount * 1e9), // Convert SOL to lamports
          slippageBps: settings.slippage * 100,
          onlyDirectRoutes: false,
          asLegacyTransaction: false
        }
      });

      if (response.data) {
        setQuote({
          ...response.data,
          tokenDecimals: token.decimals,
          outAmount: response.data.outAmount,
          inputAmount: amount
        });
      }
    } catch (error) {
      console.error('Quote error:', error);
      setQuote(null);
    }
  };

  const handleQuickSwap = async (amount: number) => {
    if (!wallet?.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(prev => ({ ...prev, [amount]: true }));

    try {
      // Get fresh quote
      await getQuote(amount);

      // Show pending toast
      const pendingToast = showTransactionToast({
        type: 'pending',
        inputAmount: amount.toString(),
        inputSymbol: 'SOL',
        outputSymbol: token.symbol
      });

      const swapResponse = await axios.post(`/api/swap`, {
        chain_uid: 'solana',
        wallet: wallet.address,
        buy_token: token.mint,
        sell_token: 'So11111111111111111111111111111111111111112',
        amount: amount,
        slippage: settings.slippage,
        speed: settings.speed,
        fee_address: '8PzqBRQps2dx9X6CVi9V5fixf7CKwPMpJAVUdVQMLbTT',
        tip: settings.tip > 0 ? settings.tip.toString() : '0'
      });

      if (!swapResponse.data?.transaction?.message) {
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
            isSigner: false,
            isWritable: true
          })),
          data: Buffer.from(ix.data.data)
        }))
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);

      // Send transaction
      const txReceipt = await sendTransaction({
        transaction,
        connection,
        options: {
          skipPreflight: true,
          maxRetries: 3
        }
      });

      toast.dismiss(pendingToast);

      // Show success toast
      showTransactionToast({
        type: 'success',
        inputAmount: amount.toString(),
        inputSymbol: 'SOL',
        outputAmount: quote ? formatNumber(quote.outAmount / Math.pow(10, quote.tokenDecimals || 6)) : '',
        outputSymbol: token.symbol,
        txSignature: txReceipt.signature,
        tip: settings.tip
      });

    } catch (err) {
      console.error('Swap error:', err);
      showTransactionToast({
        type: 'error',
        inputAmount: amount.toString(),
        inputSymbol: 'SOL',
        outputSymbol: token.symbol
      });
    } finally {
      setLoading(prev => ({ ...prev, [amount]: false }));
    }
  };

  const handleSell = async (token: any, percentage: number) => {
    const loadingKey = `${token.mint}-${percentage}`;
    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    let sellAmount = 0;
    let pendingToast;

    try {
      if (!wallet?.address) {
        throw new Error('Wallet not connected');
      }

      // Get token balance from positions
      const tokenPosition = positions?.tokens?.find(t => t.mint === token.mint);
      const tokenAmount = tokenPosition?.amount || 0;

      // Calculate exact percentage of token amount without rounding
      const exactAmount = tokenAmount * (percentage / 100);

      // For display purposes in the toast
      sellAmount = exactAmount;

      // Get quote first to show expected output
      const quoteResponse = await axios.get(`https://quote-api.jup.ag/v6/quote`, {
        params: {
          inputMint: token.mint,
          outputMint: 'So11111111111111111111111111111111111111112', // SOL
          amount: Math.floor(exactAmount * Math.pow(10, token.decimals || 6)),
          slippageBps: settings.slippage * 100,
          onlyDirectRoutes: false,
          asLegacyTransaction: false
        }
      });

      // Show pending toast with direct tip value
      pendingToast = showTransactionToast({
        type: 'pending',
        inputAmount: sellAmount,
        inputSymbol: token.symbol,
        outputSymbol: 'SOL',
        outputAmount: quoteResponse?.data?.outAmount
          ? formatNumber(Number(quoteResponse.data.outAmount) / 1e9)
          : '...',
        txSignature: '',
        tip: settings.tip
      });

      // Execute swap with exact amount
      const swapResponse = await axios.post(`/api/swap`, {
        chain_uid: 'solana',
        wallet: wallet.address,
        buy_token: 'So11111111111111111111111111111111111111112', // SOL
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

      // Send transaction using Helius RPC
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

      // Check for signature before showing success
      if (!txReceipt?.signature) {
        throw new Error('Transaction failed - no signature received');
      }

      // Dismiss pending toast
      if (pendingToast) toast.dismiss(pendingToast);

      // Show success toast with direct tip value
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

  if (selectedBot !== 'stalkswap') return null;
  return (
    <div className="mt-2 space-y-2">
      <div className="h-[1px] w-full bg-gray-700/50 mb-3" />
      <div className="text-sm text-gray-400 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span>Quick {isSellMode ? 'Sell' : 'Swap'}</span>
          <ArrowRight size={14} />
        </div>
        <button
          onClick={() => setIsSellMode(!isSellMode)}
          className={`px-2 py-0.5 rounded text-xs ${
            isSellMode
              ? 'bg-red-500/20 text-red-400'
              : 'bg-[#2a2b36] text-gray-400'
          }`}
        >
          {isSellMode ? 'Switch to Buy' : 'Switch to Sell'}
        </button>
      </div>
      <div className="flex gap-2">
        {isSellMode ? (
          // Sell buttons
          (settings.sellPresets || DEFAULT_SELL_PRESETS).map((percentage) => (
            <button
              key={percentage}
              onClick={() => handleSell(token, percentage)}
              disabled={loading[`${token.mint}-${percentage}`]}
              className={`
                flex-1 py-1.5 px-2 rounded-lg text-sm font-medium
                transition-colors duration-200
                bg-red-500/20 text-red-400 hover:bg-red-500/30
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {loading[`${token.mint}-${percentage}`] ? '...' : `${percentage}%`}
            </button>
          ))
        ) : (
          // Buy buttons
          (settings.quickSwapPresets || DEFAULT_BUY_PRESETS).map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickSwap(amount)}
              disabled={loading[amount]}
              className={`
                flex-1 py-1.5 px-2 rounded-lg text-sm font-medium
                transition-colors duration-200
                ${darkMode
                  ? 'bg-[#2a2b36] hover:bg-[#363945] text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {loading[amount] ? '...' : `${amount} SOL`}
            </button>
          ))
        )}
      </div>
      {quote && !isSellMode && (
        <div className="text-xs text-gray-400 px-1">
          ≈ {formatNumber(quote.outAmount / Math.pow(10, token.decimals || 6))} {token.symbol}
          {quote.priceImpactPct && (
            <span className={`ml-2 ${
              parseFloat(quote.priceImpactPct) > 0.05 ? 'text-red-400' : 'text-[#00ff9d]'
            }`}>
              ({(parseFloat(quote.priceImpactPct) * 100).toFixed(2)}% impact)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default QuickSwap;
