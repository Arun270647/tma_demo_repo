import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { Line } from 'react-chartjs-2';

const PredictivePerformance = ({ playerId }) => {
  const { token } = useAuth();
  const { isLight } = useTheme();
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (playerId) {
      loadPrediction();
    }
  }, [playerId]);

  const loadPrediction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/api/academy/analytics/predictive-performance/${playerId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPrediction(data);
      } else {
        setError('Failed to load prediction');
      }
    } catch (error) {
      console.error('Error loading prediction:', error);
      setError('Error loading prediction');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = () => {
    if (!prediction?.trend_direction) return <Minus className="w-5 h-5" />;
    
    switch (prediction.trend_direction) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    if (!prediction?.trend_direction) return isLight ? 'text-gray-600' : 'text-gray-400';
    
    switch (prediction.trend_direction) {
      case 'improving':
        return 'text-green-600';
      case 'declining':
        return 'text-red-600';
      default:
        return isLight ? 'text-gray-600' : 'text-gray-400';
    }
  };

  const getChartData = () => {
    if (!prediction?.historical_performance || !prediction?.predicted_performance) return null;

    const historical = prediction.historical_performance.map(h => ({
      x: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      y: h.score
    }));

    const predicted = prediction.predicted_performance.map(p => ({
      x: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      y: p.predicted_score
    }));

    // Get last historical point to connect with predictions
    const lastHistorical = historical[historical.length - 1];

    return {
      labels: [...historical.map(h => h.x), ...predicted.map(p => p.x)],
      datasets: [
        {
          label: 'Historical Performance',
          data: historical.map(h => h.y),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: 'rgb(59, 130, 246)'
        },
        {
          label: 'Predicted Performance',
          data: [
            ...Array(historical.length - 1).fill(null),
            lastHistorical?.y,
            ...predicted.map(p => p.y)
          ],
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderDash: [5, 5],
          tension: 0.4,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: 'rgb(168, 85, 247)'
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
        <div className="flex items-center gap-3 text-gray-500">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">
            {error || prediction?.message || 'No prediction data available'}
          </p>
        </div>
      </div>
    );
  }

  if (!prediction.predicted_performance) {
    return (
      <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
        <div className={`text-center py-8 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{prediction.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
            Predictive Performance Analysis
          </h3>
          <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
            30-day performance forecast based on historical trends
          </p>
        </div>
        {getTrendIcon()}
      </div>

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Trend Direction */}
        <div className={`${isLight ? 'bg-gray-50' : 'bg-gray-900'} rounded-lg p-4`}>
          <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'} mb-1`}>
            Trend Direction
          </p>
          <p className={`text-xl font-bold ${getTrendColor()} capitalize`}>
            {prediction.trend_direction}
          </p>
        </div>

        {/* Confidence Level */}
        <div className={`${isLight ? 'bg-gray-50' : 'bg-gray-900'} rounded-lg p-4`}>
          <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'} mb-1`}>
            Confidence Level
          </p>
          <div className="flex items-center gap-2">
            <p className={`text-xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
              {prediction.confidence}%
            </p>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  prediction.confidence >= 70
                    ? 'bg-green-500'
                    : prediction.confidence >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${prediction.confidence}%` }}
              />
            </div>
          </div>
        </div>

        {/* Trend Slope */}
        <div className={`${isLight ? 'bg-gray-50' : 'bg-gray-900'} rounded-lg p-4`}>
          <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'} mb-1`}>
            Trend Slope
          </p>
          <p className={`text-xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
            {prediction.trend_slope > 0 ? '+' : ''}{prediction.trend_slope}
          </p>
        </div>
      </div>

      {/* Chart */}
      {getChartData() && (
        <div className="mb-6 h-64">
          <Line
            data={getChartData()}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'top',
                  labels: {
                    color: isLight ? '#374151' : '#d1d5db',
                    usePointStyle: true,
                    padding: 15
                  }
                },
                tooltip: {
                  backgroundColor: isLight ? '#fff' : '#1f2937',
                  titleColor: isLight ? '#111827' : '#f9fafb',
                  bodyColor: isLight ? '#374151' : '#d1d5db',
                  borderColor: isLight ? '#e5e7eb' : '#374151',
                  borderWidth: 1,
                  padding: 12,
                  displayColors: true,
                  callbacks: {
                    label: function(context) {
                      return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}/10`;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 10,
                  ticks: {
                    color: isLight ? '#6b7280' : '#9ca3af',
                    stepSize: 2
                  },
                  grid: {
                    color: isLight ? '#f3f4f6' : '#374151'
                  }
                },
                x: {
                  ticks: {
                    color: isLight ? '#6b7280' : '#9ca3af',
                    maxRotation: 45,
                    minRotation: 45
                  },
                  grid: {
                    display: false
                  }
                }
              }
            }}
          />
        </div>
      )}

      {/* Recommendation */}
      <div className={`${
        prediction.trend_direction === 'improving'
          ? isLight ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-700'
          : prediction.trend_direction === 'declining'
          ? isLight ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-700'
          : isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-700'
      } border rounded-lg p-4`}>
        <p className={`text-sm font-medium ${
          prediction.trend_direction === 'improving'
            ? 'text-green-800 dark:text-green-300'
            : prediction.trend_direction === 'declining'
            ? 'text-red-800 dark:text-red-300'
            : 'text-blue-800 dark:text-blue-300'
        } mb-2`}>
          💡 Recommendation
        </p>
        <p className={`text-sm ${
          prediction.trend_direction === 'improving'
            ? 'text-green-700 dark:text-green-400'
            : prediction.trend_direction === 'declining'
            ? 'text-red-700 dark:text-red-400'
            : 'text-blue-700 dark:text-blue-400'
        }`}>
          {prediction.recommendation}
        </p>
      </div>
    </div>
  );
};

export default PredictivePerformance;
