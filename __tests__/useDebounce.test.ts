import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../src/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return the initial value immediately', async () => {
    // @ts-ignore: testing-library types are incorrect in this version
    const hook = await renderHook(() => useDebounce('initial', 500));
    const { result } = hook;
    expect(result.current).toBe('initial');
  });

  it('should debounce the value', async () => {
    // @ts-ignore: testing-library types are incorrect in this version
    const { result, rerender } = await renderHook(({ value, delay }: { value: string, delay: number }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    expect(result.current).toBe('initial');

    rerender({ value: 'changed', delay: 500 });
    
    // Should still be initial before timer fires
    expect(result.current).toBe('initial');

    // Advance timer by 499ms, should still be initial
    await act(async () => {
      jest.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial');

    // Advance timer by 1ms, should be changed
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('changed');
  });
});
