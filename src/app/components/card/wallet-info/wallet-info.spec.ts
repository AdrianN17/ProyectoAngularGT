import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletInfo } from './wallet-info';

describe('WalletInfo', () => {
  let component: WalletInfo;
  let fixture: ComponentFixture<WalletInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WalletInfo],
    }).compileComponents();

    fixture = TestBed.createComponent(WalletInfo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
