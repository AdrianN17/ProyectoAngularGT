import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerWallet } from './seller-wallet';

describe('SellerWallet', () => {
  let component: SellerWallet;
  let fixture: ComponentFixture<SellerWallet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerWallet],
    }).compileComponents();

    fixture = TestBed.createComponent(SellerWallet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
