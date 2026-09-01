import { ContextModule } from "three-start"

type GameEvents = {
  scoreChanged: [score: number]
  levelChanged: [level: number]
  levelProgressChanged: [levelProgress: number]
}

export class GameModule extends ContextModule<GameEvents> {
  private score: number = 0
  private level: number = 1
  private levelProgress: number = 0

  addScore(score: number): void {
    this.score = Math.max(0, this.score + score)
    this.emit('scoreChanged', this.score)
  }

  setScore(score: number): void {
    this.score = score
    this.emit('scoreChanged', this.score)
  }

  getScore(): number {
    return this.score
  }

  addLevelProgress(levelProgress: number): void {
    this.levelProgress += levelProgress
    this.emit('levelProgressChanged', this.levelProgress)

    if (this.levelProgress >= 1) {
      this.addLevel()
      this.setLevelProgress(0)
    }
  }

  setLevelProgress(levelProgress: number): void {
    this.levelProgress = levelProgress
    this.emit('levelProgressChanged', this.levelProgress)
  }

  getLevelProgress(): number {
    return this.levelProgress
  }

  addLevel(): void {
    this.level++
    this.emit('levelChanged', this.level)
  }

  setLevel(level: number): void {
    this.level = level
    this.emit('levelChanged', this.level)
  }

  getLevel(): number {
    return this.level
  }
}
