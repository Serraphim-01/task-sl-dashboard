/// <reference types="react-scripts" />

// Type definitions for Create React App environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly REACT_APP_API_URL?: string;
    readonly REACT_APP_WS_URL?: string;
  }
}
