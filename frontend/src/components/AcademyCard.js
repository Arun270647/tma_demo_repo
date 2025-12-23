import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { MapPin, Users, UserCheck, Edit, Trash2 } from 'lucide-react';

const AcademyCard = ({ academy, selected, onSelect, onApprove, onReject, onEdit, onDelete }) => {
  const { isLight } = useTheme();
  const backend = process.env.REACT_APP_BACKEND_URL;
  const logoUrl = academy.logo_url ? `${backend}${academy.logo_url}` : null;

  return (
    <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'} hover:shadow-md transition-all duration-200 relative`}>
      <div className="absolute top-4 left-4">
        <input 
          type="checkbox" 
          checked={selected} 
          onChange={onSelect} 
          className={`w-4 h-4 rounded ${isLight ? 'border-gray-300 text-blue-600 focus:ring-blue-500' : 'bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500'}`} 
        />
      </div>
      
      <div className="pt-4">
        <div className="flex items-center gap-4 mb-4">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={`${academy.name} logo`} 
              className="w-12 h-12 rounded-xl object-cover border-2 border-gray-200" 
            />
          ) : (
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isLight ? 'bg-gray-100' : 'bg-gray-700'}`}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{academy.name?.[0] || 'A'}</span>
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold truncate ${isLight ? 'text-gray-900' : 'text-white'} mb-1`}>{academy.name}</h4>
            <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} mb-1`}>{academy.owner_name}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{academy.location || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-4 h-4 rounded ${isLight ? 'bg-blue-100' : 'bg-blue-900'} flex items-center justify-center`}>
              <span className="text-blue-600 text-xs font-bold">S</span>
            </div>
            <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{academy.sports_type || '—'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm flex-1">
            <div className="flex items-center gap-2">
              <Users className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={`${isLight ? 'text-gray-900' : 'text-gray-200'} font-medium`}>{academy.player_limit || 50}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={`${isLight ? 'text-gray-900' : 'text-gray-200'} font-medium`}>{academy.coach_limit || 10}</span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            academy.status === 'approved' ? 'bg-green-100 text-green-700 border border-green-200' :
            academy.status === 'pending' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
            academy.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}>
            {academy.status}
          </span>
        </div>

        <div className="space-y-2">
          {academy.status === 'pending' && (
            <div className="flex gap-2">
              <button 
                onClick={onApprove} 
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200"
              >
                Approve
              </button>
              <button 
                onClick={onReject} 
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors duration-200"
              >
                Reject
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <button 
              onClick={onEdit} 
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button 
              onClick={onDelete} 
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademyCard;