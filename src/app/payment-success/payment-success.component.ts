// src/app/payment-success/payment-success.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div class="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-white/20 text-center">
        
        <!-- Success Animation -->
        <div class="mb-6">
          <div class="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white mb-2">🎉 Payment Successful!</h1>
          <p class="text-white/70">Your deposit is being processed</p>
        </div>

        <!-- Payment Details -->
        <div *ngIf="paymentDetails" class="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
          <div class="text-green-300 text-sm space-y-2">
            <div class="flex justify-between">
              <span>Amount:</span>
              <span class="font-semibold">\${{ paymentDetails.amount | number:'1.2-2' }}</span>
            </div>
            <div class="flex justify-between">
              <span>Currency:</span>
              <span class="font-semibold">{{ paymentDetails.currency?.toUpperCase() }}</span>
            </div>
            <div class="flex justify-between">
              <span>Transaction ID:</span>
              <span class="font-mono text-xs">{{ paymentDetails.transactionId }}</span>
            </div>
          </div>
        </div>

        <!-- Status Messages -->
        <div *ngIf="isLoading" class="mb-6">
          <div class="flex items-center justify-center space-x-2 text-white/70">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Verifying payment...</span>
          </div>
        </div>

        <div *ngIf="errorMessage" class="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <div class="text-red-300 text-sm">
            <div class="font-semibold mb-1">⚠️ Verification Issue</div>
            <div>{{ errorMessage }}</div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-6">
          <div class="text-blue-300 text-sm">
            <div class="font-semibold mb-2">💡 What happens next:</div>
            <ol class="list-decimal list-inside space-y-1 text-xs text-left">
              <li>Payment confirmation is being processed</li>
              <li>Funds will be added to your account automatically</li>
              <li>You can return to playing immediately</li>
              <li>Check your balance in the game</li>
            </ol>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-3">
          <button
            (click)="returnToGame()"
            class="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg font-bold hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105"
          >
            🎲 Return to Game
          </button>
          
          <button
            (click)="checkPaymentStatus()"
            [disabled]="isLoading"
            class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            Check Payment Status
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
export class PaymentSuccessComponent implements OnInit {
  paymentDetails: any = null;
  isLoading = true;
  errorMessage = '';
  countdown = 10;
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
        this.loadPaymentDetails(transactionId);
      } else {
        this.loadFromLocalStorage(orderId);
      }
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

  private async loadPaymentDetails(transactionId: string) {
    try {
      const response = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/payment/status/${transactionId}`)
      );
      
      this.paymentDetails = response;
      this.isLoading = false;
      
      // Update localStorage with latest info
      const pendingPayment = localStorage.getItem('pendingPayment');
      if (pendingPayment) {
        const paymentInfo = JSON.parse(pendingPayment);
        paymentInfo.status = 'completed';
        paymentInfo.completedAt = new Date().toISOString();
        localStorage.setItem('pendingPayment', JSON.stringify(paymentInfo));
      }
      
    } catch (error) {
      console.error('Error loading payment details:', error);
      this.errorMessage = 'Could not verify payment details. Please check your account balance.';
      this.isLoading = false;
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
          transactionId: paymentInfo.backendTransactionId || paymentInfo.transactionId,
          orderId: paymentInfo.orderId
        };
      }
    }
    this.isLoading = false;
  }

  async checkPaymentStatus() {
    if (!this.paymentDetails?.transactionId) {
      this.errorMessage = 'No transaction ID available';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/payment/status/${this.paymentDetails.transactionId}`)
      );
      
      this.paymentDetails = { ...this.paymentDetails, ...response };
      this.isLoading = false;
      
    } catch (error) {
      console.error('Error checking payment status:', error);
      this.errorMessage = 'Could not check payment status. Please try again.';
      this.isLoading = false;
    }
  }

  returnToGame() {
    // Clear the countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    // Navigate back to the dice game
    this.router.navigate(['/']);
  }
}

// src/app/payment-cancel/payment-cancel.component.ts


// import { NgModule } from '@angular/core';
// import { RouterModule, Routes } from '@angular/router';
// import { DiceGameComponent } from './dice-game/dice-game.component';
// import { PaymentSuccessComponent } from './payment-success/payment-success.component';
// import { PaymentCancelComponent } from './payment-cancel/payment-cancel.component';

// const routes: Routes = [
//   { path: '', component: DiceGameComponent },
//   { path: 'payment-success', component: PaymentSuccessComponent },
//   { path: 'payment-cancel', component: PaymentCancelComponent },
//   { path: '**', redirectTo: '' }
// ];

// @NgModule({
//   imports: [RouterModule.forRoot(routes)],
//   exports: [RouterModule]
// })
// export class AppRoutingModule { }

// // OR for standalone setup in main.ts:
// // src/main.ts
// import { bootstrapApplication } from '@angular/platform-browser';
// import { provideRouter } from '@angular/router';
// import { provideHttpClient } from '@angular/common/http';
// import { AppComponent } from './app/app.component';
// import { DiceGameComponent } from './app/dice-game/dice-game.component';
// import { PaymentSuccessComponent } from './app/payment-success/payment-success.component';
// import { PaymentCancelComponent } from './app/payment-cancel/payment-cancel.component';

// bootstrapApplication(AppComponent, {
//   providers: [
//     provideRouter([
//       { path: '', component: DiceGameComponent },
//       { path: 'payment-success', component: PaymentSuccessComponent },
//       { path: 'payment-cancel', component: PaymentCancelComponent },
//       { path: '**', redirectTo: '' }
//     ]),
//     provideHttpClient()
//   ]
// });

