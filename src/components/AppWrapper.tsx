import React, { useState, useEffect } from 'react';
import { SplashScreen } from './SplashScreen';
import { OnboardingFlow } from './OnboardingFlow';
import { useAuth } from '@/contexts/AuthContext';

interface AppWrapperProps {
  children: React.ReactNode;
}

const ONBOARDING_KEY = 'habex-onboarding-complete';
const SPLASH_SHOWN_KEY = 'habex-splash-shown-session';

export const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash once per session
    return !sessionStorage.getItem(SPLASH_SHOWN_KEY);
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Mark splash as shown for this session
    if (showSplash) {
      sessionStorage.setItem(SPLASH_SHOWN_KEY, 'true');
    }
  }, [showSplash]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    
    // Check if user is logged in and hasn't seen onboarding
    if (user && !localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    } else {
      setIsReady(true);
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
    setIsReady(true);
  };

  // When auth state changes after splash, check onboarding
  useEffect(() => {
    if (!showSplash && !authLoading) {
      if (user && !localStorage.getItem(ONBOARDING_KEY)) {
        setShowOnboarding(true);
      } else {
        setIsReady(true);
      }
    }
  }, [user, authLoading, showSplash]);

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Show onboarding for logged-in users who haven't completed it
  if (showOnboarding && user) {
    return (
      <>
        {children}
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </>
    );
  }

  return (
    <>
      {children}
    </>
  );
};