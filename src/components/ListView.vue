<script lang="ts">
import { ref, onMounted, watch } from 'vue'
import IconDelete from './icons/IconDelete.vue'
import IconEdit from './icons/IconEdit.vue'
import IconPlus from './icons/IconPlus.vue'
import IconExclamation from './icons/IconExclamation.vue'
import ModalComponent from './ModalComponent.vue'
import type { User, FormData, FormField } from './types/interfaces'

export default {
  components: {
    IconDelete,
    IconEdit,
    IconPlus,
    IconExclamation,
    ModalComponent
  },
  setup() {
    const users = ref<User[]>([]) // users is a reactive reference to an array of User
    const isModalVisible = ref(false)
    const isEditing = ref(false)
    const userId = ref()
    const useGoogleLocation = ref(false)

    const createFormField = (): FormField => ({
      value: '',
      isValid: false,
      isTouched: false
    })

    const formData = ref<FormData>({
      email: createFormField(),
      username: createFormField(),
      phoneNumber: createFormField(),
      name: createFormField(),
      address: createFormField(),
      city: createFormField(),
      zipCode: createFormField(),
      latitude: createFormField(),
      longitude: createFormField()
    })

    const isNotEmpty = (value: string) => value.trim() !== ''
    const validateEmail = (value: string) =>
      isNotEmpty(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    const validateUsername = (value: string) => isNotEmpty(value) && value.length >= 4
    const validatePhoneNumber = (value: string) => isNotEmpty(value) && /^[0-9+\-\s]+$/.test(value);


    // Generalized function to handle field touch and validation
    const handleField = (field: FormField, validator: (value: string) => boolean) => {
      field.isTouched = true
      field.isValid = validator(field.value)
      console.log('field', field.isValid)
    }

    const openModal = () => {
      isModalVisible.value = true
      console.log('openModal')
    }

    const deleteUser = async (id: number) => {
      try {
        const response = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`, {
          method: 'DELETE'
        })
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        users.value = users.value.filter((user) => user.id !== id)
        console.log('User deleted')
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error)
      }
    }

    const fetchData = async () => {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users')
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data: User[] = await response.json()
        users.value = data // Update the users reactive reference
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error)
      }
    }

    const initAutocomplete = () => {
      const input = document.getElementById('autocomplete') as HTMLInputElement
      if (!input) return

      const autocomplete = new google.maps.places.Autocomplete(input)
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (!place.geometry) {
          console.error('Autocomplete returned place with no geometry')
          return
        }
        console.log('place', place)
        const latitude = place.geometry.location.lat()
        const longitude = place.geometry.location.lng()
        formData.value.latitude.value = latitude.toString()
        formData.value.longitude.value = longitude.toString()
        const addressComponents = place.address_components
        const zipCodeObj = addressComponents?.find((component) =>
          component.types.includes('postal_code')
        )

        // Example: Fill other form fields based on the selected place
        formData.value.city.value =
          place.address_components?.find((component: { types: string | string[] }) =>
            component.types.includes('locality')
          )?.long_name || ''
        formData.value.zipCode.value = zipCodeObj?.long_name || ''
        // Add other fields as needed
      })
    }

    const resetFields = () => {
      formData.value = {
        email: createFormField(),
        username: createFormField(),
        phoneNumber: createFormField(),
        name: createFormField(),
        address: createFormField(),
        city: createFormField(),
        zipCode: createFormField(),
        latitude: createFormField(),
        longitude: createFormField()
      }
    }

    const submitForm = async (id?: number) => {
      handleField(formData.value.email, validateEmail)
      handleField(formData.value.username, validateUsername)
      handleField(formData.value.phoneNumber, validatePhoneNumber)
      handleField(formData.value.name, isNotEmpty)
      handleField(formData.value.address, isNotEmpty)
      handleField(formData.value.city, isNotEmpty)
      handleField(formData.value.zipCode, isNotEmpty)

      if (!useGoogleLocation.value) {
        formData.value.latitude.isValid = true
        formData.value.longitude.isValid = true
      } else {
        formData.value.latitude.isValid = isNotEmpty(formData.value.latitude.value)
        formData.value.longitude.isValid = isNotEmpty(formData.value.longitude.value)
      }
      // Check if all fields are valid
      const allFieldsValid = Object.values(formData.value).every((field) => field.isValid)
      console.log('allFieldsValid', allFieldsValid)

      if (allFieldsValid) {
        // If all fields are valid, process form data
        const formattedData = {
          name: formData.value.name.value,
          username: formData.value.username.value,
          email: formData.value.email.value,
          phone: formData.value.phoneNumber.value,
          address: formData.value.address.value,
          city: formData.value.city.value,
          zipCode: formData.value.zipCode.value,
          latitude: formData.value.latitude.value,
          longitude: formData.value.longitude.value
        }
        try {
          const response = !isEditing.value
            ? await fetch('https://jsonplaceholder.typicode.com/users', {
                method: 'POST',
                body: JSON.stringify(formattedData),
                headers: {
                  'Content-type': 'application/json; charset=UTF-8'
                }
              })
            : await fetch(`https://jsonplaceholder.typicode.com/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(formattedData),
                headers: {
                  'Content-type': 'application/json; charset=UTF-8'
                }
              })
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          const data: User = await response.json()
          if (isEditing.value) {
            users.value = users.value.map((user) => {
              if (user.id === id) {
                return data
              }
              return user
            })
            isEditing.value = false
            isModalVisible.value = false
            formData.value = {
              email: createFormField(),
              username: createFormField(),
              phoneNumber: createFormField(),
              name: createFormField(),
              address: createFormField(),
              city: createFormField(),
              zipCode: createFormField(),
              latitude: createFormField(),
              longitude: createFormField()
            }
            return;
          }
          users.value = [...users.value, data] // Update the users reactive reference
          console.log('User created')
          isModalVisible.value = false
          formData.value = {
            email: createFormField(),
            username: createFormField(),
            phoneNumber: createFormField(),
            name: createFormField(),
            address: createFormField(),
            city: createFormField(),
            zipCode: createFormField(),
            latitude: createFormField(),
            longitude: createFormField()
          }
        } catch (error) {
          console.error('There has been a problem with your fetch operation:', error)
        }
        console.log('Form data:', formData.value)
        // Here you can add logic to send data to a server or handle it as needed
      } else {
        console.error('Validation failed. Please check the form fields.')
      }
    }

    watch(useGoogleLocation, (newValue) => {
      if (newValue) {
        initAutocomplete()
      }
    })

    const openEdit = async (id: number) => {
      isEditing.value = true
      userId.value = id
      try {
        const response = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data: User = await response.json()
        formData.value.name.value = data.name
        formData.value.username.value = data.username
        formData.value.email.value = data.email
        formData.value.phoneNumber.value = data.phone
        formData.value.address.value = data.address.street
        formData.value.city.value = data.address.city
        formData.value.zipCode.value = data.address.zipcode
        formData.value.latitude.value = data.address.geo.lat
        formData.value.longitude.value = data.address.geo.lng
        console.log('data', data)
        isModalVisible.value = true
        // Here you can add logic to send data to a server or handle it as needed
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error)
      }
    }

    onMounted(fetchData) // fetchData is called when the component is mounted

    return {
      users, // expose users to the template
      isModalVisible,
      openModal,
      useGoogleLocation,
      formData,
      validateEmail,
      validateUsername,
      validatePhoneNumber,
      handleField,
      isNotEmpty,
      initAutocomplete,
      deleteUser,
      submitForm,
      openEdit,
      userId,
      resetFields
    }
  }
}
</script>

<template>
  <div class="create-container">
    <button class="create-button" @click="openModal">
      <IconPlus />
      <span>Create New User</span>
    </button>
    <ModalComponent v-model:show="isModalVisible" :onSubmit="submitForm" :userId="userId" :onClose="resetFields">
      <div class="sides-container">
        <div class="left-side">
          <div class="input-container">
            <div class="input-label">Full Name</div>
            <input
              type="text"
              placeholder="John Gonzales"
              v-model="formData.name.value"
              @blur="handleField(formData.name, () => isNotEmpty(formData.name.value))"
            />
            <div v-if="!formData.name.isValid && formData.name.isTouched" class="error-info">
              <IconExclamation />
              Please complete this field
            </div>
          </div>
          <div class="input-container">
            <div class="input-label">Username</div>
            <input
              type="text"
              placeholder="johngonzales13"
              v-model="formData.username.value"
              @blur="handleField(formData.username, validateUsername)"
            />
            <div
              v-if="!formData.username.isValid && formData.username.isTouched"
              class="error-info"
            >
              <IconExclamation />
              The username must be at least 4 characters long
            </div>
          </div>
          <div class="input-container">
            <div class="input-label">Email</div>
            <input
              type="text"
              placeholder="johngonzales1234@gmail.com"
              v-model="formData.email.value"
              @blur="handleField(formData.email, validateEmail)"
            />
            <div v-if="!formData.email.isValid && formData.email.isTouched" class="error-info">
              <IconExclamation />
              Please enter a valid email address
            </div>
          </div>
          <div class="input-container">
            <div class="input-label">Phone Nr</div>
            <input
              type="text"
              placeholder="123-456-7890"
              v-model="formData.phoneNumber.value"
              @blur="handleField(formData.phoneNumber, validatePhoneNumber)"
            />
            <div
              v-if="!formData.phoneNumber.isValid && formData.phoneNumber.isTouched"
              class="error-info"
            >
              <IconExclamation />
              Phone number must contain only numbers and characters
            </div>
          </div>
        </div>
        <div class="right-side">
          <div class="input-container">
            <div class="address-container">
              <div class="input-label">Address</div>
              <div class="checkbox-style">
                <input class="no-style" type="checkbox" v-model="useGoogleLocation" />
                <span class="checkbox-text">Use Google Location</span>
              </div>
            </div>
            <input
              type="text"
              placeholder="Route 54"
              v-model="formData.address.value"
              v-if="useGoogleLocation"
              id="autocomplete"
              @focus="initAutocomplete"
              @blur="handleField(formData.address, () => isNotEmpty(formData.address.value))"
            />
            <input
              type="text"
              placeholder="Route 54"
              v-model="formData.address.value"
              v-if="!useGoogleLocation"
              @focus="initAutocomplete"
              @blur="handleField(formData.address, () => isNotEmpty(formData.address.value))"
            />
            <div v-if="!formData.address.isValid && formData.address.isTouched" class="error-info">
              <IconExclamation />
              Address must not be empty
            </div>
          </div>
          <div class="input-container">
            <div class="input-label">City</div>
            <input
              type="text"
              placeholder="New York"
              v-model="formData.city.value"
              @blur="handleField(formData.city, () => isNotEmpty(formData.city.value))"
            />
            <div v-if="!formData.city.isValid && formData.city.isTouched" class="error-info">
              <IconExclamation />
              City must not be empty
            </div>
          </div>
          <div class="input-container">
            <div class="input-label">Zip Code</div>
            <input
              type="text"
              placeholder="12345"
              v-model="formData.zipCode.value"
              @blur="handleField(formData.zipCode, () => isNotEmpty(formData.zipCode.value))"
            />
            <div v-if="!formData.zipCode.isValid && formData.zipCode.isTouched" class="error-info">
              <IconExclamation />
              Zip Code must not be empty
            </div>
          </div>
          <div v-if="useGoogleLocation" class="additional-fields">
            <div class="input-container">
              <div class="input-label">Latitude</div>
              <input
                type="text"
                placeholder="Enter latitude"
                v-model="formData.latitude.value"
                @blur="handleField(formData.latitude, () => isNotEmpty(formData.latitude.value))"
              />
              <div
                v-if="!formData.latitude.isValid && formData.latitude.isTouched"
                class="error-info"
              >
                <IconExclamation />
                Latitude must not be empty
              </div>
            </div>
            <div class="input-container">
              <div class="input-label">Longitude</div>
              <input
                type="text"
                placeholder="Enter longitude"
                v-model="formData.longitude.value"
                @blur="handleField(formData.longitude, () => isNotEmpty(formData.longitude.value))"
              />
              <div
                v-if="!formData.longitude.isValid && formData.longitude.isTouched"
                class="error-info"
              >
                <IconExclamation />
                Longitude must not be empty
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalComponent>
  </div>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th class="right-text">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.phone }}</td>
          <td class="right-text">
            <!-- Actions like edit or delete could go here -->
            <button class="actions-button" @click="openEdit(user.id)">
              <IconEdit />
            </button>
            <button class="actions-button" @click="deleteUser(user.id)">
              <IconDelete />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.right-text {
  text-align: right;
  /* border-spacing: 0 10px;
  border-collapse: separate; */
}

.error-info {
  display: flex;
  align-items: center;
  gap: 5px;
  color: red;
  font-size: 12px;
}


.sides-container {
  flex-direction: column;
}

.left-side,
.right-side {
  width: 100%; /* Full width on small screens */
}

.input-container input,
.additional-fields {
  width: 100%; /* Inputs take full width */
}

/* Adjust button size for smaller screens if necessary */
.create-button,
.actions-button {
  padding: 5px; /* Smaller padding */
  font-size: 14px; /* Smaller font size */
}

/* Larger devices (tablets and desktops) */
@media (min-width: 601px) {
  .sides-container {
    flex-direction: row;
    gap: 20px;
  }

  .left-side,
  .right-side {
    flex: 1; /* Each side takes up half the width */
  }

  .create-button,
  .actions-button {
    padding: 10px; /* Larger padding */
    font-size: 16px; /* Larger font size */
  }

  .input-container input,
  .additional-fields {
    width: auto; /* Width auto-adjusts to content */
  }
}




.sides-container {
  display: flex;
  flex-wrap: wrap; /* Wrap items if they don't fit */
  gap: 20px;
  max-width: 100%; /* Ensure container does not exceed modal width */
}

.left-side,
.right-side {
  flex: 1; /* Each side will take up equal space */
  min-width: 0; /* Prevent flex items from growing past their content size */
}

.input-container input {
  width: 100%; /* Input will take full width of its container */
  box-sizing: border-box; /* Border and padding are included in the width */
  max-width: 100%; /* Prevent input from exceeding the container width */
}

.additional-fields {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 250px;
}
.checkbox-text {
  font-size: 12px;
}
.checkbox-style {
  display: flex;
  align-items: center;
  gap: 5px;
}

.no-style {
  width: auto !important;
}
.address-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sides-container {
  display: flex;
  gap: 60px;
}
.create-container {
  display: flex;
  justify-content: flex-end;
}

input {
  width: 250px;
  padding: 15px 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.input-label {
  margin: 8px 0;
  font-size: 14px;
  font-weight: bold;
}

.create-button {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #3c81fc;
  border: none;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
}

.actions-button {
  background-color: #fff;
  border: none;
  padding: 5px 8px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  border-radius: 5px;
}

table {
  margin: auto;
  width: 100%;
  overflow: hidden;
  border-collapse: separate;
  border-spacing: 0 10px;
  text-align: left;
}

td {
  border: 1px solid #ddd;
  border-style: solid none;
  margin: auto;
  padding: 8px;
  text-align: left;
}

table td:first-of-type {
  border-left-style: solid;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 10px;
}

table td:last-of-type {
  border-right-style: solid;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}
</style>
