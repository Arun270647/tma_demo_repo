import React, { useState } from 'react';
import {
  isWebShareSupported,
  shareWithFallback,
  shareOnPlatform,
  getPlatformShareUrl
} from '../utils/shareHelpers';

/**
 * ShareButton Component
 * Displays a share button with native Web Share API or platform-specific sharing
 *
 * @param {Object} props
 * @param {Object} props.shareData - Data to share (title, text, url)
 * @param {string} props.buttonText - Button text (default: "Share")
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showPlatforms - Show platform-specific buttons (default: false)
 * @param {Array} props.platforms - Platforms to show (default: ['whatsapp', 'telegram', 'twitter', 'email'])
 */
const ShareButton = ({
  shareData,
  buttonText = 'Share',
  className = '',
  showPlatforms = false,
  platforms = ['whatsapp', 'telegram', 'twitter', 'email']
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (isWebShareSupported()) {
      // Use native share
      const success = await shareWithFallback(shareData);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      // Show platform menu
      setShowMenu(!showMenu);
    }
  };

  const handlePlatformShare = (platform) => {
    shareOnPlatform(platform, shareData);
    setShowMenu(false);
  };

  const platformIcons = {
    whatsapp: '💬',
    telegram: '✈️',
    twitter: '🐦',
    facebook: '👥',
    linkedin: '💼',
    email: '📧'
  };

  const platformNames = {
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    twitter: 'Twitter',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    email: 'Email'
  };

  return (
    <div className="share-button-container" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleShare}
        className={`share-button ${className}`}
        style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
      >
        {copied ? (
          <>
            ✓ Copied!
          </>
        ) : (
          <>
            🔗 {buttonText}
          </>
        )}
      </button>

      {/* Platform-specific share menu */}
      {showMenu && (
        <div
          className="share-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '8px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '8px',
            minWidth: '200px',
            zIndex: 1000
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', padding: '8px', fontWeight: '500' }}>
            Share via:
          </div>
          {platforms.map(platform => (
            <button
              key={platform}
              onClick={() => handlePlatformShare(platform)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <span style={{ fontSize: '20px' }}>{platformIcons[platform]}</span>
              <span>{platformNames[platform]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShareButton;
