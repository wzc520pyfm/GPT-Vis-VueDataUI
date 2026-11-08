import { vi } from 'vitest';

class ResizeObserverMock implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  writable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

Object.defineProperty(globalThis, 'requestAnimationFrame', {
  configurable: true,
  writable: true,
  value: (callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(performance.now()), 0),
});

Object.defineProperty(globalThis, 'cancelAnimationFrame', {
  configurable: true,
  writable: true,
  value: (handle: number) => window.clearTimeout(handle),
});

const svgPrototype = SVGElement.prototype as unknown as {
  getBBox?: () => DOMRect;
};

if (!svgPrototype.getBBox) {
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 100, height: 20 }),
  });
}

if (!('getTotalLength' in SVGElement.prototype)) {
  Object.defineProperty(SVGElement.prototype, 'getTotalLength', {
    configurable: true,
    value: () => 100,
  });
}

if (!('getPointAtLength' in SVGElement.prototype)) {
  Object.defineProperty(SVGElement.prototype, 'getPointAtLength', {
    configurable: true,
    value: (length: number) => ({ x: length, y: 0 }),
  });
}

Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: { writeText: () => Promise.resolve() },
});
