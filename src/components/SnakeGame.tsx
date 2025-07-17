import { useState, useEffect, useCallback } from 'react'
import './SnakeGame.css'

interface Position {
  x: number
  y: number
}

enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

const BOARD_WIDTH = 20
const BOARD_HEIGHT = 20
const INITIAL_SNAKE = [{ x: 10, y: 10 }]
const INITIAL_FOOD = { x: 15, y: 15 }
const INITIAL_DIRECTION = Direction.RIGHT
const INVINCIBILITY_DURATION = 5000 // 5 seconds
const INVINCIBILITY_SPAWN_CHANCE = 0.15 // 15% chance to spawn after eating food

const SnakeGame = () => {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Position>(INITIAL_FOOD)
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [speed, setSpeed] = useState(200)
  const [invincibilityPowerUp, setInvincibilityPowerUp] = useState<Position | null>(null)
  const [isInvincible, setIsInvincible] = useState(false)
  const [invincibilityTimeLeft, setInvincibilityTimeLeft] = useState(0)

  const generateFood = useCallback((snakeBody: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * BOARD_WIDTH),
        y: Math.floor(Math.random() * BOARD_HEIGHT)
      }
    } while (snakeBody.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [])

  const generateInvincibilityPowerUp = useCallback((snakeBody: Position[], foodPos: Position): Position => {
    let newPowerUp: Position
    do {
      newPowerUp = {
        x: Math.floor(Math.random() * BOARD_WIDTH),
        y: Math.floor(Math.random() * BOARD_HEIGHT)
      }
    } while (
      snakeBody.some(segment => segment.x === newPowerUp.x && segment.y === newPowerUp.y) ||
      (foodPos.x === newPowerUp.x && foodPos.y === newPowerUp.y)
    )
    return newPowerUp
  }, [])

  const checkCollision = (head: Position, snakeBody: Position[]): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= BOARD_WIDTH || head.y < 0 || head.y >= BOARD_HEIGHT) {
      return true
    }
    // Self collision
    return snakeBody.some(segment => segment.x === head.x && segment.y === head.y)
  }

  const activateInvincibility = useCallback(() => {
    setIsInvincible(true)
    setInvincibilityTimeLeft(INVINCIBILITY_DURATION)
    setInvincibilityPowerUp(null)
  }, [])

  // Invincibility timer effect
  useEffect(() => {
    if (!isInvincible || invincibilityTimeLeft <= 0) {
      setIsInvincible(false)
      setInvincibilityTimeLeft(0)
      return
    }

    const timer = setTimeout(() => {
      setInvincibilityTimeLeft(prev => prev - 100)
    }, 100)

    return () => clearTimeout(timer)
  }, [isInvincible, invincibilityTimeLeft])

  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted) return

    setSnake(currentSnake => {
      const newSnake = [...currentSnake]
      const head = { ...newSnake[0] }

      switch (direction) {
        case Direction.UP:
          head.y -= 1
          break
        case Direction.DOWN:
          head.y += 1
          break
        case Direction.LEFT:
          head.x -= 1
          break
        case Direction.RIGHT:
          head.x += 1
          break
      }

      // Check collision only if not invincible
      if (!isInvincible && checkCollision(head, newSnake)) {
        setGameOver(true)
        return currentSnake
      }

      // Handle wall wrapping when invincible
      if (isInvincible) {
        if (head.x < 0) head.x = BOARD_WIDTH - 1
        if (head.x >= BOARD_WIDTH) head.x = 0
        if (head.y < 0) head.y = BOARD_HEIGHT - 1
        if (head.y >= BOARD_HEIGHT) head.y = 0
      }

      newSnake.unshift(head)

      // Check if food is eaten
      if (head.x === food.x && head.y === food.y) {
        setScore(prevScore => {
          const newScore = prevScore + 10
          // Increase speed every 50 points (make game harder)
          const newSpeed = Math.max(80, 200 - Math.floor(newScore / 50) * 20)
          setSpeed(newSpeed)
          return newScore
        })
        
        const newFood = generateFood(newSnake)
        setFood(newFood)
        
        // Chance to spawn invincibility power-up
        if (!invincibilityPowerUp && Math.random() < INVINCIBILITY_SPAWN_CHANCE) {
          setInvincibilityPowerUp(generateInvincibilityPowerUp(newSnake, newFood))
        }
      } else {
        newSnake.pop()
      }

      // Check if invincibility power-up is collected
      if (invincibilityPowerUp && head.x === invincibilityPowerUp.x && head.y === invincibilityPowerUp.y) {
        activateInvincibility()
        setScore(prevScore => prevScore + 25) // Bonus points for power-up
      }

      return newSnake
    })
  }, [direction, food, gameOver, gameStarted, generateFood, isInvincible, invincibilityPowerUp, generateInvincibilityPowerUp, activateInvincibility])

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!gameStarted && e.key === ' ') {
      setGameStarted(true)
      return
    }

    if (gameOver && e.key === ' ') {
      // Restart game
      setSnake(INITIAL_SNAKE)
      setFood(INITIAL_FOOD)
      setDirection(INITIAL_DIRECTION)
      setGameOver(false)
      setScore(0)
      setGameStarted(true)
      setSpeed(200)
      setInvincibilityPowerUp(null)
      setIsInvincible(false)
      setInvincibilityTimeLeft(0)
      return
    }

    if (!gameStarted || gameOver) return

    switch (e.key) {
      case 'ArrowUp':
        if (direction !== Direction.DOWN) setDirection(Direction.UP)
        break
      case 'ArrowDown':
        if (direction !== Direction.UP) setDirection(Direction.DOWN)
        break
      case 'ArrowLeft':
        if (direction !== Direction.RIGHT) setDirection(Direction.LEFT)
        break
      case 'ArrowRight':
        if (direction !== Direction.LEFT) setDirection(Direction.RIGHT)
        break
    }
  }, [direction, gameOver, gameStarted])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  useEffect(() => {
    const gameLoop = setInterval(moveSnake, speed)
    return () => clearInterval(gameLoop)
  }, [moveSnake, speed])

  const renderBoard = () => {
    const board = []
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        let cellClass = 'cell'
        
        if (snake.some(segment => segment.x === x && segment.y === y)) {
          cellClass += ' snake'
          if (isInvincible) {
            cellClass += ' invincible'
          }
          if (snake[0].x === x && snake[0].y === y) {
            cellClass += ' head'
          }
        } else if (food.x === x && food.y === y) {
          cellClass += ' food'
        } else if (invincibilityPowerUp && invincibilityPowerUp.x === x && invincibilityPowerUp.y === y) {
          cellClass += ' invincibility-powerup'
        }

        board.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
          />
        )
      }
    }
    return board
  }

  return (
    <div className="snake-game">
      <div className="game-info">
        <div className="score">Score: {score}</div>
        <div className="speed">Speed: {Math.round((200 - speed) / 20) + 1}</div>
        {isInvincible && (
          <div className="invincibility-timer">
            Invincible: {(invincibilityTimeLeft / 1000).toFixed(1)}s
          </div>
        )}
      </div>
      
      <div className="game-board">
        {renderBoard()}
      </div>

      {!gameStarted && !gameOver && (
        <div className="game-overlay">
          <h2>Snake Game</h2>
          <p>Use arrow keys to control the snake</p>
          <p>Collect ⭐ power-ups for invincibility!</p>
          <p>Press SPACE to start</p>
        </div>
      )}

      {gameOver && (
        <div className="game-overlay">
          <h2>Game Over!</h2>
          <p>Final Score: {score}</p>
          <p>Press SPACE to restart</p>
        </div>
      )}

      <div className="game-controls">
        <p>Use arrow keys to move • Press SPACE to {gameStarted ? 'restart' : 'start'}</p>
        <p>⭐ Invincibility Power-up: +25 points, 5s immunity</p>
      </div>
    </div>
  )
}

export default SnakeGame