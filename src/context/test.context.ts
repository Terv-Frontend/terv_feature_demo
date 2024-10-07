import { createContext } from 'react';

export const TestContext = createContext<{
  largeScreen?: boolean;
  lightMode: boolean;
  mediumScreen?: boolean;
  smallScreen?: boolean;
}>({
  lightMode: true,
});
