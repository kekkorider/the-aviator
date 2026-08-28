import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText)

export const animateInMainTitle = () => {
  const tl = gsap.timeline({ paused: true })

  const mainMenu = document.getElementById('main-menu') as HTMLElement
  const title = document.getElementById('main-menu-title') as HTMLElement
  const pills = title.querySelectorAll('[data-js-pill]') as NodeListOf<HTMLElement>
  const subtitle = document.getElementById('main-menu-subtitle') as HTMLElement
  const subtitleCopy = document.getElementById('main-menu-subtitle-copy') as HTMLElement
  const subtitleSplit = new SplitText(subtitleCopy, { type: 'chars' })
  const playButton = document.getElementById('main-menu-button-play') as HTMLElement

  tl.addLabel('start')
  tl.set(mainMenu, { clearProps: 'visibility' }, 'start')
  tl.fromTo(title,
    {
      y: '-100vh'
    },
    {
      y: 0,
      duration: 1.6,
      ease: 'elastic.out(0.5, 0.3)',
    }, 'start'
  )

  tl.addLabel('animatePills', '>-0.7')
  tl.fromTo(pills,
    {
      scale: 0,
      xPercent: 0,
      yPercent: 0,
      rotation: 0
    },
    {
      scale: 1,
      xPercent: (idx) => {
        switch (idx) {
          case 0:
            return -400
          case 1:
            return -50
          case 2:
            return 220
        }
      },
      yPercent: idx => {
        switch (idx) {
          case 0:
            return 300
          case 1:
            return -300
          case 2:
            return -190
        }
      },
      rotation: () => gsap.utils.random(-360, 360),
      stagger: {
        from: 'random',
        each: 0.12
      },
      ease: 'elastic.out(0.5, 0.3)',
      duration: 1.3
    },
    'animatePills'
  )

  tl.addLabel('animateInSubtitle', '<')
  tl.fromTo(subtitle, {
    scaleX: 0
  }, {
    scaleX: 1,
    duration: 1,
    ease: 'elastic.out(1, 0.6)',
  }, 'animateInSubtitle')

  tl.fromTo(subtitleSplit.chars, {
    scale: 0
  }, {
    scale: 1,
    stagger: 0.05,
    ease: 'elastic.out(1.5, 0.6)',
    duration: 1.3
  }, 'animateInSubtitle+=0.2')

  tl.addLabel('animateInPlayButton', '<0.3')
  tl.fromTo(playButton, {
    scale: 0.4,
    visibility: 'hidden'
  }, {
    scale: 1,
    duration: 1,
    ease: 'elastic.out(1, 0.6)',
    visibility: 'visible'
  }, 'animateInPlayButton')

  return tl.play()
}
