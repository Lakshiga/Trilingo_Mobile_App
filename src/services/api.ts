import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT } from '../config/apiConfig';

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

class ApiService {
  private api: AxiosInstance;

  constructor() {
    console.log('Initializing API Service with base URL:', API_BASE_URL);
    this.api = axios.create({
      baseURL: API_BASE_URL,
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
      const response = await this.api.post<AuthResponse>('/auth/login', credentials);
      
      if (response.data.isSuccess && response.data.token) {
        await this.setAuthToken(response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
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
      
      const response = await this.api.post<AuthResponse>('/auth/register', registerData);
      
      if (response.data.isSuccess && response.data.token) {
        await this.setAuthToken(response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout if available
      await this.api.post('/auth/logout');
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
      const response = await this.api.get<ApiResponse<boolean>>('/auth/check-admin');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Helper Methods
  private handleError(error: any): Error {
    if (error.response) {
      // Backend responded with error status
      const message = error.response.data?.message || 'Server error occurred';
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Generic API Methods for other endpoints
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get<ApiResponse<T>>(endpoint);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.post<ApiResponse<T>>(endpoint, data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.put<ApiResponse<T>>(endpoint, data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.delete<ApiResponse<T>>(endpoint);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Upload profile image
  async uploadProfileImage(imageUri: string): Promise<AuthResponse> {
    try {
      // Log the API base URL being used
      console.log('API Base URL:', this.api.defaults.baseURL);
      console.log('Upload endpoint:', '/auth/upload-profile-image');
      console.log('Full URL:', `${this.api.defaults.baseURL}/auth/upload-profile-image`);
      
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
      
      // Make the request - interceptor will handle auth token and Content-Type
      const response = await this.api.post<AuthResponse>(
        '/auth/upload-profile-image',
        formData,
        {
          headers: {
            'Accept': 'application/json',
            // Don't set Content-Type - let axios set it automatically for FormData
          },
          // Increase timeout for file uploads
          timeout: 30000, // 30 seconds
          // Add transform request to handle FormData properly
          transformRequest: (data, headers) => {
            // Remove Content-Type to let axios set it with boundary
            if (data instanceof FormData) {
              delete headers['Content-Type'];
            }
            return data;
          },
        }
      );
      
      console.log('Upload successful:', response.data);
      return response.data;
    } catch (error: any) {
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
        throw new Error(
          `Network error: Cannot connect to ${this.api.defaults.baseURL}. ` +
          `Please check your internet connection and ensure the backend is accessible.`
        );
      }
      
      throw this.handleError(error);
    }
  }

  // Get user profile
  async getUserProfile(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get<ApiResponse<any>>('/auth/profile');
      return response.data;
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
      // Backend returns activities directly, not wrapped in ApiResponse
      const response = await this.api.get<ActivityDto[]>('/activities');
      // Backend returns Ok(activities) which becomes response.data
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('Failed to fetch activities:', error);
      throw this.handleError(error);
    }
  }

  async getActivityById(id: number): Promise<ActivityDto | null> {
    try {
      const response = await this.api.get<ActivityDto>(`/activities/${id}`);
      return response.data || null;
    } catch (error: any) {
      console.error(`Failed to fetch activity ${id}:`, error);
      throw this.handleError(error);
    }
  }

  async getActivitiesByStage(stageId: number): Promise<ActivityDto[]> {
    try {
      const response = await this.api.get<ActivityDto[]>(`/activities/stage/${stageId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error(`Failed to fetch activities for stage ${stageId}:`, error);
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
      const response = await this.api.get<ExerciseDto[]>(`/activities/${activityId}/exercises`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error(`Failed to fetch exercises for activity ${activityId}:`, error);
      throw this.handleError(error);
    }
  }

  // MainActivity Methods (for Songs/Videos)
  async getAllMainActivities(): Promise<MainActivityDto[]> {
    try {
      const response = await this.api.get<MainActivityDto[]>('/mainactivities');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('Failed to fetch main activities:', error);
      throw this.handleError(error);
    }
  }

  async getMainActivityById(id: number): Promise<MainActivityDto | null> {
    try {
      const response = await this.api.get<MainActivityDto>(`/mainactivities/${id}`);
      return response.data || null;
    } catch (error: any) {
      console.error(`Failed to fetch main activity ${id}:`, error);
      throw this.handleError(error);
    }
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
