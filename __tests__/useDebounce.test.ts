import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../src/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce the value', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    expect(result.current).toBe('initial');

    rerender({ value: 'changed', delay: 500 });
    
    // Should still be initial before timer fires
    expect(result.current).toBe('initial');

    // Advance timer by 499ms, should still be initial
    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial');

    // Advance timer by 1ms, should be changed
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('changed');
  });
});
