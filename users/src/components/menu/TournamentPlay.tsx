import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../../frontend/services/api';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause, X, Trophy } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface TournamentPlayProps {
  user: any;
  onUpdate: () => void;
  tournament: any;
  onBack: () => void;
}

const GRID_SIZE = 20;

export default function TournamentPlay({ user, onUpdate, tournament, onBack }: TournamentPlayProps) {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [cellSize, setCellSize] = useState(20);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const speedConfig = { label: 'Normal', speed: 150, multiplier: 1.0 };

  const directionRef = useRef(direction);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const gameOverRef = useRef(false);

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

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setScore(0);
    setGameOver(false);
    gameOverRef.current = false;
    generateFood();
    setIsPaused(true);
  };

  const moveSnake = useCallback(() => {
    if (gameOverRef.current || isPaused) return;

    setSnake((prevSnake) => {
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

      // Vérifier collision avec les murs
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        gameOverRef.current = true;
        return prevSnake;
      }

      // Vérifier collision avec le corps
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        gameOverRef.current = true;
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Vérifier si le serpent mange la nourriture
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(prev => prev + 1);
        generateFood();
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, generateFood, isPaused]);

  useEffect(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }

    if (!gameOver && !isPaused) {
      gameLoopRef.current = setInterval(moveSnake, speedConfig.speed);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [moveSnake, gameOver, isPaused, speedConfig.speed]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;

      const key = e.key.toLowerCase();
      const currentDir = directionRef.current;

      if ((key === 'arrowup' || key === 'w' || key === 'z') && currentDir !== 'DOWN') {
        setDirection('UP');
      } else if ((key === 'arrowdown' || key === 's') && currentDir !== 'UP') {
        setDirection('DOWN');
      } else if ((key === 'arrowleft' || key === 'a' || key === 'q') && currentDir !== 'RIGHT') {
        setDirection('LEFT');
      } else if ((key === 'arrowright' || key === 'd') && currentDir !== 'LEFT') {
        setDirection('RIGHT');
      } else if (key === ' ') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameOver]);

  // Sauvegarder le score dans le classement du tournoi à la fin de la partie
  useEffect(() => {
    const handleGameOver = async (score: number) => {
      try {
        await apiService.updateTournamentScore(tournament.id, score);
        onUpdate();
        alert(`Partie terminée ! Score envoyé: ${score}`);
      } catch (err: any) {
        alert(err.message || 'Erreur lors de l\'envoi du score');
      }
      onBack();
    };

    if (gameOver && score > 0) {
      handleGameOver(score);
    }
  }, [gameOver, score, tournament.id, onUpdate, onBack]);

  const handleDirectionClick = (newDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOver) return;

    const currentDir = directionRef.current;

    if (
      (newDirection === 'UP' && currentDir !== 'DOWN') ||
      (newDirection === 'DOWN' && currentDir !== 'UP') ||
      (newDirection === 'LEFT' && currentDir !== 'RIGHT') ||
      (newDirection === 'RIGHT' && currentDir !== 'LEFT')
    ) {
      setDirection(newDirection);
    }
  };

  // Charger le classement actuel
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const loadLeaderboard = () => {
      const tournaments = JSON.parse(localStorage.getItem('blacksnack_tournaments') || '[]');
      const currentTournament = tournaments.find((t: any) => t.id === tournament.id);
      if (currentTournament) {
        setLeaderboard(currentTournament.leaderboard);
      }
    };

    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 2000);
    return () => clearInterval(interval);
  }, [tournament.id]);

  const userRank = leaderboard.findIndex(p => p.username === user.username) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black p-4 overflow-hidden">
      {/* Header avec info du tournoi */}
      <div className="max-w-2xl mx-auto mb-4">
        <div className="bg-zinc-900 border border-purple-700 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-white hover:text-purple-400 transition p-2"
            >
              <X size={24} />
            </button>
            <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-2 rounded-full">
              <Trophy className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-white font-bold">{tournament.name}</h2>
              <p className="text-purple-400 text-sm">Prize: {tournament.prize}$</p>
            </div>
          </div>
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            {showLeaderboard ? 'Masquer' : 'Classement'}
          </button>
        </div>
      </div>

      {/* Classement (si affiché) */}
      {showLeaderboard && (
        <div className="max-w-2xl mx-auto mb-4 bg-zinc-900 border border-purple-700 rounded-lg p-4 max-h-64 overflow-y-auto scrollbar-hide">
          <h3 className="text-white font-bold mb-3">🏆 Classement en direct</h3>
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((player, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-2 rounded ${player.username === user.username ? 'bg-purple-600/30 border border-purple-500' : 'bg-zinc-800'
                  }`}
              >
                <span className={`font-bold w-6 ${index === 0 ? 'text-yellow-400' :
                  index === 1 ? 'text-zinc-300' :
                    index === 2 ? 'text-orange-400' :
                      'text-white'
                  }`}>
                  #{index + 1}
                </span>
                <img src={player.avatar} alt={player.username} className="w-8 h-8 rounded-full" />
                <span className="text-white flex-1">{player.username}</span>
                <span className="text-purple-400 font-semibold">{player.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats de jeu */}
      <div className="max-w-2xl mx-auto mb-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-purple-700 rounded-lg p-3 text-center">
            <p className="text-purple-400 text-xs mb-1">Score Actuel</p>
            <p className="text-white text-2xl font-bold">{score}</p>
          </div>
          <div className="bg-zinc-900 border border-purple-700 rounded-lg p-3 text-center">
            <p className="text-purple-400 text-xs mb-1">Votre Position</p>
            <p className="text-white text-2xl font-bold">#{userRank || '-'}</p>
          </div>
          <div className="bg-zinc-900 border border-purple-700 rounded-lg p-3 text-center">
            <p className="text-purple-400 text-xs mb-1">Participants</p>
            <p className="text-white text-2xl font-bold">{tournament.currentPlayers}</p>
          </div>
        </div>
      </div>

      {/* Zone de jeu */}
      <div className="flex flex-col items-center">
        <div
          className="relative bg-black border-4 border-purple-700 rounded-lg overflow-hidden"
          style={{
            width: `${GRID_SIZE * cellSize}px`,
            height: `${GRID_SIZE * cellSize}px`,
            maxWidth: '95vw',
            maxHeight: '50vh'
          }}
        >
          {/* Grille du serpent */}
          {snake.map((segment, index) => (
            <div
              key={index}
              className={index === 0 ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-purple-600'}
              style={{
                position: 'absolute',
                left: `${segment.x * cellSize}px`,
                top: `${segment.y * cellSize}px`,
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                borderRadius: index === 0 ? '4px' : '2px',
              }}
            />
          ))}

          {/* Nourriture */}
          <div
            className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
            style={{
              position: 'absolute',
              left: `${food.x * cellSize}px`,
              top: `${food.y * cellSize}px`,
              width: `${cellSize}px`,
              height: `${cellSize}px`,
            }}
          />

          {/* Overlay Game Over */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
              <h2 className="text-white text-3xl font-bold mb-2">Game Over!</h2>
              <p className="text-purple-400 text-xl mb-4">Score: {score}</p>
              <p className="text-green-400 text-sm mb-4">✓ Score enregistré dans le tournoi</p>
              <button
                onClick={resetGame}
                className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                Rejouer
              </button>
            </div>
          )}

          {/* Overlay Pause */}
          {!gameOver && isPaused && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <p className="text-white text-2xl font-bold">⏸️ Pause</p>
            </div>
          )}
        </div>

        {/* Contrôles */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`${isPaused
              ? 'bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900'
              : 'bg-gradient-to-r from-yellow-600 to-yellow-800 hover:from-yellow-700 hover:to-yellow-900'
              } text-white font-semibold px-8 py-3 rounded-lg transition flex items-center gap-2`}
            disabled={gameOver}
          >
            {isPaused ? (
              <>
                <Play size={20} />
                <span>Démarrer</span>
              </>
            ) : (
              <>
                <Pause size={20} />
                <span>Pause</span>
              </>
            )}
          </button>

          {/* Touches directionnelles */}
          <div className="grid grid-cols-3 gap-2">
            <div></div>
            <button
              onClick={() => handleDirectionClick('UP')}
              className="bg-purple-700 hover:bg-purple-600 text-white p-4 rounded-lg transition active:scale-95"
              disabled={gameOver}
            >
              <ArrowUp size={24} />
            </button>
            <div></div>
            <button
              onClick={() => handleDirectionClick('LEFT')}
              className="bg-purple-700 hover:bg-purple-600 text-white p-4 rounded-lg transition active:scale-95"
              disabled={gameOver}
            >
              <ArrowLeft size={24} />
            </button>
            <button
              onClick={() => handleDirectionClick('DOWN')}
              className="bg-purple-700 hover:bg-purple-600 text-white p-4 rounded-lg transition active:scale-95"
              disabled={gameOver}
            >
              <ArrowDown size={24} />
            </button>
            <button
              onClick={() => handleDirectionClick('RIGHT')}
              className="bg-purple-700 hover:bg-purple-600 text-white p-4 rounded-lg transition active:scale-95"
              disabled={gameOver}
            >
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
