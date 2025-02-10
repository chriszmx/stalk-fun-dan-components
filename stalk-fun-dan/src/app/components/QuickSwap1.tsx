"use client";

interface QuickSwapProps {
    token: any;
    selectedBot: string;
    darkMode?: boolean;
}

const QuickSwap = ({ token, selectedBot, darkMode }: QuickSwapProps) => {
    return (
        <div className="mt-4">
            <button className="w-full py-2 px-4 rounded-lg font-medium text-base text-center transition-colors bg-[#1a472a] text-[#00ff9d] hover:bg-[#1a572a]">
                Quick Swap
            </button>
        </div>
    );
};

export default QuickSwap;
