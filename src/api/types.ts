import type { Request, Response, NextFunction } from "express";

export interface ErrorResponse {
  error: string;
  details?: string;
}

export interface PingResponse {
  status: "pong";
  timestamp: string;
}

export interface HealthCheckResponse {
  status: "connected" | "disconnected" | "error";
  message?: string;
}

export interface EvolutionInstanceRaw {
  instance?: {
    instanceName?: string;
    name?: string;
    connectionStatus?: string;
    status?: string;
    [key: string]: unknown;
  };
  instanceName?: string;
  name?: string;
  connectionStatus?: string;
  status?: string;
  [key: string]: unknown;
}

export interface EvolutionInstance {
  instanceName: string;
  connectionStatus: string;
  ownerJid?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  profileName?: string;
  [key: string]: unknown;
}

export interface EvolutionFetchInstancesResponse {
  status: "connected" | "disconnected";
  message?: string;
}

export interface StoryPayload {
  type: "text" | "image";
  content: string;
  allContacts: true;
  backgroundColor?: string;
  font?: number;
  caption?: string;
}

export interface PostStoryRequest {
  type: "text" | "image";
  content: string;
  caption?: string;
  backgroundColor?: string;
  font?: number;
  instanceName?: string;
}

export interface SuccessResponse {
  success: boolean;
}

export interface AuthRequest extends Request {
  password?: string;
}

export type AuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => void;
