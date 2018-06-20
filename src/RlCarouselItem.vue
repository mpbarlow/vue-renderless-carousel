<script>
export default {
  name: 'rl-carousel-item',
  inject: ['itemProps'],
  render (h) {
    return h('div', this.itemProps, this.$slots.default)
  }
}
</script>
