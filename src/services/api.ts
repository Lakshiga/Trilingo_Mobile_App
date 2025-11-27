import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT, API_CONFIG } from '../config/apiConfig';
// Lazy import to avoid circular dependency with UserStorage
let UserStorage: any = null;
const getUserStorage = async () => {
  if (!UserStorage) {
    UserStorage = (await import('../utils/UserStorage')).UserStorage;
  }
  return UserStorage;
};

// API Response Types
export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// Auth DTOs
export interface LoginRequest {
  identifier: string; // Can be username or email
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Extended user profile data for additional fields
export interface UserProfileData {
  name?: string;
  age?: string;
  nativeLanguage?: string;
  learningLanguage?: string;
}

export interface AuthResponse {
  isSuccess: boolean;
  message: string;
  token?: string;
  username?: string;
  email?: string;
  role?: string;
  profileImageUrl?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  age: string;
  nativeLanguage: string;
  learningLanguage: string;
  isAdmin: boolean;
  isGuest: boolean;
}

// Activity DTO from backend
export interface ActivityDto {
  id: number;
  details_JSON?: string;
  stageId: number;
  mainActivityId: number;
  activityTypeId: number;
  name_en: string;
  name_ta: string;
  name_si: string;
  sequenceOrder: number;
}

// ActivityType DTO from backend
export interface ActivityTypeDto {
  id: number;
  name_en: string;
  name_ta: string;
  name_si: string;
  jsonMethod?: string;
  mainActivityId: number;
}

// Exercise DTO from backend
export interface ExerciseDto {
  id: number;
  activityId: number;
  jsonData: string;
  sequenceOrder: number;
  createdAt: string;
  updatedAt: string;
}

// MainActivity DTO from backend (for Songs/Videos)
export interface MainActivityDto {
  id: number;
  name_en: string;
  name_ta: string;
  name_si: string;
}

// Level DTO from backend
export interface LevelDto {
  id: number;
  name_en: string;
  name_ta: string;
  name_si: string;
  levelId?: number;
}

// Stage/Lesson DTO from backend
export interface StageDto {
  id: number;
  name_en: string;
  name_ta: string;
  name_si: string;
  levelId: number;
  sequenceOrder?: number;
}

class ApiService {
  private api: AxiosInstance;
  private publicApi: AxiosInstance; // Separate instance for public endpoints without auth

  constructor() {
    // Ensure API_BASE_URL is never undefined
    const baseUrl = API_BASE_URL || API_CONFIG.PRODUCTION;
    console.log('Initializing API Service with base URL:', baseUrl);
    
    if (!baseUrl) {
      console.error('API_BASE_URL is undefined! Using fallback:', API_CONFIG.PRODUCTION);
    }
    
    this.api = axios.create({
      baseURL: baseUrl || API_CONFIG.PRODUCTION,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Create a separate axios instance for public endpoints (no auth token)
    this.publicApi = axios.create({
      baseURL: baseUrl || API_CONFIG.PRODUCTION,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // For FormData, remove Content-Type to let axios set it with boundary
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await this.clearAuthToken();
          // You could trigger a logout action here
        }
        return Promise.reject(error);
      }
    );
  }

  // Helper method to determine if we should use public or authenticated API
  private async shouldUsePublicApi(): Promise<boolean> {
    try {
      // Check if user is logged in (lazy import to avoid circular dependency)
      const UserStorageClass = await getUserStorage();
      const currentUser = await UserStorageClass.getCurrentUser();
      console.log('Current user:', currentUser);
      // Use public API for guest users or when no user is logged in
      const usePublic = !currentUser || currentUser.isGuest === true;
      console.log('Using public API:', usePublic);
      return usePublic;
    } catch (error) {
      console.error('Error checking user status:', error);
      // If we can't determine user status, default to authenticated API
      return false;
    }
  }

  // Token Management
  private getAuthToken(): Promise<string | null> {
    return AsyncStorage.getItem('authToken');
  }

  private setAuthToken(token: string): Promise<void> {
    return AsyncStorage.setItem('authToken', token);
  }

  private clearAuthToken(): Promise<void> {
    return AsyncStorage.removeItem('authToken');
  }

  // Authentication Methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.makeApiPostCall<AuthResponse>('/auth/login', credentials);
      
      if (response.isSuccess && response.token) {
        await this.setAuthToken(response.token);
      }
      
      return response;
    } catch (error: any) {
      // For login, provide better error messages
      if (error.response?.status === 401) {
        // Backend returns 401 with response body containing error message
        const errorMessage = error.response?.data?.message || 'Invalid username or password. Please try again.';
        const loginError = new Error(errorMessage);
        loginError.name = 'LoginError';
        throw loginError;
      }
      throw this.handleError(error);
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const registerData = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
      };
      
      const response = await this.makeApiPostCall<AuthResponse>('/auth/register', registerData);
      
      if (response.isSuccess && response.token) {
        await this.setAuthToken(response.token);
      }
      
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout if available
      await this.makeApiPostCall<any>('/auth/logout', {});
    } catch (error) {
      // Continue with local logout even if backend call fails
      console.warn('Backend logout failed:', error);
    } finally {
      await this.clearAuthToken();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.api.get<ApiResponse<User>>('/auth/me');
      return response.data.data || null;
    } catch (error) {
      console.warn('Failed to get current user:', error);
      return null;
    }
  }

  async checkAdmin(): Promise<ApiResponse<boolean>> {
    try {
      const response = await this.makeApiCall<ApiResponse<boolean>>('/auth/check-admin');
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Helper Methods
  private handleError(error: any): Error {
    if (error.response) {
      // Backend responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.message || 'Server error occurred';
      
      // Provide specific error messages for common status codes
      if (status === 504) {
        return new Error(
          'Backend connection failed: Server responded with error: 504. ' +
          'Please check if the backend server is running and accessible.'
        );
      } else if (status === 503) {
        return new Error('Service temporarily unavailable. Please try again later.');
      } else if (status === 502) {
        return new Error('Bad gateway. The server is not responding correctly.');
      } else if (status === 500) {
        return new Error('Internal server error. Please try again later.');
      } else if (status === 401) {
        return new Error('Authentication failed. Please login again.');
      } else if (status === 403) {
        return new Error('You do not have permission to perform this action.');
      } else if (status === 404) {
        return new Error('The requested resource was not found.');
      }
      
      return new Error(message);
    } else if (error.request) {
      // Network error - no response received
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return new Error('Request timeout. The server took too long to respond. Please try again.');
      }
      return new Error('Network error. Please check your internet connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Generic API Methods for other endpoints
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.makeApiCall<ApiResponse<T>>(endpoint);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.makeApiPostCall<ApiResponse<T>>(endpoint, data);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      console.log(`Trying authenticated API for PUT ${endpoint}`);
      const response = await this.api.put<ApiResponse<T>>(endpoint, data);
      return response.data;
    } catch (error: any) {
      console.error(`PUT API failed for ${endpoint}:`, error.message);
      throw this.handleError(error);
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      console.log(`Trying authenticated API for DELETE ${endpoint}`);
      const response = await this.api.delete<ApiResponse<T>>(endpoint);
      return response.data;
    } catch (error: any) {
      console.error(`DELETE API failed for ${endpoint}:`, error.message);
      throw this.handleError(error);
    }
  }

  // Helper method to make API calls with fallback from public to authenticated API
  private async makeApiCall<T>(endpoint: string, usePublicFirst: boolean = true): Promise<T> {
    // Try public API first if requested
    if (usePublicFirst) {
      try {
        const response = await this.retryRequest(
          () => this.publicApi.get<T>(endpoint),
          2, // max 2 retries for GET requests
          1000
        );
        return response.data;
      } catch (publicError: any) {
        // If it's a 401 or 403 error, try the authenticated API
        if (publicError.response?.status === 401 || publicError.response?.status === 403) {
          try {
            const response = await this.retryRequest(
              () => this.api.get<T>(endpoint),
              2,
              1000
            );
            return response.data;
          } catch (authError: any) {
            // If authenticated API also fails with 403, this is a permissions issue
            // Don't log as error - silently throw permission error
            if (authError.response?.status === 403) {
              const permissionError = new Error(`PERMISSION_DENIED: You do not have permission to access ${endpoint}`);
              permissionError.name = 'PermissionDeniedError';
              throw permissionError;
            }
            // For other errors, re-throw the authenticated API error
            throw authError;
          }
        }
        // If it's not a 401 or 403, re-throw the error
        throw publicError;
      }
    } else {
      // Use authenticated API directly with retry
      const response = await this.retryRequest(
        () => this.api.get<T>(endpoint),
        2,
        1000
      );
      return response.data;
    }
  }

  // Retry logic with exponential backoff for 504 errors
  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<AxiosResponse<T>> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        const isRetryable = status === 504 || status === 503 || status === 502 || 
                           error.code === 'ECONNABORTED' || error.message?.includes('timeout');
        
        if (isRetryable && attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms for status ${status}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Not retryable or max retries reached
        throw error;
      }
    }
    
    throw lastError;
  }

  // Helper method to make API calls with fallback from public to authenticated API for POST requests
  private async makeApiPostCall<T>(endpoint: string, data: any, usePublicFirst: boolean = false): Promise<T> {
    // For login and register, always use public API ONLY (user not authenticated yet)
    const isPublicEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
    
    if (usePublicFirst || isPublicEndpoint) {
      try {
        console.log(`Trying public API for POST ${endpoint}`);
        
        const response = await this.retryRequest(
          () => this.publicApi.post<T>(endpoint, data),
          3, // max 3 retries
          1000 // initial delay 1 second
        );
        
        return response.data;
      } catch (publicError: any) {
        // For login/register endpoints, NEVER fallback to authenticated API
        // 401 is a valid response for invalid credentials - just throw it
        if (isPublicEndpoint) {
          console.error(`Public API failed for POST ${endpoint}:`, publicError.message);
          throw publicError;
        }
        
        // For other endpoints, try authenticated API if public fails with 401/403
        console.log(`Public API failed for POST ${endpoint}, trying authenticated API...`);
        if (publicError.response?.status === 401 || publicError.response?.status === 403) {
          try {
            const response = await this.retryRequest(
              () => this.api.post<T>(endpoint, data),
              3,
              1000
            );
            return response.data;
          } catch (authError: any) {
            console.error(`POST API failed for ${endpoint}:`, authError.message);
            throw authError;
          }
        }
        
        // For other errors, throw the public error
        console.error(`POST API failed for ${endpoint}:`, publicError.message);
        throw publicError;
      }
    } else {
      // Use authenticated API directly
      try {
        console.log(`Trying authenticated API for POST ${endpoint}`);
        
        const response = await this.retryRequest(
          () => this.api.post<T>(endpoint, data),
          3, // max 3 retries
          1000 // initial delay 1 second
        );
        
        return response.data;
      } catch (error: any) {
        console.error(`POST API failed for ${endpoint}:`, error.message);
        
        // Provide better error messages
        if (error.response?.status === 504) {
          throw new Error(
            'Backend connection failed: Server responded with error: 504. ' +
            'Please check if the backend server is running and accessible.'
          );
        }
        
        throw error;
      }
    }
  }

  // Upload profile image
  async uploadProfileImage(imageUri: string): Promise<AuthResponse> {
    try {
      // For file uploads, ALWAYS use direct backend URL (CloudFront doesn't support uploads)
      const currentBaseUrl = this.api.defaults.baseURL || '';
      let uploadBaseUrl = currentBaseUrl;
      
      // If using CloudFront, switch to direct backend URL
      if (currentBaseUrl.includes('cloudfront.net')) {
        // Try to get the direct backend URL from config
        // Priority: PHYSICAL_DEVICE > ANDROID_EMULATOR > IOS_SIMULATOR > localhost
        if (API_CONFIG.PHYSICAL_DEVICE && !API_CONFIG.PHYSICAL_DEVICE.includes('cloudfront')) {
          uploadBaseUrl = API_CONFIG.PHYSICAL_DEVICE;
        } else if (API_CONFIG.ANDROID_EMULATOR) {
          uploadBaseUrl = API_CONFIG.ANDROID_EMULATOR;
        } else if (API_CONFIG.IOS_SIMULATOR) {
          uploadBaseUrl = API_CONFIG.IOS_SIMULATOR;
        } else {
          // Fallback to localhost
          uploadBaseUrl = 'https://d3v81eez8ecmto.cloudfront.net/api';
        }
        
        console.log('Using direct backend URL for upload (CloudFront detected):', uploadBaseUrl);
      } else {
        // Already using direct backend, use as is
        console.log('Using current API URL for upload:', uploadBaseUrl);
      }
      
      // Construct the full upload URL
      const uploadEndpoint = '/auth/upload-profile-image';
      const fullUploadUrl = uploadBaseUrl.replace(/\/$/, '') + uploadEndpoint;
      
      console.log('Upload endpoint:', uploadEndpoint);
      console.log('Full upload URL:', fullUploadUrl);
      
      // Get file extension from URI
      let fileExtension = 'jpg';
      let mimeType = 'image/jpeg';
      
      // Extract extension from URI (handle query params)
      const uriWithoutQuery = imageUri.split('?')[0];
      const uriParts = uriWithoutQuery.split('.');
      if (uriParts.length > 1) {
        const ext = uriParts[uriParts.length - 1].toLowerCase();
        fileExtension = ext;
        
        // Map extension to MIME type
        switch (ext) {
          case 'png':
            mimeType = 'image/png';
            break;
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'gif':
            mimeType = 'image/gif';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          default:
            mimeType = 'image/jpeg';
        }
      }

      // Create FormData for React Native
      const formData = new FormData();
      
      // React Native FormData format - must match backend expectation
      const fileData = {
        uri: imageUri,
        name: `profile_${Date.now()}.${fileExtension}`,
        type: mimeType,
      };
      
      console.log('File data:', {
        name: fileData.name,
        type: fileData.type,
        uri: imageUri.substring(0, 50) + '...', // Log partial URI
      });
      
      formData.append('file', fileData as any);

      // Get auth token for the request
      const token = await this.getAuthToken();
      console.log('Auth token present:', !!token);
      
      // Create a separate axios instance for upload with the direct URL
      const uploadApi = axios.create({
        baseURL: uploadBaseUrl,
        timeout: 30000, // Longer timeout for uploads
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Add auth token to upload instance
      if (token) {
        uploadApi.defaults.headers.Authorization = `Bearer ${token}`;
      }
      
      // Make the request
      const response = await uploadApi.post<AuthResponse>(
        uploadEndpoint,
        formData
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Upload error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        baseURL: this.api.defaults.baseURL,
        url: error.config?.url,
        fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
      });
      
      // Provide more specific error message
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        // Recalculate uploadBaseUrl for error message
        const currentBaseUrl = this.api.defaults.baseURL || '';
        let uploadBaseUrl = currentBaseUrl;
        
        if (currentBaseUrl.includes('cloudfront.net')) {
          const directBackendUrl = process.env.EXPO_PUBLIC_API_DIRECT || 
                                  (process.env as any).API_DIRECT ||
                                  'https://d3v81eez8ecmto.cloudfront.net/api';
          
          if (API_CONFIG.PHYSICAL_DEVICE) {
            uploadBaseUrl = API_CONFIG.PHYSICAL_DEVICE;
          } else {
            uploadBaseUrl = directBackendUrl;
          }
        }
        
        throw new Error(
          `Network error: Cannot connect to upload service. ` +
          `Please check your internet connection and ensure the backend server is running.\n\n` +
          `Current API URL: ${this.api.defaults.baseURL}\n` +
          `Upload URL: ${uploadBaseUrl}`
        );
      }
      
      throw this.handleError(error);
    }
  }

  // Get user profile
  async getUserProfile(): Promise<ApiResponse<any>> {
    try {
      const response = await this.makeApiCall<ApiResponse<any>>('/auth/profile');
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Update user profile
  async updateProfile(data: { name?: string; email?: string; age?: string; nativeLanguage?: string; learningLanguage?: string; profileImageUrl?: string }): Promise<AuthResponse> {
    try {
      const response = await this.api.put<AuthResponse>('/auth/update-profile', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Activity Methods
  async getAllActivities(): Promise<ActivityDto[]> {
    try {
      const response = await this.makeApiCall<ActivityDto[]>('/Activities');
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      console.error('Failed to fetch activities:', error);
      // Check if it's a permissions error - don't wrap it with handleError
      if (error.name === 'PermissionDeniedError' || 
          (error.response?.status === 403) ||
          (error.message && error.message.includes('PERMISSION_DENIED'))) {
        console.log('User does not have permission to access activities');
        throw error;
      }
      throw this.handleError(error);
    }
  }

  async getActivityById(id: number): Promise<ActivityDto | null> {
    try {
      const response = await this.makeApiCall<ActivityDto>(`/Activities/${id}`);
      return response || null;
    } catch (error: any) {
      console.error(`Failed to fetch activity ${id}:`, error);
      // Check if it's a permissions error - don't wrap it with handleError
      if (error.name === 'PermissionDeniedError' || 
          (error.response?.status === 403) ||
          (error.message && error.message.includes('PERMISSION_DENIED'))) {
        console.log(`User does not have permission to access activity ${id}`);
        throw error;
      }
      throw this.handleError(error);
    }
  }

  async getActivitiesByStage(stageId: number): Promise<ActivityDto[]> {
    try {
      const response = await this.makeApiCall<ActivityDto[]>(`/Activities/stage/${stageId}`);
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      console.error(`Failed to fetch activities for stage ${stageId}:`, error);
      // Check if it's a permissions error - don't wrap it with handleError
      if (error.name === 'PermissionDeniedError' || 
          (error.response?.status === 403) ||
          (error.message && error.message.includes('PERMISSION_DENIED'))) {
        console.log(`User does not have permission to access activities for stage ${stageId}`);
        throw error;
      }
      throw this.handleError(error);
    }
  }

  // ActivityType Methods
  async getAllActivityTypes(): Promise<ActivityTypeDto[]> {
    try {
      const response = await this.makeApiCall<ActivityTypeDto[]>('/activitytypes');
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      console.error('Failed to fetch activity types:', error);
      throw this.handleError(error);
    }
  }

  async getActivityTypeById(id: number): Promise<ActivityTypeDto | null> {
    try {
      const response = await this.makeApiCall<ActivityTypeDto>(`/activitytypes/${id}`);
      return response || null;
    } catch (error: any) {
      console.error(`Failed to fetch activity type ${id}:`, error);
      throw this.handleError(error);
    }
  }

  // MainActivity Methods (for Songs/Videos)
  async getAllMainActivities(): Promise<MainActivityDto[]> {
    try {
      const response = await this.makeApiCall<MainActivityDto[]>('/mainactivities');
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      console.error('Failed to fetch main activities:', error);
      throw this.handleError(error);
    }
  }

  async getMainActivityById(id: number): Promise<MainActivityDto | null> {
    try {
      const response = await this.makeApiCall<MainActivityDto>(`/mainactivities/${id}`);
      return response || null;
    } catch (error: any) {
      console.error(`Failed to fetch main activity ${id}:`, error);
      throw this.handleError(error);
    }
  }

  // Exercise Methods
  async getAllExercises(): Promise<ExerciseDto[]> {
    try {
      const response = await this.api.get<ExerciseDto[]>('/exercises');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('Failed to fetch exercises:', error);
      throw this.handleError(error);
    }
  }

  async getExerciseById(id: number): Promise<ExerciseDto | null> {
    try {
      const response = await this.api.get<ExerciseDto>(`/exercises/${id}`);
      return response.data || null;
    } catch (error: any) {
      console.error(`Failed to fetch exercise ${id}:`, error);
      throw this.handleError(error);
    }
  }

  async getExercisesByActivityId(activityId: number): Promise<ExerciseDto[]> {
    try {
      const response = await this.api.get<ExerciseDto[]>(`/Activities/${activityId}/exercises`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error(`Failed to fetch exercises for activity ${activityId}:`, error);
      throw this.handleError(error);
    }
  }

  // Level Methods
  async getAllLevels(): Promise<LevelDto[]> {
    try {
      const response = await this.makeApiCall<LevelDto[]>('/Levels');
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      console.error('Failed to fetch levels:', error);
      // Check if it's a permissions error - don't wrap it with handleError
      if (error.name === 'PermissionDeniedError' || 
          (error.response?.status === 403) ||
          (error.message && error.message.includes('PERMISSION_DENIED'))) {
        console.log('User does not have permission to access levels');
        throw error;
      }
      throw this.handleError(error);
    }
  }

  async getLevelById(id: number): Promise<LevelDto | null> {
    try {
      const response = await this.makeApiCall<LevelDto>(`/Levels/${id}`);
      return response || null;
    } catch (error: any) {
      console.error(`Failed to fetch level ${id}:`, error);
      // Check if it's a permissions error - don't wrap it with handleError
      if (error.name === 'PermissionDeniedError' || 
          (error.response?.status === 403) ||
          (error.message && error.message.includes('PERMISSION_DENIED'))) {
        console.log(`User does not have permission to access level ${id}`);
        throw error;
      }
      throw this.handleError(error);
    }
  }

  // Stage/Lesson Methods
  async getAllStages(): Promise<StageDto[]> {
    try {
      const response = await this.makeApiCall<StageDto[]>('/Stages');
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      // Silently return empty array for permission errors - we'll use fallback
      if (error.name === 'PermissionDeniedError' || 
          (error.response?.status === 403) ||
          (error.message && error.message.includes('PERMISSION_DENIED'))) {
        // Silently fail - fallback will handle it
        return [];
      }
      // Only log non-permission errors
      console.error('Failed to fetch stages:', error);
      return [];
    }
  }

  async getStageById(id: number): Promise<StageDto | null> {
    try {
      // Try public API first
      try {
        const response = await this.publicApi.get<StageDto>(`/Stages/${id}`);
        return response.data || null;
      } catch (publicError: any) {
        // If public API fails with 401/403, try authenticated API
        if (publicError.response?.status === 401 || publicError.response?.status === 403) {
          try {
            const response = await this.api.get<StageDto>(`/Stages/${id}`);
            return response.data || null;
          } catch (authError: any) {
            // If both fail, return null silently
            return null;
          }
        }
        // For other errors, return null
        return null;
      }
    } catch (error: any) {
      // Silently return null for any error
      return null;
    }
  }

  async getStagesByLevelId(levelId: number): Promise<StageDto[]> {
    try {
      console.log(`Fetching stages for levelId: ${levelId}`);
      
      // First, try to fetch stages directly (silently fail if permission denied)
      const allStages = await this.getAllStages();
      
      if (allStages.length > 0) {
        // Filter by levelId
        const filteredStages = allStages.filter(stage => stage.levelId === levelId);
        console.log(`Found ${filteredStages.length} stages directly for level ${levelId}`);
        
        if (filteredStages.length > 0) {
          return filteredStages;
        }
      }
      
      // Fallback: Get stages from activities
      // Use activities to find which stages exist, then fetch actual stage data from database
      console.log('Finding stages from activities...');
      const allActivities = await this.getAllActivities();
      console.log(`Total activities fetched: ${allActivities.length}`);
      
      // Group activities by stageId to find all unique stages
      const uniqueStageIds = new Set<number>();
      
      allActivities.forEach(activity => {
        if (activity.stageId) {
          uniqueStageIds.add(activity.stageId);
        }
      });
      
      console.log(`Found ${uniqueStageIds.size} unique stage IDs from activities`);
      
      // Fetch actual stage data from database for each stageId
      // Only return stages that we can actually fetch (with real database names)
      const validStages: StageDto[] = [];
      const stagePromises: Promise<void>[] = [];
      
      for (const stageId of uniqueStageIds) {
        stagePromises.push(
          (async () => {
            // Try to fetch actual stage from database - will return null if can't fetch
            const stage = await this.getStageById(stageId);
            if (stage) {
              // Only include if it belongs to the requested level AND has actual database names
              if (stage.levelId === levelId && stage.name_en && stage.name_ta && stage.name_si) {
                validStages.push(stage);
              }
            }
            // If we can't fetch the stage, we don't create inferred stages
            // Only show stages with actual database names
          })()
        );
      }
      
      // Wait for all stage fetches to complete
      await Promise.all(stagePromises);
      
      // Sort by ID to maintain order (matching database order)
      validStages.sort((a, b) => a.id - b.id);
      
      console.log(`Found ${validStages.length} stages with database names for level ${levelId}`);
      
      return validStages;
    } catch (error: any) {
      // Silently handle errors - don't crash the app
      console.log(`Error fetching stages for level ${levelId}, returning empty array`);
      return [];
    }
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
