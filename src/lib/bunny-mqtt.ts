const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type PublishHandler = (topic: string, payload: string) => void;

function encodeLength(length: number) {
  const bytes: number[] = [];
  do {
    let digit = length % 128;
    length = Math.floor(length / 128);
    if (length > 0) digit |= 0x80;
    bytes.push(digit);
  } while (length > 0);
  return bytes;
}

function utf8(value: string) {
  const bytes = [...encoder.encode(value)];
  return [bytes.length >> 8, bytes.length & 0xff, ...bytes];
}

function frame(header: number, body: number[]) {
  return new Uint8Array([header, ...encodeLength(body.length), ...body]);
}

function readString(bytes: Uint8Array, offset: number) {
  if (offset + 2 > bytes.length) return null;
  const length = (bytes[offset] << 8) | bytes[offset + 1];
  const start = offset + 2;
  if (start + length > bytes.length) return null;
  return { value: decoder.decode(bytes.subarray(start, start + length)), next: start + length };
}

function nextPacket(bytes: Uint8Array, offset: number) {
  if (offset + 2 > bytes.length) return null;
  const header = bytes[offset];
  let multiplier = 1;
  let remaining = 0;
  let index = offset + 1;
  let digit = 0;
  do {
    if (index >= bytes.length) return null;
    digit = bytes[index++];
    remaining += (digit & 0x7f) * multiplier;
    multiplier *= 128;
    if (multiplier > 128 * 128 * 128 * 128) return null;
  } while (digit & 0x80);
  if (index + remaining > bytes.length) return null;
  return { header, body: bytes.subarray(index, index + remaining), next: index + remaining };
}

export class BunnySocket {
  private ws: WebSocket | null = null;
  private seq = 1;
  private ping: ReturnType<typeof setInterval> | null = null;
  private stopped = false;
  private buffer = new Uint8Array(0);

  constructor(
    private url: string,
    private clientId: string,
    private willTopic: string,
    private onReady: () => void,
    private onPublish: PublishHandler,
    private onDown: (reason: string) => void,
  ) {}

  start() {
    this.stopped = false;
    this.open();
  }

  stop() {
    this.stopped = true;
    this.clearPing();
    try {
      this.send(0xe0, []);
    } catch {
      /* socket may already be gone */
    }
    this.ws?.close();
    this.ws = null;
  }

  publish(topic: string, value: string, retained = false) {
    const data = [...encoder.encode(value)];
    this.send(retained ? 0x31 : 0x30, [...utf8(topic), ...data]);
  }

  private open() {
    if (this.stopped) return;
    const ws = new WebSocket(this.url, "mqtt");
    ws.binaryType = "arraybuffer";
    this.ws = ws;
    ws.onopen = () => {
      const keepAlive = 30;
      const body = [
        ...utf8("MQTT"),
        4,
        0x26,
        keepAlive >> 8,
        keepAlive & 0xff,
        ...utf8(this.clientId),
        ...utf8(this.willTopic),
        ...utf8(""),
      ];
      ws.send(frame(0x10, body));
    };
    ws.onmessage = (event) => {
      const chunk = new Uint8Array(event.data as ArrayBuffer);
      const merged = new Uint8Array(this.buffer.length + chunk.length);
      merged.set(this.buffer);
      merged.set(chunk, this.buffer.length);
      this.buffer = merged;
      let offset = 0;
      while (offset < this.buffer.length) {
        const parsed = nextPacket(this.buffer, offset);
        if (!parsed) break;
        this.onPacket(parsed.header, parsed.body);
        offset = parsed.next;
      }
      this.buffer = this.buffer.slice(offset);
    };
    ws.onerror = () => this.onDown("Could not reach the room");
    ws.onclose = () => {
      this.clearPing();
      if (!this.stopped) this.onDown("Disconnected");
    };
  }

  private onPacket(header: number, body: Uint8Array) {
    const kind = header >> 4;
    if (kind === 2) {
      if (body.length < 2 || body[1] !== 0) {
        this.onDown("The room refused the connection");
        this.ws?.close();
        return;
      }
      this.subscribe("bunny-rtc/public/chat");
      this.subscribe("bunny-rtc/public/history/+");
      this.subscribe("bunny-rtc/public/presence/+");
      this.clearPing();
      this.ping = setInterval(() => this.send(0xc0, []), 15000);
      this.onReady();
      return;
    }
    if (kind === 13) return;
    if (kind !== 3) return;
    const qos = (header >> 1) & 0x03;
    const topicField = readString(body, 0);
    if (!topicField) return;
    let cursor = topicField.next;
    if (qos > 0 && cursor + 2 <= body.length) {
      const id = (body[cursor] << 8) | body[cursor + 1];
      if (qos === 1) this.send(0x40, [id >> 8, id & 0xff]);
      cursor += 2;
    }
    this.onPublish(topicField.value, decoder.decode(body.subarray(cursor)));
  }

  private subscribe(topic: string) {
    const id = this.seq++ & 0xffff;
    this.send(0x82, [id >> 8, id & 0xff, ...utf8(topic), 0]);
  }

  private send(header: number, body: number[]) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(frame(header, body));
  }

  private clearPing() {
    if (this.ping) clearInterval(this.ping);
    this.ping = null;
  }
}
