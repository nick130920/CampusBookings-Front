import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { User } from '../../services/auth.service';
// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    MenuModule,
    AvatarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userEmail = '';
  isMobileMenuOpen = false;
  isUserMenuOpen = false;
  isMobileView = false;
  currentUser: User | null = null;
  public currentRoute = ''; // Update this line to make currentRoute public

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.checkIfMobileView();
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.checkIfMobileView();
  }

  private checkIfMobileView() {
    this.isMobileView = window.innerWidth < 768; // Tailwind's md breakpoint
    if (!this.isMobileView) {
      this.isMobileMenuOpen = false;
    }
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userEmail = user ? user.email : 'Usuario';
    
    // Suscribirse a los cambios de ruta para actualizar currentRoute
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
    });
    
    // Establecer la ruta inicial
    this.currentRoute = this.router.url;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      this.isUserMenuOpen = false;
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isUserMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getInitials(name?: string): string {
    const userFullName = this.currentUser?.nombre || name || 'Usuario';
    return userFullName.charAt(0).toUpperCase();
  }
}
