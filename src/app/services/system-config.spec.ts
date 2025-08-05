import { TestBed } from '@angular/core/testing';

import { SystemConfig } from './system-config';

describe('SystemConfig', () => {
  let service: SystemConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SystemConfig);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
