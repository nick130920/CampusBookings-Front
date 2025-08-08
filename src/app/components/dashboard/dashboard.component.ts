import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { User } from '../../services/auth.service';
import { NavigationComponent } from '../../shared/navigation/navigation.component';
import { SidebarService } from '../../services/sidebar.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
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
    NavigationComponent,
    ButtonModule,
    MenuModule,
    AvatarModule,
    HasPermissionDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userEmail = '';
  currentUser: User | null = null;
  public currentRoute = ''; // Update this line to make currentRoute public
  
  // Sidebar state
  sidebarCollapsed = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private sidebarService: SidebarService
  ) {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    
    // Sincronizar el estado del sidebar con el servicio
    this.sidebarService.sidebarCollapsed$.subscribe(collapsed => {
      this.sidebarCollapsed = collapsed;
    });
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

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getInitials(name?: string): string {
    const userFullName = this.currentUser?.nombre || name || 'Usuario';
    return userFullName.charAt(0).toUpperCase();
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }
}
