<script setup lang="ts">
// imports here
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { collection, doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase' // Adjust the path as necessary

// variables here
const userId = ref<string | null>(null)
const userData = ref<any | null>(null)
const route = useRoute()

// functions start here
async function fetchUserData(userId: string) {
  try {
    const userDocRef = doc(collection(db, 'UserLoginTable'), userId)
    const userDocSnap = await getDoc(userDocRef)

    if (userDocSnap.exists()) {
      const data = userDocSnap.data()
      userData.value = {
        ...data,
        createdAt: data.createdAt.toDate().toLocaleString() // Convert Timestamp to Date and format it
      }
      console.log('User data:', userData.value) // Debug line to show fetched user data
    } else {
      console.error('No such user found!')
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
  }
}

onMounted(() => {
  userId.value = route.params.userId as string
  if (userId.value) {
    fetchUserData(userId.value)
  } else {
    console.error('No userId provided in the route')
  }
})
</script>

<template>
  <div v-if="userData">
    <h1>Welcome, {{ userData.name }}!</h1>
    <p>Email: {{ userData.email }}</p>
    <p>Account Created: {{ userData.createdAt }}</p>
    <!-- Add more fields as necessary -->
  </div>
  <div v-else>
    <p>Loading user data...</p>
  </div>
</template>
