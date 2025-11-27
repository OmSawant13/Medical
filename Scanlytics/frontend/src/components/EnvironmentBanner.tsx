import React from 'react';
import { isDemoMode, environmentService } from '../services/firebase';

const EnvironmentBanner: React.FC = () => {
  if (!isDemoMode) return null;

  const envInfo = environmentService.getInfo();

  return (
    <div className="bg-gradient-to-r from-blue-100 to-purple-100 border-l-4 border-blue-500 p-4 mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <span className="text-2xl">🔧</span>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-blue-900">
            Demo Mode Active
          </h3>
          <div className="text-sm text-blue-700 mt-1">
            <p>✅ All features fully functional without external dependencies</p>
            <p>💾 Feedback stored locally • 📊 Analytics tracked • 🚫 No Firebase connections</p>
            {envInfo.environment === 'development' && (
              <p className="text-xs text-blue-600 mt-1">
                Environment: {envInfo.environment} | No Firebase config required
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentBanner;
