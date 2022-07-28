import { TaskID, isTaskID } from '../../task'
import { weights } from '../../serialization'

import { isPeerID, PeerID } from './types'

export enum type {
  clientConnected,

  serverClientIDMessage,
  clientReadyMessage,
  serverReadyClients,

  clientWeightsMessageServer,
  clientSharesMessageServer,

  clientPartialSumsMessageServer
}

export interface clientConnectedMessage {
  type: type.clientConnected
}

/// Phase 0 communication (just between server and client)

// server sends client id to client
export interface serverClientIDMessage {
  type: type.serverClientIDMessage
  peerID: PeerID
}

// client who sent is ready
export interface clientReadyMessage {
  type: type.clientReadyMessage
  round: number
  peerID: PeerID
  task: TaskID
}

// server send to client who to connect to
export interface serverReadyClients {
  type: type.serverReadyClients
  peerList: PeerID[]
}

/// Phase 1 communication (between client and peers)

// client weights
export interface clientWeightsMessageServer {
  type: type.clientWeightsMessageServer
  peerID: PeerID
  weights: weights.Encoded
  destination: PeerID
}

// client shares
export interface clientSharesMessageServer {
  type: type.clientSharesMessageServer
  peerID: PeerID
  weights: weights.Encoded
  destination: PeerID
}

/// Phase 2 communication (between client and peers)

// client partial sum
export interface clientPartialSumsMessageServer {
  type: type.clientPartialSumsMessageServer
  peerID: PeerID
  partials: weights.Encoded
  destination: PeerID
}

export type ServerMessage =
  clientConnectedMessage |
  serverClientIDMessage |
  serverReadyClients

export type PeerMessage =
  clientReadyMessage |
  clientWeightsMessageServer |
  clientSharesMessageServer |
  clientPartialSumsMessageServer

export type Message = ServerMessage | PeerMessage

export function isServerMessage (raw: unknown): raw is ServerMessage {
  if (typeof raw !== 'object' || raw === null) {
    return false
  }

  const o = raw as Record<string, unknown>
  if (
    !('type' in o && typeof o.type === 'number' && o.type in type)
  ) {
    return false
  }

  switch (o.type) {
    case type.clientConnected:
      return true
    case type.serverClientIDMessage:
      return 'peerID' in o && isPeerID(o.peerID)
    case type.serverReadyClients:
      return 'peerList' in o && Array.isArray(o.peerList) && o.peerList.every(isPeerID)
  }

  return false
}

export function isPeerMessage (raw: unknown): raw is PeerMessage {
  if (typeof raw !== 'object' || raw === null) {
    return false
  }

  const o = raw as Record<string, unknown>
  if (
    !('type' in o && typeof o.type === 'number' && o.type in type)
  ) {
    return false
  }

  switch (o.type) {
    case type.clientReadyMessage:
      return 'round' in o && typeof o.round === 'number' &&
        'task' in o && isTaskID(o.task) &&
        'peerID' in o && isPeerID(o.peerID)
    case type.clientWeightsMessageServer:
    case type.clientSharesMessageServer:
      return 'peerID' in o && isPeerID(o.peerID) &&
        'weights' in o && weights.isEncoded(o.weights) &&
        'destination' in o && isPeerID(o.destination)
    case type.clientPartialSumsMessageServer:
      return 'peerID' in o && isPeerID(o.peerID) &&
        'partials' in o && weights.isEncoded(o.partials) &&
        'destination' in o && isPeerID(o.destination)
  }

  return false
}

export function isMessage (raw: unknown): raw is Message {
  return isServerMessage(raw) || isPeerMessage(raw)
}
