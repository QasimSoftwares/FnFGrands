'use server';

import { createClient } from '@/lib/supabase/server-client-fixed';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type DonationFormData = {
  name: string;
  email: string;
  amount: string;
  message?: string;
};

export async function submitDonation(formData: FormData) {
  const supabase = createClient();
  
  // Get the current user's session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to submit a donation request');
  }

  // Convert FormData to plain object
  const formEntries = Object.fromEntries(formData.entries()) as unknown as DonationFormData;
  
  // Get form data with proper typing
  const { name, email, amount: amountStr, message } = formEntries;
  const amount = parseFloat(amountStr);

  // Basic validation
  if (!name?.trim() || !email?.trim() || isNaN(amount) || amount <= 0) {
    throw new Error('Please fill in all required fields with valid values');
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address');
  }

  // Insert the donation request
  const { error } = await supabase
    .from('donation_requests')
    .insert([
      { 
        name,
        email,
        amount,
        message: message || null,
        status: 'pending'
      }
    ]);

  if (error) {
    console.error('Error submitting donation:', error);
    throw new Error('Failed to submit donation. Please try again.');
  }

  // Refresh the donations list and redirect
  revalidatePath('/dashboard');
  redirect('/dashboard?donation=success');
}
