import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface SnakeGameProps {
  user: any;
  updateUser: (user: any) => void;
}

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

export default function SnakeGame({ user, updateUser }: SnakeGameProps) {
  const userId = user?.id ?? null;            // jamais undefined

  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [highScore, setHighScore] = useState(0);
  const [cellSize, setCellSize] = useState(20);

  // Charger la vitesse configurée depuis les paramètres
  const [speedConfig, setSpeedConfig] = useState(() => {
    const saved = localStorage.getItem('blacksnack_speed_config');
    return saved ? JSON.parse(saved) : { label: 'Normal', speed: 150, multiplier: 1.0 };
  });

  const directionRef = useRef(direction);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const gameOverRef = useRef(false);


  // Synchroniser gameOver avec la ref
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // Calculer la taille optimale des cellules selon la résolution
  useEffect(() => {
    const calculateCellSize = () => {
      // Obtenir les dimensions de la fenêtre
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Réserver de l'espace pour les contrôles et marges
      // Header: ~60px, Stats: ~80px, Controls: ~180px, Margins: ~80px
      const reservedHeight = 400;
      const reservedWidth = 40; // Marges gauche/droite

      const availableWidth = windowWidth - reservedWidth;
      const availableHeight = windowHeight - reservedHeight;

      // Calculer la taille maximale des cellules pour tenir dans l'écran
      const maxCellWidth = Math.floor(availableWidth / GRID_SIZE);
      const maxCellHeight = Math.floor(availableHeight / GRID_SIZE);

      // Prendre la plus petite valeur pour que tout tienne
      const calculatedSize = Math.min(maxCellWidth, maxCellHeight);

      // Limiter entre 8px (très petits écrans) et 25px (grands écrans)
      const finalSize = Math.max(8, Math.min(25, calculatedSize));

      setCellSize(finalSize);
    };

    // Calculer au chargement
    calculateCellSize();

    // Recalculer lors du redimensionnement
    window.addEventListener('resize', calculateCellSize);

    return () => window.removeEventListener('resize', calculateCellSize);
  }, []);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    if (!userId) return;
    const savedHighScore = localStorage.getItem(`blacksnack_highscore_${userId}`);
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, [userId]);

  const generateFood = useCallback((currentSnake: Position[]) => {
    let newFood: Position;
    let isOccupied = true;
    let attempts = 0;

    while (isOccupied && attempts < 100) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // Vérifier si la position est occupée par le serpent
      isOccupied = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      attempts++;
      if (!isOccupied) {
        setFood(newFood);
        return;
      }
    }
    // Fallback au cas où (rare)
    setFood({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) });
  }, []);

  const resetGame = () => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setScore(0);
    setGameOver(false);
    setIsPaused(true);
    generateFood(initialSnake);
  };

  const moveSnake = useCallback(() => {
    if (gameOverRef.current || isPaused) return;

    setSnake((prevSnake) => {
      // Sécurité supplémentaire : si on est déjà en game over, ne rien faire
      if (gameOverRef.current || prevSnake.length === 0) return prevSnake;

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
          newHead = { ...head };
      }

      // 1. Vérifier les collisions avec les murs - ARRÊT IMMÉDIAT
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        gameOverRef.current = true;
        setGameOver(true);
        setIsPaused(true);
        // On nettoie l'intervalle immédiatement ici aussi par sécurité
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
          gameLoopRef.current = null;
        }
        return prevSnake;
      }

      // 2. Vérifier les collisions avec le corps - ARRÊT IMMÉDIAT
      // On ignore la queue (dernier segment) car elle va bouger si on ne mange pas
      const bodyToCheck = prevSnake.slice(0, -1);
      if (bodyToCheck.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        gameOverRef.current = true;
        setGameOver(true);
        setIsPaused(true);
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
          gameLoopRef.current = null;
        }
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // 3. Vérifier si la nourriture est mangée
      // Utilisation d'une référence stable pour food pour éviter de recréer moveSnake trop souvent
      // Mais ici food est dans les dépendances de useCallback, donc on l'utilise directement
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((prev) => {
          const newScore = prev + 1;
          if (newScore > highScore) {
            setHighScore(newScore);
            if (user?.id) localStorage.setItem(`blacksnack_highscore_${user.id}`, newScore.toString());
          }
          return newScore;
        });
        
        // Passer le nouveau serpent à generateFood pour s'assurer que la pomme n'apparaît pas dessus
        generateFood(newSnake);
        return newSnake;
      } else {
        newSnake.pop();
        return newSnake;
      }
    });
  }, [isPaused, food, generateFood, highScore, user?.id]);

  useEffect(() => {
    if (!isPaused && !gameOver) {
      gameLoopRef.current = setInterval(moveSnake, speedConfig.speed);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [moveSnake, isPaused, gameOver, speedConfig.speed]);

  const handleDirectionChange = (newDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    const opposites: Record<string, string> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT'
    };

    if (opposites[directionRef.current] !== newDirection) {
      setDirection(newDirection);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleDirectionChange('UP');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleDirectionChange('DOWN');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleDirectionChange('LEFT');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleDirectionChange('RIGHT');
          break;
        case ' ':
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameOver]);

  return (
    <div className="h-full w-full bg-gradient-to-b from-black via-purple-950 to-black flex items-center justify-center overflow-auto">
      {!user ? (
        <p className="text-purple-400 text-lg">Chargement...</p>
      ) : (
        <div className="flex flex-col items-center justify-center p-2 sm:p-4 my-auto w-full">
          {/* Statistiques */}
          <div className="mb-3 sm:mb-6 flex gap-4 sm:gap-8">

            <div className="text-center">
              <p className="text-purple-400 text-xs sm:text-sm mb-1">Score</p>
              <p className="text-white text-2xl sm:text-3xl font-bold">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-purple-400 text-xs sm:text-sm mb-1">Record</p>
              <p className="text-white text-2xl sm:text-3xl font-bold">{highScore}</p>
            </div>
          </div>

          {/* Zone de jeu */}
          <div
            className="relative bg-zinc-800 border-2 sm:border-4 border-purple-600 rounded-lg shadow-2xl shadow-purple-500/50 overflow-hidden"
            style={{
              width: `${GRID_SIZE * cellSize}px`,
              height: `${GRID_SIZE * cellSize}px`
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
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg">
                <div className="text-center px-4">
                  <h2 className="text-white text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">Game Over!</h2>
                  <p className="text-purple-400 text-lg sm:text-xl mb-4 sm:mb-6">Score: {score}</p>
                  <button
                    onClick={resetGame}
                    className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-900 transition text-sm sm:text-base"
                  >
                    Rejouer
                  </button>
                </div>
              </div>
            )}

            {/* Overlay Pause */}
            {isPaused && !gameOver && snake.length === 1 && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg">
                <div className="text-center px-4">
                  <h2 className="text-white text-xl sm:text-3xl font-bold mb-4 sm:mb-6">Prêt à jouer ?</h2>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-900 transition flex items-center gap-2 mx-auto text-sm sm:text-base"
                  >
                    <Play size={18} className="sm:w-5 sm:h-5" />
                    Commencer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Contrôles */}
          <div className="mt-4 sm:mt-8 flex flex-col items-center gap-3 sm:gap-4 w-full max-w-xs">
            <button
              onClick={() => setIsPaused(!isPaused)}
              disabled={gameOver}
              className="bg-purple-700 hover:bg-purple-600 disabled:bg-zinc-700 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm sm:text-base"
            >
              <Play size={18} style={{ display: isPaused ? 'block' : 'none' }} />
              <Pause size={18} style={{ display: isPaused ? 'none' : 'block' }} />
              <span>{isPaused ? 'Reprendre' : 'Pause'}</span>
            </button>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <div></div>
              <button
                onClick={() => handleDirectionChange('UP')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 sm:p-4 rounded-lg transition active:scale-95"
              >
                <ArrowUp size={20} className="sm:w-6 sm:h-6" />
              </button>
              <div></div>

              <button
                onClick={() => handleDirectionChange('LEFT')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 sm:p-4 rounded-lg transition active:scale-95"
              >
                <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => handleDirectionChange('DOWN')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 sm:p-4 rounded-lg transition active:scale-95"
              >
                <ArrowDown size={20} className="sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => handleDirectionChange('RIGHT')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 sm:p-4 rounded-lg transition active:scale-95"
              >
                <ArrowRight size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          <p className="text-zinc-500 text-xs sm:text-sm mt-4 sm:mt-6 text-center px-4">
            Utilisez les flèches du clavier ou les boutons pour jouer
          </p>
        </div>
      )}
    </div>
  );
}