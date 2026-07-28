import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RechargeListMinimun } from './recharge-list-minimun';

describe('RechargeListMinimun', () => {
  let component: RechargeListMinimun;
  let fixture: ComponentFixture<RechargeListMinimun>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RechargeListMinimun],
    }).compileComponents();

    fixture = TestBed.createComponent(RechargeListMinimun);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
