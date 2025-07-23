import { FaCheck, FaHandHoldingHeart, FaMosque, FaGlobe, FaGift } from 'react-icons/fa';

const donationTypes = [
  {
    name: 'Zakat',
    icon: <FaHandHoldingHeart className="text-yellow-600 text-2xl" />,
    description: 'Fulfill your Zakat obligation and purify your wealth by helping those in need.'
  },
  {
    name: 'Sadaqah',
    icon: <FaMosque className="text-green-600 text-2xl" />,
    description: 'Voluntary charity that brings blessings and purifies wealth.'
  },
  {
    name: 'General',
    icon: <FaGlobe className="text-blue-600 text-2xl" />,
    description: 'Support our general fund to help wherever the need is greatest.'
  },
  {
    name: 'Other',
    icon: <FaGift className="text-purple-600 text-2xl" />,
    description: 'Have a specific cause in mind? Let us know how you\'d like to help.'
  }
];

const impactAreas = [
  'Emergency Relief',
  'Education Programs',
  'Healthcare Services',
  'Clean Water Projects',
  'Orphan Support',
  'Food Security'
];

export default function DonationInfoSection() {
  return (
    <div className="bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Testimonial */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium text-gray-900 mb-4">What Donors Say</h3>
            <div className="space-y-6">
              <div className="relative">
                <div className="text-yellow-400 text-5xl absolute -top-2 -left-2">"</div>
                <blockquote className="pl-6 text-gray-700 italic">
                  <p>"I've been donating monthly for over a year now, and it's amazing to see the impact of even small contributions when we all come together."</p>
                </blockquote>
                <div className="flex items-center mt-4 pl-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">AJ</div>
                  <div className="ml-4">
                    <p className="font-medium">Ahmed J.</p>
                    <p className="text-sm text-gray-500">Monthly Donor</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Areas */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium text-gray-900 mb-4">Your Impact</h3>
            <p className="text-gray-600 mb-4">Your generous donations support various initiatives that make a real difference:</p>
            <div className="grid grid-cols-2 gap-2">
              {impactAreas.map((area) => (
                <div key={area} className="flex items-center">
                  <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{area}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Donation Types */}
        <div className="mt-8">
          <h3 className="text-xl font-medium text-gray-900 mb-6 text-center">Ways to Give</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {donationTypes.map((type) => (
              <div key={type.name} className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  {type.icon}
                </div>
                <h4 className="font-medium text-gray-900 mb-2">{type.name}</h4>
                <p className="text-sm text-gray-600">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
