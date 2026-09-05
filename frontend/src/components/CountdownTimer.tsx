import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, label }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      if (!targetDate) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      const expiryDate = new Date(targetDate).getTime();
      const now = Date.now();
      const diffMs = expiryDate - now;

      if (diffMs <= 0 || isNaN(diffMs)) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return <span className="text-xs font-semibold text-slate-500">Expired</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700">
      <Clock className="w-3.5 h-3.5 text-emerald-600" />
      {label && <span className="text-slate-500 font-sans mr-0.5">{label}:</span>}
      {timeLeft.hours > 0 ? `${timeLeft.hours}h ` : ''}
      {timeLeft.minutes}m left
    </span>
  );
};
