// src/app/dice-game/dice-game.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ApiService, GameResult, User } from '../services/api.service';
import { PaymentModalComponent } from '../components/payment-modal/payment-modal.component';


@Component({
  selector: 'app-dice-game',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule,PaymentModalComponent],
  providers: [ApiService],
  templateUrl: './dice-game.component.html',
  styleUrls: ['./dice-game.component.scss']
})
export class DiceGameComponent implements OnInit {
  emailForm: FormGroup;
  gameForm: FormGroup;
  user: User | null = null;
  currentBalance = 0;
  isRolling = false;
  showPaymentModal = false;
  lastGameResult: GameResult | null = null;
  gameHistory: any[] = [];
  todayTransactions: any[] = [];
  balanceHistory: any[] = [];
  diceValue = 1;
  showBalanceDetails = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.gameForm = this.fb.group({
      prediction: [1, [Validators.required, Validators.min(1), Validators.max(6)]],
      betAmount: [1, [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit() {
 
  }

  onEmailSubmit() {
    if (this.emailForm.valid) {
      const email = this.emailForm.get('email')?.value;
      this.apiService.loginUser(email).subscribe({
        next: (user) => {
          this.user = user;
          this.currentBalance = user.currentBalance || 0;
          this.loadUserData();
     
        },
        error: (error) => {
          console.error('Login failed:', error);
        }
      });
    }
  }

  loadUserData() {
    if (this.user) {
      this.loadGameHistory();
      this.loadTodayTransactions();
      this.loadBalanceHistory();
        this.refreshBalance();
    }
  }

  onRollDice() {
    if (!this.user || this.isRolling) return;

    const prediction = this.gameForm.get('prediction')?.value;
    const betAmount = this.gameForm.get('betAmount')?.value;

    if (this.currentBalance < betAmount) {
      this.showPaymentModal = true;
      return;
    }

    this.isRolling = true;
    this.animateDiceRoll();

    this.apiService.playDice(this.user.id, prediction, betAmount).subscribe({
      next: (result) => {
        setTimeout(() => {
          this.lastGameResult = result;
          this.currentBalance = result.newBalance;
          this.diceValue = result.diceResult;
          this.isRolling = false;
          this.loadUserData(); // Refresh all data
        }, 2000); // Wait for animation
      },
      error: (error) => {
        console.error('Game failed:', error);
        this.isRolling = false;
        if (error.error.message === 'Insufficient balance') {
          this.showPaymentModal = true;
        }
      }
    });
  }

  animateDiceRoll() {
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      this.diceValue = Math.floor(Math.random() * 6) + 1;
      rollCount++;
      if (rollCount > 20) { // Longer animation
        clearInterval(rollInterval);
      }
    }, 80);
  }

  // Add method to handle dice click for fun interaction
  onDiceClick() {
    if (!this.isRolling && this.user) {
      // Quick preview roll
      this.diceValue = Math.floor(Math.random() * 6) + 1;
    }
  }

  loadGameHistory() {
    if (this.user) {
      this.apiService.getGameHistory(this.user.id).subscribe({
        next: (history) => {
          this.gameHistory = history;
        }
      });
    }
  }

  loadTodayTransactions() {
    if (this.user) {
      this.apiService.getTodayTransactions(this.user.id).subscribe({
        next: (response) => {
          this.todayTransactions = response.transactions;
        }
      });
    }
  }

  loadBalanceHistory() {
    if (this.user) {
      this.apiService.getBalanceHistory(this.user.id, 7).subscribe({
        next: (response) => {
          this.balanceHistory = response.history;
        }
      });
    }
  }

  refreshBalance() {
    if (this.user) {
      this.apiService.getUserBalance(this.user.id).subscribe({
        next: (response) => {
          this.currentBalance = response.balance;
          this.loadUserData(); // Refresh all data
        }
      });
    }
  }

  onPaymentComplete() {
    this.showPaymentModal = false;
    this.refreshBalance();
  }

  toggleBalanceDetails() {
    this.showBalanceDetails = !this.showBalanceDetails;
  }

  getTransactionTypeClass(type: string): string {
    switch (type) {
      case 'DEPOSIT':
      case 'GAME_WIN':
        return 'text-green-400';
      case 'WITHDRAWAL':
      case 'GAME_LOSS':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  }

  getTransactionSign(type: string): string {
    switch (type) {
      case 'DEPOSIT':
      case 'GAME_WIN':
        return '+';
      case 'WITHDRAWAL':
      case 'GAME_LOSS':
        return '-';
      default:
        return '';
    }
  }

  // Payment Modal Methods (inline implementation)
  createPayment(amount: number, currency: string) {
    if (this.user) {
      this.apiService.createPayment(this.user.id, amount, currency).subscribe({
        next: (response) => {
          // Open payment URL in new window
          window.open(response.paymentUrl, '_blank');
          // You might want to poll for payment completion
          this.pollPaymentStatus(response.transactionId);
        },
        error: (error) => {
          console.error('Payment creation failed:', error);
        }
      });
    }
  }

  pollPaymentStatus(transactionId: string) {
    // Simple polling mechanism (in production, use websockets)
    const pollInterval = setInterval(() => {
      this.refreshBalance();
      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 300000);
    }, 10000); // Check every 10 seconds
  }


}



