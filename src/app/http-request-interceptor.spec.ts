import { HttpRequestInterceptor } from './http-request-interceptor';

describe('ServerErrorInterceptor', () => {
  it('should create an instance', () => {
    expect(new HttpRequestInterceptor()).toBeTruthy();
  });
});
