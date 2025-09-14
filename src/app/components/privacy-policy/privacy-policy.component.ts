import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header simple -->
      <header class="bg-white shadow-sm border-b border-gray-200 py-4">
        <div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <img src="assets/images/usco-logo.png" alt="USCO" class="h-8 w-auto" />
            <h1 class="text-lg font-semibold text-gray-800">CampusBookings</h1>
          </div>
          <button 
            (click)="goBack()"
            class="text-sm text-blue-600 hover:text-blue-800 font-medium">
            ← Volver al sistema
          </button>
        </div>
      </header>

      <!-- Contenido de la Política de Privacidad -->
      <div class="py-8">
        <div class="max-w-4xl mx-auto px-4">
          <div class="bg-white rounded-lg shadow-lg p-8">
            
            <!-- Título Principal -->
            <div class="border-b-4 border-yellow-400 pb-4 mb-6">
              <h1 class="text-3xl font-bold text-red-800">Política de Privacidad - CampusBookings</h1>
              <p class="text-lg font-semibold text-gray-700 mt-2">Universidad Surcolombiana (USCO)</p>
              <p class="text-sm text-gray-600 mt-1"><strong>Fecha de última actualización:</strong> Agosto 2025</p>
            </div>

            <!-- Resumen -->
            <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
              <p class="font-semibold text-gray-800">
                <strong>Resumen:</strong> CampusBookings respeta tu privacidad. Solo recopilamos la información necesaria para gestionar reservas de espacios académicos y deportivos, y para integrar con Google Calendar cuando lo autorices.
              </p>
            </div>

            <!-- 1. Información que Recopilamos -->
            <section class="mb-8">
              <h2 class="text-2xl font-bold text-red-800 mb-4 mt-8">1. Información que Recopilamos</h2>
              
              <h3 class="text-xl font-semibold text-gray-700 mb-3">1.1 Información Personal</h3>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Datos de Registro:</strong> Nombre, apellido, correo electrónico institucional</li>
                <li><strong>Información de Reservas:</strong> Fechas, horarios, espacios solicitados, observaciones</li>
                <li><strong>Datos de Autenticación:</strong> Contraseñas encriptadas, tokens de sesión</li>
              </ul>

              <h3 class="text-xl font-semibold text-gray-700 mb-3">1.2 Integración con Google Calendar</h3>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Tokens de Acceso:</strong> Para sincronizar reservas con tu calendario personal</li>
                <li><strong>Eventos de Calendario:</strong> Solo eventos creados por CampusBookings</li>
                <li><strong>Información Temporal:</strong> Fechas y horarios de reservas</li>
              </ul>

              <h3 class="text-xl font-semibold text-gray-700 mb-3">1.3 Información Técnica</h3>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Logs de Sistema:</strong> Para mantenimiento y resolución de problemas</li>
                <li><strong>Datos de Uso:</strong> Estadísticas anónimas de uso del sistema</li>
              </ul>
            </section>

            <!-- 2. Cómo Usamos tu Información -->
            <section class="mb-8">
              <h2 class="text-2xl font-bold text-red-800 mb-4">2. Cómo Usamos tu Información</h2>
              
              <h3 class="text-xl font-semibold text-gray-700 mb-3">2.1 Gestión de Reservas</h3>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li>Procesar solicitudes de reserva de espacios</li>
                <li>Comunicar el estado de las reservas</li>
                <li>Enviar notificaciones importantes</li>
                <li>Generar reportes administrativos</li>
              </ul>

              <h3 class="text-xl font-semibold text-gray-700 mb-3">2.2 Integración con Google Calendar</h3>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li>Crear eventos automáticamente cuando las reservas sean aprobadas</li>
                <li>Actualizar eventos cuando cambien las reservas</li>
                <li>Eliminar eventos cuando se cancelen reservas</li>
                <li>Enviar recordatorios a través de Google Calendar</li>
              </ul>

              <h3 class="text-xl font-semibold text-gray-700 mb-3">2.3 Comunicación</h3>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li>Enviar confirmaciones de reserva por correo electrónico</li>
                <li>Notificar cambios de estado de reservas</li>
                <li>Comunicar mantenimientos del sistema</li>
              </ul>
            </section>

            <!-- 3. Compartir Información -->
            <section class="mb-8">
              <h2 class="text-2xl font-bold text-red-800 mb-4">3. Compartir Información</h2>
              
              <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
                <p class="font-semibold text-gray-800">
                  <strong>No vendemos, alquilamos ni compartimos tu información personal con terceros</strong> excepto en las siguientes circunstancias:
                </p>
              </div>

              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Personal Autorizado USCO:</strong> Administradores del sistema para gestión de reservas</li>
                <li><strong>Google Calendar:</strong> Solo cuando autorizas explícitamente la integración</li>
                <li><strong>Cumplimiento Legal:</strong> Si es requerido por autoridades competentes</li>
                <li><strong>Protección de Derechos:</strong> Para proteger la seguridad del sistema y usuarios</li>
              </ul>
            </section>

            <!-- 4. Seguridad de los Datos -->
            <section class="mb-8">
              <h2 class="text-2xl font-bold text-red-800 mb-4">4. Seguridad de los Datos</h2>
              
              <h3 class="text-xl font-semibold text-gray-700 mb-3">4.1 Medidas de Protección</h3>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Encriptación:</strong> Todas las contraseñas y datos sensibles están encriptados</li>
                <li><strong>Acceso Controlado:</strong> Solo personal autorizado puede acceder a los datos</li>
                <li><strong>Comunicación Segura:</strong> Uso de HTTPS en todas las comunicaciones</li>
                <li><strong>Respaldos Seguros:</strong> Copias de seguridad con protección adicional</li>
              </ul>

              <h3 class="text-xl font-semibold text-gray-700 mb-3">4.2 Integración con Google Calendar</h3>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li>Los tokens de acceso se almacenan de forma segura</li>
                <li>Solo accedemos al calendario para operaciones autorizadas</li>
                <li>Puedes revocar el acceso en cualquier momento</li>
              </ul>
            </section>

            <!-- 5. Tus Derechos -->
            <section class="mb-8">
              <h2 class="text-2xl font-bold text-red-800 mb-4">5. Tus Derechos</h2>
              
              <h3 class="text-xl font-semibold text-gray-700 mb-3">5.1 Control de Datos</h3>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Acceso:</strong> Consultar qué información tenemos sobre ti</li>
                <li><strong>Corrección:</strong> Actualizar datos incorrectos o incompletos</li>
                <li><strong>Eliminación:</strong> Solicitar la eliminación de tu cuenta y datos</li>
                <li><strong>Portabilidad:</strong> Solicitar una copia de tus datos</li>
              </ul>

              <h3 class="text-xl font-semibold text-gray-700 mb-3">5.2 Google Calendar</h3>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Desconexión:</strong> Puedes desconectar Google Calendar en cualquier momento</li>
                <li><strong>Revocación:</strong> Los permisos pueden ser revocados desde tu cuenta Google</li>
                <li><strong>Control Total:</strong> Mantienes control completo sobre tu calendario</li>
              </ul>
            </section>

            <!-- 6. Retención de Datos -->
            <section class="mb-8">
              <h2 class="text-2xl font-bold text-red-800 mb-4">6. Retención de Datos</h2>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Datos de Usuario:</strong> Mientras tengas cuenta activa en USCO</li>
                <li><strong>Reservas Históricas:</strong> Se mantienen para fines administrativos y estadísticos</li>
                <li><strong>Logs del Sistema:</strong> Se eliminan automáticamente después de 90 días</li>
                <li><strong>Tokens de Google:</strong> Se eliminan cuando desconectas Google Calendar</li>
              </ul>
            </section>

            <!-- 7. Cumplimiento Legal -->
            <section class="mb-8">
              <h2 class="text-2xl font-bold text-red-800 mb-4">7. Cumplimiento Legal</h2>
              <p class="mb-4">Esta política cumple con:</p>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Ley de Protección de Datos Personales de Colombia</strong> (Ley 1581 de 2012)</li>
                <li><strong>Decreto 1377 de 2013</strong></li>
                <li><strong>Políticas de Google para desarrolladores</strong></li>
                <li><strong>Normativas universitarias de USCO</strong></li>
              </ul>
            </section>

            <!-- 8. Contacto -->
            <section class="mb-8">
              <div class="bg-gray-50 border-l-4 border-red-800 p-6">
                <h2 class="text-2xl font-bold text-red-800 mb-4">8. Contacto</h2>
                <p class="mb-4">Si tienes preguntas sobre esta política de privacidad o el manejo de tus datos:</p>
                
                <div class="space-y-2">
                  <p><strong>Universidad Surcolombiana (USCO)</strong><br>
                  Área de Sistemas de Información<br>
                  Avenida Pastrana Borrero - Carrera 1a<br>
                  Neiva, Huila, Colombia</p>
                  
                  <p><strong>Correo Electrónico:</strong> sistemas@usco.edu.co<br>
                  <strong>Teléfono:</strong> +57 (8) 875 8888<br>
                  <strong>Horario de Atención:</strong> Lunes a Viernes, 8:00 AM - 5:00 PM</p>
                  
                  <p><strong>Para solicitudes específicas de datos:</strong><br>
                  Puedes contactarnos a través del sistema CampusBookings o enviando un correo a: privacidad.campusbookings@usco.edu.co</p>
                </div>
              </div>
            </section>

            <!-- Footer -->
            <footer class="text-center pt-8 mt-8 border-t border-gray-200">
              <div class="text-gray-600">
                <p class="font-semibold text-gray-800">CampusBookings - Universidad Surcolombiana</p>
                <p class="text-sm">Sistema de Gestión de Reservas de Espacios Académicos y Deportivos</p>
                <p class="text-sm">© 2025 Universidad Surcolombiana. Todos los derechos reservados.</p>
              </div>
            </footer>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-red-800 {
      color: #8F141B;
    }
    .border-yellow-400 {
      border-color: #DFD4A6;
    }
    .bg-yellow-100 {
      background-color: #fef7e6;
    }
    .border-yellow-500 {
      border-color: #DFD4A6;
    }
  `]
})
export class PrivacyPolicyComponent {
  private router = inject(Router);

  goBack() {
    // Intentar volver al dashboard si está logueado, sino al login
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
