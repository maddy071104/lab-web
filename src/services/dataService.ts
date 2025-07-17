import { SystemData, User, Component, BorrowRequest, Notification, LoginSession, SystemStats } from '../types';

class DataService {
  private storageKey = 'isaacLabData';

  private getDefaultData(): SystemData {
    return {
      users: [
        {
          id: 'admin-1',
          name: 'Administrator',
          email: 'admin@issacasimov.in',
          role: 'admin',
          registeredAt: new Date().toISOString(),
          loginCount: 0,
          isActive: false
        }
      ],
      components: [
        {
          id: 'comp-1',
          name: 'Arduino Uno R3',
          totalQuantity: 25,
          availableQuantity: 25,
          category: 'Microcontroller',
          description: 'Arduino Uno R3 development board'
        },
        {
          id: 'comp-2',
          name: 'L298N Motor Driver',
          totalQuantity: 15,
          availableQuantity: 15,
          category: 'Motor Driver',
          description: 'Dual H-Bridge Motor Driver'
        },
        {
          id: 'comp-3',
          name: 'Ultrasonic Sensor HC-SR04',
          totalQuantity: 20,
          availableQuantity: 20,
          category: 'Sensor',
          description: 'Ultrasonic distance sensor'
        },
        {
          id: 'comp-4',
          name: 'Servo Motor SG90',
          totalQuantity: 30,
          availableQuantity: 30,
          category: 'Actuator',
          description: '9g micro servo motor'
        },
        {
          id: 'comp-5',
          name: 'ESP32 Development Board',
          totalQuantity: 12,
          availableQuantity: 12,
          category: 'Microcontroller',
          description: 'WiFi and Bluetooth enabled microcontroller'
        }
      ],
      requests: [],
      notifications: [],
      loginSessions: []
    };
  }

  getData(): SystemData {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsedData = JSON.parse(data);
        // Ensure loginSessions exists for backward compatibility
        if (!parsedData.loginSessions) {
          parsedData.loginSessions = [];
        }
        return parsedData;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    return this.getDefaultData();
  }

  saveData(data: SystemData): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // User operations
  addUser(user: User): void {
    const data = this.getData();
    user.loginCount = 0;
    user.isActive = false;
    data.users.push(user);
    this.saveData(data);
  }

  updateUser(user: User): void {
    const data = this.getData();
    const index = data.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      data.users[index] = user;
      this.saveData(data);
    }
  }

  getUser(email: string): User | undefined {
    const data = this.getData();
    return data.users.find(user => user.email === email);
  }

  authenticateUser(email: string, password: string): User | null {
    const expectedPassword = email === 'admin@issacasimov.in' ? 'isaacasimov' : 'ralab';
    
    if (password !== expectedPassword) {
      return null;
    }

    let user = this.getUser(email);
    
    if (!user && email.endsWith('@issacasimov.in') && email !== 'admin@issacasimov.in') {
      // Create new student user
      const name = email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      user = {
        id: `user-${Date.now()}`,
        name,
        email,
        role: 'student',
        registeredAt: new Date().toISOString(),
        loginCount: 0,
        isActive: true
      };
      this.addUser(user);
    }

    if (user) {
      // Update login statistics
      user.lastLoginAt = new Date().toISOString();
      user.loginCount = (user.loginCount || 0) + 1;
      user.isActive = true;
      this.updateUser(user);

      // Create login session
      this.createLoginSession(user);
    }

    return user || null;
  }

  // Login session management
  createLoginSession(user: User): LoginSession {
    const session: LoginSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      loginTime: new Date().toISOString(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      deviceInfo: this.getDeviceInfo(),
      isActive: true
    };

    const data = this.getData();
    data.loginSessions.push(session);
    this.saveData(data);

    return session;
  }

  endLoginSession(userId: string): void {
    const data = this.getData();
    const activeSessions = data.loginSessions.filter(s => s.userId === userId && s.isActive);
    
    activeSessions.forEach(session => {
      session.logoutTime = new Date().toISOString();
      session.isActive = false;
      session.sessionDuration = new Date().getTime() - new Date(session.loginTime).getTime();
    });

    // Update user active status
    const user = data.users.find(u => u.id === userId);
    if (user) {
      user.isActive = false;
    }

    this.saveData(data);
  }

  getLoginSessions(): LoginSession[] {
    return this.getData().loginSessions;
  }

  getActiveUsers(): User[] {
    return this.getData().users.filter(u => u.isActive);
  }

  private getClientIP(): string {
    // In a real application, you'd get this from your backend
    return 'Unknown';
  }

  private getDeviceInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Mobile')) return 'Mobile Device';
    if (ua.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }

  // Component operations
  getComponents(): Component[] {
    return this.getData().components;
  }

  updateComponent(component: Component): void {
    const data = this.getData();
    const index = data.components.findIndex(c => c.id === component.id);
    if (index !== -1) {
      data.components[index] = component;
      this.saveData(data);
    }
  }

  addComponent(component: Component): void {
    const data = this.getData();
    data.components.push(component);
    this.saveData(data);
  }

  deleteComponent(componentId: string): void {
    const data = this.getData();
    data.components = data.components.filter(c => c.id !== componentId);
    this.saveData(data);
  }

  // Request operations
  addRequest(request: BorrowRequest): void {
    const data = this.getData();
    data.requests.push(request);
    this.saveData(data);
  }

  updateRequest(request: BorrowRequest): void {
    const data = this.getData();
    const index = data.requests.findIndex(r => r.id === request.id);
    if (index !== -1) {
      data.requests[index] = request;
      this.saveData(data);
    }
  }

  getRequests(): BorrowRequest[] {
    return this.getData().requests;
  }

  getUserRequests(userId: string): BorrowRequest[] {
    return this.getData().requests.filter(r => r.studentId === userId);
  }

  // Notification operations
  addNotification(notification: Notification): void {
    const data = this.getData();
    data.notifications.push(notification);
    this.saveData(data);
  }

  getUserNotifications(userId: string): Notification[] {
    return this.getData().notifications.filter(n => n.userId === userId);
  }

  markNotificationAsRead(notificationId: string): void {
    const data = this.getData();
    const notification = data.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveData(data);
    }
  }

  // System statistics
  getSystemStats(): SystemStats {
    const data = this.getData();
    const now = new Date();
    const overdueItems = data.requests.filter(r => 
      r.status === 'approved' && new Date(r.dueDate) < now
    );

    return {
      totalUsers: data.users.length,
      activeUsers: data.users.filter(u => u.isActive).length,
      totalLogins: data.users.reduce((sum, u) => sum + (u.loginCount || 0), 0),
      onlineUsers: data.loginSessions.filter(s => s.isActive).length,
      totalRequests: data.requests.length,
      pendingRequests: data.requests.filter(r => r.status === 'pending').length,
      totalComponents: data.components.length,
      overdueItems: overdueItems.length
    };
  }

  exportLoginSessionsCSV(): string {
    const sessions = this.getLoginSessions();
    
    const headers = [
      'Login Time',
      'Logout Time',
      'User Name',
      'User Email',
      'Role',
      'Device Info',
      'Session Duration (minutes)',
      'Status'
    ];

    const rows = sessions.map(session => [
      new Date(session.loginTime).toLocaleString(),
      session.logoutTime ? new Date(session.logoutTime).toLocaleString() : 'Active',
      session.userName,
      session.userEmail,
      session.userRole,
      session.deviceInfo || 'Unknown',
      session.sessionDuration ? Math.round(session.sessionDuration / 60000).toString() : 'Active',
      session.isActive ? 'Active' : 'Ended'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

export const dataService = new DataService();