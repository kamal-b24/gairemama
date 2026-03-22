import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Settings, 
  CheckCircle2, 
  CreditCard, 
  CircleCheck,
  Loader2
} from 'lucide-react';
import { UserProfile, RechargePackage } from './types';
import { searchUserProfile } from './services/geminiService';

const PACKAGES: RechargePackage[] = [
  { id: '1', coins: 5, price: 1.25 },
  { id: '2', coins: 70, price: 17.50 },
  { id: '3', coins: 350, price: 87.50 },
  { id: '4', coins: 700, price: 175.00 },
  { id: '5', coins: 1400, price: 350.00 },
  { id: '6', coins: 3500, price: 875.00 },
  { id: '7', coins: 7000, price: 1750.00 },
  { id: '8', coins: 17500, price: 4375.00 },
];

export default function App() {
  const [recipientUsername, setRecipientUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedProfile, setSearchedProfile] = useState<UserProfile | null>(null);
  const [searchError, setSearchError] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showBankNotification, setShowBankNotification] = useState(false);

  const handleSearch = useCallback(async (username: string) => {
    if (!username.trim()) {
      setSearchedProfile(null);
      return;
    }
    
    setIsSearching(true);
    setSearchError('');

    try {
      const profile = await searchUserProfile(username);
      setSearchedProfile(profile);
    } catch (error) {
      setSearchError('Failed to find profile.');
      setSearchedProfile(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Automatic search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (recipientUsername) {
        handleSearch(recipientUsername);
      } else {
        setSearchedProfile(null);
      }
    }, 300); // Reduced to 300ms for faster response

    return () => clearTimeout(timer);
  }, [recipientUsername, handleSearch]);

  const handleRecharge = () => {
    if (!searchedProfile && !recipientUsername) return;
    setShowConfirmationModal(true);
  };

  const confirmRecharge = () => {
    setShowConfirmationModal(false);
    setShowBankNotification(true);
    
    // Show success modal after a short delay to simulate processing
    setTimeout(() => {
      setShowSuccessModal(true);
      setShowBankNotification(false);
    }, 2000);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getSelectedCoins = () => {
    if (selectedPackageId === 'custom') return customAmount || 0;
    const pkg = PACKAGES.find(p => p.id === selectedPackageId);
    return pkg ? pkg.coins : 0;
  };

  const getTotalPrice = () => {
    if (selectedPackageId === 'custom') return (customAmount || 0) * 0.25; // Simple calculation for custom
    const pkg = PACKAGES.find(p => p.id === selectedPackageId);
    return pkg ? pkg.price : 0;
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen font-sans text-gray-800 shadow-lg flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b sticky top-0 bg-white z-10">
        <button className="p-1 hover:bg-gray-100 rounded-full transition">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold">Get Coins</h1>
        <button className="p-1 hover:bg-gray-100 rounded-full transition">
          <Settings className="h-6 w-6" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        {/* Profile Section */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src="https://picsum.photos/seed/user/40" 
              alt="User Avatar" 
              className="w-10 h-10 rounded-full mr-3 border border-gray-200"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="font-semibold">Saikh The Helper</p>
              <div className="flex items-center text-gray-500 text-sm">
                <div className="w-3.5 h-3.5 bg-yellow-400 rounded-full mr-1 shadow-sm"></div>
                <span className="font-medium">83.34m</span>
              </div>
            </div>
          </div>
          <button className="text-sm font-medium text-gray-500 hover:text-gray-800 transition">Log out</button>
        </div>
        
        <div className="px-4 pb-4">
          {/* Recipient Username Input & Compact Profile Display */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Enter username" 
                  value={recipientUsername}
                  onChange={(e) => setRecipientUsername(e.target.value)}
                  className="w-full h-12 px-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition text-sm"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                  </div>
                )}
              </div>

              {/* Compact Searched Profile Display */}
              <AnimatePresence mode="wait">
                {searchedProfile && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center p-2 bg-gray-50 rounded-xl border border-gray-100 shadow-sm min-w-[140px] max-w-[180px] h-12"
                  >
                    <div className="relative flex-shrink-0">
                      <img 
                        src={searchedProfile.profilePicture} 
                        referrerPolicy="no-referrer" 
                        alt="Profile Picture" 
                        className="w-8 h-8 rounded-full border border-yellow-400 object-cover"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 rounded-full p-0.5 border border-white">
                        <CheckCircle2 className="w-2 h-2 text-black" />
                      </div>
                    </div>
                    <div className="ml-2 flex-1 min-w-0">
                      <p className="font-bold text-[11px] text-gray-900 truncate leading-tight">{searchedProfile.displayName}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-[10px] text-gray-500 truncate leading-tight">@{searchedProfile.username}</p>
                        <span className="text-[9px] font-bold text-yellow-600 bg-yellow-100 px-1 rounded">
                          {searchedProfile.followerCount >= 1000000 
                            ? `${(searchedProfile.followerCount / 1000000).toFixed(1)}M` 
                            : searchedProfile.followerCount >= 1000 
                              ? `${(searchedProfile.followerCount / 1000).toFixed(1)}K` 
                              : searchedProfile.followerCount}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {searchError && (
              <p className="mt-1 text-red-500 text-[10px] animate-pulse px-1">{searchError}</p>
            )}
          </div>

          {/* Recharge Packages */}
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-3">
              {PACKAGES.map((pkg) => (
                <button 
                  key={pkg.id}
                  onClick={() => {
                    setSelectedPackageId(pkg.id);
                    setCustomAmount(null);
                  }} 
                  className={`p-3 border rounded-xl text-center transition-all duration-200 ${
                    selectedPackageId === pkg.id 
                    ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400/20' 
                    : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full mr-1.5 shadow-sm"></div>
                    <span className="font-bold text-lg">{pkg.coins}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">R {formatPrice(pkg.price)}</span>
                </button>
              ))}
              
              {/* Custom Amount Button */}
              <button 
                onClick={() => setSelectedPackageId('custom')} 
                className={`p-3 border rounded-xl text-center transition-all duration-200 ${
                  selectedPackageId === 'custom' 
                  ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400/20' 
                  : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="font-bold text-lg block">Custom</span>
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Large amount</span>
              </button>
            </div>

            {/* Custom Amount Input */}
            <AnimatePresence>
              {selectedPackageId === 'custom' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <label htmlFor="custom-amount" className="block text-sm font-semibold text-gray-700 mb-1">Custom Coin Amount</label>
                  <input
                    id="custom-amount"
                    type="number"
                    placeholder="Enter coin amount"
                    value={customAmount || ''}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition text-sm"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Exchange Coins Section */}
        <div className="p-4 border-t mt-4">
          <h2 className="font-bold text-gray-900 mb-3">Exchange Coins</h2>
          <button className="w-full flex justify-between items-center text-sm p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            <span className="font-medium">Exchange for Coins</span>
            <span className="text-gray-400"> › </span>
          </button>
          <p className="text-xs text-gray-400 mt-2 font-medium">LIVE Gift balance: 534 M / 3456 J</p>
        </div>
      </main>

      {/* Footer / Action bar */}
      <footer className="sticky bottom-0 bg-white p-4 border-t flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-gray-600">Total</span>
          <span className="font-bold text-2xl text-gray-900">R {formatPrice(getTotalPrice())}</span>
        </div>
        <button 
          onClick={handleRecharge}
          disabled={getTotalPrice() <= 0 || !recipientUsername || !searchedProfile}
          className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all duration-200 active:scale-[0.98] ${
            getTotalPrice() > 0 && recipientUsername && searchedProfile
            ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          Recharge
        </button>
      </footer>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmationModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center"
            >
              <h3 className="text-xl font-bold mb-4 text-gray-900">Confirm Recharge</h3>
              <div className="text-left space-y-4 mb-8">
                {searchedProfile && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <img 
                      src={searchedProfile.profilePicture} 
                      referrerPolicy="no-referrer" 
                      alt="Avatar" 
                      className="w-12 h-12 rounded-full mr-3 border-2 border-yellow-400 shadow-sm"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{searchedProfile.displayName}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 truncate">@{searchedProfile.username}</p>
                        <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-1.5 rounded-full">
                          {searchedProfile.followerCount >= 1000000 
                            ? `${(searchedProfile.followerCount / 1000000).toFixed(1)}M` 
                            : searchedProfile.followerCount >= 1000 
                              ? `${(searchedProfile.followerCount / 1000).toFixed(1)}K` 
                              : searchedProfile.followerCount} followers
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Coins</p>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1.5"></div>
                      <p className="font-bold text-gray-900">{getSelectedCoins()}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Total Price</p>
                    <p className="font-bold text-gray-900">R {formatPrice(getTotalPrice())}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmationModal(false)} 
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmRecharge} 
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition shadow-lg shadow-red-200"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 p-4 rounded-full">
                  <CircleCheck className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900">Success!</h2>
              <div className="text-gray-600 mb-8 text-sm space-y-3">
                <p>
                  Recharge of <span className="font-bold text-gray-900">{getSelectedCoins()} coins</span> successful to <span className="font-bold text-gray-900">{searchedProfile?.displayName || recipientUsername}</span>.
                </p>
                <p className="bg-blue-50 text-blue-600 p-2 rounded-lg font-medium">
                  Coins will be credited to the account within 24 hours.
                </p>
              </div>
              <button 
                onClick={() => setShowSuccessModal(false)} 
                className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition shadow-lg"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bank Debit Toast Notification */}
      <AnimatePresence>
        {showBankNotification && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed top-5 right-5 z-[100] bg-white rounded-2xl shadow-2xl p-4 w-80 max-w-[90%] border border-gray-100"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-50 p-2 rounded-xl">
                <CreditCard className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-bold text-gray-900">Transaction Alert</p>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                  An amount of <span className="font-bold text-gray-900">R {formatPrice(getTotalPrice())}</span> has been debited from your bank account ending in <span className="font-mono">...0432</span>.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
