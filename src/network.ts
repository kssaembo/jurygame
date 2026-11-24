import Peer, { type DataConnection } from 'peerjs';
import type { GameState } from './types';

export type JuryNetworkStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type ClientMessage =
  | { type: 'PROJECTOR_HELLO'; projectorId: string }
  | { type: 'PING'; sentAt: number };

type HostMessage =
  | { type: 'STATE'; state: GameState }
  | { type: 'PONG'; sentAt: number };

const hostPeerId = (roomCode: string) => `jury-game-${roomCode.toLowerCase()}-host`;
const HEARTBEAT_MS = 5_000;
const SILENCE_LIMIT_MS = 15_000;

export const createRoomCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  return Array.from(bytes, value => alphabet[value % alphabet.length]).join('');
};

export const createProjectorId = () => globalThis.crypto?.randomUUID?.() ?? `projector-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export class JuryHostNetwork {
  private peer?: Peer;
  private connections = new Map<string, DataConnection>();
  private retryTimer?: number;
  private retryAttempt = 0;
  private stopped = false;

  constructor(private roomCode: string, private currentState: GameState, private onError: (message: string) => void) {}

  connect() {
    this.stopped = false;
    this.openPeer();
  }

  updateState(state: GameState) {
    this.currentState = state;
    for (const connection of this.connections.values()) this.send(connection, { type: 'STATE', state });
  }

  disconnect() {
    this.stopped = true;
    if (this.retryTimer) window.clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
    for (const connection of this.connections.values()) connection.close();
    this.connections.clear();
    this.peer?.destroy();
    this.peer = undefined;
  }

  private openPeer() {
    if (this.stopped) return;
    const peer = new Peer(hostPeerId(this.roomCode), { debug: 1 });
    this.peer = peer;
    peer.on('open', () => {
      if (this.peer !== peer || this.stopped) return;
      this.retryAttempt = 0;
      if (this.retryTimer) window.clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    });
    peer.on('connection', connection => this.accept(peer, connection));
    peer.on('disconnected', () => this.scheduleReconnect(peer));
    peer.on('error', error => {
      if (this.peer !== peer || this.stopped) return;
      this.onError(`PeerJS: ${error.message}`);
      this.scheduleReconnect(peer, true);
    });
  }

  private accept(peer: Peer, connection: DataConnection) {
    if (this.peer !== peer || this.stopped) return connection.close();
    let projectorId = '';
    connection.on('data', raw => {
      const message = raw as ClientMessage;
      if (message.type === 'PROJECTOR_HELLO') {
        projectorId = message.projectorId;
        this.connections.get(projectorId)?.close();
        this.connections.set(projectorId, connection);
        this.send(connection, { type: 'STATE', state: this.currentState });
      }
      if (message.type === 'PING') this.send(connection, { type: 'PONG', sentAt: message.sentAt });
    });
    const remove = () => {
      if (projectorId && this.connections.get(projectorId) === connection) this.connections.delete(projectorId);
    };
    connection.on('close', remove);
    connection.on('error', remove);
  }

  private send(connection: DataConnection, message: HostMessage) {
    if (!connection.open) return;
    try { connection.send(message); } catch { connection.close(); }
  }

  private scheduleReconnect(peer: Peer, recreate = false) {
    if (this.stopped || this.peer !== peer || this.retryTimer) return;
    const delay = Math.min(1000 * 2 ** this.retryAttempt, 10_000);
    this.retryAttempt += 1;
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = undefined;
      if (this.stopped || this.peer !== peer) return;
      try {
        if (recreate || peer.destroyed) {
          if (!peer.destroyed) peer.destroy();
          this.openPeer();
        } else if (peer.disconnected) peer.reconnect();
      } catch {
        try { peer.destroy(); } catch { /* already closed */ }
        this.openPeer();
      }
    }, delay);
  }
}

export class JuryProjectorNetwork {
  private peer?: Peer;
  private connection?: DataConnection;
  private retryTimer?: number;
  private heartbeatTimer?: number;
  private retryAttempt = 0;
  private generation = 0;
  private lastMessageAt = 0;
  private stopped = false;

  constructor(
    private roomCode: string,
    private projectorId: string,
    private onState: (state: GameState) => void,
    private onStatus: (status: JuryNetworkStatus, message?: string) => void,
  ) {}

  connect() {
    this.stopped = false;
    this.openPeer();
  }

  disconnect() {
    this.stopped = true;
    this.generation += 1;
    this.clearTimers();
    this.connection?.close();
    this.peer?.destroy();
  }

  private openPeer() {
    if (this.stopped) return;
    const generation = ++this.generation;
    this.onStatus(this.retryAttempt ? 'disconnected' : 'connecting');
    const peer = new Peer({ debug: 1 });
    this.peer = peer;
    peer.on('open', () => {
      if (this.stopped || generation !== this.generation) return;
      const connection = peer.connect(hostPeerId(this.roomCode), { reliable: true, serialization: 'json' });
      this.connection = connection;
      connection.on('open', () => {
        if (this.stopped || generation !== this.generation) return;
        this.retryAttempt = 0;
        this.lastMessageAt = Date.now();
        this.onStatus('connected');
        connection.send({ type: 'PROJECTOR_HELLO', projectorId: this.projectorId } satisfies ClientMessage);
        this.startHeartbeat(generation);
      });
      connection.on('data', raw => this.handleMessage(raw as HostMessage));
      connection.on('close', () => this.scheduleReconnect(generation));
      connection.on('error', () => this.scheduleReconnect(generation));
    });
    peer.on('error', error => {
      if (this.stopped || generation !== this.generation) return;
      this.onStatus('error', `PeerJS: ${error.message}`);
      this.scheduleReconnect(generation);
    });
    peer.on('disconnected', () => this.scheduleReconnect(generation));
  }

  private handleMessage(message: HostMessage) {
    this.lastMessageAt = Date.now();
    if (message.type === 'STATE') this.onState(message.state);
  }

  private startHeartbeat(generation: number) {
    if (this.heartbeatTimer) window.clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = window.setInterval(() => {
      if (this.stopped || generation !== this.generation) return;
      if (!this.connection?.open || Date.now() - this.lastMessageAt >= SILENCE_LIMIT_MS) return this.scheduleReconnect(generation);
      this.connection.send({ type: 'PING', sentAt: Date.now() } satisfies ClientMessage);
    }, HEARTBEAT_MS);
  }

  private scheduleReconnect(generation: number) {
    if (this.stopped || generation !== this.generation || this.retryTimer) return;
    this.generation += 1;
    this.onStatus('disconnected', '교사 운영 화면과 다시 연결하고 있습니다.');
    if (this.heartbeatTimer) window.clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
    const connection = this.connection;
    const peer = this.peer;
    this.connection = undefined;
    this.peer = undefined;
    connection?.close();
    peer?.destroy();
    const delay = Math.min(1000 * 2 ** this.retryAttempt, 10_000);
    this.retryAttempt += 1;
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = undefined;
      this.openPeer();
    }, delay);
  }

  private clearTimers() {
    if (this.retryTimer) window.clearTimeout(this.retryTimer);
    if (this.heartbeatTimer) window.clearInterval(this.heartbeatTimer);
    this.retryTimer = undefined;
    this.heartbeatTimer = undefined;
  }
}
