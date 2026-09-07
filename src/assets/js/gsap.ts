import { gsap } from 'gsap'

// animateOutElasticOut()
gsap.registerEffect({
  name: 'animateOutElasticOut',
  effect: (targets: HTMLElement | HTMLElement[], config: gsap.TweenVars = {}) => {
    return gsap.fromTo(targets, {
      visibility: 'hidden',
      scale: 0.6,
      rotation: -20
    }, {
      visibility: 'visible',
      scale: 1,
      rotation: 0,
      duration: 1.2,
      ease: 'elastic.out(1.3, 0.6)',
      ...config
    })
  },
  defaults: {
    onStart: () => {},
    onComplete: () => {}
  },
  extendTimeline: true
})

// animateOutBackIn()
gsap.registerEffect({
  name: 'animateOutBackIn',
  effect: (targets: HTMLElement | HTMLElement[], config: gsap.TweenVars = {}) => {
    return gsap.to(targets, {
      scale: 0,
      duration: 0.5,
      ease: 'back.in(1.5)',
      ...config
    })
  },
  defaults: {
    onStart: () => {},
    onComplete: () => {}
  },
  extendTimeline: true
})
