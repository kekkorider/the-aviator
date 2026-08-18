import { ContextModule } from "three-start"

type GameEvents = {
  scoreChanged: [score: number]
}

export class GameModule extends ContextModule<GameEvents> {
  private score: number = 0

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
}
