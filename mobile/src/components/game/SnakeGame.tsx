import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, PanResponder, Platform } from 'react-native';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause } from 'lucide-react-native';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Position {
  x: number;
  y: number;
}

interface SnakeGameProps {
  user: any;
  updateUser: () => void;
  challenge?: any;
  onComplete?: (score: number) => void;
  tournamentId?: string;
  onTournamentComplete?: (score: number) => void;
}

const GRID_SIZE = 20;

export default function SnakeGame({ user, updateUser, challenge, onComplete, tournamentId, onTournamentComplete }: SnakeGameProps) {
  const userId = user?.id ?? null;

  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [highScore, setHighScore] = useState(0);
  const [cellSize, setCellSize] = useState(15);

  const [speedConfig, setSpeedConfig] = useState({ label: 'Normal', speed: 150, multiplier: 1.0 });

  const directionRef = useRef(direction);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const gameOverRef = useRef(false);

  const [timeLeft, setTimeLeft] = useState(challenge?.timeLimit || 0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (challenge && !isPaused && !gameOver && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            setGameOver(true);
            gameOverRef.current = true;
            setIsPaused(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, gameOver, timeLeft, challenge]);

  useEffect(() => {
    if (gameOver) {
      if (challenge && onComplete) onComplete(score);
      else if (tournamentId && onTournamentComplete) onTournamentComplete(score);
    }
  }, [gameOver]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Load Speed Config and High Score
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem('blacksnack_speed_config');
        if (saved) setSpeedConfig(JSON.parse(saved));

        if (userId) {
          const savedHighScore = await AsyncStorage.getItem(`blacksnack_highscore_${userId}`);
          if (savedHighScore) setHighScore(parseInt(savedHighScore));
        }
      } catch (e) {
        console.log('Error loading settings', e);
      }
    };
    loadSettings();
  }, [userId]);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Calculate Cell Size
  useEffect(() => {
    const availableWidth = screenWidth - 32; // 16px padding on each side
    const maxCellWidth = Math.floor(availableWidth / GRID_SIZE);

    // Calculate based on height
    const reservedHeight = Platform.OS === 'ios' ? 380 : 350;
    const availableHeight = screenHeight - reservedHeight;
    const maxCellHeight = Math.floor(availableHeight / GRID_SIZE);

    // Final Cell Size (capped for aesthetics)
    let finalCellSize = Math.min(maxCellWidth, maxCellHeight, 22);
    if (finalCellSize < 12) finalCellSize = 12; // Min size for playability

    setCellSize(finalCellSize);
  }, [screenWidth, screenHeight]);

  const generateFood = useCallback((currentSnake: Position[]) => {
    let newFood: Position = { x: 15, y: 15 };
    let isOccupied = true;
    let attempts = 0;

    while (isOccupied && attempts < 100) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      isOccupied = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      attempts++;
    }
    setFood(newFood);
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
      if (gameOverRef.current || prevSnake.length === 0) return prevSnake;

      const head = prevSnake[0];
      let newHead: Position;

      switch (directionRef.current) {
        case 'UP': newHead = { x: head.x, y: head.y - 1 }; break;
        case 'DOWN': newHead = { x: head.x, y: head.y + 1 }; break;
        case 'LEFT': newHead = { x: head.x - 1, y: head.y }; break;
        case 'RIGHT': newHead = { x: head.x + 1, y: head.y }; break;
        default: newHead = { ...head };
      }

      // Walls constraint
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        gameOverRef.current = true;
        setGameOver(true);
        setIsPaused(true);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        return prevSnake;
      }

      // Body collision
      const bodyToCheck = prevSnake.slice(0, -1);
      if (bodyToCheck.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        gameOverRef.current = true;
        setGameOver(true);
        setIsPaused(true);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Eat Food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((prev) => {
          const newScore = prev + 1;
          if (newScore > highScore) {
            setHighScore(newScore);
            if (userId) AsyncStorage.setItem(`blacksnack_highscore_${userId}`, newScore.toString());
          }
          return newScore;
        });
        generateFood(newSnake);
        return newSnake;
      } else {
        newSnake.pop();
        return newSnake;
      }
    });
  }, [isPaused, food, generateFood, highScore, userId]);

  useEffect(() => {
    if (!isPaused && !gameOver) {
      gameLoopRef.current = setInterval(moveSnake, speedConfig.speed);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, isPaused, gameOver, speedConfig.speed]);

  const handleDirectionChange = (newDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (isPaused || gameOver) return;
    const opposites: Record<string, string> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
    if (opposites[directionRef.current] !== newDirection) {
      setDirection(newDirection);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 20) handleDirectionChange('RIGHT');
          else if (dx < -20) handleDirectionChange('LEFT');
        } else {
          if (dy > 20) handleDirectionChange('DOWN');
          else if (dy < -20) handleDirectionChange('UP');
        }
      },
    })
  ).current;

  if (!user) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-black`}>
        <Text style={tw`text-purple-400 font-bold`}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-black items-center justify-center p-4`}>
      {/* Stats */}
      <View style={tw`flex-row justify-center gap-12 w-full mb-6`}>
        <View style={tw`items-center`}>
          <Text style={tw`text-purple-400 text-sm mb-1 font-bold`}>Score</Text>
          <Text style={tw`text-white text-3xl font-black`}>{score}</Text>
        </View>
        {challenge ? (
          <View style={tw`items-center`}>
            <Text style={tw`text-blue-400 text-sm mb-1 font-bold`}>Temps</Text>
            <Text style={tw`text-white text-3xl font-black`}>{timeLeft}s</Text>
          </View>
        ) : (
          <View style={tw`items-center`}>
            <Text style={tw`text-purple-400 text-sm mb-1 font-bold`}>Record</Text>
            <Text style={tw`text-white text-3xl font-black`}>{highScore}</Text>
          </View>
        )}
      </View>

      {/* Game Board */}
      <View
        {...panResponder.panHandlers}
        style={[
          tw`bg-zinc-800 border-[3px] border-purple-600 rounded-lg overflow-hidden relative shadow-lg`,
          { width: GRID_SIZE * cellSize, height: GRID_SIZE * cellSize, shadowColor: '#a855f7' }
        ]}
      >
        {snake.map((segment, index) => {
          const pad = cellSize * 0.1;
          const inner = cellSize - pad * 2;
          return (
            <View
              key={`snake-${index}`}
              style={[
                tw`absolute items-center justify-center`,
                {
                  left: segment.x * cellSize + pad, top: segment.y * cellSize + pad,
                  width: inner, height: inner,
                  backgroundColor: index === 0 ? '#8b5cf6' : '#a78bfa',
                  borderRadius: index === 0 ? inner * 0.3 : inner * 0.2,
                  borderWidth: 1, borderColor: '#7c3aed'
                }
              ]}
            />
          );
        })}

        {/* Food */}
        <View
          style={[
            tw`absolute rounded-full bg-red-500`,
            {
              left: food.x * cellSize + cellSize * 0.15,
              top: food.y * cellSize + cellSize * 0.15,
              width: cellSize * 0.7,
              height: cellSize * 0.7,
              shadowColor: '#ef4444', shadowRadius: 6, shadowOpacity: 1, shadowOffset: { width: 0, height: 0 }
            }
          ]}
        />

        {/* Overlays */}
        {gameOver && !challenge && !tournamentId && (
          <View style={tw`absolute inset-0 bg-black/80 items-center justify-center rounded-lg p-4`}>
            <Text style={tw`text-white text-3xl font-black mb-2`}>Game Over!</Text>
            <Text style={tw`text-purple-400 text-lg font-bold mb-6`}>Score: {score}</Text>
            <TouchableOpacity onPress={resetGame} style={tw`rounded-xl overflow-hidden shadow-lg`}>
              <LinearGradient colors={['#9333ea', '#6b21a8']} style={tw`px-8 py-3 items-center justify-center`}>
                <Text style={tw`text-white font-bold text-lg`}>Rejouer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {gameOver && (challenge || tournamentId) && (
          <View style={tw`absolute inset-0 bg-black/80 items-center justify-center rounded-lg p-4`}>
            <Text style={tw`text-white text-xl font-black mb-2`}>Fin de la partie</Text>
            <Text style={tw`text-purple-400 text-lg font-bold mb-6`}>Validation du score...</Text>
          </View>
        )}

        {isPaused && !gameOver && snake.length === 1 && (
          <View style={tw`absolute inset-0 bg-black/80 items-center justify-center rounded-lg p-4`}>
            <Text style={tw`text-white text-2xl font-black mb-6`}>Prêt à jouer ?</Text>
            <TouchableOpacity onPress={() => setIsPaused(false)} style={tw`rounded-xl overflow-hidden shadow-[0_0_10px_purple]`}>
              <LinearGradient colors={['#9333ea', '#6b21a8']} style={tw`px-8 py-3 flex-row items-center justify-center`}>
                <Play color="#fff" size={20} style={tw`mr-2`} />
                <Text style={tw`text-white font-bold text-lg`}>Commencer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={tw`mt-8 items-center`}>
        <TouchableOpacity
          onPress={() => setIsPaused(!isPaused)}
          disabled={gameOver}
          style={tw`bg-purple-700 disabled:bg-zinc-700 px-6 py-3 rounded-xl flex-row items-center mb-6`}
        >
          {isPaused ? <Play color="#fff" size={20} /> : <Pause color="#fff" size={20} />}
          <Text style={tw`text-white font-bold ml-2`}>{isPaused ? 'Reprendre' : 'Pause'}</Text>
        </TouchableOpacity>

        <View style={tw`items-center justify-center mt-4 mb-4`}>
          <View style={tw`flex-col items-center gap-2`}>
            <TouchableOpacity onPress={() => handleDirectionChange('UP')} style={tw`bg-zinc-800 w-16 h-16 rounded-xl items-center justify-center active:bg-zinc-700`}>
              <ArrowUp color="#fff" size={28} />
            </TouchableOpacity>
            <View style={tw`flex-row gap-2`}>
              <TouchableOpacity onPress={() => handleDirectionChange('LEFT')} style={tw`bg-zinc-800 w-16 h-16 rounded-xl items-center justify-center active:bg-zinc-700`}>
                <ArrowLeft color="#fff" size={28} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDirectionChange('DOWN')} style={tw`bg-zinc-800 w-16 h-16 rounded-xl items-center justify-center active:bg-zinc-700`}>
                <ArrowDown color="#fff" size={28} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDirectionChange('RIGHT')} style={tw`bg-zinc-800 w-16 h-16 rounded-xl items-center justify-center active:bg-zinc-700`}>
                <ArrowRight color="#fff" size={28} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <Text style={tw`text-zinc-500 text-xs font-medium text-center mt-6`}>Glissez sur l'écran ou utilisez les boutons pour jouer</Text>
    </View>
  );
}
