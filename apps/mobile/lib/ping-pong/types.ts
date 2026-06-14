export const PING_PONG_MAX_TURNS = 6;

export interface PingPongTurn {
  id: string;
  word: string;
  from: "user" | "ai";
}

export interface PingPongResponse {
  word: string;
  source: "ai" | "fallback";
}
