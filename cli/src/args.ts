// eslint-disable-file @typescript-eslint/prefer-ts-expect-error
import {parse} from 'ts-command-line-args'
import {Map} from 'immutable'

import {tasks, node, Task} from '@epfml/discojs-node'

interface BenchmarkUnsafeArguments {
  task: string
  numberOfUsers: number
  epochs: number
  roundDuration: number
  batchSize: number
  save: boolean
  help?: boolean
}

const argExample = 'e.g. npm run benchmark -- -u 2 -e 3, runs 2 users for 3 epochs'

const unsafeArgs = parse<BenchmarkUnsafeArguments>(
  {
    // @ts-ignore
    task: {type: String, alias: 't', description: 'Task', optional: true},
    // @ts-ignore
    numberOfUsers: {type: Number, alias: 'u', description: 'Number of users', optional: true},
    // @ts-ignore
    epochs: {type: Number, alias: 'e', description: 'Number of epochs', optional: true},
    // @ts-ignore
    roundDuration: {type: Number, alias: 'r', description: 'Round duration', optional: true},
    // @ts-ignore
    batchSize: {type: Number, alias: 'b', description: 'Round duration', optional: true},
    // @ts-ignore
    save: {type: Boolean, alias: 's', description: 'Save logs of benchmark', default: false},
    help: {type: Boolean, optional: true, alias: 'h', description: 'Prints this usage guide'}
  },
  {
    helpArg: 'help',
    headerContentSections: [{header: 'Disco benchmark', content: 'npm run benchmark -- [Options]\n' + argExample}]
  }
)

const taskID = unsafeArgs.task === undefined ? 'simple_face' : unsafeArgs.task
let task = tasks.simple_face.task

let supportedTasks: Map<string, Task> = Map()
supportedTasks = supportedTasks.set(tasks.simple_face.task.taskID, tasks.simple_face.task)
supportedTasks = supportedTasks.set(tasks.titanic.task.taskID, tasks.titanic.task)
supportedTasks = supportedTasks.set(tasks.cifar10.task.taskID, tasks.cifar10.task)

const task_ = supportedTasks.get(taskID)

if (task_ !== undefined) {
  task = task_
} else {
  throw Error(`${unsafeArgs.task} not implemented.`)
}

// TODO: Default args for non boolean did not seem to work
const numberOfUsers = unsafeArgs.numberOfUsers === undefined ? 1 : unsafeArgs.numberOfUsers
const roundDuration = unsafeArgs.roundDuration === undefined ? 10 : unsafeArgs.roundDuration
const epochs = unsafeArgs.epochs === undefined ? 10 : unsafeArgs.epochs
const batchSize = unsafeArgs.batchSize === undefined ? 10 : unsafeArgs.batchSize

// Override training information 
if (task.trainingInformation !== undefined) {
  task.trainingInformation.batchSize = batchSize
  task.trainingInformation.roundDuration = roundDuration
  task.trainingInformation.epochs = epochs
  // For DP
  // TASK.trainingInformation.clippingRadius = 10000000
  // TASK.trainingInformation.noiseScale = 0
}

interface BenchmarkArguments {
  task: Task
  numberOfUsers: number
  epochs: number
  roundDuration: number
  batchSize: number
  save: boolean
}

export const args: BenchmarkArguments = {
  task,
  numberOfUsers,
  epochs,
  roundDuration,
  batchSize,
  save: unsafeArgs.save,
}
