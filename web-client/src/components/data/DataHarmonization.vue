<script setup lang="ts">
import { defineProps } from 'vue'

import { Task } from '@epfml/discojs'

import DropdownCard from '@/components/containers/DropdownCard.vue'

interface Props {
  task: Task
}
const props = defineProps<Props>()
</script>

<template>
  <div class="space-y-4 md:space-y-8">
    <DropdownCard>
      <template #title>
        Data Format
      </template>
      <template
        v-if="task.displayInformation?.dataFormatInformation !== undefined"
        #content
      >
        It is <span class="font-bold">important</span> to harmonize your data to the expected format as described below.<br><br>
        <span v-html="task.displayInformation.dataFormatInformation" />
      </template>
      <template
        v-else
        #content
      >
        <span class="italic">
          No format was specified by the task's author.
        </span>
      </template>
    </DropdownCard>
    <DropdownCard v-if="task.displayInformation?.dataExampleText !== undefined">
      <template #title>
        Example Data
      </template>
      <template #content>
        <span v-html="task.displayInformation.dataExampleText" /><br><br>
        <!-- Tabular data example -->
        <div
          v-if="task.trainingInformation.dataType === 'tabular'"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <span
            v-for="(column, idx) in task.displayInformation.dataExample"
            :key="idx"
          >
            <span class="font-bold">{{ column.columnName }}:</span> {{ column.columnData }}
          </span>
        </div>
        <!-- Image data example -->
        <div v-if="task.trainingInformation.dataType === 'image'">
          <img
            class="mx-auto"
            :src="props.task.displayInformation?.dataExampleImage"
            alt="Error! Image not found"
          >
        </div>
      </template>
    </DropdownCard>
  </div>
</template>
