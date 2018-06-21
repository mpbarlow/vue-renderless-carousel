<script>
import elementResizeDetectorMaker from 'element-resize-detector'

const erd = elementResizeDetectorMaker({ strategy: 'scroll' })

export default {
  name: 'rl-carousel',
  props: {
    autoScrollInterval: {
      type: [Boolean, Number, String],
      default: 0
    },
    noWrap: {
      type: Boolean,
      default: false
    },
    static: {
      type: Boolean,
      default: false
    },
    touchWrap: {
      type: Boolean,
      default: false
    },
    transition: {
      type: String,
      default: 'ease',
      validator: value => value.match(/^(ease|linear|ease-in|ease-out|ease-in-out|cubic-bezier\(.*\))$/) !== null
    },
    transitionTime: {
      type: [Number, String],
      default: 0.5
    },
    value: {
      type: Number,
      required: true
    },
    vertical: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      slideSizes: [],
      carouselSize: 0,
      clientSize: 0,
      slideCount: 0,
      mainAxisStart: undefined,
      mainAxisEnd: undefined,
      crossAxisStart: undefined,
      crossAxisEnd: undefined,
      intervalHandler: undefined,
    }
  },
  render () {
    return this.$scopedSlots.default({
      wrapperStyles: this.wrapperStyles,
      slides: {
        count: this.slideCount,
        active: this.value,
      }
    })
  },
  computed: {
    wrapperStyles () {
      return {
        style: {
          transform: `translate${this.vertical ? 'Y' : 'X'}(${-this.mainAxisTranslate}px)`,
          transition: this.transitionProperty,
          display: 'inline-flex',
          'flex-wrap': `${this.vertical ? '' : 'no'}wrap`
        }
      }
    },
    mainAxisDragOffset () {
      if (this.mainAxisStart === undefined || this.mainAxisEnd === undefined) return 0
      return this.mainAxisStart - this.mainAxisEnd
    },
    transitionProperty () {
      // If we're touching we want the transform to follow the finger immediately rather than
      // transitioning
      return this.mainAxisEnd === undefined && this.animated
        ? `transform ${this.transitionTime}s ${this.transition}`
        : 'all 0s'
    },
    mainAxisTranslate () {
      return this.accumulatedTranslate - this.offsetToCenterInView + this.mainAxisDragOffset 
    },
    accumulatedTranslate () {
      return this.slideSizes.slice(0, this.value).reduce((a, c) => a + c, 0)
    },
    offsetToCenterInView () {
      return this.carouselSize < this.clientSize
        ? (this.carouselSize / 2) - (this.slideSizes[this.value] / 2)
        : (this.clientSize - this.slideSizes[this.value]) / 2
    },
    wrap () {
      return !this.noWrap
    },
    animated () {
      return !this.static
    }
  },
  methods: {
    spawnIntervalHandler () {
      this.intervalHandler = setInterval(() => {
        // Don't auto-switch if the user is mid-drag
        if (this.mainAxisStart === undefined) {
          const forwards = this.autoScrollInterval > 0

          if (forwards && this.value >= this.slideCount - 1) {
            this.$emit('input', 0)
          } else if (!forwards && this.value <= 0) {
            this.$emit('input', this.slideCount - 1)
          } else {
            this.$emit('input', this.value + (forwards ? 1 : -1))
          }
        }
      }, parseInt(Math.abs(this.autoScrollInterval)))
    },
    setSizes (el) {
      const size = `client${this.vertical ? 'Height' : 'Width'}`
      const slides = this.$children.filter(vn => vn.$options.name === 'rl-carousel-slide')

      this.clientSize = el[size]
      this.slideSizes.splice(0, this.slideSizes.length)

      if (slides.length > 0) {
        this.slideSizes.push(...slides.map(s => s.$el[size]))
        this.carouselSize = slides.map(s => s.$el[size]).reduce((a, c) => a + c, 0)
      } else {
        this.carouselSize = 0
      }
    }
  },
  watch: {
    value (newVal) {
      if (newVal >= this.slideCount) this.$emit('input', this.wrap ? 0 : this.slideCount - 1)
      if (newVal < 0) this.$emit('input', this.wrap ? this.slideCount - 1 : 0)

      this.$emit('rl-carousel-slide-changed', this.value)
    },
    autoScrollInterval (newVal) {
      clearInterval(this.intervalHandler)
      if (newVal) {
        this.spawnIntervalHandler()
      }
    }
  },
  mounted () {
    this.slideCount = this.$children.filter(vn => vn.$options.name === 'rl-carousel-slide').length
    this.setSizes(this.$el)

    // Re-translate on bounds change
    erd.listenTo(this.$el, el => {
      this.$emit('rl-carousel-resize')
      this.setSizes(el)
    })

    this.touchstart = event => {
      this.$emit('rl-carousel-touchstart')

      this.mainAxisStart = Math.floor(event.touches[0][`client${this.vertical ? 'Y' : 'X'}`])
      this.crossAxisStart = Math.floor(event.touches[0][`client${this.vertical ? 'X' : 'Y'}`])
    }

    this.touchmove = event => {
      this.$emit('rl-carousel-touchmove')

      this.mainAxisEnd = Math.floor(event.touches[0][`client${this.vertical ? 'Y' : 'X'}`])
      this.crossAxisEnd = Math.floor(event.touches[0][`client${this.vertical ? 'X' : 'Y'}`])

      // If the swipe is more horizontal than vertical, prevent scrolling.
      const angle = Math.atan2(
        this.mainAxisEnd - this.mainAxisStart,
        this.crossAxisEnd - this.crossAxisStart
      ) * (180 / Math.PI)

      if ((angle > -135 && angle < -45) || (angle > 45 && angle < 135)) event.preventDefault()
    }

    this.touchend = () => {
      this.$emit('rl-carousel-touchend')

      // Just a touch, not a swipe
      if (this.mainAxisEnd === undefined) {
        this.mainAxisStart = undefined
        return
      }

      this.$emit('rl-carousel-swipe-recognized')

      // Swipes >= 20% of carousel size change the active index.
      if ((Math.abs(this.mainAxisDragOffset) / this.slideSizes[this.value]) * 100 >= 20) {
        if (this.mainAxisDragOffset < 0 && (this.value > 0 || this.touchWrap)) {
          this.$emit('input', this.value - 1)
        } else if (this.mainAxisDragOffset > 0 && (this.value < this.slideCount - 1 || this.touchWrap)) {
          this.$emit('input', this.value + 1)
        }
      }

      this.mainAxisStart = undefined
      this.mainAxisEnd = undefined
      this.crossAxisStart = undefined
      this.crossAxisEnd = undefined
    }

    // Touch/swipe controls
    this.$el.addEventListener('touchstart', this.touchstart)
    this.$el.addEventListener('touchmove', this.touchmove)
    this.$el.addEventListener('touchend', this.touchend)

    // Auto-scroll: negative interval to scroll backwards
    if (this.autoScrollInterval) {
      this.spawnIntervalHandler()
    }
  },
  beforeDestroy () {
    erd.removeAllListeners(this.$el)
    this.$el.removeEventListener('touchstart', this.touchstart)
    this.$el.removeEventListener('touchmove', this.touchmove)
    this.$el.removeEventListener('touchend', this.touchend)
    clearInterval(this.intervalHandler)
  }
}
</script>
