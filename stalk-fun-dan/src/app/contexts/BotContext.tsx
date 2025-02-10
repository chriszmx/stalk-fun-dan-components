"use client";

import React, { createContext, useContext, useState } from "react";

interface BotContextType {
    selectedBot: string;
    setSelectedBot: (bot: string) => void;
}

const BotContext = createContext<BotContextType>({
    selectedBot: "stalkswap",
    setSelectedBot: () => {},
});

export const useBotContext = () => useContext(BotContext);

export const BotProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [selectedBot, setSelectedBot] = useState("stalkswap");

    return (
        <BotContext.Provider value={{ selectedBot, setSelectedBot }}>
            {children}
        </BotContext.Provider>
    );
};
