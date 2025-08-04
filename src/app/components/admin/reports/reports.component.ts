import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ReporteReserva {
  escenarioId: number;
  escenarioNombre: string;
  tipo: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  cantidadReservas: number;
  usuarioEmail: string;
  observaciones?: string;
}

interface ReporteRequest {
  fechaInicio: string;
  fechaFin: string;
  tipo?: string;
  estado?: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  reportForm: FormGroup;
  reportData: ReporteReserva[] = [];
  isLoading = false;
  
  // Opciones para los filtros
  tiposEscenario = [
    'Aula',
    'Laboratorio',
    'Auditorio',
    'Sala de conferencias',
    'Espacio deportivo',
    'Biblioteca'
  ];
  
  estadosReserva = [
    'PENDIENTE',
    'APROBADA',
    'RECHAZADA',
    'CANCELADA'
  ];

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private http: HttpClient
  ) {
    this.reportForm = this.fb.group({
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      tipo: [''],
      estado: ['']
    });
  }

  ngOnInit(): void {
    // Configurar fechas por defecto (último mes)
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 1);
    
    this.reportForm.patchValue({
      fechaInicio: fechaInicio.toISOString().slice(0, 16),
      fechaFin: fechaFin.toISOString().slice(0, 16)
    });
  }

  onSubmit(): void {
    if (this.reportForm.valid) {
      this.generarReporte();
    } else {
      this.toastService.showError('Por favor complete todos los campos requeridos');
    }
  }

  generarReporte(): void {
    this.isLoading = true;
    const formValue = this.reportForm.value;
    
    const request: ReporteRequest = {
      fechaInicio: new Date(formValue.fechaInicio).toISOString(),
      fechaFin: new Date(formValue.fechaFin).toISOString(),
      tipo: formValue.tipo || undefined,
      estado: formValue.estado || undefined
    };

    this.http.post<ReporteReserva[]>(`${environment.apiUrl}/reservas/reporte`, request)
      .subscribe({
        next: (data) => {
          this.reportData = data;
          this.isLoading = false;
          this.toastService.showSuccess(`Reporte generado exitosamente. ${data.length} reservas encontradas.`);
        },
        error: (error) => {
          console.error('Error al generar reporte:', error);
          this.isLoading = false;
          this.toastService.showError('Error al generar el reporte');
        }
      });
  }

  limpiarFiltros(): void {
    this.reportForm.patchValue({
      tipo: '',
      estado: ''
    });
  }

  exportarExcel(): void {
    if (this.reportData.length === 0) {
      this.toastService.showWarning('No hay datos para exportar');
      return;
    }
    
    // Implementación básica de exportación (aquí podrías usar una librería como xlsx)
    const headers = ['Escenario', 'Tipo', 'Estado', 'Usuario', 'Fecha Inicio', 'Fecha Fin', 'Observaciones'];
    const csvContent = [
      headers.join(','),
      ...this.reportData.map(row => [
        `"${row.escenarioNombre}"`,
        `"${row.tipo}"`,
        `"${row.estado}"`,
        `"${row.usuarioEmail}"`,
        `"${new Date(row.fechaInicio).toLocaleString()}"`,
        `"${new Date(row.fechaFin).toLocaleString()}"`,
        `"${row.observaciones || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_reservas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    
    this.toastService.showSuccess('Reporte exportado exitosamente');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoClass(estado: string): string {
    switch (estado.toUpperCase()) {
      case 'APROBADA':
        return 'bg-green-100 text-green-800';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'RECHAZADA':
        return 'bg-red-100 text-red-800';
      case 'CANCELADA':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  trackReservations(index: number, reserva: ReporteReserva): any {
    return reserva.escenarioId + '_' + index;
  }
}