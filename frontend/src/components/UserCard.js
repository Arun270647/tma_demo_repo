import React from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import DefaultLogo from '../assets/tma_logo.png';
import { ChevronDown } from 'lucide-react';

const UserCard = () => {
    // THIS IS THE FIX:
    // It provides an empty object {} as a fallback if useAuth() returns
    // a nullish value while data is loading. This prevents the crash.
    const { user, academy, academySettings } = useAuth() || {};
    
    const { isLight } = useTheme();

    // This line is now safe because academySettings will be, at worst,
    // undefined (from the empty object), not cause a crash.
    const logoUrl = academySettings && academySettings.logo_url 
        ? `${process.env.REACT_APP_BACKEND_URL}${academySettings.logo_url}` 
        : DefaultLogo;

    // A guard to prevent rendering if the user data isn't available yet
    if (!user) {
        return null;
    }

    return (
        <div className={`p-4 border-t ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
            <div className="flex items-center gap-3">
                <img src={logoUrl} alt="Academy Logo" className="h-10 w-10 rounded-md object-cover" />
                <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate ${isLight ? 'text-gray-800' : 'text-white'}`}>
                        {academy?.name || 'My Academy'}
                    </div>
                    <div className={`text-sm truncate ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        {user.email}
                    </div>
                </div>
                <button className={`${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                    <ChevronDown className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default UserCard;
