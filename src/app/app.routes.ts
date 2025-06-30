import { Routes } from '@angular/router';
import { PaymentCancelComponent } from './payment-cancel/payment-cancel.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { DiceHomeComponent } from './app/dice-home/dice-home.component';

export const routes: Routes = [
    { path: '', component: DiceHomeComponent },
      { path: 'payment-success', component: PaymentSuccessComponent },
  { path: 'payment-cancel', component: PaymentCancelComponent },
   { path: '**', redirectTo: '' }

];
