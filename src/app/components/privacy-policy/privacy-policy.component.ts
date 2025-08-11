import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4">
        <iframe 
          src="assets/privacy-policy.html" 
          class="w-full h-screen border-0 rounded-lg shadow-lg bg-white"
          title="Política de Privacidad - CampusBookings USCO">
        </iframe>
      </div>
    </div>
  `
})
export class PrivacyPolicyComponent {}
