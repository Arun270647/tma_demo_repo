import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Users, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const PlayerAssignmentModal = ({ isOpen, onClose, coach, onAssign, allPlayers }) => {
  const { isLight } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [localPlayers, setLocalPlayers] = useState(allPlayers || []);

  useEffect(() => {
    if (isOpen) {
      setLocalPlayers(allPlayers || []);
    }
  }, [allPlayers, isOpen]);

  // Early return if modal is not open or coach is null
  if (!isOpen || !coach) return null;

  // Filter players based on search
  const filteredPlayers = (localPlayers || []).filter(player => {
    const fullName = `${player.first_name} ${player.last_name}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || 
           (player.registration_number || '').toLowerCase().includes(search) ||
           (player.sport || '').toLowerCase().includes(search);
  });

  
  const normalizeId = (v) => String(v ?? '');
  const currentCoachId = coach?.id ?? coach?.coach_id;
  const assignedPlayers = filteredPlayers.filter(p => normalizeId(p.coach_id) === normalizeId(currentCoachId));
  const unassignedPlayers = filteredPlayers.filter(p => p.coach_id === null || p.coach_id === undefined || p.coach_id === '');
  const assignedToOthers = filteredPlayers.filter(p => !unassignedPlayers.includes(p) && normalizeId(p.coach_id) !== normalizeId(currentCoachId));

  const handleSelectPlayer = (playerId) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSelectAll = (playerList) => {
    const playerIds = playerList.map(p => p.id);
    setSelectedPlayers(prev => {
      const allSelected = playerIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !playerIds.includes(id));
      } else {
        return [...new Set([...prev, ...playerIds])];
      }
    });
  };

  const handleAssign = async () => {
    if (!coach) return;
    
    if (selectedPlayers.length === 0) {
      setMessage('⚠️ Please select at least one player');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      await onAssign(currentCoachId, selectedPlayers);
      const selectedSet = new Set(selectedPlayers.map(id => String(id)));
      setLocalPlayers(prev => prev.map(p => selectedSet.has(String(p.id)) ? { ...p, coach_id: currentCoachId } : p));
      setMessage(`✅ Successfully assigned ${selectedPlayers.length} player(s) to ${coach.first_name || ''} ${coach.last_name || ''}`);
      setSelectedPlayers([]);
      setTimeout(() => {
        setMessage('');
        onClose();
      }, 2000);
    } catch (error) {
      setMessage(`❌ ${error.message || 'Failed to assign players'}`);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (selectedPlayers.length === 0) {
      setMessage('⚠️ Please select at least one player to unassign');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      await onAssign(null, selectedPlayers); // Pass null to unassign
      const selectedSet = new Set(selectedPlayers.map(id => String(id)));
      setLocalPlayers(prev => prev.map(p => selectedSet.has(String(p.id)) ? { ...p, coach_id: '' } : p));
      setMessage(`✅ Successfully unassigned ${selectedPlayers.length} player(s)`);
      setSelectedPlayers([]);
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage(`❌ ${error.message || 'Failed to unassign players'}`);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
          <div>
            <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Assign Players to Coach
            </h2>
            <p className={`text-sm mt-1 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
              Coach: <span className="font-semibold">{coach?.first_name || ''} {coach?.last_name || ''}</span> 
              {coach?.sports && coach.sports.length > 0 && (
                <span> • Sports: {coach.sports.join(', ')}</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'
            }`}
          >
            <X className={`w-6 h-6 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 pb-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search players by name, registration number, or sport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                isLight 
                  ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500' 
                  : 'bg-gray-900 border-gray-700 text-white placeholder-gray-400'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            />
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-6 mb-4 p-3 rounded-xl text-sm font-medium ${
            message.includes('✅') 
              ? isLight ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-green-500/20 text-green-400 border border-green-500/30'
              : message.includes('⚠️')
              ? isLight ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : isLight ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message}
          </div>
        )}

        {/* Player Lists */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {/* Already Assigned to This Coach */}
          {assignedPlayers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Already Assigned ({assignedPlayers.length})
                </h3>
                <button
                  onClick={() => handleSelectAll(assignedPlayers)}
                  className={`text-sm font-medium ${isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'}`}
                >
                  {assignedPlayers.every(p => selectedPlayers.includes(p.id)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid gap-3">
                {assignedPlayers.map(player => (
                  <PlayerItem
                    key={player.id}
                    player={player}
                    isSelected={selectedPlayers.includes(player.id)}
                    onSelect={() => handleSelectPlayer(player.id)}
                    isLight={isLight}
                    status="assigned"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Unassigned Players */}
          {unassignedPlayers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  <Users className="w-5 h-5 text-gray-500" />
                  Available Players ({unassignedPlayers.length})
                </h3>
                <button
                  onClick={() => handleSelectAll(unassignedPlayers)}
                  className={`text-sm font-medium ${isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'}`}
                >
                  {unassignedPlayers.every(p => selectedPlayers.includes(p.id)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid gap-3">
                {unassignedPlayers.map(player => (
                  <PlayerItem
                    key={player.id}
                    player={player}
                    isSelected={selectedPlayers.includes(player.id)}
                    onSelect={() => handleSelectPlayer(player.id)}
                    isLight={isLight}
                    status="unassigned"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Assigned to Other Coaches */}
          {assignedToOthers.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                <UserPlus className="w-5 h-5 text-orange-500" />
                Assigned to Other Coaches ({assignedToOthers.length})
              </h3>
              <div className="grid gap-3">
                {assignedToOthers.map(player => (
                  <PlayerItem
                    key={player.id}
                    player={player}
                    isSelected={false}
                    onSelect={() => {}}
                    isLight={isLight}
                    status="other"
                    disabled
                  />
                ))}
              </div>
            </div>
          )}

          {filteredPlayers.length === 0 && (
            <div className={`text-center py-12 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No players found</p>
              <p className="text-sm mt-2">Try adjusting your search criteria</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex gap-3 p-6 border-t ${isLight ? 'border-gray-200 bg-gray-50' : 'border-gray-700 bg-gray-900'}`}>
          <div className={`flex-1 text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
            {selectedPlayers.length > 0 && (
              <span className="font-medium">{selectedPlayers.length} player(s) selected</span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              isLight 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Cancel
          </button>
          {assignedPlayers.some(p => selectedPlayers.includes(p.id)) && (
            <button
              onClick={handleUnassign}
              disabled={loading || selectedPlayers.length === 0}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                loading || selectedPlayers.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isLight
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {loading ? 'Unassigning...' : 'Unassign Selected'}
            </button>
          )}
          <button
            onClick={handleAssign}
            disabled={loading || selectedPlayers.length === 0}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              loading || selectedPlayers.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isLight
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {loading ? 'Assigning...' : 'Assign Selected'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PlayerItem = ({ player, isSelected, onSelect, isLight, status, disabled = false }) => {
  const statusColors = {
    assigned: isLight ? 'bg-green-50 border-green-200' : 'bg-green-500/10 border-green-500/30',
    unassigned: isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/30',
    other: isLight ? 'bg-gray-100 border-gray-300' : 'bg-gray-700 border-gray-600'
  };

  return (
    <div
      onClick={disabled ? undefined : onSelect}
      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
      } ${
        isSelected 
          ? isLight ? 'border-blue-500 bg-blue-50' : 'border-blue-500 bg-blue-500/20'
          : statusColors[status]
      }`}
    >
      {/* Checkbox */}
      {!disabled && (
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          isSelected 
            ? 'bg-blue-600 border-blue-600' 
            : isLight ? 'border-gray-300' : 'border-gray-600'
        }`}>
          {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
        </div>
      )}

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className={`font-semibold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
          {player.first_name} {player.last_name}
        </div>
        <div className={`text-sm flex items-center gap-3 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
          {player.registration_number && <span>#{player.registration_number}</span>}
          {player.sport && <span className="truncate">{player.sport}</span>}
          {player.position && <span className="truncate">{player.position}</span>}
        </div>
      </div>

      {/* Status Badge */}
      {status === 'other' && (
        <span className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
          isLight ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/20 text-orange-400'
        }`}>
          Assigned to Other
        </span>
      )}
    </div>
  );
};

export default PlayerAssignmentModal;
