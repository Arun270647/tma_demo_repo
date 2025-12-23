import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Cake, Hash, Shield, KeyRound, RefreshCw, Copy, Check } from 'lucide-react';

const PlayerCard = ({ player, onEdit, onDelete, onSelect, isSelected, selectionMode, onRegeneratePassword }) => {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const fullName = `${player.first_name || ''} ${player.last_name || ''}`.trim();

  const handleCopyPassword = async () => {
    if (player.default_password) {
      try {
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(player.default_password);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = player.default_password;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch (err) {
            console.error('Failed to copy:', err);
            alert(`Password: ${player.default_password}\nPlease copy manually.`);
          }
          document.body.removeChild(textArea);
        }
      } catch (error) {
        console.error('Copy failed:', error);
        alert(`Password: ${player.default_password}\nPlease copy manually.`);
      }
    }
  };

  const handleRegeneratePassword = async () => {
    if (!onRegeneratePassword) return;
    setRegenerating(true);
    try {
      await onRegeneratePassword(player.id);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3 }}
      className={`relative rounded-lg p-4 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 w-full flex flex-col h-full
        ${isSelected ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white border border-gray-200'}
      `}
    >
      {selectionMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(player.id)}
          className="absolute top-2 right-2 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      )}
      <div className="flex-grow">
        <div className="flex items-center mb-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4 flex-shrink-0">
            {player.photo_url ? (
              <img 
                src={player.photo_url.startsWith('data:') ? player.photo_url : `${process.env.REACT_APP_BACKEND_URL}${player.photo_url}`}
                alt={fullName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-gray-500" />
            )}
          </div>
          <div className="min-w-0">
            <p 
              className="text-lg font-bold text-gray-800 truncate" 
              title={fullName || player.name || 'Unnamed Player'}
            >
              {fullName || player.name || 'Unnamed Player'}
            </p>
            {player.email && (
              <p className="text-xs text-gray-500 truncate" title={player.email}>
                {player.email}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-sm text-gray-500">
            <Shield className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-semibold text-gray-700 mr-1">Sport:</span>
            {player.sport || 'N/A'}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Hash className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-semibold text-gray-700 mr-1">Reg No:</span>
            {player.registration_number || player.jersey_number || 'N/A'}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Cake className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-semibold text-gray-700 mr-1">Age:</span>
            {player.age || 'N/A'}
          </div>
          
          {/* Show credentials only if player has login and hasn't changed password */}
          {!player.password_changed && player.default_password && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center text-sm text-yellow-800">
                  <KeyRound className="w-4 h-4 mr-2" />
                  <span className="font-semibold">Login Credentials</span>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-mono bg-white px-2 py-1 rounded text-gray-800 mt-1">
                    {player.email}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Password:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono bg-white px-2 py-1 rounded text-gray-800 flex-1">
                      {player.default_password}
                    </p>
                    <button
                      onClick={handleCopyPassword}
                      className="p-3 bg-white hover:bg-gray-100 rounded transition"
                      title="Copy password"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-yellow-700 mt-2">⚠️ Password visible until player changes it</p>
                {!player.has_login && (
                  <p className="text-yellow-700 mt-1">Account activation pending in local environment</p>
                )}
              </div>
            </div>
          )}

          {/* Show regenerate button if player has login and has changed password */}
          {player.has_login && player.password_changed && (
            <div className="mt-3">
              <button
                onClick={handleRegeneratePassword}
                disabled={regenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Regenerating...' : 'Regenerate Password'}
              </button>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Use if player forgot password
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-4 mt-auto">
        <button
          onClick={() => onEdit(player)}
          className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(player)}
          className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
        >
          Delete
        </button>
      </div>
    </motion.div>
  );
};

export default PlayerCard;
