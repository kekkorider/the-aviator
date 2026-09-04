import { ContextModule, ThreeContextEvents } from "three-start"
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { Observer } from 'gsap/Observer'

gsap.registerPlugin(SplitText, Observer)

type UIEvents = {
  animateInMainTitle: []
  animateOutMainTitle: []
}

type Elements = {
  scoreElem: HTMLDivElement
  scoreValueElem: HTMLDivElement

  playButton: HTMLButtonElement
  playButtonObserver: Observer
  playButtonHoverTween: gsap.core.Tween

  livesCounter: HTMLDivElement

  levelProgress: HTMLDivElement
  levelProgressInner: HTMLDivElement

  levelIndicator: HTMLDivElement
  levelIndicatorValue: HTMLDivElement

  progressBarBoundingBox: DOMRect

  gameOverScreen: HTMLElement
  gameOverTitle: HTMLHeadingElement
  gameOverButton: HTMLButtonElement
  gameOverButtonObserver: Observer
  gameOverButtonHoverTween: gsap.core.Tween
}

export class UIModule extends ContextModule<UIEvents> {
  private scoreElem: Elements['scoreElem']
  private scoreValueElem: Elements['scoreValueElem']
  private playButton: Elements['playButton']
  private playButtonObserver!: Elements['playButtonObserver']
  private playButtonHoverTween!: Elements['playButtonHoverTween']
  private livesCounter: Elements['livesCounter']
  private levelProgress: Elements['levelProgress']
  private levelProgressInner: Elements['levelProgressInner']
  private levelIndicator: Elements['levelIndicator']
  private levelIndicatorValue: Elements['levelIndicatorValue']
  private progressBarBoundingBox!: Elements['progressBarBoundingBox']
  private gameOverScreen: Elements['gameOverScreen']
  private gameOverTitle: Elements['gameOverTitle']
  private gameOverButton: Elements['gameOverButton']
  private gameOverButtonObserver!: Elements['gameOverButtonObserver']
  private gameOverButtonHoverTween!: Elements['gameOverButtonHoverTween']

  constructor() {
    super()

    this.scoreElem = document.getElementById('hud-score') as HTMLDivElement
    this.scoreValueElem = document.getElementById('hud-score-value') as HTMLDivElement
    this.playButton = document.getElementById('main-menu-button-play') as HTMLButtonElement
    this.livesCounter = document.getElementById('hud-lives') as HTMLDivElement
    this.levelProgress = document.getElementById('level-progress') as HTMLDivElement
    this.levelProgressInner = document.getElementById('level-progress-inner') as HTMLDivElement
    this.levelIndicator = document.getElementById('level-indicator') as HTMLDivElement
    this.levelIndicatorValue = document.getElementById('level-indicator-value') as HTMLDivElement
    this.gameOverScreen = document.getElementById('game-over-screen') as HTMLElement
    this.gameOverTitle = document.getElementById('game-over-title') as HTMLHeadingElement
    this.gameOverButton = document.getElementById('game-over-button') as HTMLButtonElement

    this.createButtons()
    this.handleResize()
  }

  onAwake() {
    const formatter = new Intl.NumberFormat('en-US')

    this.modules.game.on('scoreChanged', (currScore: number, prevScore: number) => {
      const score = { value: prevScore }

      gsap.to(score, {
        value: currScore,
        snap: 'value',
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => {
          this.scoreValueElem!.textContent = formatter.format(score.value)
        }
      })
    })

    this.modules.game.on('livesChanged', (lives: number, _prevLives: number) => {
      this.livesCounter!.setAttribute('data-lives', lives.toString())
    })

    this.modules.game.on('levelChanged', (level: number) => {
      this.levelIndicatorValue!.textContent = level.toString()
    })

    this.modules.game.on('levelProgressChanged', (progress: number) => {
      this.levelProgress!.style.setProperty('--progress', progress.toString())

      gsap.to(this.levelIndicator, {
        x: progress * this.progressBarBoundingBox!.width,
        xPercent: -50,
        overwrite: true,
        duration: 0.3,
        delay: 0.05
      })
    })

    this.ctx.on(ThreeContextEvents.Resized, this.handleResize.bind(this))
  }

  animateInMainTitle(): void {
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
        this.emit('animateInMainTitle')
      },
      onComplete: () => {
        this.playButton!.removeAttribute('disabled')
        this.createPlayButtonObserver()
      }
    }, 'animateInPlayButton')

    return tl.play()
  }

  animateOutMainTitle(): void {
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

  animateInHud(): void {
    const tl = gsap.timeline()
    tl.addLabel('start')

    tl.fromTo(this.scoreElem, {
      visibility: 'hidden',
      scale: 0.4
    }, {
      visibility: 'visible',
      duration: 0.5,
      scale: 1,
      ease: 'back.out(4)',
    }, 'start')

    tl.addLabel('animateInLivesCounter', '<0.2')
    tl.fromTo(this.livesCounter, {
      visibility: 'hidden',
      scale: 0.5
    }, {
      visibility: 'visible',
      scale: 1,
      duration: 0.5,
      ease: 'back.out(3)',
    }, 'animateInLivesCounter')

    tl.from(this.livesCounter!.querySelectorAll('svg'), {
      autoAlpha: 0,
      stagger: 0.08,
      duration: 0.35,
      yPercent: 25,
      ease: 'back.out(10)',
      onComplete: function() {
        gsap.set(this.targets(), { clearProps: 'all' })
      }
    }, 'animateInLivesCounter+=0.25')

    tl.addLabel('animateInProgress', '<0.2')
    tl.set(this.levelProgress, {
      visibility: 'visible',
    }, 'animateInProgress')
    tl.from(this.levelProgress, {
      width: 0,
      duration: 0.7,
      ease: 'back.out(3)',
    }, 'animateInProgress')

    tl.fromTo(this.levelIndicator, {
      visibility: 'hidden',
      rotation: -40,
      scale: 0.8,
    }, {
      visibility: 'visible',
      scale: 1,
      rotation: 0,
      ease: 'back.out(6)',
      duration: 0.6
    }, '>-0.1')
  }

  animateInGameOverScreen(): void {
    const tl = gsap.timeline()
    tl.addLabel('start')

    tl.set(this.gameOverScreen, { clearProps: 'visibility' }, 'start')

    tl.from(this.gameOverTitle, {
      y: '-60vh',
      duration: 1,
      ease: 'bounce.out'
    }, 'start')

    tl.addLabel('animateInButton', '<0.8')
    tl.fromTo(this.gameOverButton, {
      visibility: 'hidden',
      scale: 0.6,
      rotation: -20
    }, {
      visibility: 'visible',
      scale: 1,
      rotation: 0,
      duration: 1.2,
      ease: 'elastic.out(1.3, 0.6)'
    }, 'animateInButton')
  }

  animateOutGameOverScreen(): void {}

  private createPlayButtonObserver(): void {
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

    this.gameOverButtonObserver = Observer.create({
      target: this.gameOverButton,
      onClick: () => {
        this.gameOverButtonObserver?.disable()
      },
      onHover: () => {
        this.gameOverButtonHoverTween?.invalidate()
        this.gameOverButtonHoverTween?.timeScale(1)
        this.gameOverButtonHoverTween?.restart()
      },
      onHoverEnd: () => {
        this.gameOverButtonHoverTween?.timeScale(1.5)
        this.gameOverButtonHoverTween?.reverse()
      }
    })
  }

  private createButtons(): void {
    this.playButtonHoverTween = this.createButtonHoverTween(this.playButton!)
    this.gameOverButtonHoverTween = this.createButtonHoverTween(this.gameOverButton!)
  }

  private createButtonHoverTween(target: HTMLButtonElement): gsap.core.Tween {
    return gsap.to(target, {
      paused: true,
      scale: 1.1,
      rotation: () => gsap.utils.random(-10, 10),
      duration: 0.5,
      ease: 'elastic.out(1, 0.3)',
      easeReverse: 'power2.out',
    })
  }

  private handleResize(): void {
    this.progressBarBoundingBox = this.levelProgressInner!.getBoundingClientRect()
  }
}
