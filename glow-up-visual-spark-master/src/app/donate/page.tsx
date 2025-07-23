'use client';

import dynamic from 'next/dynamic';
import DonationInfoSection from './DonationInfoSection';

// Load NewDonationForm with SSR disabled to avoid hydration issues
const NewDonationForm = dynamic(() => import('./new-donation-form'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-6xl mx-auto">
      <div className="h-96 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading donation form...</div>
      </div>
    </div>
  ),
});

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-white">
      <main>
        <NewDonationForm />
        <DonationInfoSection />
      </main>
      
      {/* Trust Badges */}
      <div className="bg-gray-50 border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: '🔒', text: 'Secure Donations' },
              { icon: '📋', text: 'Donation Policy' },
              { icon: '📊', text: 'Annual Reports' },
              { icon: '📞', text: '24/7 Support' },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <span className="text-2xl mb-2">{item.icon}</span>
                <span className="text-sm text-gray-600">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
