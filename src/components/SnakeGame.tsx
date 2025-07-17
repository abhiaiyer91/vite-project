import { useState, useEffect, useCallback, useRef } from 'react'
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
const BOMB_SPAWN_INTERVAL = 3000 // 3 seconds (reduced for testing)

const SnakeGame = () => {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Position>(INITIAL_FOOD)
  const [bombs, setBombs] = useState<Position[]>([])
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [speed, setSpeed] = useState(200)
  
  // Use refs to access current state in interval
  const snakeRef = useRef(snake)
  const foodRef = useRef(food)
  const bombsRef = useRef(bombs)
  
  // Update refs when state changes
  useEffect(() => { snakeRef.current = snake }, [snake])
  useEffect(() => { foodRef.current = food }, [food])
  useEffect(() => { bombsRef.current = bombs }, [bombs])

  const generateFood = useCallback((snakeBody: Position[], bombPositions: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * BOARD_WIDTH),
        y: Math.floor(Math.random() * BOARD_HEIGHT)
      }
    } while (
      snakeBody.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
      bombPositions.some(bomb => bomb.x === newFood.x && bomb.y === newFood.y)
    )
    return newFood
  }, [])

  const generateBomb = useCallback((snakeBody: Position[], foodPosition: Position, existingBombs: Position[]): Position => {
    let newBomb: Position
    do {
      newBomb = {
        x: Math.floor(Math.random() * BOARD_WIDTH),
        y: Math.floor(Math.random() * BOARD_HEIGHT)
      }
    } while (
      snakeBody.some(segment => segment.x === newBomb.x && segment.y === newBomb.y) ||
      (foodPosition.x === newBomb.x && foodPosition.y === newBomb.y) ||
      existingBombs.some(bomb => bomb.x === newBomb.x && bomb.y === newBomb.y)
    )
    return newBomb
  }, [])

  const checkCollision = (head: Position, snakeBody: Position[]): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= BOARD_WIDTH || head.y < 0 || head.y >= BOARD_HEIGHT) {
      return true
    }
    // Self collision
    return snakeBody.some(segment => segment.x === head.x && segment.y === head.y)
  }

  const checkBombCollision = (head: Position, bombPositions: Position[]): boolean => {
    return bombPositions.some(bomb => bomb.x === head.x && bomb.y === head.y)
  }

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

      if (checkCollision(head, newSnake)) {
        setGameOver(true)
        return currentSnake
      }

      // Check bomb collision
      if (checkBombCollision(head, bombs)) {
        setGameOver(true)
        return currentSnake
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
        setFood(generateFood(newSnake, bombs))
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }, [direction, food, bombs, gameOver, gameStarted, generateFood])

  // Bomb spawning effect
  useEffect(() => {
    if (!gameStarted || gameOver) return

    const bombInterval = setInterval(() => {
      const newBomb = generateBomb(snakeRef.current, foodRef.current, bombsRef.current)
      setBombs(prev => [...prev, newBomb])
    }, BOMB_SPAWN_INTERVAL)

    return () => clearInterval(bombInterval)
  }, [gameStarted, gameOver, generateBomb])

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!gameStarted && e.key === ' ') {
      setGameStarted(true)
      // Add a test bomb when game starts
      setBombs([{ x: 5, y: 5 }])
      return
    }

    if (gameOver && e.key === ' ') {
      // Restart game
      setSnake(INITIAL_SNAKE)
      setFood(INITIAL_FOOD)
      setBombs([])
      setDirection(INITIAL_DIRECTION)
      setGameOver(false)
      setScore(0)
      setGameStarted(true)
      setSpeed(200)
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
          if (snake[0].x === x && snake[0].y === y) {
            cellClass += ' head'
          }
        } else if (food.x === x && food.y === y) {
          cellClass += ' food'
        } else if (bombs.some(bomb => bomb.x === x && bomb.y === y)) {
          cellClass += ' bomb'
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
        <div className="bombs">Bombs: {bombs.length}</div>
      </div>
      
      <div className="game-board">
        {renderBoard()}
      </div>

      {!gameStarted && !gameOver && (
        <div className="game-overlay">
          <h2>Snake Game</h2>
          <p>Use arrow keys to control the snake</p>
          <p>Eat food to grow, avoid bombs!</p>
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
        <p>Use arrow keys to move • Avoid the bombs! • Press SPACE to {gameStarted ? 'restart' : 'start'}</p>
      </div>
    </div>
  )
}

export default SnakeGame