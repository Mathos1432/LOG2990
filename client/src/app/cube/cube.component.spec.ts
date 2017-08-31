import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {AppModule} from '../app.module';
import { CubeComponent } from './cube.component';

describe('CubeComponent', () => {
  let component: CubeComponent;
  let fixture: ComponentFixture<CubeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        AppModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CubeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
