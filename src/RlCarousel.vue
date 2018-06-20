<script>
import elementResizeDetectorMaker from 'element-resize-detector'

const erd = elementResizeDetectorMaker({ strategy: 'scroll' })

export default {
  name: 'rl-carousel',
  render () {
    return this.$scopedSlots.default({
      styleProps: {
        wrapper: this.wrapperProps,
        inner: this.innerProps
      },
      slides: {
        count: this.slideCount,
        active: this.value,
      }
    })
  },
  props: {
    autoScrollInterval: {
      type: [Boolean, Number, String],
      default: 0
    },
    noWrap: {
      type: Boolean,
      default: false
    },
    overflow: {
      type: Boolean,
      default: false
    },
    slideHeight: {
      type: [Number, String],
    },
    slideWidth: {
      type: [Number, String]
    },
    spaceBetween: {
      type: [Number, String],
      default: 0
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
  provide () {
    return {
      height: this.slideHeight,
      spacing: this.spaceBetween,
      vertical: this.vertical,
      width: this.slideWidth
    }
  },
  data () {
    return {
      activeSlide: 0,
      slideSize: 0,
      clientSize: undefined,
      slideCount: 0,
      mainAxisStart: undefined,
      mainAxisEnd: undefined,
      crossAxisStart: undefined,
      crossAxisEnd: undefined,
      intervalHandler: undefined
    }
  },
  computed: {
    wrapperProps () {
      return {
        style: {
          height: this.vertical ? `${this.clientSize}px` : 'auto',
          overflow: this.overflow ? 'visible' : 'hidden'
        }
      }
    },
    innerProps () {
      return {
        style: {
          transform: `translate${this.vertical ? 'Y' : 'X'}(${-this.mainAxisTranslate}px)`,
          transition: this.transitionMode,
          display: 'flex',
          'flex-wrap': `${this.vertical ? '' : 'no'}wrap`
        }
      }
    },
    spacing () {
      return this.parseDimension(this.spaceBetween)
    },
    mainAxisDragOffset () {
      if (this.mainAxisStart === undefined || this.mainAxisEnd === undefined) return 0
      return this.mainAxisStart - this.mainAxisEnd
    },
    transitionMode () {
      // If we're touching we want the transform to follow the finger immediately rather than
      // transitioning
      return this.mainAxisEnd === undefined && this.animated
        ? `transform ${this.transitionTime}s ${this.transition}`
        : 'all 0s'
    },
    mainAxisTranslate () {
      return (this.value * this.slideSize) - this.offsetToCenterInView + this.mainAxisDragOffset 
    },
    offsetToCenterInView () {
      if (this.clientSize === undefined) return 0
      return Math.round((this.clientSize / 2) - (this.slideSize / 2)) 
    },
    wrap () {
      return !this.noWrap
    },
    animated () {
      return !this.static
    },
    parsedSlideWidth () {
      return this.parseDimension(this.slideWidth)
    },
    parsedSlideHeight () {
      return this.parseDimension(this.slideHeight)
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
    parseDimension (dimension) {
      if (this.clientSize === undefined) {
        return 0
      }

      if (dimension === undefined) {
        return this.clientSize
      }

      if (dimension.slice(-2, dimension.length) === 'px') {
        return parseFloat(dimension.slice(0, dimension.length - 2))
      }

      if (dimension.slice(-2, dimension.length) === 'vw') {
        return (document.documentElement.clientWidth / 100) * parseFloat(dimension.slice(0, dimension.length - 2))
      }

      if (dimension.slice(-2, dimension.length) === 'vh') {
        return (document.documentElement.clientHeight / 100) * parseFloat(dimension.slice(0, dimension.length - 2))
      }

      if (dimension.slice(-1, dimension.length) === '%') {
        return (this.clientSize / 100) * parseFloat(dimension.slice(0, dimension.length - 1))
      }

      return parseFloat(dimension)
    }
  },
  watch: {
    value (newVal) {
      if (newVal >= this.slideCount) this.$emit('input', this.wrap ? 0 : this.slideCount - 1)
      if (newVal < 0) this.$emit('input', this.wrap ? this.slideCount - 1 : 0)

      this.$emit('slide-changed', this.value)
    },
    autoScrollInterval (newVal) {
      clearInterval(this.intervalHandler)
      if (newVal) {
        this.spawnIntervalHandler()
      }
    }
  },
  mounted () {
    this.clientSize = this.vertical ? this.$el.clientHeight : this.$el.clientWidth

    this.slideSize = this.vertical
      ? this.parsedSlideHeight
      : (this.slideWidth === undefined ? this.$el.clientWidth : this.parsedSlideWidth)

    this.slideCount = this.$children.filter(vn => vn.$options.name === 'rl-carousel-slide').length

    // Re-translate on bounds change
    erd.listenTo(this.$el, el => {
      this.slideSize = this.vertical
        ? this.parsedSlideHeight
        : (this.slideWidth === undefined ? el.clientWidth : this.parsedSlideWidth)

        this.clientSize = this.vertical ? this.$el.clientHeight : el.clientWidth
    })

    this.touchstart = event => {
      this.mainAxisStart = Math.floor(event.touches[0][`client${this.vertical ? 'Y' : 'X'}`])
      this.crossAxisStart = Math.floor(event.touches[0][`client${this.vertical ? 'X' : 'Y'}`])
    }

    this.touchmove = event => {
      this.$emit('user-touch')

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
      // Just a touch, not a swipe
      if (this.mainAxisEnd === undefined) {
        this.mainAxisStart = undefined
        return
      }

      // Swipes >= 20% of carousel size change the active index.
      if ((Math.abs(this.mainAxisDragOffset) / this.slideSize) * 100 >= 20) {
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
    if (this.autoScrollInterval !== 0) {
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
