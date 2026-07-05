export const PING_PONG_USER_TURNS = 3;

/** 5 étapes : humain → IA → humain → IA → humain */
export const PING_PONG_TOTAL_STEPS = PING_PONG_USER_TURNS * 2 - 1;

export interface PingPongTurn {
  id: string;
  from: "user" | "ai";
  word: string;
  logicalWord?: string;
  suggestedWord?: string;
}

export interface PingPongAiReply {
  logicalWord: string;
  suggestedWord: string;
  source: "ai" | "fallback";
}

export interface PingPongResponse {
  logicalWord: string;
  suggestedWord: string;
  source: "ai" | "fallback";
}

/** @deprecated Utiliser PING_PONG_USER_TURNS */
export const PING_PONG_MAX_TURNS = PING_PONG_USER_TURNS;
