#!/usr/bin/env python3
import asyncio
import base64
import hashlib
import json
import os
import struct
import sys

GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
ROOMS = {}
CLIENTS = {}


async def read_exact(reader, size):
  data = await reader.readexactly(size)
  return data


async def read_frame(reader):
  first = await read_exact(reader, 2)
  opcode = first[0] & 0x0F
  masked = first[1] & 0x80
  length = first[1] & 0x7F

  if length == 126:
    length = struct.unpack('!H', await read_exact(reader, 2))[0]
  elif length == 127:
    length = struct.unpack('!Q', await read_exact(reader, 8))[0]

  mask = await read_exact(reader, 4) if masked else b''
  payload = await read_exact(reader, length) if length else b''

  if masked:
    payload = bytes(byte ^ mask[index % 4] for index, byte in enumerate(payload))

  if opcode == 8:
    return None

  return payload.decode()


async def send_frame(writer, message):
  payload = message.encode()
  header = bytearray([0x81])

  if len(payload) < 126:
    header.append(len(payload))
  elif len(payload) < (1 << 16):
    header.append(126)
    header.extend(struct.pack('!H', len(payload)))
  else:
    header.append(127)
    header.extend(struct.pack('!Q', len(payload)))

  writer.write(bytes(header) + payload)
  await writer.drain()


async def send_json(writer, message):
  await send_frame(writer, json.dumps(message, separators=(',', ':')))


async def handshake(reader, writer):
  request = b''
  while b'\r\n\r\n' not in request:
    request += await reader.read(4096)

  headers = {}
  for line in request.decode(errors='ignore').split('\r\n')[1:]:
    if ':' in line:
      key, value = line.split(':', 1)
      headers[key.lower()] = value.strip()

  accept = base64.b64encode(
    hashlib.sha1((headers['sec-websocket-key'] + GUID).encode()).digest(),
  ).decode()
  writer.write(
    (
      'HTTP/1.1 101 Switching Protocols\r\n'
      'Upgrade: websocket\r\n'
      'Connection: Upgrade\r\n'
      f'Sec-WebSocket-Accept: {accept}\r\n\r\n'
    ).encode(),
  )
  await writer.drain()


async def leave(client_id):
  client = CLIENTS.pop(client_id, None)
  if not client:
    return

  room = ROOMS.get(client['roomId'])
  if not room:
    return

  room.pop(client_id, None)
  for peer in list(room.values()):
    await send_json(peer['writer'], {'type': 'PEER_LEAVE', 'peerId': client_id})

  if not room:
    ROOMS.pop(client['roomId'], None)


async def join_room(room_id, client_id, writer):
  room = ROOMS.setdefault(room_id, {})
  CLIENTS[client_id] = {'roomId': room_id, 'writer': writer}

  for peer_id, peer in list(room.items()):
    await send_json(writer, {'type': 'PEER_JOIN', 'peerId': peer_id})
    await send_json(peer['writer'], {'type': 'PEER_JOIN', 'peerId': client_id})

  room[client_id] = {'writer': writer}


async def route_room_message(sender_id, message):
  sender = CLIENTS.get(sender_id)
  if not sender:
    return

  room = ROOMS.get(sender['roomId'], {})
  payload = {
    'type': 'ROOM_MESSAGE',
    'from': sender_id,
    'data': message.get('data'),
  }
  target = message.get('target')

  if target:
    peer = room.get(target)
    if peer:
      await send_json(peer['writer'], payload)
    return

  for peer_id, peer in list(room.items()):
    if peer_id != sender_id:
      await send_json(peer['writer'], payload)


async def handle_client(reader, writer):
  client_id = None

  try:
    await handshake(reader, writer)

    while True:
      raw = await read_frame(reader)
      if raw is None:
        break

      message = json.loads(raw)

      if message.get('type') == 'JOIN':
        client_id = message['clientId']
        await join_room(message['roomId'], client_id, writer)
      elif message.get('type') == 'ROOM_MESSAGE' and client_id:
        await route_room_message(client_id, message)
  except (asyncio.IncompleteReadError, ConnectionError, json.JSONDecodeError, KeyError):
    pass
  finally:
    if client_id:
      await leave(client_id)
    writer.close()
    await writer.wait_closed()


async def main():
  port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get('PORT', '8787'))
  host = sys.argv[2] if len(sys.argv) > 2 else os.environ.get('HOST', '127.0.0.1')
  server = await asyncio.start_server(handle_client, host, port)
  sockets = ', '.join(str(sock.getsockname()) for sock in server.sockets)
  print(f'Coffee Rush dev relay listening on {sockets}', flush=True)

  async with server:
    await server.serve_forever()


if __name__ == '__main__':
  asyncio.run(main())
