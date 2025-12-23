import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

/**
 * SplashScreen Component
 * Displays a branded loading screen when app starts
 * Shows academy logo, name, and loading animation
 */
const SplashScreen = ({ onComplete, minDuration = 2000 }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        // Gradually increase progress with some randomness
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 100);
      });
    }, 150);

    // Wait for minimum duration and 100% progress
    const checkComplete = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (progress >= 100 && elapsed >= minDuration) {
        clearInterval(checkComplete);
        setFadeOut(true);

        // Call onComplete after fade out animation
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }
    }, 100);

    return () => {
      clearInterval(progressInterval);
      clearInterval(checkComplete);
    };
  }, [progress, minDuration, onComplete]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        {/* Logo */}
        <div className="splash-logo-container">
          <img
            src="/icons/icon-192x192.png"
            alt="Track My Academy Logo"
            className="splash-logo"
          />
          <div className="splash-logo-glow"></div>
        </div>

        {/* App Name */}
        <h1 className="splash-title">Track My Academy</h1>
        <p className="splash-tagline">Sports Academy Management</p>

        {/* Loading Animation */}
        <div className="splash-loader-container">
          <div className="splash-progress-bar">
            <div
              className="splash-progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="splash-loading-text">
            {progress < 30 && 'Initializing...'}
            {progress >= 30 && progress < 60 && 'Loading resources...'}
            {progress >= 60 && progress < 90 && 'Setting up...'}
            {progress >= 90 && 'Almost ready...'}
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="splash-decorative">
          <div className="splash-ball splash-ball-1"></div>
          <div className="splash-ball splash-ball-2"></div>
          <div className="splash-ball splash-ball-3"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
