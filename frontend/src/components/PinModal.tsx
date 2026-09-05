import React, { useState } from 'react';
import { KeyRound, CheckCircle } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  claimId: number | null;
  onClose: () => void;
  onVerify: (claimId: number, pin: string) => Promise<void>;
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, claimId, onClose, onVerify }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !claimId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onVerify(claimId, pin);
      setPin('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid pickup PIN. Please check with the donor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden border border-slate-200 p-6 text-center">
        <div className="w-10 h-10 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-5 h-5" />
        </div>

        <h3 className="text-base font-bold text-slate-900">Verify Pickup PIN</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Enter the 4-digit verification code provided by the donor upon arrival.
        </p>

        {error && (
          <div className="p-3 mb-4 text-xs font-semibold text-red-700 bg-red-50 rounded border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              maxLength={4}
              placeholder="0 0 0 0"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full text-center tracking-[0.8em] text-xl font-bold py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-md transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? 'Verifying...' : <><CheckCircle className="w-4 h-4" /> Confirm PIN</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
