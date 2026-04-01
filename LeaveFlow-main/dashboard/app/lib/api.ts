// API client for FastAPI backend

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: 'worker' | 'manager' | 'hr' | 'admin';
  manager_id?: number;
  created_at: string;
}

export interface LeaveBalance {
  id: number;
  user_id: number;
  casual: number;
  sick: number;
  special: number;
  year: number;
}

export interface LeaveRequest {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  days: number;
  leave_type: 'casual' | 'sick' | 'special';
  duration_type: 'full' | 'half_morning' | 'half_afternoon';
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  rejection_reason?: string;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  user?: User;
  attachments?: Attachment[];
}

export interface Attachment {
  id: number;
  file_url: string;
  file_type?: string;
  uploaded_at: string;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  description?: string;
}

export interface DashboardStats {
  pending_count: number;
  approved_today: number;
  rejected_today: number;
  on_leave_today: User[];
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async fetch<T>(path: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true', // Skip ngrok warning page
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        // Add timeout for better UX
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        // Handle 503 Service Unavailable with retry (Vercel cold start)
        if (response.status === 503 && retryCount < 3) {
          const waitTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s exponential backoff
          console.log(`[API] 503 Service Unavailable. Retrying in ${waitTime}ms (attempt ${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return this.fetch<T>(path, options, retryCount + 1);
        }

        const error = await response.json().catch(() => ({ 
          detail: response.status === 403 
            ? 'You do not have permission to access this resource' 
            : response.status === 404
            ? 'Resource not found'
            : response.status === 503
            ? 'Service temporarily unavailable. Please wait a moment and try again.'
            : response.status === 400
            ? 'Invalid request. Please check the data and try again.'
            : 'Request failed' 
        }));
        
        // Handle specific error cases
        if (response.status === 401) {
          // Clear token on auth failure
          this.setToken(null);
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }
        
        throw new Error(error.detail || error.message || 'Request failed');
      }

      return await response.json();
    } catch (error: any) {
      // Handle network errors
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
  }

  // Auth
  async login(email: string, password: string): Promise<{ access_token: string }> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  logout() {
    this.setToken(null);
  }

  async getMe(): Promise<User> {
    return this.fetch('/auth/me');
  }

  // Leave requests
  async getPendingRequests(): Promise<LeaveRequest[]> {
    const data = await this.fetch('/leave/pending');
    console.log('[API] getPendingRequests response:', data, 'Type:', typeof data, 'isArray:', Array.isArray(data));
    return data as LeaveRequest[];
  }

  async getLeaveHistory(status?: string, userId?: number): Promise<LeaveRequest[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (userId) params.append('user_id', userId.toString());
    return this.fetch(`/leave/history?${params}`);
  }

  async getLeaveRequest(id: number): Promise<LeaveRequest> {
    return this.fetch(`/leave/${id}`);
  }

  async approveLeave(id: number): Promise<LeaveRequest> {
    return this.fetch(`/leave/approve/${id}`, { method: 'POST' });
  }

  async rejectLeave(id: number, reason: string): Promise<LeaveRequest> {
    return this.fetch(`/leave/reject/${id}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async cancelLeave(id: number): Promise<LeaveRequest> {
    return this.fetch(`/leave/cancel/${id}`, { method: 'POST' });
  }

  async getMyBalance(): Promise<LeaveBalance> {
    return this.fetch('/leave/balance');
  }

  async getUserBalance(userId: number): Promise<LeaveBalance> {
    return this.fetch(`/leave/balance/${userId}`);
  }

  async getTodayLeaves(): Promise<{ employees: User[]; count: number }> {
    return this.fetch('/leave/today');
  }

  // Users
  async getUsers(role?: string): Promise<User[]> {
    const path = role ? `/users/?role=${role}` : '/users/';
    return this.fetch(path);
  }

  async getMyTeam(): Promise<User[]> {
    return this.fetch('/users/team');
  }

  async getUser(id: number): Promise<User & { leave_balance?: LeaveBalance }> {
    return this.fetch(`/users/${id}`);
  }

  async updateUser(id: number, userData: {
    name?: string;
    email?: string;
    phone?: string;
  }): Promise<User> {
    return this.fetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async adminUpdateUser(id: number, userData: {
    name: string;
    email: string;
    phone: string;
    role: string;
    manager_id?: number | null;
    password?: string;
  }): Promise<User> {
    return this.fetch(`/users/${id}/admin`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getPendingAccounts(): Promise<User[]> {
    return this.fetch('/users/pending-accounts');
  }

  async approveAccount(userId: number): Promise<User> {
    return this.fetch(`/users/${userId}/approve`, {
      method: 'POST',
    });
  }

  async rejectAccount(userId: number): Promise<void> {
    return this.fetch(`/users/${userId}/reject`, {
      method: 'POST',
    });
  }

  async getManagers(): Promise<User[]> {
    return this.fetch('/users/managers');
  }

  // Registration
  async register(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
  }): Promise<User> {
    return this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Holidays
  async getHolidays(year?: number): Promise<Holiday[]> {
    const path = year ? `/holidays/?year=${year}` : '/holidays/';
    return this.fetch(path);
  }

  async createHoliday(date: string, name: string, description?: string): Promise<Holiday> {
    return this.fetch('/holidays/', {
      method: 'POST',
      body: JSON.stringify({ date, name, description }),
    });
  }

  async deleteHoliday(id: number): Promise<void> {
    return this.fetch(`/holidays/${id}`, { method: 'DELETE' });
  }

  // Diagnostic methods
  async testConnection(): Promise<{ status: string; message: string }> {
    try {
      const response = await this.fetch('/docs');
      return { status: 'ok', message: 'Backend is responding' };
    } catch (error) {
      return { status: 'error', message: String(error) };
    }
  }
}

export const api = new ApiClient();
