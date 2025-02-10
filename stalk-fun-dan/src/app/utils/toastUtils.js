'use client';

import { toast } from 'react-hot-toast';
import React from 'react';

let currentToastId = null;

export const showTransactionToast = ({
  type = 'pending',
  inputAmount,
  inputSymbol,
  outputAmount,
  outputSymbol,
  txSignature,
  tip
}) => {
  // Dismiss any existing toast first
  if (currentToastId) {
    toast.dismiss(currentToastId);
  }

  switch(type) {
    case 'pending':
      currentToastId = toast.loading(
        <div className="flex flex-col gap-1">
          <div className="font-medium">Swap Pending</div>
          <div className="text-sm opacity-80">
            {inputAmount} {inputSymbol} → {outputSymbol}
          </div>
        </div>,
        {
          id: 'swap-toast', // Give it a consistent ID
          style: {
            background: '#2e2f3b',
            color: '#fff',
            border: '1px solid #676FFF'
          }
        }
      );
      return currentToastId;

    case 'success':
      currentToastId = toast.success(
        <div className="flex flex-col space-y-1">
          <span className="font-medium">Swap Successful!</span>
          <span className="text-sm">
            {inputAmount} {inputSymbol} → {outputAmount} {outputSymbol}
            {tip && tip > 0 && (
              <span className="block text-xs text-gray-400">
                +{tip}% tip ({(inputAmount * (tip / 100)).toFixed(6)} SOL)
              </span>
            )}
          </span>
          {txSignature && (
            <a 
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#00ff9d] hover:underline"
            >
              View on Solscan ↗
            </a>
          )}
        </div>,
        {
          id: 'swap-toast',
          duration: 8000,
          style: {
            background: '#2e2f3b',
            color: '#fff',
            border: '1px solid #00ff9d'
          }
        }
      );
      return currentToastId;

    case 'error':
      currentToastId = toast.error(
        <div className="flex flex-col gap-1">
          <div className="font-medium">Swap Failed</div>
          <div className="text-xs opacity-80">
            {inputAmount} {inputSymbol} → {outputSymbol}
            <br/>
            Please try again
          </div>
        </div>,
        {
          id: 'swap-toast',
          style: {
            background: '#2e2f3b',
            color: '#fff',
            border: '1px solid #ff4444'
          }
        }
      );
      return currentToastId;
  }
};