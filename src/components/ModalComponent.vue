<template>
  <div v-if="props.show" class="modal-overlay" @click="closeModal">
    
    <div class="modal-content" @click.stop>
        <div class="header">
        <h2>New User Info</h2>
          <button class="close-button" @click="closeModal">X</button>
      </div>
      <div class="separator"></div>
      <slot></slot>
      <div class="footer">
          <button class="save-button" @click="submit">Save</button>
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

const props = defineProps({
  show: Boolean,
  onSubmit: Function,
  onClose: Function,
  userId: Number || undefined,
})
const emits = defineEmits(['update:show'])

const submit = () => {
  if (props.onSubmit) {
    props.onSubmit(props.userId)
  }
}

const closeModal = () => {
  emits('update:show', false)
  if (props.onClose) {
    props.onClose()
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
  position: relative;
  max-width: 600px;
  width: 100%;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.separator {
    height: 1px;
    background: #ddd;
    margin: 10px 0;
}

.footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin: 10px 0;
}

.close-button {
    border: none;
    background: #ddd;
    font-size: 16px;
    border-radius: 20px;
    padding: 5px 10px;
    cursor: pointer;
}

.save-button {
    border: none;
    background: #3C81FC;
    color: white;
    font-size: 16px;
    border-radius: 5px;
    padding: 10px 25px;
    cursor: pointer;
}

</style>
