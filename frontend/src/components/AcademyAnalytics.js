import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const AcademyAnalytics = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/academy/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        console.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const SectionButton = ({ id, label, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2 rounded-none font-medium transition-all duration-300 ${
        active
          ? 'bg-sky-500 text-white shadow-lg'
          : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  const StatCard = ({ title, value, subtitle, color = 'blue', icon }) => (
    <div className={`bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold text-${color}-400 mb-1`}>{title}</h3>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`text-${color}-400 text-2xl`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  const DistributionChart = ({ title, data, color = 'sky' }) => (
    <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
      <h4 className="text-lg font-medium text-gray-300 mb-4">{title}</h4>
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => {
          const total = Object.values(data).reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? (value / total * 100) : 0;
          
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-none bg-${color}-400`}></div>
                <span className="text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">{value}</span>
                <span className="text-gray-400 text-sm">({percentage.toFixed(0)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-none h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">Unable to load analytics data</div>
          <button
            onClick={loadAnalytics}
            className="bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 px-4 py-2 rounded-none transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Academy Analytics</h2>
        <button
          onClick={loadAnalytics}
          className="bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 px-4 py-2 rounded-none transition-all duration-300"
        >
          Refresh Data
        </button>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <SectionButton
          id="overview"
          label="Overview"
          active={activeSection === 'overview'}
          onClick={setActiveSection}
        />
        <SectionButton
          id="players"
          label="Players"
          active={activeSection === 'players'}
          onClick={setActiveSection}
        />
        <SectionButton
          id="coaches"
          label="Coaches"
          active={activeSection === 'coaches'}
          onClick={setActiveSection}
        />
        <SectionButton
          id="growth"
          label="Growth"
          active={activeSection === 'growth'}
          onClick={setActiveSection}
        />
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-300 mb-4">Academy Overview</h3>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Members"
              value={analytics.total_members}
              subtitle="Players + Coaches"
              color="blue"
              icon="👥"
            />
            <StatCard
              title="Monthly Growth"
              value={`${analytics.monthly_growth_rate}%`}
              subtitle="Last 30 days"
              color="green"
              icon="📈"
            />
            <StatCard
              title="Capacity Usage"
              value={`${analytics.capacity_usage}%`}
              subtitle="Overall utilization"
              color="purple"
              icon="📊"
            />
            <StatCard
              title="Academy Age"
              value={`${analytics.operational_metrics.academy_age} days`}
              subtitle="Since establishment"
              color="yellow"
              icon="🎂"
            />
          </div>

          {/* Player & Coach Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
              <h4 className="text-lg font-medium text-gray-300 mb-4">Player Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Players</span>
                  <span className="text-white font-medium">{analytics.player_analytics.total_players}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Players</span>
                  <span className="text-green-400 font-medium">{analytics.player_analytics.active_players}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Recent Additions</span>
                  <span className="text-blue-400 font-medium">{analytics.player_analytics.recent_additions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Capacity</span>
                  <span className="text-purple-400 font-medium">
                    {analytics.operational_metrics.capacity_utilization.players}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
              <h4 className="text-lg font-medium text-gray-300 mb-4">Coach Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Coaches</span>
                  <span className="text-white font-medium">{analytics.coach_analytics.total_coaches}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Coaches</span>
                  <span className="text-green-400 font-medium">{analytics.coach_analytics.active_coaches}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg Experience</span>
                  <span className="text-blue-400 font-medium">{analytics.coach_analytics.average_experience} years</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Capacity</span>
                  <span className="text-purple-400 font-medium">
                    {analytics.operational_metrics.capacity_utilization.coaches}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Metrics */}
          <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
            <h4 className="text-lg font-medium text-gray-300 mb-4">Operational Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {analytics.operational_metrics.settings_completion}%
                </div>
                <div className="text-gray-400 text-sm">Settings Completion</div>
                <div className="w-full bg-gray-700 rounded-none h-2 mt-2">
                  <div 
                    className="bg-sky-500 h-2 rounded-none" 
                    style={{width: `${analytics.operational_metrics.settings_completion}%`}}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {analytics.operational_metrics.recent_activity.players_updated}
                </div>
                <div className="text-gray-400 text-sm">Players Updated</div>
                <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {analytics.operational_metrics.recent_activity.coaches_updated}
                </div>
                <div className="text-gray-400 text-sm">Coaches Updated</div>
                <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Players Section */}
      {activeSection === 'players' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-300 mb-4">Player Analytics</h3>
          
          {/* Player Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Players"
              value={analytics.player_analytics.total_players}
              subtitle="All registered players"
              color="blue"
            />
            <StatCard
              title="Active Players"
              value={analytics.player_analytics.active_players}
              subtitle="Currently active"
              color="green"
            />
            <StatCard
              title="Recent Additions"
              value={analytics.player_analytics.recent_additions}
              subtitle="Last 30 days"
              color="purple"
            />
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DistributionChart
              title="Age Distribution"
              data={analytics.player_analytics.age_distribution}
              color="blue"
            />
            <DistributionChart
              title="Position Distribution"
              data={analytics.player_analytics.position_distribution}
              color="green"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DistributionChart
              title="Status Distribution"
              data={analytics.player_analytics.status_distribution}
              color="purple"
            />
            
            {/* Player Insights */}
            <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
              <h4 className="text-lg font-medium text-gray-300 mb-4">Player Insights</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Most Common Age Group</span>
                  <span className="text-white font-medium">
                    {Object.entries(analytics.player_analytics.age_distribution)
                      .sort(([,a], [,b]) => b - a)[0]?.[0]?.replace(/_/g, ' ') || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Most Popular Position</span>
                  <span className="text-white font-medium">
                    {Object.entries(analytics.player_analytics.position_distribution)
                      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Activity Rate</span>
                  <span className="text-green-400 font-medium">
                    {analytics.player_analytics.total_players > 0 
                      ? Math.round((analytics.player_analytics.active_players / analytics.player_analytics.total_players) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coaches Section */}
      {activeSection === 'coaches' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-300 mb-4">Coach Analytics</h3>
          
          {/* Coach Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Coaches"
              value={analytics.coach_analytics.total_coaches}
              subtitle="All registered coaches"
              color="blue"
            />
            <StatCard
              title="Active Coaches"
              value={analytics.coach_analytics.active_coaches}
              subtitle="Currently active"
              color="green"
            />
            <StatCard
              title="Avg Experience"
              value={`${analytics.coach_analytics.average_experience}y`}
              subtitle="Years of experience"
              color="purple"
            />
            <StatCard
              title="Recent Additions"
              value={analytics.coach_analytics.recent_additions}
              subtitle="Last 30 days"
              color="yellow"
            />
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DistributionChart
              title="Specialization Distribution"
              data={analytics.coach_analytics.specialization_distribution}
              color="blue"
            />
            <DistributionChart
              title="Experience Distribution"
              data={analytics.coach_analytics.experience_distribution}
              color="green"
            />
          </div>

          {/* Coach Insights */}
          <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
            <h4 className="text-lg font-medium text-gray-300 mb-4">Coach Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-400 mb-1">
                  {Object.entries(analytics.coach_analytics.specialization_distribution)
                    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                </div>
                <div className="text-gray-400 text-sm">Top Specialization</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-400 mb-1">
                  {Object.entries(analytics.coach_analytics.experience_distribution)
                    .sort(([,a], [,b]) => b - a)[0]?.[0]?.replace(/_/g, ' ') || 'N/A'}
                </div>
                <div className="text-gray-400 text-sm">Common Experience Level</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-400 mb-1">
                  {analytics.coach_analytics.total_coaches > 0 
                    ? Math.round((analytics.coach_analytics.active_coaches / analytics.coach_analytics.total_coaches) * 100)
                    : 0}%
                </div>
                <div className="text-gray-400 text-sm">Activity Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Growth Section */}
      {activeSection === 'growth' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-300 mb-4">Growth Analytics</h3>
          
          {/* Growth Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Monthly Growth Rate"
              value={`${analytics.monthly_growth_rate}%`}
              subtitle="Member growth last 30 days"
              color="green"
            />
            <StatCard
              title="Total Added This Year"
              value={analytics.growth_metrics.yearly_summary.players_added + analytics.growth_metrics.yearly_summary.coaches_added}
              subtitle="Players + Coaches"
              color="blue"
            />
          </div>

          {/* Growth Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
              <h4 className="text-lg font-medium text-gray-300 mb-4">Player Growth</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Players Added</span>
                  <span className="text-white font-medium">{analytics.growth_metrics.yearly_summary.players_added}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Recent Additions (30d)</span>
                  <span className="text-green-400 font-medium">{analytics.player_analytics.recent_additions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Growth Rate</span>
                  <span className="text-blue-400 font-medium">
                    {analytics.player_analytics.total_players > 0 
                      ? Math.round((analytics.player_analytics.recent_additions / analytics.player_analytics.total_players) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
              <h4 className="text-lg font-medium text-gray-300 mb-4">Coach Growth</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Coaches Added</span>
                  <span className="text-white font-medium">{analytics.growth_metrics.yearly_summary.coaches_added}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Recent Additions (30d)</span>
                  <span className="text-green-400 font-medium">{analytics.coach_analytics.recent_additions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Growth Rate</span>
                  <span className="text-blue-400 font-medium">
                    {analytics.coach_analytics.total_coaches > 0 
                      ? Math.round((analytics.coach_analytics.recent_additions / analytics.coach_analytics.total_coaches) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Insights */}
          <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
            <h4 className="text-lg font-medium text-gray-300 mb-4">Growth Insights & Recommendations</h4>
            <div className="space-y-3">
              {analytics.monthly_growth_rate > 5 && (
                <div className="flex items-center space-x-2 text-green-400">
                  <span>📈</span>
                  <span>Excellent growth rate! Your academy is expanding rapidly.</span>
                </div>
              )}
              {analytics.capacity_usage > 80 && (
                <div className="flex items-center space-x-2 text-yellow-400">
                  <span>⚠️</span>
                  <span>High capacity usage. Consider expanding limits or facilities.</span>
                </div>
              )}
              {analytics.coach_analytics.average_experience > 5 && (
                <div className="flex items-center space-x-2 text-blue-400">
                  <span>🎯</span>
                  <span>High coach experience level provides quality training foundation.</span>
                </div>
              )}
              {analytics.operational_metrics.settings_completion < 50 && (
                <div className="flex items-center space-x-2 text-orange-400">
                  <span>📝</span>
                  <span>Complete your academy settings to improve operational efficiency.</span>
                </div>
              )}
              {analytics.player_analytics.recent_additions === 0 && analytics.coach_analytics.recent_additions === 0 && (
                <div className="flex items-center space-x-2 text-gray-400">
                  <span>💡</span>
                  <span>Consider marketing initiatives to attract new members.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademyAnalytics;
