import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause, Target, Timer } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface ChallengeSnakeGameProps {
  user: any;
  updateUser: (user: any) => void;
  challenge: any;
  onComplete: (score: number, adjustedReward: number) => void;
}

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

const SPEED_OPTIONS = [
  { label: 'Lent', speed: 250, multiplier: 0.5, color: 'text-blue-400' },
  { label: 'Normal', speed: 150, multiplier: 1.0, color: 'text-green-400' },
  { label: 'Rapide', speed: 100, multiplier: 1.5, color: 'text-orange-400' },
  { label: 'Très Rapide', speed: 75, multiplier: 2.0, color: 'text-red-400' }
];

export default function ChallengeSnakeGame({ user, updateUser, challenge, onComplete }: ChallengeSnakeGameProps) {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(challenge.timeLimit);
  const [cellSize, setCellSize] = useState(20);
  
  // Charger la vitesse configurée depuis les paramètres
  const [speedConfig, setSpeedConfig] = useState(() => {
    const saved = localStorage.getItem('blacksnack_speed_config');
    return saved ? JSON.parse(saved) : SPEED_OPTIONS[1]; // Normal par défaut
  });
  const [adjustedReward, setAdjustedReward] = useState(challenge.reward);

  const directionRef = useRef(direction);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gameOverRef = useRef(false);

  // Calculer la récompense ajustée en fonction de la vitesse configurée
  useEffect(() => {
    const newReward = Math.round(challenge.reward * speedConfig.multiplier);
    setAdjustedReward(newReward);
  }, [speedConfig, challenge.reward]);

  // Synchroniser gameOver avec la ref
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // Calculer la taille optimale des cellules
  useEffect(() => {
    const calculateCellSize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      const reservedHeight = 350;
      const reservedWidth = 40;
      
      const availableWidth = windowWidth - reservedWidth;
      const availableHeight = windowHeight - reservedHeight;
      
      const maxCellWidth = Math.floor(availableWidth / GRID_SIZE);
      const maxCellHeight = Math.floor(availableHeight / GRID_SIZE);
      
      const calculatedSize = Math.min(maxCellWidth, maxCellHeight);
      const finalSize = Math.max(8, Math.min(25, calculatedSize));
      
      setCellSize(finalSize);
    };

    calculateCellSize();
    window.addEventListener('resize', calculateCellSize);
    
    return () => window.removeEventListener('resize', calculateCellSize);
  }, []);

  // Chronomètre du défi
  useEffect(() => {
    if (isPaused || gameOver || !gameStarted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, gameOver, gameStarted]);

  // Fin du jeu - appeler onComplete
  useEffect(() => {
    if (gameOver && !isPaused) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      
      setTimeout(() => {
        onComplete(score, adjustedReward);
      }, 1000);
    }
  }, [gameOver, score, onComplete, isPaused, adjustedReward]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    setFood(newFood);
  }, []);

  const moveSnake = useCallback(() => {
    if (gameOverRef.current || isPaused) return;

    setSnake((prevSnake) => {
      if (gameOverRef.current) return prevSnake;
      
      const head = prevSnake[0];
      let newHead: Position;

      switch (directionRef.current) {
        case 'UP':
          newHead = { x: head.x, y: head.y - 1 };
          break;
        case 'DOWN':
          newHead = { x: head.x, y: head.y + 1 };
          break;
        case 'LEFT':
          newHead = { x: head.x - 1, y: head.y };
          break;
        case 'RIGHT':
          newHead = { x: head.x + 1, y: head.y };
          break;
        default:
          newHead = head;
      }

      // Vérifier collision avec les murs - ARRÊT IMMÉDIAT
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        gameOverRef.current = true;
        setGameOver(true);
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
          gameLoopRef.current = null;
        }
        return prevSnake;
      }

      // Vérifier collision avec soi-même - ARRÊT IMMÉDIAT
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        gameOverRef.current = true;
        setGameOver(true);
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
          gameLoopRef.current = null;
        }
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Vérifier si on mange la nourriture
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 1);
        generateFood();
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, isPaused, generateFood]);

  useEffect(() => {
    if (!isPaused && !gameOver && gameStarted) {
      gameLoopRef.current = setInterval(moveSnake, speedConfig.speed);
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, isPaused, gameOver, gameStarted, speedConfig]);

  // Contrôles clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (directionRef.current !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (directionRef.current !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (directionRef.current !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (directionRef.current !== 'LEFT') setDirection('RIGHT');
          break;
        case ' ':
          e.preventDefault();
          setIsPaused(p => !p);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameOver]);

  const handleDirectionClick = (newDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOver) return;
    
    if (
      (newDirection === 'UP' && directionRef.current !== 'DOWN') ||
      (newDirection === 'DOWN' && directionRef.current !== 'UP') ||
      (newDirection === 'LEFT' && directionRef.current !== 'RIGHT') ||
      (newDirection === 'RIGHT' && directionRef.current !== 'LEFT')
    ) {
      setDirection(newDirection);
    }
  };

  const gridWidth = GRID_SIZE * cellSize;
  const gridHeight = GRID_SIZE * cellSize;

  // Si le jeu n'est pas encore commencé, afficher l'écran "Êtes-vous prêt ?"
  if (!gameStarted) {
    return (
      <div className="bg-zinc-900 rounded-lg border border-purple-700 p-6 sm:p-8 text-center max-w-xl mx-auto">
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-5 sm:p-6 rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6">
          <Play className="text-white" size={40} />
        </div>
        <h2 className="text-white text-2xl sm:text-3xl font-bold mb-6">Êtes-vous prêt ?</h2>
        
        {/* Informations du défi */}
        <div className="bg-zinc-800 rounded-lg p-4 mb-6 border border-purple-600/30">
          <p className="text-zinc-400 mb-2">Objectif : <span className="text-white font-semibold">{challenge.target} points</span></p>
          <p className="text-zinc-400 mb-2">Temps limite : <span className="text-white font-semibold">{challenge.timeLimit} secondes</span></p>
          <p className="text-purple-400 mb-2">Gains de base : <span className="text-green-500 font-bold line-through">{challenge.potential} $</span></p>
          <div className="mt-3 pt-3 border-t border-purple-600/30">
            <p className="text-sm text-zinc-400 mb-1">Vitesse actuelle : <span className={`font-bold ${speedConfig.color}`}>{speedConfig.label}</span></p>
            <p className="text-xs text-zinc-500 mb-2">Multiplicateur de gains : ×{speedConfig.multiplier}</p>
            <p className={`text-3xl font-bold ${speedConfig.color}`}>
              {adjustedReward} $
            </p>
          </div>
        </div>

        <p className="text-zinc-500 text-xs mb-6 italic">
          Note: Vous pouvez modifier la vitesse globale dans l'onglet "Autres".
        </p>
        
        <button
          onClick={() => setGameStarted(true)}
          className="bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white font-bold text-lg sm:text-xl px-10 sm:px-12 py-3 sm:py-4 rounded-lg transition-all transform hover:scale-105 w-full"
        >
          🎮 Commencer le défi !
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-lg border border-purple-700 p-4">
      {/* Stats du défi */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-purple-600/20 rounded-lg p-3 text-center border border-purple-600">
          <p className="text-purple-400 text-xs mb-1">Score Actuel</p>
          <p className="text-white text-2xl font-bold">{score}</p>
        </div>
        <div className="bg-blue-600/20 rounded-lg p-3 text-center border border-blue-600">
          <p className="text-blue-400 text-xs mb-1">Objectif</p>
          <p className="text-white text-2xl font-bold">{challenge.target}</p>
        </div>
        <div className={`rounded-lg p-3 text-center border ${
          timeLeft <= 10 ? 'bg-red-600/20 border-red-600' : 'bg-green-600/20 border-green-600'
        }`}>
          <p className={`text-xs mb-1 ${timeLeft <= 10 ? 'text-red-400' : 'text-green-400'}`}>Temps Restant</p>
          <p className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>{timeLeft}s</p>
        </div>
      </div>

      {/* Grille de jeu */}
      <div className="flex justify-center mb-4">
        <div 
          className="relative bg-zinc-800 border-4 border-purple-700 rounded-lg overflow-hidden"
          style={{ 
            width: `${gridWidth}px`, 
            height: `${gridHeight}px`,
            maxWidth: '100%'
          }}
        >
          {/* Serpent */}
          {snake.map((segment, index) => {
            const padding = cellSize * 0.1; // 10% de padding
            const innerSize = cellSize - (padding * 2);
            return (
              <div
                key={index}
                className="absolute transition-all duration-75"
                style={{
                  left: `${segment.x * cellSize + padding}px`,
                  top: `${segment.y * cellSize + padding}px`,
                  width: `${innerSize}px`,
                  height: `${innerSize}px`,
                  backgroundColor: index === 0 ? '#8B5CF6' : '#A78BFA',
                  borderRadius: index === 0 ? '30%' : '20%',
                  border: '1px solid #7C3AED'
                }}
              />
            );
          })}

          {/* Nourriture */}
          {(() => {
            const padding = cellSize * 0.15; // 15% de padding pour la nourriture
            const innerSize = cellSize - (padding * 2);
            return (
              <div
                className="absolute rounded-full"
                style={{
                  left: `${food.x * cellSize + padding}px`,
                  top: `${food.y * cellSize + padding}px`,
                  width: `${innerSize}px`,
                  height: `${innerSize}px`,
                  backgroundColor: '#EF4444',
                  boxShadow: '0 0 8px #EF4444'
                }}
              />
            );
          })()}

          {/* Overlay Game Over */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="text-center">
                <p className="text-white text-2xl font-bold mb-2">Temps écoulé !</p>
                <p className="text-purple-400 text-lg">Score final: {score}</p>
              </div>
            </div>
          )}

          {/* Overlay Pause */}
          {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="text-center">
                <Pause className="text-white mx-auto mb-2" size={48} />
                <p className="text-white text-xl font-bold">Pause</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => setIsPaused(!isPaused)}
          disabled={gameOver}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 text-white px-6 py-2 rounded-lg transition-all flex items-center gap-2"
        >
          {isPaused ? <Play size={20} /> : <Pause size={20} />}
          {isPaused ? 'Reprendre' : 'Pause'}
        </button>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => handleDirectionClick('UP')}
            className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-lg transition-all"
          >
            <ArrowUp size={24} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleDirectionClick('LEFT')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-lg transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <button
              onClick={() => handleDirectionClick('DOWN')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-lg transition-all"
            >
              <ArrowDown size={24} />
            </button>
            <button
              onClick={() => handleDirectionClick('RIGHT')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-lg transition-all"
            >
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}