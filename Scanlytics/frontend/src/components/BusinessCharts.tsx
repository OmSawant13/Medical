import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ALL required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export const BusinessCharts: React.FC = () => {
  // Revenue Forecast Chart Data
  const revenueData = {
    labels: ['Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025 (Forecast)'],
    datasets: [
      {
        label: 'Actual Revenue',
        data: [450000, 480000, 520000, 550000, 580000, 610000, null],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
      {
        label: 'Forecast',
        data: [null, null, null, null, null, 610000, 655050],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderDash: [8, 4],
        tension: 0.4,
        fill: false,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  };

  // CAC vs CLTV Chart Data
  const cacCltvData = {
    labels: ['Premium Patients', 'Regular Patients', 'Occasional Patients'],
    datasets: [
      {
        label: 'Customer Acquisition Cost (CAC)',
        data: [150, 100, 80],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
      },
      {
        label: 'Customer Lifetime Value (CLTV)',
        data: [12000, 3000, 600],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
      },
    ],
  };

  // NPS Distribution Data
  const npsData = {
    labels: ['Promoters (9-10)', 'Passives (7-8)', 'Detractors (0-6)'],
    datasets: [
      {
        data: [50, 30, 20],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  // Chart Options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '6-Month Revenue Forecast Analysis',
        font: {
          size: 16,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += '$' + context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Month'
        },
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Revenue (USD)'
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Customer Acquisition Cost vs Lifetime Value',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += '$' + context.parsed.y.toLocaleString();
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Patient Segments'
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        title: {
          display: true,
          text: 'Amount (USD)'
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Net Promoter Score Distribution',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: ${value}%`;
          }
        }
      },
    },
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">📊 Interactive Business Analytics & KPIs</h2>
        
        {/* Revenue Forecast */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">💰 Revenue Forecast & Growth Projection</h3>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
            <p className="text-gray-700 text-lg">
              📈 Predictive analytics showing <span className="font-bold text-blue-600">8.0% monthly growth</span> rate 
              with 95% confidence interval based on current patient acquisition trends
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">$610K</div>
                <div className="text-sm text-gray-600">Current Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">$655K</div>
                <div className="text-sm text-gray-600">Next Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">8.0%</div>
                <div className="text-sm text-gray-600">Growth Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">95%</div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6" style={{ height: '400px' }}>
            <Line data={revenueData} options={lineChartOptions} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-xl font-bold text-blue-600">Q4 2025 Target</div>
              <div className="text-2xl font-bold text-gray-900">$2.1M</div>
              <div className="text-sm text-gray-600">Projected quarterly revenue</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-xl font-bold text-green-600">Patient Growth</div>
              <div className="text-2xl font-bold text-gray-900">+1,250</div>
              <div className="text-sm text-gray-600">New patients per month</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-xl font-bold text-purple-600">Market Share</div>
              <div className="text-2xl font-bold text-gray-900">12.3%</div>
              <div className="text-sm text-gray-600">Healthcare AI sector</div>
            </div>
          </div>
        </div>

        {/* CAC vs CLTV Analysis */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">📈 Customer Economics: CAC vs CLTV</h3>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
            <p className="text-gray-700 text-lg mb-4">
              💡 Customer Acquisition Cost vs Customer Lifetime Value analysis by patient segment. 
              <span className="font-bold text-green-600">Excellent CLTV:CAC ratios</span> across all segments.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-gray-900">Premium</div>
                <div className="text-sm text-gray-600">CAC: $150 | CLTV: $12,000</div>
                <div className="text-lg font-bold text-green-600">ROI: 80x</div>
                <div className="text-xs text-gray-500">High-value specialized care</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-gray-900">Regular</div>
                <div className="text-sm text-gray-600">CAC: $100 | CLTV: $3,000</div>
                <div className="text-lg font-bold text-green-600">ROI: 30x</div>
                <div className="text-xs text-gray-500">Standard healthcare services</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-gray-900">Occasional</div>
                <div className="text-sm text-gray-600">CAC: $80 | CLTV: $600</div>
                <div className="text-lg font-bold text-yellow-600">ROI: 7.5x</div>
                <div className="text-xs text-gray-500">Minimal engagement</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6" style={{ height: '400px' }}>
            <Bar data={cacCltvData} options={barChartOptions} />
          </div>
        </div>

        {/* NPS Score Analysis */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">⭐ Net Promoter Score (NPS) Analysis</h3>
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6">
            <p className="text-gray-700 text-lg">
              📊 Patient satisfaction and likelihood to recommend our healthcare platform. 
              <span className="font-bold text-green-600">NPS Score: +30</span> indicates good customer loyalty.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6" style={{ height: '350px' }}>
              <Doughnut data={npsData} options={doughnutOptions} />
            </div>
            <div className="flex flex-col justify-center space-y-6">
              <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Overall NPS Score</div>
                    <div className="text-5xl font-bold text-green-600">+30</div>
                    <div className="text-lg text-green-700 font-medium">Good Performance</div>
                  </div>
                  <div className="text-6xl">👍</div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  Industry Average: +15 | Our Target: +40
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-green-100 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-600 rounded-full mr-3"></div>
                    <span className="font-medium">Promoters (9-10)</span>
                  </div>
                  <span className="font-bold text-green-600">50% (5 patients)</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-100 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-600 rounded-full mr-3"></div>
                    <span className="font-medium">Passives (7-8)</span>
                  </div>
                  <span className="font-bold text-yellow-600">30% (3 patients)</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-100 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-600 rounded-full mr-3"></div>
                    <span className="font-medium">Detractors (0-6)</span>
                  </div>
                  <span className="font-bold text-red-600">20% (2 patients)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Business Insights */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">💡 Strategic Business Insights</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-purple-900">🎯 Strengths</h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-green-600 text-xl mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Efficient Customer Acquisition</div>
                    <div className="text-sm text-gray-600">CAC 33% below healthcare industry average ($150 vs $225)</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 text-xl mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Exceptional CLTV Ratios</div>
                    <div className="text-sm text-gray-600">Premium segment: 80x ROI, significantly above 3x benchmark</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 text-xl mr-3 mt-1">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Consistent Growth Trajectory</div>
                    <div className="text-sm text-gray-600">8% monthly growth sustained over 6 months</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-purple-900">🚀 Opportunities</h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-blue-600 text-xl mr-3 mt-1">📈</span>
                  <div>
                    <div className="font-semibold text-gray-900">Scale Premium Segment</div>
                    <div className="text-sm text-gray-600">80x ROI suggests potential for significant expansion</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 text-xl mr-3 mt-1">🎯</span>
                  <div>
                    <div className="font-semibold text-gray-900">Improve NPS to +40</div>
                    <div className="text-sm text-gray-600">Convert passives to promoters through enhanced UX</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 text-xl mr-3 mt-1">💰</span>
                  <div>
                    <div className="font-semibold text-gray-900">Market Share Growth</div>
                    <div className="text-sm text-gray-600">Current 12.3% in healthcare AI has room for expansion</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-white rounded-lg p-4">
            <h4 className="font-bold text-gray-900 mb-2">📊 Projected Impact (Next 12 Months)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-blue-600">$8.2M</div>
                <div className="text-xs text-gray-600">Annual Revenue</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">15,000</div>
                <div className="text-xs text-gray-600">New Patients</div>
              </div>
              <div>
                <div className="text-xl font-bold text-purple-600">18.5%</div>
                <div className="text-xs text-gray-600">Market Share</div>
              </div>
              <div>
                <div className="text-xl font-bold text-orange-600">+40</div>
                <div className="text-xs text-gray-600">Target NPS</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCharts;
