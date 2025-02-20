<template>
  <VeeForm
    v-slot="{ handleSubmit }"
    :validation-schema="schema"
  >
    <form
      class="grid grid-cols-1 gap-8 p-4 lg:grid-cols-1 xl:grid-cols-1"
      @submit="handleSubmit($event, onSubmit)"
    >
      <div
        v-for="section in sections"
        :key="section.id"
      >
        <IconCard>
          <template #title>
            {{ section.title }}
          </template>
          <template #content>
            <div class="space-y-4">
              <div
                v-for="field in section.fields"
                :key="field.id"
              >
                <div v-if="isFieldVisible(field, dataType, scheme)">
                  <label
                    :for="field.id"
                    class="
                      inline
                      text-slate-600
                      font-bold
                      md:text-right
                      mb-1
                      md:mb-0
                      pr-4
                    "
                  >
                    {{ field.name }}
                  </label>
                  <ErrorMessage
                    class="text-red-600"
                    :name="field.id"
                  />
                  <SelectContainer
                    v-if="field.id === 'dataType'"
                    v-model="dataType"
                    :field="field"
                  />
                  <SelectContainer
                    v-else-if="field.id === 'scheme'"
                    v-model="scheme"
                    :field="field"
                  />
                  <div v-else>
                    <SelectContainer
                      v-if="['select', 'select-multiple'].includes(field.type)"
                      :field="field"
                    />
                    <FileContainer
                      v-else-if="field.type === 'file'"
                      :field="field"
                      @input="handleModelFiles($event, field)"
                    />
                    <ArrayContainer
                      v-else-if="field.type === 'array'"
                      :field="field"
                    />
                    <ObjectArrayContainer
                      v-else-if="field.type === 'arrayObject'"
                      :field="field"
                    />
                    <TextContainer
                      v-else-if="field.type === 'text'"
                      :field="field"
                    />
                    <CheckboxContainer
                      v-else-if="field.type === 'checkbox'"
                      :field="field"
                    />
                    <NumberContainer
                      v-else-if="field.type === 'number'"
                      :field="field"
                    />
                    <FloatContainer
                      v-else-if="field.type === 'float'"
                      :field="field"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </IconCard>
      </div>
      <div class="flex flex-wrap justify-center gap-8 my-2">
        <CustomButton
          type="submit"
          class="basis-48"
        >
          Submit
        </CustomButton>
        <CustomButton
          type="reset"
          class="basis-48"
        >
          Reset
        </CustomButton>
        <CustomButton
          type="button"
          href=""
          class="basis-48"
        >
          Request Help on Slack
        </CustomButton>
      </div>
    </form>
  </VeeForm>
</template>

<script lang="ts" setup>
import * as yup from 'yup'
import axios from 'axios'
import { ref, shallowRef } from 'vue'
import { List, Map } from 'immutable'
import { Form as VeeForm, ErrorMessage } from 'vee-validate'

import { serialization, tf } from '@epfml/discojs'

import { sections, FormField, FormSection } from '@/task_creation_form'
import { useToaster } from '@/composables/toaster'
import { CONFIG } from '@/config'
import IconCard from '@/components/containers/IconCard.vue'
import SelectContainer from './containers/SelectContainer.vue'
import FileContainer from './containers/FileContainer.vue'
import ArrayContainer from './containers/ArrayContainer.vue'
import ObjectArrayContainer from './containers/ObjectArrayContainer.vue'
import TextContainer from './containers/TextContainer.vue'
import CheckboxContainer from './containers/CheckboxContainer.vue'
import NumberContainer from './containers/NumberContainer.vue'
import FloatContainer from './containers/FloatContainer.vue'
import CustomButton from '@/components/simple/CustomButton.vue'

const toaster = useToaster()

// Maps sections to a form-wide yup schema object composed of labelled yup fields.
// A list of (K, V) pair tuples is converted to a K -> V map, which directly corresponds
// to a { K: V } JavaScript object, as required by yup.
const schemaData =
  Map(
    List(Object.values(sections))
      .flatMap((section) => List(section.fields)
        .map((field) => [field.id, field.yup.label(field.name)] as [string, yup.AnySchema])
      )
      .values()
  ).toObject()
const schema = yup.object(schemaData)

const dataType = ref('')
const scheme = ref('')
const modelFiles = shallowRef(List<File>())

const formatSection = (section: FormSection, rawTask: any): any => {
  let fields = List(section.fields)
    .map((field) => {
      const content = rawTask[field.id]
      if (content === undefined) {
        return undefined
      }
      if (['number', 'float'].includes(field.type)) {
        return [field.id, Number(content)]
      }
      if (field.type === 'checkbox') {
        return [field.id, Boolean(content)]
      }
      return [field.id, content]
    })
    .filter((entry) => entry !== undefined)

  // nest special sections into training information
  if (section.id === 'trainingInformation') {
    fields = fields
      .push(
        formatSection(
          List(sections).filter((section) => section.id === 'modelCompileData').first(),
          rawTask
        )
      )
      .push([
        'scheme',
        rawTask.scheme
      ])
      .push([
        'dataType',
        rawTask.dataType
      ])
  }

  return [section.id, Map(fields).toObject()]
}

const handleModelFiles = async (files: FileList, field: FormField): Promise<void> => {
  modelFiles.value = modelFiles.value.push(...files)
}

const onSubmit = async (rawTask: any, { resetForm }): Promise<void> => {
  toaster.success('Form validation succeeded! Uploading...')

  // format the flat form entries to a nested task object
  const specialSections = ['generalInformation', 'modelCompileData', 'modelFiles']
  const task = Map(
    List(sections)
      .filter((section) => !specialSections.includes(section.id))
      .map((section) => formatSection(section, rawTask))
  )
    .set('taskID', rawTask.taskID)
    .toObject()

  console.log('Submitted task:', task)

  const url = new URL('', CONFIG.serverUrl.href)
  url.pathname += 'tasks'

  let model: tf.LayersModel
  try {
    model = await tf.loadLayersModel(tf.io.browserFiles(modelFiles.value.toArray()))
  } catch (error) {
    console.error(error)
    toaster.error('Model loading failed')
    return
  }

  console.log(model)

  axios
    .post(url.href, { task, model: await serialization.model.encode(model) })
    .then(() => {
      toaster.success('Task successfully submitted')
      resetForm()
    })
    .catch((error) => {
      toaster.error('An error occured server-side')
      console.error(error)
    })
}

const isFieldVisible = (field: FormField, dataType: string, scheme: string): boolean => {
  if (field.dependencies === undefined) {
    return true
  }
  if ('dataType' in field.dependencies && field.dependencies.dataType === dataType) {
    return true
  }
  if ('scheme' in field.dependencies && field.dependencies.scheme === scheme) {
    return true
  }
  return false
}
</script>
