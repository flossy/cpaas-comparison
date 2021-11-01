import Vue from 'vue'
import CpaasComparison from './CpaasComparison.vue'
import VueCompositionAPI from '@vue/composition-api'
import vuetify from './plugins/vuetify'
Vue.use(VueCompositionAPI)

Vue.config.productionTip = false

new Vue({
  vuetify,
  render: (h) => h(CpaasComparison),
}).$mount('#app')
