import { motion } from "framer-motion";

interface XPieceProps {
  isWinning?: boolean;
  isPreview?: boolean;
}

const XPiece = ({ isWinning, isPreview }: XPieceProps) => (
  <motion.svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    initial={isPreview ? false : { scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: isPreview ? 0.2 : 1 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={isWinning ? "animate-pulse" : ""}
  >
    <line x1="6" y1="6" x2="18" y2="18" stroke="hsl(221.2, 83.2%, 53.3%)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="18" y1="6" x2="6" y2="18" stroke="hsl(221.2, 83.2%, 53.3%)" strokeWidth="2.5" strokeLinecap="round" />
  </motion.svg>
);

export default XPiece;
