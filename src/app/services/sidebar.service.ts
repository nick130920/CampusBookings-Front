import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private _sidebarCollapsed = new BehaviorSubject<boolean>(false);

  /**
   * Observable que indica si el sidebar está colapsado
   */
  get sidebarCollapsed$(): Observable<boolean> {
    return this._sidebarCollapsed.asObservable();
  }

  /**
   * Valor actual del estado del sidebar
   */
  get isCollapsed(): boolean {
    return this._sidebarCollapsed.value;
  }

  /**
   * Actualiza el estado del sidebar
   */
  setSidebarCollapsed(collapsed: boolean): void {
    this._sidebarCollapsed.next(collapsed);
  }

  /**
   * Toggle del estado del sidebar
   */
  toggleSidebar(): void {
    this.setSidebarCollapsed(!this.isCollapsed);
  }
}
