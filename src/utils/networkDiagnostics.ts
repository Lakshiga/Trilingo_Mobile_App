import { API_BASE_URL, FALLBACK_URLS } from '../config/apiConfig';
import axios from 'axios';

export class NetworkDiagnostics {
  /**
   * Test basic connectivity to the backend
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Testing connection to: ${API_BASE_URL}`);
      
      // Test the auth endpoint with invalid credentials (should return 401 if server is running)
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { identifier: 'test', password: 'test' },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      return {
        success: true,
        message: `Connection successful! Status: ${response.status}`,
      };
    } catch (error: any) {
      console.error('Connection test failed:', error);
      
      // If we get a 401, that's actually success - it means the server is running
      if (error.response && error.response.status === 401) {
        return {
          success: true,
          message: 'Connection successful! Server is running (401 = expected for invalid credentials)',
        };
      }
      
      // Try fallback URLs
      console.log('Trying fallback URLs...');
      for (const url of FALLBACK_URLS) {
        if (url === API_BASE_URL) continue; // Skip the one we already tried
        
        try {
          console.log(`Testing fallback URL: ${url}`);
          const response = await axios.post(
            `${url}/auth/login`,
            { identifier: 'test', password: 'test' },
            {
              timeout: 3000,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          
          return {
            success: true,
            message: `Fallback URL works! Use: ${url} (Status: ${response.status})`,
          };
        } catch (fallbackError: any) {
          if (fallbackError.response && fallbackError.response.status === 401) {
            return {
              success: true,
              message: `Fallback URL works! Use: ${url} (401 = expected for invalid credentials)`,
            };
          }
          console.log(`Fallback ${url} failed:`, fallbackError.message);
        }
      }
      
      let errorMessage = 'Connection failed - all URLs tested';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Backend server is not running or not accessible. Try: http://10.0.2.2:5166/api for Android emulator';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Backend server URL not found. Try updating your IP address in apiConfig.ts';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Connection timeout. Check if backend is running and firewall allows connection';
      } else if (error.response) {
        errorMessage = `Server responded with error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Check network and backend status';
      } else {
        errorMessage = error.message || 'Unknown network error';
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Test authentication endpoint specifically
   */
  static async testAuthEndpoint(): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Testing auth endpoint: ${API_BASE_URL}/auth/login`);
      
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { identifier: 'test', password: 'test' },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      return {
        success: true,
        message: `Auth endpoint accessible! Status: ${response.status}`,
      };
    } catch (error: any) {
      console.error('Auth endpoint test failed:', error);
      
      // For auth, we expect 401 or 400 errors even when the endpoint is working
      if (error.response && (error.response.status === 401 || error.response.status === 400)) {
        return {
          success: true,
          message: 'Auth endpoint is working (expected authentication error)',
        };
      }
      
      return {
        success: false,
        message: `Auth endpoint error: ${error.message || 'Unknown error'}`,
      };
    }
  }

  /**
   * Get current network configuration info
   */
  static getNetworkInfo(): string {
    return `
=== Network Configuration ===
API Base URL: ${API_BASE_URL}
Platform: ${typeof window !== 'undefined' ? 'Web' : 'React Native'}

=== Troubleshooting Steps ===
1. Make sure backend is running on the configured URL
2. Check if backend allows CORS requests from mobile apps
3. Verify firewall is not blocking the connection
4. For physical devices, use your computer's IP address
5. For Android emulator, use: http://10.0.2.2:5166/api
6. For iOS simulator, use: http://localhost:5166/api
7. Override the URL by setting EXPO_PUBLIC_API_URL or expo.extra.apiBaseUrl

=== To Update Configuration ===
Edit: src/config/apiConfig.ts
Change the return value in getApiBaseUrl()
    `;
  }
}

// Export a simple test function that can be called from the app
export const testBackendConnection = async () => {
  console.log(NetworkDiagnostics.getNetworkInfo());
  
  const connectionTest = await NetworkDiagnostics.testConnection();
  console.log('Connection Test:', connectionTest);
  
  const authTest = await NetworkDiagnostics.testAuthEndpoint();
  console.log('Auth Test:', authTest);
  
  return {
    connection: connectionTest,
    auth: authTest,
  };
};
