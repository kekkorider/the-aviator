import { ContextModule } from "three-start"
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { Observer } from 'gsap/Observer'

gsap.registerPlugin(SplitText, Observer)

type UIEvents = {
  animateInMainTitle: []
  animateOutMainTitle: []
}

export class UIModule extends ContextModule<UIEvents> {
  private scoreElem: HTMLDivElement | null = null
  private playButton: HTMLButtonElement | null = null
  private playButtonObserver: Observer | null = null
  private playButtonHoverTween: gsap.core.Tween | null = null

  constructor() {
    super()

    this.scoreElem = document.getElementById('hud-score-value') as HTMLDivElement
    this.playButton = document.getElementById('main-menu-button-play') as HTMLButtonElement

    this.createPlayButtonHoverTween()
  }

  onAwake() {
    this.modules.game.on('scoreChanged', (currScore: number, prevScore: number) => {
      const score = { value: prevScore }

      gsap.to(score, {
        value: currScore,
        snap: 'value',
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => {
          this.scoreElem!.textContent = formatPadded(score.value)
        }
      })
    })

    function formatPadded(num: number): string {
      // Ensure a non-negative integer, pad to 8 digits, then group with commas
      const padded = Math.trunc(Math.abs(num)).toString().padStart(8, '0')
      const withCommas = padded.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

      return num < 0 ? `-${withCommas}` : withCommas
    }
  }

  animateInMainTitle = () => {
    const tl = gsap.timeline({
      paused: true
    })

    const mainMenu = document.getElementById('main-menu') as HTMLElement
    const title = document.getElementById('main-menu-title') as HTMLElement
    const pills = title.querySelectorAll('[data-js-pill]') as NodeListOf<HTMLElement>
    const subtitle = document.getElementById('main-menu-subtitle') as HTMLElement
    const subtitleCopy = document.getElementById('main-menu-subtitle-copy') as HTMLElement
    const subtitleSplit = new SplitText(subtitleCopy, { type: 'chars' })

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
            default:
              return 0
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
            default:
              return 0
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
    tl.fromTo(this.playButton, {
      scale: 0.4,
      visibility: 'hidden'
    }, {
      scale: 1,
      duration: 1,
      ease: 'elastic.out(1, 0.6)',
      visibility: 'visible',
      onStart: () => {
        this.playButton!.removeAttribute('disabled')
        this.createPlayButtonObserver()
        this.emit('animateInMainTitle')
      },
    }, 'animateInPlayButton')

    return tl.play()
  }

  animateOutMainTitle = () => {
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        this.emit('animateOutMainTitle')
      }
    })

    const title = document.getElementById('main-menu-title') as HTMLElement
    const pills = title.querySelectorAll('[data-js-pill]') as NodeListOf<HTMLElement>
    const subtitle = document.getElementById('main-menu-subtitle') as HTMLElement

    tl.addLabel('start')
    tl.to(this.playButton, {
      scale: 0,
      duration: 0.5,
      ease: 'back.in(1.5)',
    }, 'start')

    tl.to(pills, {
      scale: 0,
      duration: 0.5,
      ease: 'back.in(1.5)',
      yPercent: 0,
      xPercent: 0,
      stagger: {
        from: 'random',
        each: 0.12
      }
    }, '<0.12')

    tl.to([title, subtitle], {
      scale: 0,
      duration: 0.5,
      stagger: {
        from: 'random',
        each: 0.15
      },
      ease: 'back.in(1.5)',
    }, '>-0.2')

    return tl.play()
  }

  private createPlayButtonObserver() {
    this.playButtonObserver = Observer.create({
      target: this.playButton,
      onClick: () => {
        this.playButtonObserver?.disable()
        this.animateOutMainTitle()
      },
      onHover: () => {
        this.playButtonHoverTween?.invalidate()
        this.playButtonHoverTween?.timeScale(1)
        this.playButtonHoverTween?.restart()
      },
      onHoverEnd: () => {
        this.playButtonHoverTween?.timeScale(1.5)
        this.playButtonHoverTween?.reverse()
      }
    })
  }

  private createPlayButtonHoverTween() {
    this.playButtonHoverTween = gsap.to(this.playButton, {
      paused: true,
      scale: 1.1,
      rotation: () => gsap.utils.random(-10, 10),
      duration: 0.5,
      ease: 'elastic.out(1, 0.3)',
      easeReverse: 'power2.out',
    })
  }
}
