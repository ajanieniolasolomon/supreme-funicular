// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  currentBalance?: number;
}

export interface GameResult {
  id: string;
  diceResult: number;
  prediction: number;
  betAmount: number;
  payout: number;
  isWin: boolean;
  newBalance: number;
}

export interface PaymentResponse {
  transactionId: string;
  paymentId: string;
  paymentUrl: string;
  amount: number;
  currency: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  loginUser(email: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users/login`, { email });
  }

  getUserBalance(userId: string): Observable<{ balance: number }> {
    return this.http.get<{ balance: number }>(`${this.baseUrl}/balance/${userId}/current`);
  }

  getBalanceHistory(userId: string, days?: number): Observable<any> {
    const params = days ? `?days=${days}` : '';
    return this.http.get(`${this.baseUrl}/balance/${userId}/history${params}`);
  }

  getTodayTransactions(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/balance/${userId}/today-transactions`);
  }

  playDice(userId: string, prediction: number, betAmount: number): Observable<GameResult> {
    return this.http.post<GameResult>(`${this.baseUrl}/game/dice/play`, {
      userId,
      prediction,
      betAmount
    });
  }

  createPayment(userId: string, amount: number, currency: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/payment/create`, {
      userId,
      amount,
      currency
    });
  }

  getGameHistory(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/game/history/${userId}`);
  }

  getTransactionHistory(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/payment/transactions/${userId}`);
  }
}