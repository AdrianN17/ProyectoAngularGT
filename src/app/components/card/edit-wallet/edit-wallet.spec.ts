import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditWallet } from './edit-wallet';

describe('EditWallet', () => {
  let component: EditWallet;
  let fixture: ComponentFixture<EditWallet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditWallet],
    }).compileComponents();

    fixture = TestBed.createComponent(EditWallet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
