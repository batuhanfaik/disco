import { List } from 'immutable'

import { Weights } from './types'

export function averageWeights (peersWeights: List<Weights>): Weights {
  console.log('Aggregating a list of', peersWeights.size, 'weight vectors.')
  const firstWeightSize = peersWeights.first()?.length
  if (firstWeightSize === undefined) {
    throw new Error('no weights to average')
  }
  if (!peersWeights.rest().every((ws) => ws.length === firstWeightSize)) {
    throw new Error('weights dimensions are different for some of the summands')
  }

  const numberOfPeers = peersWeights.size
  const peersAverageWeights = peersWeights.reduce((accum: Weights, weights) => {
    return accum.map((w, i) => w.add(weights[i]))
  }).map((w) => w.div(numberOfPeers))

  return peersAverageWeights
}
