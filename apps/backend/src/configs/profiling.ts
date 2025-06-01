import Pyroscope from '@pyroscope/nodejs';

export function initializeProfiling() {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_PROFILING === 'true') {
    const pyroscopeServerAddress = process.env.PYROSCOPE_SERVER_ADDRESS;
    const pyroscopeAuthToken = process.env.PYROSCOPE_AUTH_TOKEN;
    const pyroscopeApplicationName = process.env.PYROSCOPE_APPLICATION_NAME || 'kanaliiga-backend';

    if (!pyroscopeServerAddress) {
      console.warn('PYROSCOPE_SERVER_ADDRESS not configured, skipping profiling initialization');
      return;
    }

    // Auth token is optional when using local Alloy
    const isLocalAlloy = pyroscopeServerAddress.includes('172.17.0.1') || pyroscopeServerAddress.includes('localhost');
    
    if (!pyroscopeAuthToken && !isLocalAlloy) {
      console.warn('PYROSCOPE_AUTH_TOKEN not configured for remote server, skipping profiling initialization');
      return;
    }

    try {
      const config = {
        serverAddress: pyroscopeServerAddress,
        appName: pyroscopeApplicationName,
        tags: {
          region: process.env.REGION || 'unknown',
          version: process.env.VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        },
        ...(pyroscopeAuthToken && { authToken: pyroscopeAuthToken }),
      };

      Pyroscope.init(config);

      // Start profiling
      Pyroscope.start();

      console.log(`✅ Profiling initialized for ${pyroscopeApplicationName} -> ${pyroscopeServerAddress}`);
    } catch (error) {
      console.error('❌ Failed to initialize profiling:', error);
    }
  } else {
    console.log('⚠️ Profiling disabled (production mode or ENABLE_PROFILING not set)');
  }
} 