import type { IncomingMessage } from "node:http";
import { ServerResponse } from "node:http";

export function getRequestBody<T = unknown>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => chunks.push(chunk));

    req.on("end", () => {
      try {
        const rawBody = Buffer.concat(chunks).toString("utf-8");

        if (!rawBody) return resolve(null as T);

        const parsedData = JSON.parse(rawBody) as T;
        resolve(parsedData);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", (error) => reject(error));
  });
}

export function responseErrorHandler(
  error: unknown,
  res: ServerResponse,
  code: number = 500,
) {
  let errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  console.error(`Server Error: `, errorMessage);

  if (!res.writableEnded) {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: errorMessage }));
  }
}

export function getErrorMessage(error: unknown, noDefaultMessage?: boolean) {
  if (error instanceof Error && (error as any).isValidationError) {
    return error.message;
  } else if (typeof error === "string" && error && error.length > 0) {
    return error as string;
  } else {
    return !noDefaultMessage ? "no error message!" : null;
  }
}

export function parseRawWsFrame(buffer: Buffer): string | null {
  const firstByte = buffer[0];
  const opcode = firstByte & 0x0f;

  if (opcode === 0x08) return null; // Connection close opcode

  const secondByte = buffer[1];
  const isMasked = (secondByte & 0x80) === 0x80;
  let payloadLength = secondByte & 0x7f;
  let dataStartOffset = 2;

  if (payloadLength === 126) {
    payloadLength = buffer.readUInt16BE(2);
    dataStartOffset = 4;
  } else if (payloadLength === 127) {
    // Highly unlikely for simple log models to hit 64-bit lengths
    return null;
  }

  if (!isMasked) {
    return buffer.toString(
      "utf8",
      dataStartOffset,
      dataStartOffset + payloadLength,
    );
  }

  const maskingKey = buffer.subarray(dataStartOffset, dataStartOffset + 4);
  dataStartOffset += 4;

  const payload = buffer.subarray(
    dataStartOffset,
    dataStartOffset + payloadLength,
  );
  const unmasked = Buffer.alloc(payloadLength);

  for (let i = 0; i < payloadLength; i++) {
    unmasked[i] = payload[i] ^ maskingKey[i % 4];
  }

  return unmasked.toString("utf8");
}

export function constructRawWsFrame(textPayload: string): Buffer {
  const payloadBuffer = Buffer.from(textPayload, "utf8");
  const length = payloadBuffer.length;

  let frameBuffer: Buffer;
  let dataOffset: number;

  if (length < 126) {
    frameBuffer = Buffer.alloc(2 + length);
    frameBuffer[1] = length;
    dataOffset = 2;
  } else if (length <= 65535) {
    frameBuffer = Buffer.alloc(4 + length);
    frameBuffer[1] = 126;
    frameBuffer.writeUInt16BE(length, 2);
    dataOffset = 4;
  } else {
    throw new Error(
      "Payload size limit exceeded for internal native frames setup.",
    );
  }

  frameBuffer[0] = 0x81;
  payloadBuffer.copy(frameBuffer, dataOffset);

  return frameBuffer;
}
