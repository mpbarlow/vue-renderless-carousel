<script>
export default {
  name: 'rl-carousel-slide',
  inject: ['height', 'spacing', 'vertical', 'width'],
  render (h) {
    return h('div', this.props, this.$slots.default)
  },
  computed: {
    props () {
      return {
        style: {
          'flex-shrink': 0,
          height: this.height === undefined ? 'auto' : this.height,
          [`margin-${this.vertical ? 'bottom' : 'right'}`]: this.spacing,
          width: this.width === undefined ? '100%' : this.width,
          ...this.verticalStyles
        }
      }
    },
    verticalStyles () {
      return this.vertical ? {
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'stretch',
        'justify-content': 'center'
      } : {}
    }
  }
}
</script>
