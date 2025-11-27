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
    <div className="space-y-8">
      {/* System Metrics */}
      <div className="grid md:grid-cols-5 gap-6">
        <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-6 border border-gray-100 hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.08)] transition-all">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-[12px] bg-blue-50 flex items-center justify-center text-2xl mr-4">📊</div>
            <div>
              <p className="text-sm font-medium text-[#7a7a7a]">Total Scans</p>
              <p className="text-[24px] font-bold text-[#0a0b10] tracking-[-0.5px]">{systemMetrics.totalScans}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-6 border border-gray-100 hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.08)] transition-all">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-[12px] bg-yellow-50 flex items-center justify-center text-2xl mr-4">⚙️</div>
            <div>
              <p className="text-sm font-medium text-[#7a7a7a]">Queue</p>
              <p className="text-[24px] font-bold text-[#0a0b10] tracking-[-0.5px]">{systemMetrics.processingQueue}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-6 border border-gray-100 hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.08)] transition-all">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-[12px] bg-green-50 flex items-center justify-center text-2xl mr-4">⏱️</div>
            <div>
              <p className="text-sm font-medium text-[#7a7a7a]">Avg Time</p>
              <p className="text-[24px] font-bold text-[#0a0b10] tracking-[-0.5px]">{systemMetrics.averageProcessingTime}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-6 border border-gray-100 hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.08)] transition-all">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-[12px] bg-purple-50 flex items-center justify-center text-2xl mr-4">🔄</div>
            <div>
              <p className="text-sm font-medium text-[#7a7a7a]">Uptime</p>
              <p className="text-[24px] font-bold text-[#0a0b10] tracking-[-0.5px]">{systemMetrics.systemUptime}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-6 border border-gray-100 hover:shadow-[0_7px_21px_0_rgba(27,68,254,0.08)] transition-all">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-[12px] bg-red-50 flex items-center justify-center text-2xl mr-4">🤖</div>
            <div>
              <p className="text-sm font-medium text-[#7a7a7a]">AI Accuracy</p>
              <p className="text-[24px] font-bold text-[#0a0b10] tracking-[-0.5px]">{systemMetrics.aiAccuracy}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px] mb-6">📤 Upload Medical Scans</h3>
        <div className="border-2 border-dashed border-gray-200 rounded-[20px] p-12 text-center hover:border-[#1B44FE] transition-colors bg-[#f8f9fa]">
          <div className="text-6xl mb-6">🏥</div>
          <h4 className="text-[20px] font-semibold text-[#0a0b10] mb-3">Upload Medical Images</h4>
          <p className="text-[#7a7a7a] mb-8 max-w-md mx-auto">Support for DICOM, JPEG, and PNG files up to 50MB. Securely encrypted and HIPAA compliant.</p>

          {isUploading ? (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#1B44FE] h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-[#1B44FE] font-semibold text-sm">Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3.5 rounded-[12px] text-sm font-semibold text-white shadow-[0_4px_12px_0_rgba(27,68,254,0.2)] hover:shadow-[0_6px_16px_0_rgba(27,68,254,0.3)] transition-all mr-4"
                style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
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
              <span className="text-sm text-[#7a7a7a] block mt-4">
                Drag & drop files here or click to browse
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px] mb-6">Recent Uploads</h3>
        <div className="space-y-4">
          {uploadedScans.slice(0, 5).map(scan => (
            <div key={scan.scanId} className="flex items-center justify-between p-6 bg-[#f8f9fa] rounded-[16px] border border-gray-100 hover:border-gray-200 transition-all">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-[12px] bg-white border border-gray-100 flex items-center justify-center text-2xl mr-4 shadow-sm">
                  {getStatusIcon(scan.status)}
                </div>
                <div>
                  <h4 className="font-semibold text-[#0a0b10] text-[16px]">{scan.fileName}</h4>
                  <p className="text-sm text-[#7a7a7a] mt-1">
                    {scan.patientName} <span className="text-gray-300 mx-2">|</span> {scan.patientId} <span className="text-gray-300 mx-2">|</span> {scan.scanType}
                  </p>
                  <p className="text-xs text-[#7a7a7a] mt-1 opacity-70">
                    {scan.fileSize} • {new Date(scan.uploadDate).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(scan.status)}`}>
                  {scan.status.replace('_', ' ')}
                </span>
                {scan.status === 'processing' && (
                  <div className="mt-2 flex justify-end">
                    <div className="animate-spin w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
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
    <div className="space-y-8">
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px]">Upload History & Analytics</h3>
          <div className="flex space-x-3">
            <button
              onClick={exportAnalytics}
              className="px-5 py-2.5 rounded-[12px] text-sm font-medium text-[#0a0b10] bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center"
            >
              <span className="mr-2">📊</span> Export Analytics
            </button>
            <button
              onClick={downloadAllReports}
              className="px-5 py-2.5 rounded-[12px] text-sm font-semibold text-white shadow-[0_4px_12px_0_rgba(27,68,254,0.2)] hover:shadow-[0_6px_16px_0_rgba(27,68,254,0.3)] transition-all flex items-center"
              style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
            >
              <span className="mr-2">📥</span> Download All Reports
            </button>
          </div>
        </div>

        {/* Upload History Table */}
        <div className="overflow-x-auto rounded-[16px] border border-gray-100">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#7a7a7a] uppercase tracking-wider">Scan ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#7a7a7a] uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#7a7a7a] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#7a7a7a] uppercase tracking-wider">Upload Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#7a7a7a] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#7a7a7a] uppercase tracking-wider">AI Results</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#7a7a7a] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {uploadedScans.map(scan => (
                <tr key={scan.scanId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[#0a0b10]">{scan.scanId}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-[#0a0b10]">{scan.patientName}</div>
                    <div className="text-xs text-[#7a7a7a] mt-0.5">{scan.patientId}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#0a0b10]">{scan.scanType}</td>
                  <td className="px-6 py-4 text-sm text-[#7a7a7a]">
                    <div>{new Date(scan.uploadDate).toLocaleDateString()}</div>
                    <div className="text-xs opacity-70 mt-0.5">
                      {new Date(scan.uploadDate).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(scan.status)}`}>
                      <span className="mr-1.5">{getStatusIcon(scan.status)}</span>
                      {scan.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {scan.aiResults ? (
                      <div>
                        <div className="font-medium text-[#0a0b10]">
                          Confidence: {(scan.aiResults.confidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-[#7a7a7a] mt-0.5">
                          {scan.aiResults.findings.length} findings
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#7a7a7a] italic">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {scan.aiResults && (
                        <button
                          onClick={() => downloadReport(scan)}
                          className="text-[#1B44FE] hover:text-blue-700 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-[8px] transition-colors"
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
    <div className="space-y-8">
      {/* System Status */}
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px] mb-6">🔧 System Management</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border border-gray-100 rounded-[16px] p-6 bg-[#f8f9fa] hover:border-gray-200 transition-all">
            <h4 className="font-semibold text-[#0a0b10] mb-3 text-[16px]">AI Service Status</h4>
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
              <span className="text-green-600 font-semibold text-sm">Online</span>
            </div>
            <p className="text-sm text-[#7a7a7a]">Processing queue: {systemMetrics.processingQueue} scans</p>
          </div>

          <div className="border border-gray-100 rounded-[16px] p-6 bg-[#f8f9fa] hover:border-gray-200 transition-all">
            <h4 className="font-semibold text-[#0a0b10] mb-3 text-[16px]">Database Status</h4>
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
              <span className="text-green-600 font-semibold text-sm">Connected</span>
            </div>
            <p className="text-sm text-[#7a7a7a]">Response time: 23ms</p>
          </div>

          <div className="border border-gray-100 rounded-[16px] p-6 bg-[#f8f9fa] hover:border-gray-200 transition-all">
            <h4 className="font-semibold text-[#0a0b10] mb-3 text-[16px]">Storage</h4>
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2 shadow-[0_0_8px_rgba(234,179,8,0.4)]"></div>
              <span className="text-yellow-600 font-semibold text-sm">78% Used</span>
            </div>
            <p className="text-sm text-[#7a7a7a]">1.2TB / 1.5TB capacity</p>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
        <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px] mb-6">🔄 Bulk Operations</h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-[#0a0b10] mb-2 text-[16px]">System Maintenance</h4>
            <p className="text-[#7a7a7a] mb-6 text-sm">Perform maintenance operations on the system</p>
            <div className="space-y-3">
              <button
                onClick={downloadAllReports}
                className="w-full bg-[#f8f9fa] border border-gray-200 text-[#0a0b10] py-3 px-4 rounded-[12px] hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all text-left font-medium flex items-center"
              >
                <span className="mr-3 text-lg">📥</span> Download All Reports
              </button>
              <button
                onClick={exportAnalytics}
                className="w-full bg-[#f8f9fa] border border-gray-200 text-[#0a0b10] py-3 px-4 rounded-[12px] hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all text-left font-medium flex items-center"
              >
                <span className="mr-3 text-lg">📊</span> Generate Analytics Report
              </button>
              <button
                onClick={archiveOldScans}
                className="w-full bg-[#f8f9fa] border border-gray-200 text-[#0a0b10] py-3 px-4 rounded-[12px] hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all text-left font-medium flex items-center"
              >
                <span className="mr-3 text-lg">🗑️</span> Archive Old Scans
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[#0a0b10] mb-4 text-[16px]">Today's Statistics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-5 bg-blue-50 rounded-[16px] border border-blue-100">
                <div className="text-3xl font-bold text-blue-600 mb-1">{uploadedScans.length}</div>
                <div className="text-sm text-blue-700 font-medium">Total Scans</div>
              </div>
              <div className="text-center p-5 bg-green-50 rounded-[16px] border border-green-100">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {uploadedScans.filter(s => s.status === 'doctor_reviewed').length}
                </div>
                <div className="text-sm text-green-700 font-medium">Completed</div>
              </div>
              <div className="text-center p-5 bg-yellow-50 rounded-[16px] border border-yellow-100">
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {uploadedScans.filter(s => s.status === 'processing').length}
                </div>
                <div className="text-sm text-yellow-700 font-medium">Processing</div>
              </div>
              <div className="text-center p-5 bg-purple-50 rounded-[16px] border border-purple-100">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {uploadedScans.filter(s => s.status === 'analysis_complete').length}
                </div>
                <div className="text-sm text-purple-700 font-medium">Pending Review</div>
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
      <div className="space-y-8">
        {/* Performance Overview */}
        <div className="bg-white rounded-[20px] shadow-[0_7px_21px_0_rgba(27,68,254,0.03)] p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[24px] font-semibold text-[#0a0b10] tracking-[-0.8px]">📊 Hospital Analytics & Reports</h3>
            <button
              onClick={exportDetailedReport}
              className="px-5 py-2.5 rounded-[12px] text-sm font-semibold text-white shadow-[0_4px_12px_0_rgba(27,68,254,0.2)] hover:shadow-[0_6px_16px_0_rgba(27,68,254,0.3)] transition-all flex items-center"
              style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}
            >
              <span className="mr-2">📥</span> Export Complete Report
            </button>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-[20px] shadow-lg">
              <h4 className="text-lg font-semibold mb-2 opacity-90">Daily Scans Average</h4>
              <p className="text-4xl font-bold mb-1">{avgScanCount}</p>
              <p className="text-sm opacity-80">scans per day</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-[20px] shadow-lg">
              <h4 className="text-lg font-semibold mb-2 opacity-90">AI Accuracy</h4>
              <p className="text-4xl font-bold mb-1">{avgAccuracy}%</p>
              <p className="text-sm opacity-80">average accuracy</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-[20px] shadow-lg">
              <h4 className="text-lg font-semibold mb-2 opacity-90">Processing Time</h4>
              <p className="text-4xl font-bold mb-1">{avgProcessingTime}s</p>
              <p className="text-sm opacity-80">average time</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-[20px] shadow-lg">
              <h4 className="text-lg font-semibold mb-2 opacity-90">System Uptime</h4>
              <p className="text-4xl font-bold mb-1">{systemMetrics.systemUptime}</p>
              <p className="text-sm opacity-80">availability</p>
            </div>
          </div>

          {/* Charts and Analytics */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Scan Type Distribution */}
            <div className="bg-[#f8f9fa] rounded-[20px] p-8 border border-gray-100">
              <h4 className="text-[18px] font-semibold text-[#0a0b10] mb-6">📈 Scan Type Distribution</h4>
              <div className="space-y-4">
                {Object.entries(reportData.scanTypeDistribution).map(([type, count]) => {
                  const total = Object.values(reportData.scanTypeDistribution).reduce((a, b) => a + b, 0);
                  const percentage = ((count / total) * 100).toFixed(1);
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-[#0a0b10] font-medium text-sm">{type}</span>
                      <div className="flex items-center space-x-4 flex-1 mx-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-[#1B44FE] h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-[#7a7a7a] w-20 text-right font-medium">{count} ({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Accuracy Trend */}
            <div className="bg-[#f8f9fa] rounded-[20px] p-8 border border-gray-100">
              <h4 className="text-[18px] font-semibold text-[#0a0b10] mb-6">📊 AI Accuracy Trend (Last 7 Days)</h4>
              <div className="space-y-4">
                {reportData.aiAccuracyTrend.map((accuracy, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-[#0a0b10] font-medium text-sm w-16">Day {index + 1}</span>
                    <div className="flex items-center space-x-4 flex-1 ml-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${accuracy}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-[#7a7a7a] w-12 text-right font-medium">{accuracy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Processing Times Analysis */}
          <div className="mt-8 bg-[#f8f9fa] rounded-[20px] p-8 border border-gray-100">
            <h4 className="text-[18px] font-semibold text-[#0a0b10] mb-6">⏱️ Processing Time Analysis</h4>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-4 bg-white rounded-[16px] border border-gray-100 shadow-sm">
                <p className="text-3xl font-bold text-[#1B44FE] mb-1">
                  {Math.min(...reportData.processingTimes)}s
                </p>
                <p className="text-sm text-[#7a7a7a] font-medium">Fastest Processing</p>
              </div>
              <div className="text-center p-4 bg-white rounded-[16px] border border-gray-100 shadow-sm">
                <p className="text-3xl font-bold text-green-600 mb-1">
                  {avgProcessingTime}s
                </p>
                <p className="text-sm text-[#7a7a7a] font-medium">Average Processing</p>
              </div>
              <div className="text-center p-4 bg-white rounded-[16px] border border-gray-100 shadow-sm">
                <p className="text-3xl font-bold text-orange-500 mb-1">
                  {Math.max(...reportData.processingTimes)}s
                </p>
                <p className="text-sm text-[#7a7a7a] font-medium">Slowest Processing</p>
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



  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] font-Inter">
      {/* Header */}
      <header className="bg-white shadow-[0_4px_20px_0_rgba(0,0,0,0.02)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="flex w-[32px] h-[32px] items-center justify-center shrink-0 flex-nowrap relative rounded-[8px]" style={{ background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 256 256"
                  className="h-5 w-5 fill-white"
                >
                  <path d="M213.85,125.46l-112,120a8,8,0,0,1-13.69-7l14.66-73.33L45.19,143.49a8,8,0,0,1-3-13l112-120a8,8,0,0,1,13.69,7L153.18,90.9l57.63,21.61a8,8,0,0,1,3,12.95Z" />
                </svg>
              </div>
              <Link to="/" className="text-[20px] font-semibold text-[#0a0b10] tracking-[-0.8px]">
                Scanlytics
              </Link>
              <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
              <h1 className="text-[16px] font-medium text-[#7a7a7a]">Hospital Portal</h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 pl-6 border-l border-gray-100">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold shadow-sm bg-blue-500">
                  HP
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#0a0b10] leading-tight">{user?.name || 'Hospital Admin'}</span>
                  <span className="text-xs text-[#7a7a7a]">Administrator</span>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('userData');
                  localStorage.removeItem('userRole');
                  navigate('/');
                }}
                className="text-[#7a7a7a] hover:text-[#FF4D4D] text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8 overflow-x-auto">
          <nav className="flex space-x-2 p-1 bg-white rounded-[16px] shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'history', label: 'Upload History', icon: '📁' },
              { id: 'system', label: 'System Management', icon: '⚙️' },
              { id: 'reports', label: 'Reports', icon: '📋' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-5 py-2.5 rounded-[12px] text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                  ? 'text-white shadow-md'
                  : 'text-[#7a7a7a] hover:bg-gray-50 hover:text-[#0a0b10]'
                  }`}
                style={activeTab === tab.id ? { background: 'radial-gradient(50% 50%, rgb(27, 68, 254) 51.654%, rgb(83, 117, 254) 100%)' } : {}}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="transition-all duration-300 ease-in-out">
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
