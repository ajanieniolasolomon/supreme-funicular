import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterOutlet } from '@angular/router';
import { DiceGameComponent } from '../../dice-game/dice-game.component';


@Component({
  selector: 'dice-home',
    imports: [DiceGameComponent],

  templateUrl: './dice-home.component.html',
  styleUrl: './dice-home.component.scss'
})
export class DiceHomeComponent {
  title = 'casion';
}
