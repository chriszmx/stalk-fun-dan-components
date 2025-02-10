import { motion, AnimatePresence } from 'framer-motion';

interface CopyNotificationProps {
    isVisible: boolean;
    address: string;
    onClose: () => void;
}

const CopyNotification: React.FC<CopyNotificationProps> = ({ isVisible, address, onClose }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]
                        max-w-md w-full bg-gray-900/95 shadow-lg rounded-lg
                        flex items-center justify-between p-4 gap-3
                        border border-[#00ff9d]/20 backdrop-blur-md"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full
                            bg-[#00ff9d]/10 flex items-center justify-center">
                            <span className="text-xl">📋</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[#00ff9d]">
                                Address copied!
                            </p>
                            <p className="text-xs text-gray-400 mt-1 font-mono">
                                {address}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-200
                            transition-colors rounded-lg hover:bg-gray-800/50 p-2"
                    >
                        ✕
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CopyNotification;
