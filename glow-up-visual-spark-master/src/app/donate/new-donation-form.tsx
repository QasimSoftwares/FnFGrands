'use client';

import { useState } from 'react';
import { FaHandHoldingHeart, FaMosque, FaGlobe, FaGift, FaCheck } from 'react-icons/fa';
import DonationSummary from './DonationSummary';

type DonationType = 'Zakat' | 'Sadaqah' | 'General' | 'Other';
type Frequency = 'one-time' | 'monthly';

const presetAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

export default function NewDonationForm() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [donationType, setDonationType] = useState<DonationType>('Zakat');
  const [frequency, setFrequency] = useState<Frequency>('one-time');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'mobile' | 'crypto'>('card');

  const handleLinkClick = (e: React.MouseEvent, page: string) => {
    e.preventDefault();
    console.log(`Navigating to ${page} page (to be implemented)`);
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*$/.test(value)) {
      setCustomAmount(value);
      setSelectedAmount(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSuccess(true);
    } catch (error) {
      console.error('Donation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDonateClick = () => {
    const formEvent = new Event('submit', { cancelable: true }) as unknown as React.FormEvent;
    handleSubmit(formEvent);
  };

  const getDonationTypeIcon = (type: DonationType) => {
    switch (type) {
      case 'Zakat':
        return <FaHandHoldingHeart className="text-yellow-600" />;
      case 'Sadaqah':
        return <FaMosque className="text-green-600" />;
      case 'General':
        return <FaGlobe className="text-blue-600" />;
      case 'Other':
        return <FaGift className="text-purple-600" />;
      default:
        return null;
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Family and Fellows Foundation</h1>
          <p className="text-lg md:text-xl mb-6 max-w-3xl mx-auto">
            Your generous donation helps us make a difference in the lives of those in need.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base">
            <a href="#donation-policy" onClick={(e) => handleLinkClick(e, 'donation-policy')} className="hover:underline flex items-center">
              <FaCheck className="mr-1" /> Donation Policy
            </a>
            <span className="text-blue-200">•</span>
            <a href="#audited-annually" onClick={(e) => handleLinkClick(e, 'audited-annually')} className="hover:underline flex items-center">
              <FaCheck className="mr-1" /> Audited Annually
            </a>
            <span className="text-blue-200">•</span>
            <a href="#tax-deductible" onClick={(e) => handleLinkClick(e, 'tax-deductible')} className="hover:underline flex items-center">
              <FaCheck className="mr-1" /> Tax Deductible
            </a>
          </div>
        </div>

        <div className="bg-green-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <FaCheck className="text-green-600 text-4xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You for Your Donation!</h2>
        <p className="text-gray-600 mb-6">Your generous contribution will help us make a difference.</p>
        <button
          onClick={() => setIsSuccess(false)}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Donate Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header Section - More compact */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 md:p-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Family and Fellows Foundation</h1>
        <p className="text-sm md:text-base mb-3 max-w-3xl mx-auto">
          Your generous donation helps us make a difference in the lives of those in need.
        </p>
      </div>
      
      <div className="p-4 md:p-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info - Moved to top */}
              <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Information</h3>
                
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
                    Make this an anonymous donation
                  </label>
                </div>

                {!isAnonymous && (
                  <div className="mb-4">
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-gray-500">(Optional)</span>
                    </label>
                    <input 
                      id="fullName"
                      type="text" 
                      placeholder="Your name" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                )}
                
                <div className="mb-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="email"
                    type="email" 
                    placeholder="your.email@example.com" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    required 
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input 
                    id="phone"
                    type="tel" 
                    placeholder="+92 300 1234567" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>

              {/* Amount - Moved to second position */}
              <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Donation Amount</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Amount (PKR)</label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {presetAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleAmountSelect(amount)}
                        className={`py-3 px-2 rounded-md text-center font-medium transition-colors ${
                          selectedAmount === amount ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">PKR</span>
                    <input
                      type="text"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder="Enter custom amount"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              {/* Cover Fees Option */}
              <div className="mt-6 flex items-center">
                <input
                  type="checkbox"
                  id="coverFees"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="coverFees" className="ml-2 block text-sm text-gray-700">
                  I'd like to cover the processing fees so 100% of my donation goes to the cause.
                </label>
              </div>
            </form>
          </div>
          </div>

          {/* Right Column - Donation Summary */}
          <div className="md:col-span-1">
            <DonationSummary
              amount={selectedAmount}
              customAmount={customAmount}
              donationType={donationType}
              frequency={frequency}
              onDonationTypeChange={setDonationType}
              onFrequencyChange={setFrequency}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              onDonate={handleDonateClick}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
