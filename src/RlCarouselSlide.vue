<script>
export default {
  name: 'rl-carousel-slide',
  inject: ['slideProps'],
  render (h) {
    return h('div', this.props, this.$slots.default)
  },
  computed: {
    props () {
      return {
        style: {
          [`margin-${this.slideProps.vertical ? 'bottom' : 'right'}`]: `${this.slideProps.rightMargin}px`,
          width: this.slideProps.width || '100%',
          'flex-shrink': 0
        }
      }
    }
  }
}
</script>
