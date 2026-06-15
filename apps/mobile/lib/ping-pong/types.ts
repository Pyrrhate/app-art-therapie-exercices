export const PING_PONG_MAX_TURNS = 4;

export interface PingPongTurn {
  id: string;
  word: string;
  from: "user" | "ai";
}

export interface PingPongResponse {
  word: string;
  source: "ai" | "fallback";
}
