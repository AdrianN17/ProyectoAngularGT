import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionListDelete } from './transaction-list-delete';

describe('TransactionListDelete', () => {
  let component: TransactionListDelete;
  let fixture: ComponentFixture<TransactionListDelete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionListDelete],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionListDelete);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
