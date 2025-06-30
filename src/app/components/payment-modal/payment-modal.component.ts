import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';


interface PaymentData {
  price_amount: number;
  price_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  success_url: string;
  cancel_url: string;
}

interface PaymentResponse {
  invoice_url: string;
  invoice_id: string;
  order_id: string;
  payment_status: string;
}

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-white/20">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-bold text-white">💰 Add Funds</h3>
          <button 
            (click)="closeModal()"
            class="text-white/70 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div *ngIf="!isProcessing" class="space-y-6">
          <!-- Current Balance Display -->
          <div class="text-center text-white/80 mb-6">
            Current Balance: <span class="text-green-400 font-bold">\${{ currentBalance | number:'1.2-2' }}</span>
          </div>
          
          <!-- Quick Amount Buttons -->
          <div class="grid grid-cols-3 gap-3 mb-6">
            <button 
              *ngFor="let amount of quickAmounts"
              (click)="selectAmount(amount)"
              [class]="'bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-white py-3 px-4 rounded-lg transition-all hover:scale-105 ' + (selectedAmount === amount ? 'ring-2 ring-blue-400' : '')"
            >
              \${{ amount }}
            </button>
          </div>
          
          <!-- Custom Amount Input -->
          <div class="mb-6">
            <label class="block text-white/80 text-sm font-medium mb-2">Custom Amount</label>
            <input
              type="number"
              [(ngModel)]="customAmount"
              min="1"
              max="10000"
              placeholder="Enter amount"
              class="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/70 border border-white/30 focus:border-white focus:outline-none"
              (input)="onCustomAmountChange()"
            />
          </div>
          
          <!-- Selected Amount Display -->
          <div *ngIf="selectedAmount > 0" class="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
            <div class="text-green-300 text-center">
              <div class="text-sm">Amount to Add:</div>
              <div class="text-2xl font-bold">\${{ selectedAmount | number:'1.2-2' }}</div>
              <div class="text-xs mt-1">New Balance: \${{ (currentBalance + selectedAmount) | number:'1.2-2' }}</div>
            </div>
          </div>
          
        
          
          <!-- Payment Button -->
          <button
            (click)="handleBuyClick()"
            [disabled]="selectedAmount <= 0"
            class="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <span *ngIf="!isLoading">💳 Pay with Now Payments </span>
            <span *ngIf="isLoading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          </button>
        </div>

        <!-- Processing State -->
        <div *ngIf="isProcessing" class="text-center py-8">
          <div class="text-white text-lg mb-4">🔄 Processing Payment...</div>
          <div class="text-white/70 text-sm mb-4">You will be redirected to complete payment</div>
          <div class="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
            <div class="text-yellow-300 text-sm">
              <div class="font-semibold mb-2">⏱️ Please wait:</div>
              <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Creating secure payment session</li>
                <li>Generating payment invoice</li>
                <li>Redirecting to payment page</li>
              </ol>
            </div>
          </div>
        </div>
        
        <!-- Instructions -->
        <div *ngIf="!isProcessing" class="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mt-6">
          <div class="text-blue-300 text-sm">
            <div class="font-semibold mb-2">💡 How it works:</div>
            <ol class="list-decimal list-inside space-y-1 text-xs">
              <li>Select amount and payment method</li>
              <li>Click "Pay" to open secure payment page</li>
              <li>Complete cryptocurrency payment</li>
              <li>Funds automatically added to your account</li>
              <li>Return to play with your new balance!</li>
            </ol>
          </div>
        </div>
        
        <!-- Close Button -->
        <div *ngIf="!isProcessing" class="flex gap-3 mt-6">
          <button
            (click)="closeModal()"
            class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            (click)="refreshBalance()"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors"
          >
            Refresh Balance
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./payment-modal.component.scss']
})
export class PaymentModalComponent {
  @Input() currentBalance: number = 0;
  @Input() userId: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() paymentComplete = new EventEmitter<void>();

  isLoading = false;
  isProcessing = false;
  selectedAmount = 0;
  customAmount: number | null = null;
  selectedCurrency = 'btc';
  errorMessage = '';

  quickAmounts = [10, 25, 50, 100, 250, 500];

 

  constructor(private http: HttpClient) {}



  selectAmount(amount: number): void {
    this.selectedAmount = amount;
    this.customAmount = null;
    this.clearError();
  }

  onCustomAmountChange(): void {
    if (this.customAmount && this.customAmount > 0) {
      this.selectedAmount = this.customAmount;
      this.clearError();
    }
  }

  selectCurrency(currency: string): void {
    this.selectedCurrency = currency;
    this.clearError();
  }

  clearError(): void {
    this.errorMessage = '';
  }

  async handleBuyClick(): Promise<void> {
    if (this.selectedAmount <= 0 || !this.selectedCurrency || !this.userId) {
      this.errorMessage = 'Please select an amount and payment method';
      return;
    }

    this.isLoading = true;
    this.isProcessing = true;
    this.clearError();

    try {
      // Get NOWPayments API key from environment
      const apiKey = environment.nowPaymentsApiKey;
      
      if (!apiKey) {
        throw new Error('Payment API key not configured');
      }

      const paymentUrl = 'https://api-sandbox.nowpayments.io/v1/invoice';

      // Generate unique order ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const paymentData: PaymentData = {
        price_amount: this.selectedAmount,
        price_currency: 'usd',
        order_id: orderId,
        order_description: `Dice Casino Deposit - ${this.selectedAmount}`,
        ipn_callback_url: `${environment.apiUrl}/payment/webhook`,
        success_url: `${window.location.origin}/success`,
        cancel_url: `${window.location.origin}/cancel`
      };

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      });

      // Use firstValueFrom for better TypeScript support
      const response = await firstValueFrom(
        this.http.post<PaymentResponse>(paymentUrl, paymentData, { headers })
      );

      if (response && response.invoice_url) {
        // Store payment info in localStorage for tracking
        const paymentInfo = {
          orderId: orderId,
          amount: this.selectedAmount,
          currency: this.selectedCurrency,
          userId: this.userId,
          invoiceId: response.invoice_id,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('pendingPayment', JSON.stringify(paymentInfo));

        // Optional: Save to your backend first
        await this.savePaymentToBackend(paymentInfo, response);

        // Redirect to payment page
        window.location.href = response.invoice_url;
      } else {
        throw new Error('Invalid payment response - missing invoice URL');
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      this.handlePaymentError(error);
    } finally {
      this.isLoading = false;
      this.isProcessing = false;
    }
  }

  private async savePaymentToBackend(paymentInfo: any, response: PaymentResponse): Promise<void> {
    try {
      // Save payment record to your backend
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/payment/create`, {
          userId: this.userId,
          amount: this.selectedAmount,
          currency: this.selectedCurrency,
          paymentId: response.invoice_id,
          paymentUrl: response.invoice_url
        })
      );
    } catch (error) {
      console.error('Failed to save payment to backend:', error);
      // Don't block the payment flow for this error
    }
  }



  private handlePaymentError(error: any): void {
    let errorMessage = 'Payment failed. Please try again.';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Show error message (you can implement a toast/notification system)
    alert(`Payment Error: ${errorMessage}`);
  }

  refreshBalance(): void {
    this.paymentComplete.emit();
  }

  closeModal(): void {
    this.close.emit();
  }
}
