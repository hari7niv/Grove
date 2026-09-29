import React, { useEffect, useState } from 'react';
import { create, act } from 'react-test-renderer';
import { useDebounce } from '../src/hooks/useDebounce';

function TestComponent({ value, delay, onDebounce }: { value: string, delay: number, onDebounce: (val: string) => void }) {
  const debounced = useDebounce(value, delay);
  useEffect(() => {
    onDebounce(debounced);
  }, [debounced, onDebounce]);
  return null;
}

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should debounce the value', () => {
    let latestValue = '';
    const onDebounce = jest.fn((val: string) => {
      latestValue = val;
    });

    let root: any;
    act(() => {
      root = create(<TestComponent value="initial" delay={500} onDebounce={onDebounce} />);
    });

    expect(latestValue).toBe('initial');

    act(() => {
      root.update(<TestComponent value="changed" delay={500} onDebounce={onDebounce} />);
    });

    // Should still be initial before timer fires
    expect(latestValue).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(latestValue).toBe('changed');
  });
});
