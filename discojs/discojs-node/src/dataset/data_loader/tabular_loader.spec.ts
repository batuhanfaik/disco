import { assert, expect } from 'chai'
import { List } from 'immutable'

import { tf, tasks, node } from '@epfml/discojs-node'

const inputFiles = ['../../example_training_data/titanic_train.csv']

describe('tabular loader', () => {
  it('loads a single sample', async () => {
    const titanic = tasks.titanic.task
    const loaded = new node.data_loader.NodeTabularLoader(titanic, ',').loadAll(
      inputFiles,
      {
        features: titanic.trainingInformation?.inputColumns,
        labels: titanic.trainingInformation?.outputColumns,
        shuffle: false
      }
    )
    const sample = await (await (await loaded).train.dataset.iterator()).next()
    /**
     * Data loaders simply return a dataset object read from input sources.
     * They do NOT apply any transform/conversion, which is left to the
     * dataset builder.
     */
    expect(sample).to.eql({
      value: {
        xs: [1, 3, 22, 1, 0, 7.25],
        ys: [0]
      },
      done: false
    })
  })

  it('shuffles samples', async () => {
    const titanic = tasks.titanic.task
    const loader = new node.data_loader.NodeTabularLoader(titanic, ',')
    const config = {
      features: titanic.trainingInformation?.inputColumns,
      labels: titanic.trainingInformation?.outputColumns,
      shuffle: false
    }
    const dataset = await (await loader
      .loadAll(inputFiles, config))
      .train.dataset.toArray()
    const shuffled = await (await loader
      .loadAll(inputFiles, { ...config, shuffle: true }))
      .train.dataset.toArray()

    const misses = List(dataset).zip(List(shuffled)).map(([d, s]) =>
      tf.notEqual((d as any).xs, (s as any).xs).any().dataSync()[0]
    ).reduce((acc: number, e) => acc + e)
    assert(misses > 0)
  })
})
