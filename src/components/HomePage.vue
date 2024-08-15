<script setup lang="ts">
// imports here
import { ref, onMounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { db } from '@/firebase' // Adjust the path as necessary
import DormPostCard from '@/components/DormPostCard.vue'

// variables here
const menuClick = ref<boolean>(false)
const isLoggedIn = ref<boolean>(false)
const auth = getAuth()
const router = useRouter()
const dorms = ref<any[]>([])
const isGuestRedirect = ref(false)

// functions start here
function goToLogin() {
  menuClick.value = !menuClick.value
}

function loginClicked() {
  if (isLoggedIn.value) {
    auth
      .signOut()
      .then(() => {
        router.push('/') // Redirect to home after logout
      })
      .catch((error) => {
        console.error('Error signing out:', error)
      })
  } else {
    router.push('/user-login')
  }
}

function goToDormListing() {
  if (isLoggedIn.value) {
    router.push('/dorm-listing')
  } else {
    alert('You must be logged in before you can list a dorm.')
    router.push('/user-login')
  }
}

function viewDormPost(dormId: string) {
  router.push(`/dorm-page/${dormId}`)
}

function goToProfile() {
  const user = auth.currentUser
  if (user) {
    router.push(`/user-dashboard/${user.uid}`) // Redirect to user dashboard with userId
  } else {
    console.error('User not logged in')
  }
}

async function fetchApprovedDorms() {
  try {
    const dormsCollection = collection(db, 'ApprovedDormsTable')
    const dormsSnapshot = await getDocs(dormsCollection)
    dorms.value = dormsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    console.log('Fetched approved dorms:', dorms.value) // Debug line to show fetched dorms
  } catch (error) {
    console.error('Error fetching approved dorms:', error)
  }
}

onMounted(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      isLoggedIn.value = true
      if (!isGuestRedirect.value) {
        router.push(`/home/${user.uid}`)
      }
    } else {
      isLoggedIn.value = false
      if (!isGuestRedirect.value) {
        router.push('/')
      }
    }
  })

  fetchApprovedDorms()

  return () => {
    unsubscribe()
  }
})
</script>

<template>
  <div>
    <h1>Home Page</h1>
    <button @click="goToLogin">=</button>
    <button v-if="menuClick" @click="loginClicked">{{ isLoggedIn ? 'Logout' : 'Login' }}</button>

    <!-- Account Profile button appears only if logged in -->
    <button v-if="isLoggedIn && menuClick" @click="goToProfile">Account Profile</button>

    <br />
    <br />
    <button @click="goToDormListing">List your Dorms here!</button>
    <br />
    <br />
    <div v-for="dorm in dorms" :key="dorm.id">
      <button @click="viewDormPost(dorm.id)">
        <DormPostCard :dorm="dorm" />
      </button>
      <br />
      <br />
    </div>
  </div>
</template>
