import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiceGameComponent } from './dice-game.component';

describe('DiceGameComponent', () => {
  let component: DiceGameComponent;
  let fixture: ComponentFixture<DiceGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiceGameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiceGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
