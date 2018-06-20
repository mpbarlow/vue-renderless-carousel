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
        active: this.activeSlide,
        moveTo: this.moveToSlide
      }
    })
  },
  provide () {
    return {
      slideProps: {
        vertical: this.vertical,
        rightMargin: this.rightMargin
      }
    }
  },
  props: {
    autoScrollInterval: {
      type: [Number, String],
      default: 0
    },
    height: {
      type: [String, Number],
      required: false
    },
    initialIndex: {
      type: [Number, String],
      default: 0
    },
    nextIndex: {
      type: Function
    },
    noWrap: {
      type: Boolean,
      default: false
    },
    overflow: {
      type: Boolean,
      default: false
    },
    spaceBetween: {
      type: [Number, String],
      default: 0
    },
    static: {
      type: Boolean,
      default: false
    },
    stopOnUserSelect: {
      type: Boolean,
      default: true
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
    vertical: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      activeSlide: 0,
      carouselSize: 0,
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
          height: this.vertical ? `${this.height}px` : 'auto',
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
    rightMargin () {
      return parseInt(this.spaceBetween)
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
      return (this.activeSlide * (this.carouselSize + this.rightMargin)) + this.mainAxisDragOffset
    },
    wrap () {
      return !this.noWrap
    },
    animated () {
      return !this.static
    }
  },
  methods: {
    moveToSlide (index) {
      this.activeSlide = index
      if (this.stopOnUserSelect) clearInterval(this.intervalHandler)
    }
  },
  watch: {
    activeSlide (newVal) {
      if (newVal >= this.slideCount) this.activeSlide = this.wrap ? 0 : this.slideCount - 1
      if (newVal < 0) this.activeSlide = this.wrap ? this.slideCount - 1 : 0
      this.$emit('slide-changed', this.activeSlide)
    }
  },
  mounted () {
    this.carouselSize = this.vertical ? parseInt(this.height) : this.$el.clientWidth
    this.slideCount = this.$children.filter(vn => vn.$options.name === 'rl-carousel-slide').length
    this.activeSlide = parseInt(this.initialIndex)

    // Re-translate on bounds change
    erd.listenTo(this.$el, el => {
      this.carouselSize = this.vertical ? parseInt(this.height) : el.clientWidth
    })

    this.touchstart = event => {
      this.mainAxisStart = Math.floor(event.touches[0][`client${this.vertical ? 'Y' : 'X'}`])
      this.crossAxisStart = Math.floor(event.touches[0][`client${this.vertical ? 'X' : 'Y'}`])
    }

    this.touchmove = event => {
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
      if ((Math.abs(this.mainAxisDragOffset) / this.carouselSize) * 100 >= 20) {
        if (this.mainAxisDragOffset < 0 && (this.activeSlide > 0 || this.touchWrap)) {
          this.moveToSlide(this.activeSlide - 1)
        } else if (this.mainAxisDragOffset > 0 && (this.activeSlide < this.slideCount - 1 || this.touchWrap)) {
          this.moveToSlide(this.activeSlide + 1)
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
      this.intervalHandler = setInterval(() => {
        // Don't auto-switch if the user is mid-drag
        if (this.mainAxisStart === undefined) {
          // If the user has supplied an autoscroll function, use that instead
          if (typeof this.nextIndex === 'function') {
            this.activeSlide = this.nextIndex(this.activeSlide, this.slideCount)
          } else {
            const forwards = this.autoScrollInterval > 0
            // Do this manually so we still wrap when autoscrolling if user wrapping is disabled
            if (forwards && this.activeSlide >= this.slideCount - 1) {
              this.activeSlide = 0
            } else if (!forwards && this.activeSlide <= 0) {
              this.activeSlide = this.slideCount - 1
            } else {
              this.activeSlide += forwards ? 1 : -1
            }
          }
        }
      }, parseInt(Math.abs(this.autoScrollInterval)))
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
