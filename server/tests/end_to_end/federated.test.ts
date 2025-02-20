import fs from 'fs/promises'
import path from 'node:path'
import { Server } from 'node:http'
import { Range } from 'immutable'

import { node, ConsoleLogger, training, TrainingSchemes, informant, EmptyMemory, tasks, client as clients } from '@epfml/discojs-node'

import { getClient, startServer } from '../utils'

const SCHEME = TrainingSchemes.FEDERATED

describe('end to end federated', function () {
  this.timeout(60_000)

  let server: Server
  before(async () => { server = await startServer() })
  after(() => { server?.close() })

  it('runs cifar 10 with two users', async () =>
    await Promise.all([cifar10user(), cifar10user()]))

  async function cifar10user (): Promise<void> {
    const dir = '../example_training_data/CIFAR10/'
    const files = (await fs.readdir(dir)).map((file) => path.join(dir, file))
    const labels = Range(0, 24).map((label) => (label % 10).toString()).toArray()

    const cifar10 = tasks.cifar10.task

    const data = await new node.data_loader.NodeImageLoader(cifar10).loadAll(files, { labels: labels })

    const client = await getClient(clients.federated.Client, server, cifar10)
    await client.connect()

    const disco = new training.Disco(
      cifar10,
      new ConsoleLogger(),
      new EmptyMemory(),
      SCHEME,
      new informant.DecentralizedInformant(cifar10.taskID, 10),
      client
    )

    await disco.startTraining(data)
  }

  it('runs titanic with two users', async () =>
    await Promise.all([titanicUser(), titanicUser()]))

  async function titanicUser (): Promise<void> {
    const files = ['../example_training_data/titanic_train.csv']

    // TODO: can load data, so path is right.
    // console.log(await tf.data.csv('file://'.concat(dir)).toArray())
    const titanic = tasks.titanic.task
    const data = await (new node.data_loader.NodeTabularLoader(titanic, ',').loadAll(
      files,
      {
        features: titanic.trainingInformation.inputColumns,
        labels: titanic.trainingInformation.outputColumns,
        shuffle: false
      }
    ))

    const client = await getClient(clients.federated.Client, server, titanic)
    await client.connect()

    const disco = new training.Disco(
      titanic,
      new ConsoleLogger(),
      new EmptyMemory(),
      SCHEME,
      new informant.FederatedInformant(titanic.taskID, 10),
      client
    )

    await disco.startTraining(data)
  }
})
