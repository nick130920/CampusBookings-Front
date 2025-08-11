import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import * as jwt_decode from 'jwt-decode';

export interface User {
  id: number;
  email: string;
  role: string;
  nombre: string;
  apellido: string;
}

interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  userId: number; 
  email: string;
  nombre: string;
  apellido: string;
  rol: string; 
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}${environment.authEndpoint}`;
  private isAuthenticated = new BehaviorSubject<boolean>(false);
  public currentUser = new BehaviorSubject<User | null>(null);
  private readonly TOKEN_KEY = 'auth_token';
  private tokenExpirationTimer: any;

  constructor(private http: HttpClient, private router: Router) {
    this.checkAuthStatus();
  }

  /**
   * Notificar que el usuario se ha autenticado (para iniciar monitoreo de actividad)
   */
  private notifyUserLoggedIn(): void {
    // Enviar evento personalizado para que ActivityService lo escuche
    window.dispatchEvent(new CustomEvent('user-logged-in'));
  }

  /**
   * Notificar que el usuario se ha desconectado (para detener monitoreo)
   */
  private notifyUserLoggedOut(): void {
    // Enviar evento personalizado para que ActivityService lo escuche
    window.dispatchEvent(new CustomEvent('user-logged-out'));
  }

  /**
   * Observable del usuario actual
   */
  getCurrentUser$(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    console.log('Sending registration request:', userData);
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        console.log('Registration response received:', response);
        this.handleAuthentication(response);
        console.log('Authentication handled successfully after registration');
      }),
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/authenticate`, credentials).pipe(
      tap(response => this.handleAuthentication(response)),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  private handleAuthentication(response: AuthResponse): void {
    console.log('Handling authentication with response:', response);
    
    const { token, userId, email, nombre, apellido, rol } = response;
    
    const user: User = {
      id: userId,
      email,
      nombre,
      apellido,
      role: rol
    };
    
    console.log('Created user object:', user);
    
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem('user_data', JSON.stringify(user));
    
    this.currentUser.next(user);
    this.isAuthenticated.next(true);
    const expirationTime = this.getTokenExpiration(token).getTime() - new Date().getTime();
    this.autoLogout(expirationTime);
    
    // Notificar que el usuario se ha autenticado
    this.notifyUserLoggedIn();
  }

  logout(navigateToLogin: boolean = true): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
    this.clearAuthData();
    if (navigateToLogin) {
      this.router.navigate(['/login']);
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('user_data');
    this.isAuthenticated.next(false);
    this.currentUser.next(null);
    
    // Notificar que el usuario se ha desconectado
    this.notifyUserLoggedOut();
  }

  private autoLogout(expirationDuration: number): void {
    if (expirationDuration > 0) {
      this.tokenExpirationTimer = setTimeout(() => {
        this.logout(true);
      }, expirationDuration);
    }
  }

  public isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    return expiration.getTime() < new Date().getTime();
  }

  private getTokenExpiration(token: string): Date {
    try {
      const decoded: any = jwt_decode.jwtDecode(token);
      if (decoded.exp === undefined) return new Date(0);
      return new Date(decoded.exp * 1000);
    } catch (error) {
      console.error('Error decodificando el token:', error);
      return new Date(0);
    }
  }

  getTokenExpirationDate(): Date | null {
    const token = this.getToken();
    if (!token) return null;
    return this.getTokenExpiration(token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Actualizar token renovado desde el backend
   */
  updateToken(newToken: string): void {
    if (newToken && newToken.trim()) {
      localStorage.setItem(this.TOKEN_KEY, newToken);
      console.log('🔄 Token actualizado por renovación automática del backend');
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.currentUser.value;
    const role = user?.role?.toUpperCase();
    return role === 'ADMIN' || role === 'ADMINISTRATOR';
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('user_data');
    if (!userData) return null;
    
    try {
      // Check if userData is already an object (might happen if it was set directly)
      if (typeof userData === 'object') {
        return userData as User;
      }
      // Otherwise parse it as JSON string
      return JSON.parse(userData) as User;
    } catch (e) {
      console.error('Error parsing user data:', e, 'Raw data:', userData);
      // Clear invalid data to prevent future errors
      localStorage.removeItem('user_data');
      return null;
    }
  }

  getIsAuthenticated(): Observable<boolean> {
    // If we have a token but not user data, try to restore session
    if (this.getToken() && !this.currentUser.value) {
      const user = this.getCurrentUser();
      if (user) {
        this.currentUser.next(user);
        this.isAuthenticated.next(true);
      }
    }
    return this.isAuthenticated.asObservable();
  }

  getUserRole(): string | null {
    return this.currentUser.value?.role || null;
  }

  private checkAuthStatus(): void {
    const token = this.getToken();
    if (token) {
      if (this.isTokenExpired(token)) {
        this.clearAuthData();
        return;
      }
      this.isAuthenticated.next(true);
      this.autoLogout(this.getTokenExpiration(token).getTime() - new Date().getTime());
      
      // Siempre decodificar el token para obtener la información más actualizada
      try {
        const tokenData: any = jwt_decode.jwtDecode(token);
        console.log('Token data on page reload:', tokenData);
        
        const user: User = {
          id: tokenData.userId  ,
          email: tokenData.email || tokenData.sub || '',
          nombre: tokenData.nombre || '',
          apellido: tokenData.apellido || '',
          role: tokenData.rol || tokenData.role || 'USER'
        };
        
        console.log('User created from token:', user);
        
        // Actualizar localStorage con los datos del token
        localStorage.setItem('user_data', JSON.stringify(user));
        this.currentUser.next(user);
      } catch (error) {
        console.error('Error decodificando el token:', error);
        this.clearAuthData();
      }
    }
  }

  // Métodos para recuperación de contraseña
  sendPasswordResetCode(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password/send-code`, { email });
  }

  verifyPasswordResetCode(email: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password/verify-code`, { email, code });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password/reset`, { token, newPassword });
  }

  /**
   * Actualizar rol del usuario actual (llamado desde WebSocket)
   */
  updateUserRole(newRole: string): void {
    const currentUser = this.currentUser.value;
    if (currentUser) {
      const updatedUser = { ...currentUser, role: newRole };
      
      // Actualizar en memoria
      this.currentUser.next(updatedUser);
      
      // Actualizar en localStorage
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      
      console.log(`🔄 Rol actualizado de ${currentUser.role} a ${newRole} para usuario ${currentUser.email}`);
      
      // Emitir evento personalizado para que otros componentes puedan reaccionar
      window.dispatchEvent(new CustomEvent('user-role-updated', { 
        detail: { 
          oldRole: currentUser.role, 
          newRole: newRole,
          user: updatedUser
        } 
      }));
    }
  }

  /**
   * Actualizar datos completos del usuario (en caso de cambios múltiples)
   */
  updateUserData(userData: Partial<User>): void {
    const currentUser = this.currentUser.value;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      
      // Actualizar en memoria
      this.currentUser.next(updatedUser);
      
      // Actualizar en localStorage
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      
      console.log('👤 Datos del usuario actualizados:', updatedUser);
    }
  }
}
