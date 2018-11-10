export default {
  methods: {
    setValue (key, value) {
      const config = { ...this.config }

      config[key] = value

      this.save(config)
    },
    save (conf) {
      this.$store.dispatch('config/save', conf)
    }
  }
}
