import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../src/types/express';

/**
 * Create a mock Express Request object for testing
 */
export const mockRequest = (options: {
  body?: any;
  params?: any;
  query?: any;
  session?: any;
  headers?: any;
  method?: string;
  url?: string;
  ip?: string;
} = {}): Partial<AuthenticatedRequest> => {
  const req: any = {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    session: options.session || {},
    headers: options.headers || {},
    method: options.method || 'GET',
    url: options.url || '/',
    ip: options.ip || '127.0.0.1',
  };

  req.get = jest.fn((header: string) => {
    return req.headers[header.toLowerCase()] || undefined;
  });

  return req as Partial<AuthenticatedRequest>;
};

/**
 * Create a mock Express Response object for testing
 */
export const mockResponse = (): Partial<Response> => {
  const res: any = {
    statusCode: 200,
    body: null,
    headers: {},
  };

  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });

  res.json = jest.fn((data: any) => {
    res.body = data;
    return res;
  });

  res.send = jest.fn((data: any) => {
    res.body = data;
    return res;
  });

  res.download = jest.fn((path: string, filename: string, callback?: (err: Error | null) => void) => {
    if (callback) {
      callback(null);
    }
    return res;
  });

  res.setHeader = jest.fn((name: string, value: string | string[]) => {
    res.headers[name] = value;
    return res;
  });

  res.removeHeader = jest.fn((name: string) => {
    delete res.headers[name];
    return res;
  });

  return res as Partial<Response>;
};

/**
 * Create a mock authenticated teacher request
 */
export const mockTeacherRequest = (options: {
  body?: any;
  params?: any;
  query?: any;
} = {}): Partial<AuthenticatedRequest> => {
  return mockRequest({
    ...options,
    session: {
      isTeacher: true,
    },
  });
};

/**
 * Create a mock unauthenticated request
 */
export const mockUnauthenticatedRequest = (options: {
  body?: any;
  params?: any;
  query?: any;
} = {}): Partial<AuthenticatedRequest> => {
  return mockRequest({
    ...options,
    session: {
      isTeacher: false,
    },
  });
};
