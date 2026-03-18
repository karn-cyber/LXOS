'use client';

import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isEmailAllowed, isCollegeEmail } from './clerk-config';

export const useClerkEmailValidation = () => {
  const { userId } = useAuth();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateEmail = async () => {
      if (!userId) {
        setIsValid(false);
        return;
      }

      try {
        // Fetch user from Clerk
        const response = await fetch('/api/auth/validate');
        const data = await response.json();

        if (!data.allowed) {
          setError(data.reason);
          setIsValid(false);
          // Redirect after showing error
          setTimeout(() => {
            redirect('/blocked');
          }, 2000);
          return;
        }

        setIsValid(true);
        setError(null);
      } catch (err) {
        console.error('Validation error:', err);
        setError('Validation failed');
        setIsValid(false);
      }
    };

    validateEmail();
  }, [userId]);

  return { isValid, error, isLoading: isValid === null };
};
