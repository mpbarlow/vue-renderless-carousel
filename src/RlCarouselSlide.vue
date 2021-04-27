<script>
export default {
  name: "rl-carousel-slide",
  render(h) {
    return h("div", { style: { "flex-shrink": 0 } }, this.$slots.default);
  },
};
</script>
