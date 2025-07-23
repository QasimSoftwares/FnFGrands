import { FaCreditCard, FaBuilding, FaMobileAlt, FaHandHoldingUsd } from 'react-icons/fa';
import { FaHandHoldingHeart, FaMosque, FaGlobe, FaGift } from 'react-icons/fa';

type PaymentMethod = 'card' | 'bank' | 'mobile' | 'crypto';
type DonationType = 'Zakat' | 'Sadaqah' | 'General' | 'Other';
type Frequency = 'one-time' | 'monthly';

interface DonationSummaryProps {
  amount: number | null;
  customAmount: string;
  donationType: DonationType;
  frequency: Frequency;
  onDonationTypeChange: (type: DonationType) => void;
  onFrequencyChange: (freq: Frequency) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onDonate: () => void;
  isSubmitting: boolean;
}

export default function DonationSummary({
  amount,
  customAmount,
  donationType,
  frequency,
  onDonationTypeChange,
  onFrequencyChange,
  paymentMethod,
  onPaymentMethodChange,
  onDonate,
  isSubmitting
}: DonationSummaryProps) {
  const displayAmount = customAmount || amount?.toLocaleString() || '0';
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Donation Summary</h2>
      
      {/* Donation Type */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Donation Type</h3>
        <div className="flex flex-wrap gap-2">
          {['Zakat', 'Sadaqah', 'General', 'Other'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onDonationTypeChange(type as DonationType)}
              className={`flex items-center px-3 py-1.5 rounded-full border text-sm transition-colors ${
                donationType === type
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
            >
              <span className="mr-1.5">
                {type === 'Zakat' ? <FaMosque /> :
                 type === 'Sadaqah' ? <FaHandHoldingHeart /> :
                 type === 'General' ? <FaGlobe /> : <FaGift />}
              </span>
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Frequency</h3>
        <div className="flex items-center space-x-4">
          {[
            { value: 'one-time', label: 'One-time' },
            { value: 'monthly', label: 'Monthly' },
          ].map((option) => (
            <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="frequency"
                checked={frequency === option.value}
                onChange={() => onFrequencyChange(option.value as Frequency)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Amount</span>
          <span className="font-medium">PKR {displayAmount}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Type</span>
          <span className="font-medium">{donationType}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Frequency</span>
          <span className="font-medium capitalize">{frequency}</span>
        </div>
        <div className="border-t border-blue-100 my-2"></div>
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>PKR {displayAmount}</span>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Method</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'card', label: 'Card', icon: <FaCreditCard className="text-blue-600" /> },
            { id: 'bank', label: 'Bank', icon: <FaBuilding className="text-green-600" /> },
            { id: 'mobile', label: 'Mobile', icon: <FaMobileAlt className="text-purple-600" /> },
            { id: 'crypto', label: 'Crypto', icon: <FaHandHoldingUsd className="text-yellow-600" /> },
          ].map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => onPaymentMethodChange(method.id as PaymentMethod)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                paymentMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <span className="text-xl mb-1">{method.icon}</span>
              <span className="text-xs font-medium">{method.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onDonate}
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-70 text-base"
      >
        {isSubmitting ? 'Processing...' : 'Donate Now'}
      </button>

      <div className="mt-4 text-center text-xs text-gray-500">
        <p>Your donation is secure and encrypted</p>
        <div className="flex justify-center space-x-4 mt-2">
          <span>🔒 256-bit SSL</span>
          <span>💳 Secure Payment</span>
        </div>
      </div>
    </div>
  );
}
