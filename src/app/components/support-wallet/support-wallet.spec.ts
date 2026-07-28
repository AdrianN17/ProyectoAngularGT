import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportWallet } from './support-wallet';

describe('SupportWallet', () => {
  let component: SupportWallet;
  let fixture: ComponentFixture<SupportWallet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportWallet],
    }).compileComponents();

    fixture = TestBed.createComponent(SupportWallet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
