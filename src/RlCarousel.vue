<script>
import elementResizeDetectorMaker from "element-resize-detector";

const erd = elementResizeDetectorMaker({ strategy: "scroll" });

const debounce = (fn, timeout) => {
  let handle;

  return (...args) => {
    clearTimeout(handle);
    handle = setTimeout(() => fn(...args), timeout);
  };
};

export default {
  name: "rl-carousel",
  props: {
    align: {
      type: String,
      default: "center",
      validator: (value) => value.match(/^(left|center|right)$/) !== null,
    },
    animateIn: {
      type: Boolean,
      default: false,
    },
    noWrap: {
      type: Boolean,
      default: false,
    },
    static: {
      type: Boolean,
      default: false,
    },
    touchWrap: {
      type: Boolean,
      default: false,
    },
    transition: {
      type: String,
      default: "ease",
      validator: (value) =>
        value.match(/^(ease|linear|ease-in|ease-out|ease-in-out|cubic-bezier\(.*\))$/) !== null,
    },
    transitionTime: {
      type: [Number, String],
      default: 0.5,
    },
    value: {
      type: Number,
      required: true,
    },
    vertical: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      positioned: false,
      slideSizes: [],
      carouselSize: 0,
      clientSize: 0,
      slideCount: 0,
      mainAxisStart: undefined,
      mainAxisEnd: undefined,
      crossAxisStart: undefined,
      crossAxisEnd: undefined,
    };
  },
  render() {
    return this.$scopedSlots.default({
      wrapperStyles: this.wrapperStyles,
      slides: {
        count: this.slideCount,
        active: this.value,
      },
    });
  },
  computed: {
    wrapperStyles() {
      return {
        style: {
          display: "inline-flex",
          "flex-wrap": `${this.vertical ? "" : "no"}wrap`,
          transform: `translate${this.vertical ? "Y" : "X"}(${-this.mainAxisTranslate}px)`,
          transition: this.transitionProperty,
        },
      };
    },
    shouldAnimateIn() {
      return this.animateIn || this.positioned;
    },
    mainAxisDragOffset() {
      if (this.mainAxisStart === undefined || this.mainAxisEnd === undefined) {
        return 0;
      }

      return this.mainAxisStart - this.mainAxisEnd;
    },
    transitionProperty() {
      // If we're touching we want the transform to follow the finger
      // immediately rather than transitioning
      return this.mainAxisEnd === undefined && this.animated && this.shouldAnimateIn
        ? `transform ${parseFloat(this.transitionTime)}s ${this.transition}`
        : "all 0s";
    },
    mainAxisTranslate() {
      return this.accumulatedTranslate - this.offsetToAlignInView + this.mainAxisDragOffset;
    },
    accumulatedTranslate() {
      return this.slideSizes.slice(0, this.value).reduce((a, c) => a + c, 0);
    },
    offsetToAlignInView() {
      switch (this.align) {
        case "left":
          return 0;
        case "center":
          return this.carouselSize < this.clientSize
            ? this.carouselSize / 2 - this.slideSizes[this.value] / 2
            : (this.clientSize - this.slideSizes[this.value]) / 2;
        case "right":
          return this.clientSize - this.slideSizes[this.value];
      }
    },
    wrap() {
      return !this.noWrap;
    },
    animated() {
      return !this.static;
    },
  },
  methods: {
    recalculateDimensions(el) {
      const size = (el) =>
        this.vertical ? el.getBoundingClientRect().height : el.getBoundingClientRect().width;

      const slides = this.$children.filter((vn) => vn.$options.name === "rl-carousel-slide");

      this.slideCount = slides.length;

      if (this.value > this.slideCount - 1) {
        this.$emit("input", Math.max(this.slideCount - 1, 0));
      }

      this.clientSize = size(el);
      this.slideSizes.splice(0, this.slideSizes.length);

      if (slides.length > 0) {
        this.slideSizes.push(...slides.map((s) => size(s.$el)));
        this.carouselSize = this.slideSizes.reduce((a, c) => a + c, 0);
      } else {
        this.carouselSize = 0;
      }

      this.$emit("size-calculated");
    },
  },
  watch: {
    value(newVal) {
      if (newVal >= this.slideCount) {
        this.$emit("input", this.wrap ? 0 : this.slideCount - 1);
      }

      if (newVal < 0) {
        this.$emit('input', this.wrap ? this.slideCount - 1 : 0)
      }

      this.$emit('slide-changed', this.value)
    }
  },
  mounted() {
    this.recalculateDimensions(this.$el)

    // Re-translate on bounds change
    erd.listenTo(this.$el, el => {
      this.$emit('resized')
      this.recalculateDimensions(el)
    })

    this.touchstart = event => {
      this.$emit('touchstart')

      this.mainAxisStart = Math.floor(event.touches[0][`client${this.vertical ? 'Y' : 'X'}`])

      this.crossAxisStart = Math.floor(event.touches[0][`client${this.vertical ? 'X' : 'Y'}`])
    }

    this.touchmove = event => {
      this.$emit('touchmove')

      this.mainAxisEnd = Math.floor(event.touches[0][`client${this.vertical ? 'Y' : 'X'}`])

      this.crossAxisEnd = Math.floor(event.touches[0][`client${this.vertical ? 'X' : 'Y'}`])

      // If the swipe is more horizontal than vertical, prevent scrolling.
      const angle =
        Math.atan2(this.mainAxisEnd - this.mainAxisStart, this.crossAxisEnd - this.crossAxisStart) *
        (180 / Math.PI);

      if ((angle > -135 && angle < -45) || (angle > 45 && angle < 135)) {
        event.preventDefault();
      }
    };

    this.touchend = () => {
      this.$emit("touchend");

      // Just a touch, not a swipe
      if (this.mainAxisEnd === undefined) {
        this.mainAxisStart = undefined;
        return;
      }

      this.$emit("swipe-recognized");

      // Swipes >= 20% of carousel size change the active index.
      if ((Math.abs(this.mainAxisDragOffset) / this.slideSizes[this.value]) * 100 >= 20) {
        if (this.mainAxisDragOffset < 0 && (this.value > 0 || this.touchWrap)) {
          this.$emit("input", this.value - 1);
        } else if (
          this.mainAxisDragOffset > 0 &&
          (this.value < this.slideCount - 1 || this.touchWrap)
        ) {
          this.$emit("input", this.value + 1);
        }
      }

      this.mainAxisStart = undefined
      this.mainAxisEnd = undefined
      this.crossAxisStart = undefined
      this.crossAxisEnd = undefined
    }

    this.$el.addEventListener('touchstart', this.touchstart)
    this.$el.addEventListener('touchmove', this.touchmove)
    this.$el.addEventListener('touchend', this.touchend)

    this.childNodeObserver = new MutationObserver(() => {
      this.$emit('slide-count-changed')
      this.recalculateDimensions(this.$el)
    })

    this.childNodeObserver.observe(this.$el, { childList: true, subtree: true })

    // Delay animation for a frame so it doesn't draw in its default position and slide in
    setTimeout(() => {
      this.positioned = true;
      this.$emit("positioned");
    }, 16);
  },
  beforeDestroy() {
    this.$emit("before-destroy");

    erd.removeAllListeners(this.$el);

    this.$el.removeEventListener("touchstart", this.touchstart);
    this.$el.removeEventListener("touchmove", this.touchmove);
    this.$el.removeEventListener("touchend", this.touchend);

    this.childNodeObserver.disconnect();
  },
};
</script>
