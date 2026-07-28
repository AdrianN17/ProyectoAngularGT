import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RechargeCreate } from './recharge-create';

describe('RechargeCreate', () => {
  let component: RechargeCreate;
  let fixture: ComponentFixture<RechargeCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RechargeCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(RechargeCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
