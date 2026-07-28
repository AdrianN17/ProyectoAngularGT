import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RechargeListDelete } from './recharge-list-delete';

describe('RechargeListDelete', () => {
  let component: RechargeListDelete;
  let fixture: ComponentFixture<RechargeListDelete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RechargeListDelete],
    }).compileComponents();

    fixture = TestBed.createComponent(RechargeListDelete);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
