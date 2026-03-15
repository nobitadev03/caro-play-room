import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface TurnTimerProps {
    deadline: string | null;       // ISO string from DB
    isMyTurn: boolean;
    isGameOver: boolean;
    onTimeout: () => void;
}

const TOTAL = 30;

const TurnTimer = ({ deadline, isMyTurn, isGameOver, onTimeout }: TurnTimerProps) => {
    const [secondsLeft, setSecondsLeft] = useState(TOTAL);
    const onTimeoutRef = useRef(onTimeout);
    onTimeoutRef.current = onTimeout;

    useEffect(() => {
        if (!deadline || isGameOver) {
            setSecondsLeft(TOTAL);
            return;
        }

        const tick = () => {
            const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000);
            const clamped = Math.max(0, Math.min(diff, TOTAL));
            setSecondsLeft(clamped);

            if (clamped <= 0 && isMyTurn) {
                onTimeoutRef.current();
            }
        };

        tick();
        const id = setInterval(tick, 500);
        return () => clearInterval(id);
    }, [deadline, isGameOver, isMyTurn]);

    if (!deadline || isGameOver) return null;

    const pct = secondsLeft / TOTAL;
    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - pct);

    const color =
        secondsLeft > 15 ? "#22c55e"
            : secondsLeft > 8 ? "#f59e0b"
                : "#ef4444";

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" width="40" height="40" viewBox="0 0 40 40">
                    {/* track */}
                    <circle cx="20" cy="20" r={radius} fill="none" stroke="currentColor"
                        strokeWidth="3" className="text-muted/40" />
                    {/* progress */}
                    <motion.circle
                        cx="20" cy="20" r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        transition={{ duration: 0.4, ease: "linear" }}
                    />
                </svg>
                <span
                    className="relative text-xs font-bold tabular-nums"
                    style={{ color }}
                >
                    {secondsLeft}
                </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
                {isMyTurn ? "Lượt bạn" : "Đối thủ"}
            </span>
        </div>
    );
};

export default TurnTimer;
