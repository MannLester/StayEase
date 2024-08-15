<script setup lang="ts">
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth } from '@/firebase'
import { useRouter } from 'vue-router'

const firestore = getFirestore()
const router = useRouter()

const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    prompt: 'select_account'
  })

  try {
    await signOut(auth) // Ensure any existing user is signed out

    const result = await signInWithPopup(auth, provider)
    const user = result.user

    const userDocRef = doc(firestore, `UserLoginTable/${user.uid}`)
    await setDoc(
      userDocRef,
      {
        userId: user.uid,
        email: user.email,
        name: user.displayName,
        profilePictureUrl: user.photoURL,
        createdAt: serverTimestamp()
      },
      { merge: true }
    )

    console.log('User logged in and data saved:', user)
    router.push(`/home/${user.uid}`) // Redirect to dynamic home page with user ID
  } catch (error) {
    console.error('Error logging in with Google:', error)
  }
}

const continueAsGuest = async () => {
  try {
    await signOut(auth) // Ensure any existing user is signed out
    router.push('/') // Redirect to root page
  } catch (error) {
    console.error('Error signing out:', error)
  }
}
</script>

<template>
  <h1>User Login</h1>
  <br />
  <h3>Login using:</h3>
  <button @click="loginWithGoogle">Google</button>
  <br />
  <button @click="continueAsGuest">Continue as Guest</button>
</template>
