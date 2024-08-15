<script setup lang="ts">
import { ref } from 'vue'
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase' // Adjust the path as necessary
import DormPostCard from './DormPostCard.vue'

const showDormPost = ref(false)
const dorms = ref<any[]>([]) // Adjust type as necessary

async function showDormApplications() {
  if (!showDormPost.value) {
    try {
      const dormsCollection = collection(db, 'DormsApplicationsTable')
      const dormsSnapshot = await getDocs(dormsCollection)
      dorms.value = dormsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      console.log('Fetched dorms:', dorms.value) // Debug line to show fetched dorms
    } catch (error) {
      console.error('Error fetching dorms:', error)
    }
  }
  showDormPost.value = !showDormPost.value
}

async function rejectDorm(index: number) {
  const dormToReject = dorms.value[index]
  try {
    const dormDoc = doc(db, 'DormsApplicationsTable', dormToReject.id)
    await deleteDoc(dormDoc)
    dorms.value.splice(index, 1)
    console.log('Rejected dorm:', dormToReject) // Debug line to show rejected dorm
  } catch (error) {
    console.error('Error rejecting dorm:', error)
  }
}

async function acceptDorm(index: number) {
  const dormToAccept = dorms.value[index]
  try {
    // Move dorm to 'ApprovedDormsTable'
    const approvedDormDoc = doc(db, 'ApprovedDormsTable', dormToAccept.id)
    await setDoc(approvedDormDoc, dormToAccept)

    // Delete from 'DormsApplicationsTable'
    const dormDoc = doc(db, 'DormsApplicationsTable', dormToAccept.id)
    await deleteDoc(dormDoc)

    // Remove the dorm from local state
    dorms.value.splice(index, 1)
    console.log('Accepted dorm:', dormToAccept) // Debug line to show accepted dorm
  } catch (error) {
    console.error('Error accepting dorm:', error)
  }
}
</script>

<template>
  <div>
    <h1>Developer Dashboard</h1>
    <button @click="showDormApplications">
      {{ showDormPost ? 'Hide' : 'Show' }} Dorm Applications
    </button>
    <div v-if="showDormPost">
      <div v-for="(dorm, index) in dorms" :key="index">
        <DormPostCard :dorm="dorm"></DormPostCard>
        <button @click="rejectDorm(index)">Reject</button>
        <button @click="acceptDorm(index)">Accept</button>
      </div>
    </div>
    <button v-if="!showDormPost">Messages</button>
  </div>
</template>
