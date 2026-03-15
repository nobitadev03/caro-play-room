import { motion } from "framer-motion";

interface OPieceProps {
  isWinning?: boolean;
  isPreview?: boolean;
}

const OPiece = ({ isWinning, isPreview }: OPieceProps) => (
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
    <circle cx="12" cy="12" r="7" stroke="hsl(346.8, 77.2%, 49.8%)" strokeWidth="2.5" fill="none" />
  </motion.svg>
);

export default OPiece;
