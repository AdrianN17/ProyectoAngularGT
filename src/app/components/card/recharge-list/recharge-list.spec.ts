import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RechargeList } from './recharge-list';

describe('RechargeList', () => {
  let component: RechargeList;
  let fixture: ComponentFixture<RechargeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RechargeList],
    }).compileComponents();

    fixture = TestBed.createComponent(RechargeList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
