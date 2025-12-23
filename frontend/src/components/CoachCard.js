import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Award, Key, Eye, EyeOff, Copy, CheckCircle, UserPlus } from 'lucide-react';

const Avatar = ({ name, photoUrl }) => {
  const initials = (name || '').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
  
  if (photoUrl) {
    return (
      <img 
        src={photoUrl} 
        alt={name} 
        className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
      />
    );
  }
  
  return (
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-semibold text-xl">
      {initials || 'CH'}
    </div>
  );
};

const CoachCard = ({ coach, onEdit, onDelete, onAssignPlayers }) => {
  const { isLight } = useTheme();
  const fullName = `${coach.first_name || ''} ${coach.last_name || ''}`.trim();
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPassword = async () => {
    if (coach.temporary_password) {
      try {
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(coach.temporary_password);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = coach.temporary_password;
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
            alert(`Password: ${coach.temporary_password}\nPlease copy manually.`);
          }
          document.body.removeChild(textArea);
        }
      } catch (error) {
        console.error('Copy failed:', error);
        alert(`Password: ${coach.temporary_password}\nPlease copy manually.`);
      }
    }
  };

  return (
    <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm hover:shadow-md' : 'bg-gray-900 border border-cyan-500/30 hover:border-cyan-500/60'} rounded-xl transition-all duration-200 p-4 sm:p-5 md:p-6`}>
      <div className="space-y-4 sm:space-y-5">
      <div className="flex items-start gap-4 mb-3 sm:mb-4">
        <Avatar name={fullName || coach.email} photoUrl={coach.photo_url} />
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-xl whitespace-normal break-words text-left ${isLight ? 'text-gray-900' : 'text-white'}`}>
            {fullName || coach.email}
          </h3>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm whitespace-normal break-words flex items-center gap-1 text-left`}>
            {coach.email || 'No email'}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onEdit(coach)} 
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isLight 
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
            }`}
          >
            Edit
          </button>
          <button 
            onClick={() => onDelete(coach.id)} 
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isLight 
                ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            }`}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Sports Badges */}
      {coach.sports && coach.sports.length > 0 && (
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className={`w-4 h-4 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              Sports Handled
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {coach.sports.map((sport) => (
              <span
                key={sport}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  isLight 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}
              >
                {sport}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Temporary Password Section */}
      {!coach.has_reset_password && coach.temporary_password && (
        <div className={`mb-3 sm:mb-4 p-3 rounded-xl border ${
          isLight 
            ? 'bg-yellow-50 border-yellow-200' 
            : 'bg-yellow-500/10 border-yellow-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Key className={`w-4 h-4 ${isLight ? 'text-yellow-700' : 'text-yellow-400'}`} />
            <span className={`text-sm font-semibold ${isLight ? 'text-yellow-900' : 'text-yellow-400'}`}>
              Temporary Password
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex-1 px-4 py-2.5 rounded-lg font-mono text-sm ${
              isLight ? 'bg-white border border-yellow-300 text-gray-900' : 'bg-gray-800 border border-yellow-500/50 text-white'
            }`}>
              {showPassword ? coach.temporary_password : '••••••••'}
            </div>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className={`p-2 rounded-lg transition-colors ${
                isLight ? 'hover:bg-yellow-100' : 'hover:bg-yellow-500/20'
              }`}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className={`w-4 h-4 ${isLight ? 'text-yellow-700' : 'text-yellow-400'}`} />
              ) : (
                <Eye className={`w-4 h-4 ${isLight ? 'text-yellow-700' : 'text-yellow-400'}`} />
              )}
            </button>
            <button
              onClick={handleCopyPassword}
              className={`p-2 rounded-lg transition-colors ${
                isLight ? 'hover:bg-yellow-100' : 'hover:bg-yellow-500/20'
              }`}
              title="Copy password"
            >
              {copied ? (
                <CheckCircle className={`w-4 h-4 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
              ) : (
                <Copy className={`w-4 h-4 ${isLight ? 'text-yellow-700' : 'text-yellow-400'}`} />
              )}
            </button>
          </div>
          <p className={`text-xs mt-2 ${isLight ? 'text-yellow-800' : 'text-yellow-300'}`}>
            ⚠️ Share this password with the coach. It will be hidden once they change it.
          </p>
        </div>
      )}

      {/* Coach Details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:gap-4 text-sm mb-3 sm:mb-4 justify-items-start">
        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-left`}>Specialization</div>
        <div className={`${isLight ? 'text-gray-900' : 'text-gray-200'} font-medium text-left`}>
          {coach.specialization || 'General'}
        </div>
        
        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-left`}>Experience</div>
        <div className={`${isLight ? 'text-gray-900' : 'text-gray-200'} font-medium text-left`}>
          {coach.experience_years ? `${coach.experience_years} years` : '—'}
        </div>
        
        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-left`}>Status</div>
        <div className="text-left">
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
            coach.status === 'active' 
              ? isLight 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
              : isLight
                ? 'bg-gray-100 text-gray-700 border border-gray-200'
                : 'bg-gray-700 text-gray-400 border border-gray-600'
          }`}>
            {coach.status || 'inactive'}
          </span>
        </div>

        {coach.has_reset_password !== undefined && (
          <>
            <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-left`}>Password Status</div>
            <div className="text-left">
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                coach.has_reset_password
                  ? isLight 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : isLight
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {coach.has_reset_password ? 'Changed' : 'Not Changed'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Assign Players Button */}
      {onAssignPlayers && (
        <button
          onClick={() => onAssignPlayers(coach)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all mt-4 sm:mt-5 ${
            isLight
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
          }`}
        >
          <UserPlus className="w-5 h-5" />
          Assign Players
        </button>
      )}
      </div>
    </div>
  );
};

export default CoachCard;
