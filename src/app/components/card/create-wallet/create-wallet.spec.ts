import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWallet } from './create-wallet';

describe('CreateWallet', () => {
  let component: CreateWallet;
  let fixture: ComponentFixture<CreateWallet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateWallet],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateWallet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
