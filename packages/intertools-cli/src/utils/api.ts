import fetch from 'node-fetch';
import { config } from '../config';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Make API request with error handling
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    timeout?: number;
  } = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = config.timeout
  } = options;

  const url = `${config.serverUrl}${endpoint}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.error || 'Request failed',
        message: responseData.message
      };
    }

    return {
      success: true,
      data: responseData
    };

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout',
        message: 'The request took too long to complete'
      };
    }

    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'Connection refused',
        message: `Unable to connect to InterTools server at ${config.serverUrl}`
      };
    }

    return {
      success: false,
      error: 'Network error',
      message: error.message || 'Failed to make request'
    };
  }
}

/**
 * Activate license (create checkout session)
 */
export async function activateLicense(email: string): Promise<ApiResponse> {
  return apiRequest(config.endpoints.activate, {
    method: 'POST',
    body: {
      email,
      product: 'intertools'
    }
  });
}

/**
 * Redeem trial token
 */
export async function redeemTrial(email: string): Promise<ApiResponse> {
  return apiRequest(config.endpoints.redeemTrial, {
    method: 'POST',
    body: {
      email,
      product: 'intertools'
    }
  });
}

/**
 * Verify token
 */
export async function verifyToken(token: string): Promise<ApiResponse> {
  return apiRequest(config.endpoints.verify, {
    method: 'POST',
    body: { token }
  });
}

/**
 * Get public key for offline verification
 */
export async function getPublicKey(): Promise<ApiResponse> {
  return apiRequest(config.endpoints.publicKey);
}

/**
 * Check server health
 */
export async function checkServerHealth(): Promise<ApiResponse> {
  return apiRequest('/health', { timeout: 5000 });
}
