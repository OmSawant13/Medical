import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface UploadedScan {
  scanId: string;
  patientName: string;
  patientId: string;
  scanType: string;
  fileName: string;
  uploadDate: string;
  fileSize: string;
  status: 'uploaded' | 'processing' | 'analysis_complete' | 'doctor_reviewed';
  aiResults?: {
    confidence: number;
    findings: string[];
    recommendations: string[];
  };
}

interface SystemMetrics {
  totalScans: number;
  processingQueue: number;
  averageProcessingTime: string;
  systemUptime: string;
  aiAccuracy: number;
}

interface ReportData {
  dailyScanCount: number[];
  scanTypeDistribution: { [key: string]: number };
  aiAccuracyTrend: number[];
  processingTimes: number[];
  doctorReviewTimes: number[];
}

const HospitalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<any>(null);
  const [uploadedScans, setUploadedScans] = useState<UploadedScan[]>([]);
  const [systemMetrics] = useState<SystemMetrics>({
    totalScans: 247,
    processingQueue: 3,
    averageProcessingTime: '2.3 min',
    systemUptime: '99.8%',
    aiAccuracy: 94.7
  });
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [reportData] = useState<ReportData>({
    dailyScanCount: [12, 15, 8, 22, 18, 25, 19],
    scanTypeDistribution: {
      'Chest X-Ray': 45,
      'Brain MRI': 28,
      'CT Scan': 32,
      'Bone X-Ray': 21,
      'Ultrasound': 15
    },
    aiAccuracyTrend: [92.1, 93.4, 94.7, 93.9, 95.2, 94.7, 96.1],
    processingTimes: [120, 180, 95, 145, 210, 167, 134],
    doctorReviewTimes: [15, 22, 18, 31, 12, 25, 19]
  });

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login?role=hospital');
    }

    loadDemoData();
  }, [navigate]);

  const loadDemoData = () => {
    setUploadedScans([
      {
        scanId: 'S001',
        patientName: 'John Smith',
        patientId: 'P001',
        scanType: 'Chest X-Ray',
        fileName: 'chest_xray_001.jpg',
        uploadDate: '2024-10-05 09:15:00',
        fileSize: '2.4 MB',
        status: 'analysis_complete',
        aiResults: {
          confidence: 0.94,
          findings: ['Normal lung fields', 'No acute abnormalities'],
          recommendations: ['Continue routine care', 'Follow-up in 12 months']
        }
      },
      {
        scanId: 'S002',
        patientName: 'Maria Garcia',
        patientId: 'P002',
        scanType: 'Brain MRI',
        fileName: 'brain_mri_002.dcm',
        uploadDate: '2024-10-05 10:22:00',
        fileSize: '15.7 MB',
        status: 'doctor_reviewed',
        aiResults: {
          confidence: 0.87,
          findings: ['Possible small lesion detected', 'Requires further evaluation'],
          recommendations: ['Neurologist consultation', 'Additional imaging with contrast']
        }
      },
      {
        scanId: 'S003',
        patientName: 'Robert Johnson',
        patientId: 'P003',
        scanType: 'Bone X-Ray',
        fileName: 'bone_xray_003.jpg',
        uploadDate: '2024-10-05 11:45:00',
        fileSize: '3.1 MB',
        status: 'processing'
      },
      {
        scanId: 'S004',
        patientName: 'Alice Brown',
        patientId: 'P004',
        scanType: 'CT Scan',
        fileName: 'ct_scan_004.dcm',
        uploadDate: '2024-10-05 12:10:00',
        fileSize: '28.9 MB',
        status: 'uploaded'
      }
    ]);
  };

  // Working button functions
  const exportAnalytics = () => {
    const analyticsData = {
      exportDate: new Date().toISOString(),
      totalScans: uploadedScans.length,
      scansByStatus: {
        uploaded: uploadedScans.filter(s => s.status === 'uploaded').length,
        processing: uploadedScans.filter(s => s.status === 'processing').length,
        analysis_complete: uploadedScans.filter(s => s.status === 'analysis_complete').length,
        doctor_reviewed: uploadedScans.filter(s => s.status === 'doctor_reviewed').length
      },
      scansByType: reportData.scanTypeDistribution,
      systemMetrics: systemMetrics
    };

    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hospital_analytics_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ Analytics exported successfully!');
  };

  const downloadAllReports = () => {
    const reportsData = uploadedScans
      .filter(scan => scan.aiResults)
      .map(scan => ({
        scanId: scan.scanId,
        patientName: scan.patientName,
        patientId: scan.patientId,
        scanType: scan.scanType,
        uploadDate: scan.uploadDate,
        status: scan.status,
        aiResults: scan.aiResults
      }));

    const blob = new Blob([JSON.stringify(reportsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_medical_reports_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ All reports downloaded successfully!');
  };

  const archiveOldScans = () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days old
    
    const archivedScans = uploadedScans.filter(scan => 
      new Date(scan.uploadDate) < cutoffDate && scan.status === 'doctor_reviewed'
    );
    
    if (archivedScans.length > 0) {
      setUploadedScans(prev => 
        prev.filter(scan => !archivedScans.includes(scan))
      );
      alert(`✅ Archived ${archivedScans.length} old scans successfully!`);
    } else {
      alert('ℹ️ No scans older than 30 days found for archiving.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/dicom', '.dcm'];
    const fileExtension = file.name.toLowerCase();
    const isValidType = allowedTypes.some(type => 
      file.type === type || fileExtension.endsWith('.dcm') || fileExtension.endsWith('.jpg') || fileExtension.endsWith('.png')
    );

    if (!isValidType) {
      alert('Please upload a valid medical image file (JPEG, PNG, or DICOM)');
      return;
    }

    // Simulate upload process
    setIsUploading(true);
    setUploadProgress(0);

    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          setIsUploading(false);
          
          // Add to uploads list
          const newScan: UploadedScan = {
            scanId: `S${Date.now()}`,
            patientName: 'New Patient',
            patientId: `P${Math.floor(Math.random() * 1000)}`,
            scanType: 'Unknown',
            fileName: file.name,
            uploadDate: new Date().toLocaleString(),
            fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            status: 'uploaded'
          };

          setUploadedScans(prev => [newScan, ...prev]);
          
          // Simulate AI processing after 2 seconds
          setTimeout(() => {
            setUploadedScans(prev => 
              prev.map(scan => 
                scan.scanId === newScan.scanId 
                  ? { ...scan, status: 'processing' }
                  : scan
              )
            );
            
            // Simulate completion after 5 more seconds
            setTimeout(() => {
              setUploadedScans(prev => 
                prev.map(scan => 
                  scan.scanId === newScan.scanId 
                    ? { 
                        ...scan, 
                        status: 'analysis_complete',
                        scanType: 'Chest X-Ray',
                        aiResults: {
                          confidence: 0.91,
                          findings: ['Normal chest structure', 'No abnormalities detected'],
                          recommendations: ['Routine follow-up', 'Patient can be discharged']
                        }
                      }
                    : scan
                )
              );
            }, 5000);
          }, 2000);

          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'analysis_complete': return 'bg-green-100 text-green-800';
      case 'doctor_reviewed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded': return '📤';
      case 'processing': return '⚙️';
      case 'analysis_complete': return '✅';
      case 'doctor_reviewed': return '👨‍⚕️';
      default: return '❓';
    }
  };

  const downloadReport = (scan: UploadedScan) => {
    const reportData = {
      scanId: scan.scanId,
      patientName: scan.patientName,
      patientId: scan.patientId,
      scanType: scan.scanType,
      uploadDate: scan.uploadDate,
      aiResults: scan.aiResults,
      reportGenerated: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical_report_${scan.scanId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`✅ Report for ${scan.patientName} downloaded successfully!`);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Metrics */}
      <div className="grid md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="text-3xl text-blue-500 mr-4">📊</div>
            <div>
              <p className="text-sm text-gray-600">Total Scans</p>
              <p className="text-2xl font-bold text-gray-900">{systemMetrics.totalScans}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="text-3xl text-yellow-500 mr-4">⚙️</div>
            <div>
              <p className="text-sm text-gray-600">Processing Queue</p>
              <p className="text-2xl font-bold text-gray-900">{systemMetrics.processingQueue}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="text-3xl text-green-500 mr-4">⏱️</div>
            <div>
              <p className="text-sm text-gray-600">Avg Processing</p>
              <p className="text-2xl font-bold text-gray-900">{systemMetrics.averageProcessingTime}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="text-3xl text-purple-500 mr-4">🔄</div>
            <div>
              <p className="text-sm text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900">{systemMetrics.systemUptime}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="text-3xl text-red-500 mr-4">🤖</div>
            <div>
              <p className="text-sm text-gray-600">AI Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">{systemMetrics.aiAccuracy}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📤 Upload Medical Scans</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🏥</div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload Medical Images</h4>
          <p className="text-gray-600 mb-4">Support for DICOM, JPEG, and PNG files up to 50MB</p>
          
          {isUploading ? (
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-blue-600 font-semibold">Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold mr-4"
              >
                📂 Select Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.dcm,.dicom"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="text-sm text-gray-500">
                Drag & drop files here or click to browse
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Uploads</h3>
        <div className="space-y-4">
          {uploadedScans.slice(0, 5).map(scan => (
            <div key={scan.scanId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="text-2xl mr-4">{getStatusIcon(scan.status)}</div>
                <div>
                  <h4 className="font-semibold text-gray-900">{scan.fileName}</h4>
                  <p className="text-sm text-gray-600">
                    {scan.patientName} ({scan.patientId}) - {scan.scanType}
                  </p>
                  <p className="text-sm text-gray-600">
                    {scan.fileSize} • {new Date(scan.uploadDate).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(scan.status)}`}>
                  {scan.status.replace('_', ' ')}
                </span>
                {scan.status === 'processing' && (
                  <div className="mt-2">
                    <div className="animate-spin inline-block w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUploadHistory = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Upload History & Analytics</h3>
          <div className="flex space-x-2">
            <button 
              onClick={exportAnalytics}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              📊 Export Analytics
            </button>
            <button 
              onClick={downloadAllReports}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              📥 Download All Reports
            </button>
          </div>
        </div>
        
        {/* Upload History Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Scan ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Patient</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Upload Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">AI Results</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {uploadedScans.map(scan => (
                <tr key={scan.scanId} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{scan.scanId}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {scan.patientName}<br/>
                    <span className="text-xs text-gray-500">{scan.patientId}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{scan.scanType}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {new Date(scan.uploadDate).toLocaleDateString()}<br/>
                    <span className="text-xs text-gray-500">
                      {new Date(scan.uploadDate).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(scan.status)}`}>
                      {getStatusIcon(scan.status)} {scan.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {scan.aiResults ? (
                      <div>
                        <div className="font-medium">
                          Confidence: {(scan.aiResults.confidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {scan.aiResults.findings.length} findings
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex space-x-2">
                      {scan.aiResults && (
                        <button 
                          onClick={() => downloadReport(scan)}
                          className="text-green-600 hover:text-green-800 text-sm bg-green-100 px-2 py-1 rounded"
                          title="Download Report"
                        >
                          📥 Download
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSystemManagement = () => (
    <div className="space-y-6">
      {/* System Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🔧 System Management</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">AI Service Status</h4>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-green-600 font-semibold">Online</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Processing queue: {systemMetrics.processingQueue} scans</p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Database Status</h4>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-green-600 font-semibold">Connected</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Response time: 23ms</p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Storage</h4>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-yellow-600 font-semibold">78% Used</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">1.2TB / 1.5TB capacity</p>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🔄 Bulk Operations</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">System Maintenance</h4>
            <p className="text-gray-600 mb-4">Perform maintenance operations on the system</p>
            <div className="space-y-3">
              <button 
                onClick={downloadAllReports}
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
              >
                📥 Download All Reports
              </button>
              <button 
                onClick={exportAnalytics}
                className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600"
              >
                📊 Generate Analytics Report
              </button>
              <button 
                onClick={archiveOldScans}
                className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
              >
                🗑️ Archive Old Scans
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Today's Statistics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{uploadedScans.length}</div>
                <div className="text-sm text-gray-600">Total Scans</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {uploadedScans.filter(s => s.status === 'doctor_reviewed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {uploadedScans.filter(s => s.status === 'processing').length}
                </div>
                <div className="text-sm text-gray-600">Processing</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {uploadedScans.filter(s => s.status === 'analysis_complete').length}
                </div>
                <div className="text-sm text-gray-600">Pending Review</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => {
    const totalConsultations = reportData.dailyScanCount.reduce((a, b) => a + b, 0);
    const avgScanCount = (totalConsultations / reportData.dailyScanCount.length).toFixed(1);
    const avgAccuracy = (reportData.aiAccuracyTrend.reduce((a, b) => a + b, 0) / reportData.aiAccuracyTrend.length).toFixed(1);
    const avgProcessingTime = (reportData.processingTimes.reduce((a, b) => a + b, 0) / reportData.processingTimes.length).toFixed(0);

    const exportDetailedReport = () => {
      const detailedReport = {
        hospitalName: 'Healthcare AI Platform',
        reportDate: new Date().toISOString(),
        period: 'Last 7 days',
        summary: {
          totalScans: uploadedScans.length,
          avgDailyScans: avgScanCount,
          systemUptime: systemMetrics.systemUptime,
          aiAccuracy: avgAccuracy,
          avgProcessingTime: `${avgProcessingTime}s`,
          scansByStatus: {
            uploaded: uploadedScans.filter(s => s.status === 'uploaded').length,
            processing: uploadedScans.filter(s => s.status === 'processing').length,
            analysis_complete: uploadedScans.filter(s => s.status === 'analysis_complete').length,
            doctor_reviewed: uploadedScans.filter(s => s.status === 'doctor_reviewed').length
          }
        },
        dailyMetrics: {
          scanCounts: reportData.dailyScanCount,
          aiAccuracy: reportData.aiAccuracyTrend,
          processingTimes: reportData.processingTimes,
          doctorReviewTimes: reportData.doctorReviewTimes
        },
        scanTypeDistribution: reportData.scanTypeDistribution,
        systemMetrics: systemMetrics
      };

      const blob = new Blob([JSON.stringify(detailedReport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hospital_detailed_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('✅ Detailed hospital report exported successfully!');
    };

    return (
      <div className="space-y-6">
        {/* Performance Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">📊 Hospital Analytics & Reports</h3>
            <button 
              onClick={exportDetailedReport}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              📥 Export Complete Report
            </button>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg">
              <h4 className="text-lg font-semibold mb-2">Daily Scans Average</h4>
              <p className="text-3xl font-bold">{avgScanCount}</p>
              <p className="text-sm opacity-80">scans per day</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg">
              <h4 className="text-lg font-semibold mb-2">AI Accuracy</h4>
              <p className="text-3xl font-bold">{avgAccuracy}%</p>
              <p className="text-sm opacity-80">average accuracy</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg">
              <h4 className="text-lg font-semibold mb-2">Processing Time</h4>
              <p className="text-3xl font-bold">{avgProcessingTime}s</p>
              <p className="text-sm opacity-80">average time</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg">
              <h4 className="text-lg font-semibold mb-2">System Uptime</h4>
              <p className="text-3xl font-bold">{systemMetrics.systemUptime}</p>
              <p className="text-sm opacity-80">availability</p>
            </div>
          </div>

          {/* Charts and Analytics */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Scan Type Distribution */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">📈 Scan Type Distribution</h4>
              <div className="space-y-3">
                {Object.entries(reportData.scanTypeDistribution).map(([type, count]) => {
                  const total = Object.values(reportData.scanTypeDistribution).reduce((a, b) => a + b, 0);
                  const percentage = ((count / total) * 100).toFixed(1);
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-gray-700">{type}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-16">{count} ({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Accuracy Trend */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 AI Accuracy Trend (Last 7 Days)</h4>
              <div className="space-y-3">
                {reportData.aiAccuracyTrend.map((accuracy, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">Day {index + 1}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${accuracy}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12">{accuracy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Processing Times Analysis */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">⏱️ Processing Time Analysis</h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {Math.min(...reportData.processingTimes)}s
                </p>
                <p className="text-sm text-gray-600">Fastest Processing</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {avgProcessingTime}s
                </p>
                <p className="text-sm text-gray-600">Average Processing</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {Math.max(...reportData.processingTimes)}s
                </p>
                <p className="text-sm text-gray-600">Slowest Processing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Reports */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Detailed Reports</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Generate Custom Reports</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Weekly Summary</option>
                    <option>Monthly Analysis</option>
                    <option>AI Performance Report</option>
                    <option>System Usage Report</option>
                    <option>Financial Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <div className="flex space-x-2">
                    <input type="date" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" />
                    <input type="date" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <button 
                  onClick={() => alert('📊 Custom report generated successfully!')}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                >
                  📊 Generate Report
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Quick Actions</h4>
              <div className="space-y-3">
                <button 
                  onClick={exportAnalytics}
                  className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 text-left pl-4"
                >
                  📥 Export System Analytics
                </button>
                <button 
                  onClick={downloadAllReports}
                  className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 text-left pl-4"
                >
                  📋 Download All Patient Reports
                </button>
                <button 
                  onClick={() => alert('📊 Performance metrics exported!')}
                  className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 text-left pl-4"
                >
                  📈 Export Performance Metrics
                </button>
                <button 
                  onClick={() => alert('🔧 System health report generated!')}
                  className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 text-left pl-4"
                >
                  �� System Health Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600 mr-8">
                🏥 Healthcare AI
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Hospital Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  H
                </div>
                <span className="text-gray-700">{user.name}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'history', label: 'Upload History', icon: '📋' },
              { id: 'system', label: 'System Management', icon: '🔧' },
              { id: 'reports', label: 'Reports', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'history' && renderUploadHistory()}
          {activeTab === 'system' && renderSystemManagement()}
          {activeTab === 'reports' && renderReports()}
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
