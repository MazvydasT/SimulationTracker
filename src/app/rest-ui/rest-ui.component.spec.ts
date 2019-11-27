import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RestUiComponent } from './rest-ui.component';

describe('RestUiComponent', () => {
  let component: RestUiComponent;
  let fixture: ComponentFixture<RestUiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RestUiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RestUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
