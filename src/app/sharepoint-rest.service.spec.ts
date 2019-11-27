import { TestBed } from '@angular/core/testing';

import { SharepointRestService } from './sharepoint-rest.service';

describe('RestService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SharepointRestService = TestBed.get(SharepointRestService);
    expect(service).toBeTruthy();
  });
});
