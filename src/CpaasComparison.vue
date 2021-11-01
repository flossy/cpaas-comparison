<template>
  <div class="cpaas-comparison">
    <v-app style="background: transparent">
      <v-main>
        <v-app-bar color="primary" dark>
          <v-toolbar-title>
            CpaaS-Comparison
            <small>(Only Offer / Answer)</small>
          </v-toolbar-title>
          <v-spacer />
          <v-select
            dark
            dense
            outlined
            hide-details
            :items="items"
            v-model="choose"
            label="Choose CPaaS"
          ></v-select>
        </v-app-bar>
        <v-container>
          <v-row>
            <v-col><component :is="choose" max-width="480" /></v-col>
          </v-row>
        </v-container>
      </v-main>
    </v-app>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import ConnectyCube from './components/ConnectyCube.vue'
import QuickBlox from './components/QuickBlox.vue'
import SkyWay from './components/SkyWay.vue'

export default Vue.extend({
  name: 'App',
  components: {
    ConnectyCube,
    QuickBlox,
    SkyWay,
  },
  data: () => ({
    items: ['connecty-cube', 'quick-blox', 'sky-way'],
    choose: '',
  }),
})
</script>
