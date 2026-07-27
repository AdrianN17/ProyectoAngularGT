import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionCreate } from './transaction-create';

describe('TransactionCreate', () => {
  let component: TransactionCreate;
  let fixture: ComponentFixture<TransactionCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
