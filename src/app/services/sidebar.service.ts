import { Injectable, signal, computed, effect } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {

  // 🚀 Signal principal para el estado del sidebar
  private _isCollapsed = signal<boolean>(false);

  // 🔍 Signal readonly para acceso público
  public readonly isCollapsed = this._isCollapsed.asReadonly();

  // 📊 Observable para compatibilidad con código existente
  private _collapsedSubject = new BehaviorSubject<boolean>(false);
  public readonly sidebarCollapsed$ = this._collapsedSubject.asObservable();

  // 🧮 Computed signals para clases CSS dinámicas
  public readonly sidebarWidth = computed(() => 
    this._isCollapsed() ? 'w-16' : 'w-64'
  );

  public readonly contentMargin = computed(() => 
    this._isCollapsed() ? 'ml-16' : 'ml-64'
  );

  public readonly contentPadding = computed(() => 
    this._isCollapsed() ? 'm-6 sm:m-10' : 'm-16'
  );

  // 🎯 Computed para clases completas de contenedor
  public readonly containerClasses = computed(() => 
    `bg-usco-gris-50 min-h-screen transition-all duration-300 ${this.contentPadding()}`
  );

  // 🎯 Computed para detectar si es mobile
  public readonly isMobile = computed(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  constructor() {
    // 📱 Effect para manejar cambios de viewport automáticamente
    effect(() => {
      if (typeof window !== 'undefined') {
        const handleResize = () => {
          // En mobile, colapsar automáticamente
          if (window.innerWidth < 768 && !this._isCollapsed()) {
            this.collapse();
          }
        };

        window.addEventListener('resize', handleResize);
        
        // Cleanup cuando el effect se destruya
        return () => window.removeEventListener('resize', handleResize);
      }
      return; // Siempre retornar algo
    });

    // 💾 Effect para persistir estado en localStorage y sincronizar Observable
    effect(() => {
      if (typeof window !== 'undefined') {
        const collapsed = this._isCollapsed();
        localStorage.setItem('sidebar-collapsed', collapsed.toString());
        // Sincronizar con Observable para compatibilidad
        this._collapsedSubject.next(collapsed);
      }
    });

    // 🔄 Cargar estado inicial desde localStorage
    this.loadInitialState();
  }

  /**
   * 🔄 Alternar estado del sidebar
   */
  toggle(): void {
    this._isCollapsed.update(current => !current);
  }

  /**
   * 📦 Colapsar sidebar
   */
  collapse(): void {
    this._isCollapsed.set(true);
  }

  /**
   * 📂 Expandir sidebar
   */
  expand(): void {
    this._isCollapsed.set(false);
  }

  /**
   * 🔧 Establecer estado específico
   */
  setCollapsed(collapsed: boolean): void {
    this._isCollapsed.set(collapsed);
  }

  /**
   * 🔄 Cargar estado inicial desde localStorage
   */
  private loadInitialState(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) {
        const isCollapsed = saved === 'true';
        this._isCollapsed.set(isCollapsed);
        this._collapsedSubject.next(isCollapsed);
      } else {
        // Estado inicial: expandido en desktop, colapsado en mobile
        const isCollapsed = window.innerWidth < 768;
        this._isCollapsed.set(isCollapsed);
        this._collapsedSubject.next(isCollapsed);
      }
    }
  }

  /**
   * 🎨 Obtener clases CSS dinámicas para cualquier componente
   */
  getResponsiveClasses(baseClasses: string = ''): string {
    return `${baseClasses} ${this.containerClasses()}`.trim();
  }

  /**
   * 🔄 Método de compatibilidad (legacy)
   */
  toggleSidebar(): void {
    this.toggle();
  }

  /**
   * 📊 Obtener información del estado actual
   */
  getState() {
    return {
      isCollapsed: this.isCollapsed(),
      sidebarWidth: this.sidebarWidth(),
      contentMargin: this.contentMargin(),
      contentPadding: this.contentPadding(),
      isMobile: this.isMobile()
    };
  }
}