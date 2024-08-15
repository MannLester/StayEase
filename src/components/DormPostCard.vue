<script setup lang="ts">
import { defineProps } from 'vue'

// Define the props that the component expects
const props = defineProps<{
  dorm: {
    addressOfTheDorm: string
    advancePrice: number
    aircon: boolean
    curfew: string
    depositPrice: number
    descOfTheDorm: string
    electricityIncluded: boolean
    gender: string
    id: string
    internet: boolean
    internetIncluded: boolean
    monthlyPrice: number
    moveinDate: string
    nameOfTheDorm: string
    pax: number
    rating: number
    rentType: string
    reservationPrice: number
    waterIncluded: boolean
  }
}>()

// Destructure the props for easier use in the template
const {
  nameOfTheDorm,
  addressOfTheDorm,
  advancePrice,
  aircon,
  curfew,
  depositPrice,
  descOfTheDorm,
  electricityIncluded,
  gender,
  id,
  internet,
  internetIncluded,
  monthlyPrice,
  moveinDate,
  pax,
  rating,
  rentType,
  reservationPrice,
  waterIncluded
} = props.dorm

console.log(props.dorm)
</script>

<template>
  <div>
    <h1>{{ nameOfTheDorm }}</h1>
    <h4>{{ addressOfTheDorm }}</h4>
    <h3>Price: {{ monthlyPrice }}/ month</h3>
    <h4>Rent Type: {{ rentType }}</h4>
    <h4>Pax: {{ pax }}</h4>
    <h4>Gender: {{ gender }}</h4>
    <h4>Inclusions:</h4>
    <h4 v-if="aircon">Aircon</h4>
    <h4 v-if="internet">Internet</h4>
    <h4>Move-in: {{ moveinDate }}</h4>
    <p>Id: {{ id }}</p>
    <p>Rating: {{ rating }}</p>
  </div>
</template>
