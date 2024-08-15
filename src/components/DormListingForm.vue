<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db, auth } from '../firebase'
import { collection, addDoc } from 'firebase/firestore'

const router = useRouter()
const form = ref<HTMLFormElement | null>(null)

const nameOfTheDorm = ref('')
const addressOfTheDorm = ref('')
const monthlyPrice = ref<number | null>(null)
const reservationPrice = ref<number | null>(null)
const advancePrice = ref<number | null>(null)
const depositPrice = ref<number | null>(null)
const rentType = ref('')
const pax = ref<number | null>(null)
const gender = ref('')
const curfewValue = ref('n/a')
const curfewTime = ref('')
const internet = ref(false)
const aircon = ref(false)
const electricityIncluded = ref(false)
const waterIncluded = ref(false)
const internetIncluded = ref(false)
const moveinDate = ref('')

const isFormValid = computed(() => {
  return (
    nameOfTheDorm.value &&
    addressOfTheDorm.value &&
    monthlyPrice.value &&
    reservationPrice.value &&
    advancePrice.value &&
    depositPrice.value &&
    rentType.value &&
    pax.value &&
    gender.value &&
    moveinDate.value
  )
})

function handleCurfewChange(event: Event) {
  const target = event.target as HTMLSelectElement
  curfewValue.value = target.value
}

async function handleSubmit(event: Event) {
  event.preventDefault()

  if (!form.value) return

  // Ensure the user is logged in before submission
  const user = auth.currentUser
  if (!user) {
    console.error('No user is logged in.')
    return
  }

  // Gather form data
  const formData = new FormData(form.value)
  const curfewFinal = curfewValue.value === 'time' ? curfewTime.value : curfewValue.value

  // Prepare the dorm data including creator details and timestamp
  const dormData = {
    nameOfTheDorm: nameOfTheDorm.value,
    addressOfTheDorm: addressOfTheDorm.value,
    descOfTheDorm: formData.get('dormDescription')?.toString() || '',
    monthlyPrice: monthlyPrice.value,
    reservationPrice: reservationPrice.value,
    advancePrice: advancePrice.value,
    depositPrice: depositPrice.value,
    rentType: rentType.value,
    pax: pax.value,
    gender: gender.value,
    curfew: curfewFinal,
    internet: internet.value,
    aircon: aircon.value,
    electricityIncluded: electricityIncluded.value,
    waterIncluded: waterIncluded.value,
    internetIncluded: internetIncluded.value,
    moveinDate: moveinDate.value,
    creatorName: user.displayName || 'Unknown', // Get the logged-in user's name
    creatorLink: user.uid, // Get the logged-in user's ID
    createdAt: new Date() // Store the current timestamp
  }

  console.log('Dorm data:', dormData) // Debug line to show the dorm data

  // Save to Firestore
  try {
    const docRef = await addDoc(collection(db, 'DormsApplicationsTable'), dormData)
    console.log('Document written with ID: ', docRef.id)

    // Show confirmation popup
    if (confirm("Details Recorded and Submitted! Please wait for Developer's Confirmation")) {
      router.push('/')
    }
  } catch (e) {
    console.error('Error adding document: ', e)
  }
}

function cancelClicked() {
  router.push('/')
}
</script>

<template>
  <h1>Dorm Listing Form</h1>

  <form ref="form" @submit="handleSubmit">
    <!-- Your form inputs -->
    <h3>Name of the Dorm (required)</h3>
    <input type="text" id="dorm-name" name="dormName" v-model="nameOfTheDorm" required />

    <h3>Address of the Dorm (required)</h3>
    <input type="text" id="dorm-address" name="dormAddress" v-model="addressOfTheDorm" required />

    <h3>Description of the Dorm (optional)</h3>
    <textarea id="dorm-description" name="dormDescription"></textarea>

    <h3>Price</h3>
    <h4>Monthly:</h4>
    <input
      type="number"
      id="monthly-price"
      name="monthly-price"
      v-model.number="monthlyPrice"
      required
    />
    <h4>Reservation:</h4>
    <input
      type="number"
      id="reservation-price"
      name="reservation-price"
      v-model.number="reservationPrice"
      required
    />
    <h4>Advance:</h4>
    <input
      type="number"
      id="advance-price"
      name="advance-price"
      v-model.number="advancePrice"
      required
    />
    <h4>Deposit:</h4>
    <input
      type="number"
      id="deposit-price"
      name="deposit-price"
      v-model.number="depositPrice"
      required
    />

    <br />

    <h3>Rent Type</h3>
    <select id="rent-type" name="rentType" v-model="rentType" required>
      <option value="unit">Unit</option>
      <option value="room">Room</option>
      <option value="bedspace">Bedspace</option>
    </select>

    <h3>Pax</h3>
    <input type="number" id="pax-number" name="pax-number" v-model.number="pax" required />

    <h3>Gender</h3>
    <select id="gender" name="gender" v-model="gender" required>
      <option value="male">Male</option>
      <option value="female">Female</option>
      <option value="combine">Combine</option>
    </select>

    <h3>Curfew</h3>
    <select id="curfew" name="curfew" v-model="curfewValue" @change="handleCurfewChange">
      <option value="n/a">N/A</option>
      <option value="time">Specify Time</option>
    </select>

    <input
      v-if="curfewValue === 'time'"
      type="time"
      id="curfew-time"
      name="curfewTime"
      v-model="curfewTime"
    />

    <h3>Internet</h3>
    <select id="internet" name="internet" v-model="internet">
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>

    <h3>Air conditioning</h3>
    <select id="aircon" name="aircon" v-model="aircon">
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>

    <h3>Bills Inclusion</h3>
    <div class="checkbox-group">
      <h4>
        <input
          type="checkbox"
          name="billsInclusion"
          value="electricity"
          v-model="electricityIncluded"
        />
        Electricity
      </h4>
      <h4>
        <input type="checkbox" name="billsInclusion" value="water" v-model="waterIncluded" />
        Water
      </h4>
      <h4>
        <input type="checkbox" name="billsInclusion" value="internet" v-model="internetIncluded" />
        Internet
      </h4>
    </div>

    <h3>Move-in date (required)</h3>
    <input type="date" id="move-in-date" name="moveInDate" v-model="moveinDate" required />

    <br />
    <br />
    <button type="submit" class="submit-btn" :disabled="!isFormValid">Submit</button>
    <button @click="cancelClicked">Cancel</button>
  </form>
</template>
