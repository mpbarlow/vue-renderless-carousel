import t from"element-resize-detector";var e=t({strategy:"scroll"});function i(t,e,i,n,s,r,o,a,l,u){"boolean"!=typeof o&&(l=a,a=o,o=!1);var c,d="function"==typeof i?i.options:i;if(t&&t.render&&(d.render=t.render,d.staticRenderFns=t.staticRenderFns,d._compiled=!0,s&&(d.functional=!0)),n&&(d._scopeId=n),r?(c=function(t){(t=t||this.$vnode&&this.$vnode.ssrContext||this.parent&&this.parent.$vnode&&this.parent.$vnode.ssrContext)||"undefined"==typeof __VUE_SSR_CONTEXT__||(t=__VUE_SSR_CONTEXT__),e&&e.call(this,l(t)),t&&t._registeredComponents&&t._registeredComponents.add(r)},d._ssrRegister=c):e&&(c=o?function(t){e.call(this,u(t,this.$root.$options.shadowRoot))}:function(t){e.call(this,a(t))}),c)if(d.functional){var h=d.render;d.render=function(t,e){return c.call(e),h(t,e)}}else{var f=d.beforeCreate;d.beforeCreate=f?[].concat(f,c):[c]}return i}var n=i({},undefined,{name:"rl-carousel",props:{align:{type:String,default:"center",validator:function(t){return null!==t.match(/^(left|center|right)$/)}},animateIn:{type:Boolean,default:!1},noWrap:{type:Boolean,default:!1},static:{type:Boolean,default:!1},touchWrap:{type:Boolean,default:!1},transition:{type:String,default:"ease",validator:function(t){return null!==t.match(/^(ease|linear|ease-in|ease-out|ease-in-out|cubic-bezier\(.*\))$/)}},transitionTime:{type:[Number,String],default:.5},value:{type:Number,required:!0},vertical:{type:Boolean,default:!1}},data:function(){return{positioned:!1,slideSizes:[],carouselSize:0,clientSize:0,slideCount:0,mainAxisStart:void 0,mainAxisEnd:void 0,crossAxisStart:void 0,crossAxisEnd:void 0}},render:function(){return this.$scopedSlots.default({wrapperStyles:this.wrapperStyles,slides:{count:this.slideCount,active:this.value}})},computed:{wrapperStyles:function(){return{style:{display:"inline-flex","flex-wrap":(this.vertical?"":"no")+"wrap",transform:"translate"+(this.vertical?"Y":"X")+"("+-this.mainAxisTranslate+"px)",transition:this.transitionProperty}}},shouldAnimateIn:function(){return this.animateIn||this.positioned},mainAxisDragOffset:function(){return void 0===this.mainAxisStart||void 0===this.mainAxisEnd?0:this.mainAxisStart-this.mainAxisEnd},transitionProperty:function(){return void 0===this.mainAxisEnd&&this.animated&&this.shouldAnimateIn?"transform "+parseFloat(this.transitionTime)+"s "+this.transition:"all 0s"},mainAxisTranslate:function(){return this.accumulatedTranslate-this.offsetToAlignInView+this.mainAxisDragOffset},accumulatedTranslate:function(){return this.slideSizes.slice(0,this.value).reduce((function(t,e){return t+e}),0)},offsetToAlignInView:function(){switch(this.align){case"left":return 0;case"center":return this.carouselSize<this.clientSize?this.carouselSize/2-this.slideSizes[this.value]/2:(this.clientSize-this.slideSizes[this.value])/2;case"right":return this.clientSize-this.slideSizes[this.value]}},wrap:function(){return!this.noWrap},animated:function(){return!this.static}},methods:{recalculateDimensions:function(t){var e,i=this,n=function(t){return i.vertical?t.getBoundingClientRect().height:t.getBoundingClientRect().width},s=this.$children.filter((function(t){return"rl-carousel-slide"===t.$options.name}));this.slideCount=s.length,this.value>this.slideCount-1&&this.$emit("input",Math.max(this.slideCount-1,0)),this.clientSize=n(t),this.slideSizes.splice(0,this.slideSizes.length),s.length>0?((e=this.slideSizes).push.apply(e,s.map((function(t){return n(t.$el)}))),this.carouselSize=this.slideSizes.reduce((function(t,e){return t+e}),0)):this.carouselSize=0,this.$emit("size-calculated")}},watch:{value:function(t){t>=this.slideCount&&this.$emit("input",this.wrap?0:this.slideCount-1),t<0&&this.$emit("input",this.wrap?this.slideCount-1:0),this.$emit("slide-changed",this.value)}},mounted:function(){var t,i,n,s=this;this.recalculateDimensions(this.$el),e.listenTo(this.$el,(t=function(){s.$emit("resized"),s.recalculateDimensions(s.$el)},i=16,function(){for(var e=[],s=arguments.length;s--;)e[s]=arguments[s];clearTimeout(n),n=setTimeout((function(){return t.apply(void 0,e)}),i)})),this.touchstart=function(t){s.$emit("touchstart"),s.mainAxisStart=Math.floor(t.touches[0]["client"+(s.vertical?"Y":"X")]),s.crossAxisStart=Math.floor(t.touches[0]["client"+(s.vertical?"X":"Y")])},this.touchmove=function(t){s.$emit("touchmove"),s.mainAxisEnd=Math.floor(t.touches[0]["client"+(s.vertical?"Y":"X")]),s.crossAxisEnd=Math.floor(t.touches[0]["client"+(s.vertical?"X":"Y")]);var e=Math.atan2(s.mainAxisEnd-s.mainAxisStart,s.crossAxisEnd-s.crossAxisStart)*(180/Math.PI);(e>-135&&e<-45||e>45&&e<135)&&t.preventDefault()},this.touchend=function(){s.$emit("touchend"),void 0!==s.mainAxisEnd?(s.$emit("swipe-recognized"),Math.abs(s.mainAxisDragOffset)/s.slideSizes[s.value]*100>=20&&(s.mainAxisDragOffset<0&&(s.value>0||s.touchWrap)?s.$emit("input",s.value-1):s.mainAxisDragOffset>0&&(s.value<s.slideCount-1||s.touchWrap)&&s.$emit("input",s.value+1)),s.mainAxisStart=void 0,s.mainAxisEnd=void 0,s.crossAxisStart=void 0,s.crossAxisEnd=void 0):s.mainAxisStart=void 0},this.$el.addEventListener("touchstart",this.touchstart),this.$el.addEventListener("touchmove",this.touchmove),this.$el.addEventListener("touchend",this.touchend),this.childNodeObserver=new MutationObserver((function(){s.$emit("slide-count-changed"),s.$nextTick((function(){return s.recalculateDimensions(s.$el)}))})),this.childNodeObserver.observe(this.$el,{childList:!0,subtree:!0}),setTimeout((function(){s.positioned=!0,s.$emit("positioned")}),16)},beforeDestroy:function(){this.$emit("before-destroy"),e.removeAllListeners(this.$el),this.$el.removeEventListener("touchstart",this.touchstart),this.$el.removeEventListener("touchmove",this.touchmove),this.$el.removeEventListener("touchend",this.touchend),this.childNodeObserver.disconnect()}},undefined,undefined,undefined,!1,void 0,void 0,void 0),s=i({},undefined,{name:"rl-carousel-slide",render:function(t){return t("div",{style:{"flex-shrink":0}},this.$slots.default)}},undefined,undefined,undefined,!1,void 0,void 0,void 0);export{n as RlCarousel,s as RlCarouselSlide};
