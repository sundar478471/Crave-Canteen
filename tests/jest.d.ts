declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void | Promise<void>): void;
declare function it(name: string, fn: () => void | Promise<void>): void;
declare function beforeAll(fn: () => void | Promise<void>): void;
declare function beforeEach(fn: () => void | Promise<void>): void;
declare function afterAll(fn: () => void | Promise<void>): void;
declare function afterEach(fn: () => void | Promise<void>): void;

interface ExpectMatchers {
  toBe(expected: any): void;
  toEqual(expected: any): void;
  toBeDefined(): void;
  toBeNull(): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toContain(item: any): void;
  toHaveBeenCalledWith(...args: any[]): void;
  toHaveBeenCalled(): void;
  toBeGreaterThan(expected: number): void;
  not: ExpectMatchers;
}

declare function expect(actual: any): ExpectMatchers;

declare const jest: {
  fn(implementation?: (...args: any[]) => any): any;
};
