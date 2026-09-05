import React, { useState } from 'react';
import type { CreateListingData, ListingCategory, StorageCondition } from '../types';
import { X, Utensils, Clock, Scale, Thermometer, Flame, Snowflake } from 'lucide-react';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateListingData) => Promise<void>;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ListingCategory>('cooked');
  const [quantityKg, setQuantityKg] = useState('');
  const [storageCondition, setStorageCondition] = useState<StorageCondition>('ambient');
  const [safetyTemperature, setSafetyTemperature] = useState('');
  const [expireHours, setExpireHours] = useState('4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStorageConditionChange = (condition: StorageCondition) => {
    setStorageCondition(condition);
    if (condition === 'hot_holding') {
      setExpireHours('2');
    } else if (condition === 'refrigerated') {
      if (parseFloat(expireHours) > 6) setExpireHours('4');
    } else if (condition === 'ambient') {
      if (parseFloat(expireHours) > 24) setExpireHours('24');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !quantityKg) {
      setError('Please fill in required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const hours = parseFloat(expireHours) || 4;
      const expireDate = new Date(Date.now() + hours * 3600 * 1000);

      await onSubmit({
        title,
        description,
        category,
        quantity_kg: parseFloat(quantityKg),
        expires_at: expireDate.toISOString(),
        storage_condition: storageCondition,
        safety_temperature: safetyTemperature ? parseFloat(safetyTemperature) : undefined,
      });

      setTitle('');
      setDescription('');
      setCategory('cooked');
      setQuantityKg('');
      setStorageCondition('ambient');
      setSafetyTemperature('');
      setExpireHours('4');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create food listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold">Post Food Surplus Listing</h3>
            <p className="text-xs text-slate-400 mt-0.5">Enter details for non-profit organizations to view and claim</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-900 max-h-[85vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 rounded border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Food Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Assorted Bakery Items & Sandwiches"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ListingCategory)}
                  className="w-full px-3.5 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                >
                  <option value="cooked">Cooked Meals</option>
                  <option value="bakery">Bakery / Bread</option>
                  <option value="produce">Fresh Produce</option>
                </select>
                <Utensils className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Quantity (KG) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <Scale className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Storage & Temperature Protocol */}
          <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Storage Condition Protocol *</span>
                <span className="text-[10px] text-slate-400 font-normal">Food Hygiene Standards</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleStorageConditionChange('hot_holding')}
                  className={`px-2 py-2 rounded-md text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${storageCondition === 'hot_holding'
                    ? 'bg-amber-600 text-white border-amber-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Hot (&gt;60°C)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStorageConditionChange('refrigerated')}
                  className={`px-2 py-2 rounded-md text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${storageCondition === 'refrigerated'
                    ? 'bg-blue-600 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                >
                  <Snowflake className="w-3.5 h-3.5" />
                  <span>Cold (&lt;5°C)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStorageConditionChange('ambient')}
                  className={`px-2 py-2 rounded-md text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${storageCondition === 'ambient'
                    ? 'bg-slate-700 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                >
                  <Thermometer className="w-3.5 h-3.5" />
                  <span>Ambient</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Expiration Window</span>
              {storageCondition === 'hot_holding' && <span className="text-[10px] text-amber-600 font-bold">Capped at 4h max</span>}
              {storageCondition === 'refrigerated' && <span className="text-[10px] text-blue-600 font-bold">Capped at 6h max</span>}
              {storageCondition === 'ambient' && <span className="text-[10px] text-slate-500 font-bold">Capped at 24h max</span>}
            </label>
            <div className="relative">
              <select
                value={expireHours}
                onChange={(e) => setExpireHours(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              >
                <option value="1">1 Hour</option>
                <option value="2">2 Hours</option>
                <option value="4">4 Hours</option>
                {storageCondition !== 'hot_holding' && storageCondition !== 'refrigerated' && <option value="6">6 Hours</option>}
                {storageCondition === 'ambient' && <option value="12">12 Hours</option>}
                {storageCondition === 'ambient' && <option value="24">24 Hours</option>}
              </select>
              <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description & Pickup Instructions
            </label>
            <textarea
              rows={3}
              placeholder="Provide allergen notes or pickup entrance instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
