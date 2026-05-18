import { describe, it, expect } from 'vitest';
import { parsePageParam, clampPage } from './pagination';

describe('parsePageParam', () => {
  it('defaults to 1 when undefined', () => {
    expect(parsePageParam(undefined)).toBe(1);
  });
  it('defaults to 1 for non-numeric', () => {
    expect(parsePageParam('abc')).toBe(1);
  });
  it('defaults to 1 for zero or negative', () => {
    expect(parsePageParam('0')).toBe(1);
    expect(parsePageParam('-3')).toBe(1);
  });
  it('parses positive integers', () => {
    expect(parsePageParam('5')).toBe(5);
  });
  it('floors decimals', () => {
    expect(parsePageParam('3.9')).toBe(3);
  });
  it('takes the first value when given an array', () => {
    expect(parsePageParam(['4', '7'])).toBe(4);
  });
});

describe('clampPage', () => {
  it('clamps above pageCount', () => {
    expect(clampPage(10, 3)).toBe(3);
  });
  it('clamps below 1', () => {
    expect(clampPage(0, 5)).toBe(1);
  });
  it('returns 1 when there are no pages', () => {
    expect(clampPage(1, 0)).toBe(1);
  });
  it('passes through valid page', () => {
    expect(clampPage(2, 5)).toBe(2);
  });
});
