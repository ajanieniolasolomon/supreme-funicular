import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div class="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-white/20 text-center">
        
        <!-- Cancel Icon -->
        <div class="mb-6">
          <div class="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
          <p class="text-white/70">Your payment was not completed</p>
        </div>

        <!-- Payment Details -->
        <div *ngIf="paymentDetails" class="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <div class="text-red-300 text-sm space-y-2">
            <div class="flex justify-between">
              <span>Amount:</span>
              <span class="font-semibold">\${{ paymentDetails.amount | number:'1.2-2' }}</span>
            </div>
            <div class="flex justify-between">
              <span>Currency:</span>
              <span class="font-semibold">{{ paymentDetails.currency?.toUpperCase() }}</span>
            </div>
            <div class="flex justify-between">
              <span>Status:</span>
              <span class="font-semibold">Cancelled</span>
            </div>
          </div>
        </div>

        <!-- Information -->
        <div class="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
          <div class="text-yellow-300 text-sm">
            <div class="font-semibold mb-2">💡 What happened:</div>
            <ul class="list-disc list-inside space-y-1 text-xs text-left">
              <li>Payment was cancelled or interrupted</li>
              <li>No funds were charged</li>
              <li>You can try again with a different payment method</li>
              <li>Your account balance remains unchanged</li>
            </ul>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-3">
          <button
            (click)="tryAgain()"
            class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            💳 Try Payment Again
          </button>
          
          <button
            (click)="returnToGame()"
            class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            🎲 Return to Game
          </button>
        </div>

        <!-- Auto-redirect countdown -->
        <div *ngIf="countdown > 0" class="mt-4 text-white/60 text-sm">
          Redirecting to game in {{ countdown }} seconds...
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    :host {
      animation: fadeIn 0.5s ease-out;
    }
  `]
})
export class PaymentCancelComponent implements OnInit {
  paymentDetails: any = null;
  countdown = 15;
  private countdownInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const orderId = params['orderId'];
      const transactionId = params['transactionId'];
      
      if (transactionId) {
        this.markTransactionCancelled(transactionId);
      }
      
      this.loadFromLocalStorage(orderId);
    });

    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private startCountdown() {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.returnToGame();
      }
    }, 1000);
  }

  private async markTransactionCancelled(transactionId: string) {
    try {
      // Optionally notify backend that payment was cancelled
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/payment/cancel`, {
          transactionId
        })
      );
    } catch (error) {
      console.error('Error marking transaction as cancelled:', error);
    }
  }

  private loadFromLocalStorage(orderId: string) {
    const pendingPayment = localStorage.getItem('pendingPayment');
    if (pendingPayment) {
      const paymentInfo = JSON.parse(pendingPayment);
      if (paymentInfo.orderId === orderId) {
        this.paymentDetails = {
          amount: paymentInfo.amount,
          currency: paymentInfo.currency,
          orderId: paymentInfo.orderId
        };
        
        // Update status in localStorage
        paymentInfo.status = 'cancelled';
        paymentInfo.cancelledAt = new Date().toISOString();
        localStorage.setItem('pendingPayment', JSON.stringify(paymentInfo));
      }
    }
  }

  tryAgain() {
    // Clear countdown and return to game with payment modal
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    // Navigate back to game and trigger payment modal
    this.router.navigate(['/'], { 
      queryParams: { showPayment: 'true' } 
    });
  }

  returnToGame() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    this.router.navigate(['/']);
  }
}
