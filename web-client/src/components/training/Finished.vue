<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 items-stretch">
    <!-- Save the model -->
    <ButtonCard
      :click="testModel"
      :button-placement="'center'"
    >
      <template #title>
        Test the model
      </template>
      <template #text>
        Check the performance of your DISCOllaboratively trained model
        by testing it on new data (that was not used in training).
      </template>
      <template #button>
        Test model
      </template>
    </ButtonCard>
    <!-- Test the model -->
    <ButtonCard
      :click="saveModel"
      :button-placement="'center'"
    >
      <template #title>
        Save the model
      </template>
      <template #text>
        Saving the model will allow you to access it later
        to update training in a new DISCOllaborative.
      </template>
      <template #button>
        Save model
      </template>
    </ButtonCard>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'

import { browser, EmptyMemory, Memory, ModelType, isTask, ModelInfo } from '@epfml/discojs'

import { useMemoryStore } from '@/store/memory'
import { useValidationStore } from '@/store/validation'
import ButtonCard from '@/components/containers/ButtonCard.vue'

export default defineComponent({
  components: { ButtonCard },
  props: {
    task: {
      validator: isTask,
      default: undefined
    }
  },
  computed: {
    ...mapStores(useMemoryStore, useValidationStore),
    memory (): Memory {
      return this.memoryStore.useIndexedDB ? new browser.IndexedDB() : new EmptyMemory()
    },
    modelInfo (): ModelInfo {
      return {
        type: ModelType.WORKING,
        taskID: this.task.taskID,
        name: this.task.trainingInformation.modelID
      }
    }
  },
  methods: {
    async testModel () {
      if (await this.memory.contains(this.modelInfo)) {
        this.validationStore.setModel(this.memory.pathFor(this.modelInfo))
        this.$router.push({ path: '/testing' })
      } else {
        this.$toast.error('Model was not trained!')
      }
    },
    async saveModel () {
      if (!(this.memory instanceof EmptyMemory)) {
        await this.memory.saveWorkingModel(this.modelInfo)
        this.$toast.success(
          `The current ${this.task.displayInformation.taskTitle} model has been saved.`
        )
      } else {
        this.$toast.error(
          'The model library is currently turned off. See settings for more information'
        )
      }
    }
  }
})
</script>
