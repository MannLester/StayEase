<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  increment
} from 'firebase/firestore'
import { db, auth } from '@/firebase' // Adjust the path as necessary
import { onAuthStateChanged } from 'firebase/auth'
import router from '@/router'

// References to store the dorm data, current user details, and comments
const dormData = ref<any>(null)
const currentUser = ref<any>(null)
const comments = ref<any[]>([])
const newComment = ref('') // For the new comment content
const route = useRoute() // Access the current route

// Function to fetch dorm data from Firestore
async function fetchDormData(dormId: string) {
  try {
    const dormDocRef = doc(db, 'ApprovedDormsTable', dormId) // Reference to the specific dorm document
    const dormDocSnap = await getDoc(dormDocRef)

    if (dormDocSnap.exists()) {
      dormData.value = dormDocSnap.data() // Store the dorm data
      console.log('Dorm data:', dormData.value) // Debug line to show fetched dorm data
    } else {
      console.error('No such dorm document!')
    }
  } catch (error) {
    console.error('Error fetching dorm data:', error)
  }
}

// Function to fetch the current user's information from UserLoginTable
async function fetchCurrentUser(userId: string) {
  try {
    const userDocRef = doc(db, 'UserLoginTable', userId)
    const userDocSnap = await getDoc(userDocRef)
    if (userDocSnap.exists()) {
      return userDocSnap.data()
    } else {
      console.error('No such user document!')
      return null
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    return null
  }
}

// Function to handle comment submission
async function handleCommentSubmit() {
  if (!currentUser.value) {
    console.error('No user is logged in.')
    return
  }

  try {
    await addDoc(collection(db, 'CommentsTable'), {
      commentorName: currentUser.value.name,
      commentorId: currentUser.value.userId,
      commentorPic: currentUser.value.profilePictureUrl,
      commentDate: new Date(),
      commentContent: newComment.value,
      commentedTo: route.params.dormId, // Direct comment to the dorm
      likeNumber: 0,
      dislikeNumber: 0
    })
    newComment.value = ''
    fetchComments() // Refresh comments after submission
  } catch (error) {
    console.error('Error adding comment:', error)
  }
}

// Function to fetch comments for the current dorm
async function fetchComments() {
  try {
    const commentsQuery = query(
      collection(db, 'CommentsTable'),
      where('commentedTo', '==', route.params.dormId)
    )
    const querySnapshot = await getDocs(commentsQuery)
    comments.value = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      commentId: doc.id // Store the comment ID for like/dislike functionality
    }))
  } catch (error) {
    console.error('Error fetching comments:', error)
  }
}

// Capitalize words function
const capitalizeWords = (text: string) => {
  return text.replace(/\b\w/g, (char) => char.toUpperCase())
}

// Computed property to capitalize dorm data
const capitalizeDormData = computed(() => {
  if (!dormData.value) return null
  return {
    ...dormData.value,
    nameOfTheDorm: capitalizeWords(dormData.value.nameOfTheDorm),
    addressOfTheDorm: capitalizeWords(dormData.value.addressOfTheDorm),
    descOfTheDorm: capitalizeWords(dormData.value.descOfTheDorm),
    rentType: capitalizeWords(dormData.value.rentType),
    gender: capitalizeWords(dormData.value.gender)
  }
})

// On component mount
onMounted(async () => {
  const dormId = route.params.dormId as string // Ensure dormId is treated as a string
  if (dormId) {
    fetchDormData(dormId) // Fetch dorm data based on the dormId
    fetchComments() // Fetch comments for the dorm
  }
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser.value = await fetchCurrentUser(user.uid)
    } else {
      currentUser.value = null
    }
  })
})

// Function to handle liking a comment
async function likeComment(comment: any) {
  try {
    const commentDocRef = doc(db, 'CommentsTable', comment.commentId)
    await updateDoc(commentDocRef, {
      likeNumber: increment(1)
    })
    comment.likeNumber += 1 // Update locally
  } catch (error) {
    console.error('Error liking comment:', error)
  }
}

// Function to handle disliking a comment
async function dislikeComment(comment: any) {
  try {
    const commentDocRef = doc(db, 'CommentsTable', comment.commentId)
    await updateDoc(commentDocRef, {
      dislikeNumber: increment(1)
    })
    comment.dislikeNumber += 1 // Update locally
  } catch (error) {
    console.error('Error disliking comment:', error)
  }
}

// Function to navigate to the creator's profile
function goToCreatorProfile() {
  if (dormData.value && dormData.value.creatorLink) {
    router.push(`/user-dashboard/${dormData.value.creatorLink}`)
  } else {
    console.error('Creator link not available.')
  }
}
</script>

<template>
  <div v-if="dormData">
    <h1>{{ capitalizeDormData.nameOfTheDorm }}</h1>
    <h3>Address: {{ capitalizeDormData.addressOfTheDorm }}</h3>
    <p>
      <a @click.prevent="goToCreatorProfile" href="#">
        {{ dormData.creatorName }}
      </a>
    </p>
    <h3>Rating: {{ dormData.rating }}</h3>
    <br />
    <h2>Description:</h2>
    <h3>{{ capitalizeDormData.descOfTheDorm }}</h3>
    <br />
    <h2>Pricing:</h2>
    <h3>Advance Payment: Php {{ dormData.advancePrice }}</h3>
    <h3>Deposit Payment: Php {{ dormData.depositPrice }}</h3>
    <h3>Monthly Payment: Php {{ dormData.monthlyPrice }}</h3>
    <h3>Reservation Payment: Php {{ dormData.reservationPrice }}</h3>
    <br />
    <br />
    <h2>Other Details:</h2>
    <h3>Rent Type: {{ capitalizeDormData.rentType }}</h3>
    <h3>Pax: {{ dormData.pax }}</h3>
    <h3>Gender: {{ capitalizeDormData.gender }}</h3>
    <h3>Curfew: {{ dormData.curfew }}</h3>
    <h3 v-if="dormData.aircon === true">Aircon Included</h3>
    <h3 v-if="dormData.internet === true">Internet Included</h3>
    <br />
    <br />
    <h2>Bills Inclusion:</h2>
    <h3 v-if="dormData.electricityIncluded === true">Electricity</h3>
    <h3 v-if="dormData.internetIncluded === true">Internet</h3>
    <h3 v-if="dormData.waterIncluded === true">Water</h3>
    <br />
    <h3>Move in Date: {{ dormData.moveinDate }}</h3>
    <br />

    <!-- Comment Section -->
    <h2>Comments:</h2>
    <div v-for="comment in comments" :key="comment.commentId">
      <div>
        <img :src="comment.commentorPic" alt="Commentor Profile Picture" width="50" height="50" />
        <strong>{{ comment.commentorName }}</strong>
        <p>{{ comment.commentContent }}</p>
        <small>{{ comment.commentDate.toDate().toLocaleString() }}</small>
        <br />
        <button @click="likeComment(comment)">Like ({{ comment.likeNumber }})</button>
        <button @click="dislikeComment(comment)">Dislike ({{ comment.dislikeNumber }})</button>
      </div>
      <br />
    </div>

    <!-- New Comment Form -->
    <h2>Leave a Comment:</h2>
    <textarea v-model="newComment" placeholder="Write your comment here"></textarea>
    <button @click="handleCommentSubmit">Submit</button>
  </div>
  <div v-else>
    <p>Loading dorm data...</p>
  </div>
</template>
