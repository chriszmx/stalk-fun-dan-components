export const formatNumber = (num: number): string => {
    if (!num) return "0";

    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toFixed(2);
};
