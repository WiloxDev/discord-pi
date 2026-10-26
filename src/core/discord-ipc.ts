import * as net from "node:net";
import * as path from "node:path";
import * as fs from "node:fs";
import { EventEmitter } from "node:events";

export enum IpcOpcode {
  HANDSHAKE = 0,
  FRAME = 1,
  CLOSE = 2,
  PING = 3,
  PONG = 4,
}

export interface IpcPacket {
  opcode: IpcOpcode;
  payload: any;
}

/**
 * Encodes an IPC packet with the 8-byte Little Endian header required by Discord.
 */
export function encodeIpcPacket(opcode: IpcOpcode, payload: Record<string, any>): Buffer {
  const jsonStr = JSON.stringify(payload);
  const jsonBuffer = Buffer.from(jsonStr, "utf8");
  const header = Buffer.alloc(8);
  header.writeUInt32LE(opcode, 0);
  header.writeUInt32LE(jsonBuffer.length, 4);
  return Buffer.concat([header, jsonBuffer]);
}

/**
 * Decodes the first complete IPC packet from a buffer.
 */
export function decodeIpcPacket(buffer: Buffer): { packet: IpcPacket; remainder: Buffer } | null {
  if (buffer.length < 8) {
    return null;
  }
  const opcode = buffer.readUInt32LE(0);
  const length = buffer.readUInt32LE(4);

  if (buffer.length < 8 + length) {
    return null;
  }

  const payloadSlice = buffer.subarray(8, 8 + length);
  const remainder = Buffer.from(buffer.subarray(8 + length));

  try {
    const payload = JSON.parse(payloadSlice.toString("utf8"));
    return {
      packet: { opcode, payload },
      remainder,
    };
  } catch {
    return null;
  }
}

/**
 * Resolves candidate socket or named pipe paths depending on OS (Windows vs Linux/macOS).
 */
export function getIpcCandidatePaths(): string[] {
  const candidates: string[] = [];
  const maxPipes = 10;

  if (process.platform === "win32") {
    for (let i = 0; i < maxPipes; i++) {
      candidates.push(`\\\\.\\pipe\\discord-ipc-${i}`);
    }
    return candidates;
  }

  const xdg = process.env.XDG_RUNTIME_DIR;
  const tmp = process.env.TMPDIR || process.env.TMP || process.env.TEMP || "/tmp";
  const uid = typeof process.getuid === "function" ? process.getuid() : 1000;

  for (let i = 0; i < maxPipes; i++) {
    const pipeName = `discord-ipc-${i}`;
    if (xdg) {
      candidates.push(path.join(xdg, pipeName));
      candidates.push(path.join(xdg, "snap.discord", pipeName));
      candidates.push(path.join(xdg, "app", "com.discordapp.Discord", pipeName));
    }
    candidates.push(`/run/user/${uid}/${pipeName}`);
    candidates.push(`/run/user/${uid}/snap.discord/${pipeName}`);
    candidates.push(path.join(tmp, pipeName));
  }

  // Filter to paths that actually exist (on Unix domain sockets)
  return Array.from(new Set(candidates)).filter((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
}

/**
 * Standalone lightweight Discord IPC Client for Windows and Linux.
 */
export class DiscordIpcConnection extends EventEmitter {
  private socket: net.Socket | null = null;
  private incomingBuffer = Buffer.alloc(0);
  private connected = false;
  private currentPath: string | null = null;
  private nonceCounter = 0;
  private pendingCommands = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private currentUser: any = null;

  constructor(private clientId: string = "1290372891901239328") {
    super();
  }

  public isConnected(): boolean {
    return this.connected && this.socket !== null && !this.socket.destroyed;
  }

  public getCurrentUser(): any {
    return this.currentUser;
  }

  public async connect(): Promise<boolean> {
    if (this.isConnected()) {
      return true;
    }

    const candidates = getIpcCandidatePaths();
    if (candidates.length === 0) {
      return false;
    }

    for (const candidate of candidates) {
      const ok = await this.tryConnectPath(candidate);
      if (ok) {
        this.currentPath = candidate;
        return true;
      }
    }

    return false;
  }

  private tryConnectPath(targetPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = net.connect(targetPath);
      let established = false;

      const timeout = setTimeout(() => {
        if (!established) {
          socket.destroy();
          resolve(false);
        }
      }, 1500);

      socket.once("connect", () => {
        established = true;
        clearTimeout(timeout);
        this.socket = socket;
        this.connected = true;
        this.setupSocketEvents(socket);

        // Send initial Handshake
        this.sendHandshake(this.clientId);
        resolve(true);
      });

      socket.once("error", () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve(false);
      });
    });
  }

  private setupSocketEvents(socket: net.Socket): void {
    socket.on("data", (chunk: Buffer) => {
      this.incomingBuffer = Buffer.concat([this.incomingBuffer, chunk]);

      while (true) {
        const decoded = decodeIpcPacket(this.incomingBuffer);
        if (!decoded) {
          break;
        }
        this.incomingBuffer = Buffer.from(decoded.remainder);
        this.handleIncomingPacket(decoded.packet);
      }
    });

    socket.on("close", () => {
      this.cleanup();
      this.emit("disconnect");
    });

    socket.on("error", (err) => {
      this.emit("error", err);
      this.cleanup();
    });
  }

  private handleIncomingPacket(packet: IpcPacket): void {
    const { opcode, payload } = packet;

    if (opcode === IpcOpcode.FRAME && payload) {
      if (payload.cmd === "DISPATCH") {
        if (payload.evt === "READY") {
          this.currentUser = payload.data?.user || null;
          this.emit("ready", this.currentUser);
        } else {
          this.emit("event", payload.evt, payload.data);
        }
      }

      if (payload.nonce && this.pendingCommands.has(payload.nonce)) {
        const handler = this.pendingCommands.get(payload.nonce)!;
        this.pendingCommands.delete(payload.nonce);
        if (payload.evt === "ERROR") {
          handler.reject(new Error(payload.data?.message || "Discord IPC command error"));
        } else {
          handler.resolve(payload.data);
        }
      }
    } else if (opcode === IpcOpcode.CLOSE) {
      this.cleanup();
      this.emit("disconnect");
    } else if (opcode === IpcOpcode.PING) {
      this.sendRaw(IpcOpcode.PONG, payload || {});
    }
  }

  public sendHandshake(clientId: string): void {
    this.sendRaw(IpcOpcode.HANDSHAKE, {
      v: 1,
      client_id: clientId,
    });
  }

  public sendCommand(cmd: string, args: Record<string, any> = {}): Promise<any> {
    if (!this.isConnected()) {
      return Promise.reject(new Error("Discord IPC no está conectado"));
    }

    const nonce = `cmd_${++this.nonceCounter}_${Date.now()}`;
    const packet = encodeIpcPacket(IpcOpcode.FRAME, {
      cmd,
      args,
      nonce,
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.pendingCommands.has(nonce)) {
          this.pendingCommands.delete(nonce);
          reject(new Error(`Timeout en comando IPC: ${cmd}`));
        }
      }, 3000);

      this.pendingCommands.set(nonce, {
        resolve: (val) => {
          clearTimeout(timeout);
          resolve(val);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        },
      });

      this.socket?.write(packet);
    });
  }

  public async setMute(muted: boolean): Promise<boolean> {
    try {
      await this.sendCommand("SET_VOICE_SETTINGS", { mute: muted });
      return true;
    } catch {
      return false;
    }
  }

  public async getVoiceSettings(): Promise<any> {
    try {
      return await this.sendCommand("GET_VOICE_SETTINGS");
    } catch {
      return null;
    }
  }

  public async getSelectedVoiceChannel(): Promise<any> {
    try {
      return await this.sendCommand("GET_SELECTED_VOICE_CHANNEL");
    } catch {
      return null;
    }
  }

  private sendRaw(opcode: IpcOpcode, payload: Record<string, any>): void {
    if (this.socket && !this.socket.destroyed) {
      const packet = encodeIpcPacket(opcode, payload);
      this.socket.write(packet);
    }
  }

  public cleanup(): void {
    this.connected = false;
    this.currentUser = null;
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.incomingBuffer = Buffer.alloc(0);
    for (const [nonce, { reject }] of this.pendingCommands.entries()) {
      reject(new Error("Conexión IPC cerrada"));
    }
    this.pendingCommands.clear();
  }

  public disconnect(): void {
    this.cleanup();
  }
}
