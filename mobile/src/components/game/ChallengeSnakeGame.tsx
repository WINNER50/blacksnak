import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, PanResponder, ScrollView } from 'react-native';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause } from 'lucide-react-native';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Position {
  x: number;
  y: number;
}

interface ChallengeSnakeGameProps {
  user: any;
  updateUser: () => void;
  challenge: any;
  onComplete: (score: number) => void;
}

const GRID_SIZE = 20;

const SPEED_OPTIONS = [
  { label: 'Lent', speed: 250, multiplier: 0.5, color: '#60a5fa' }, // blue-400
  { label: 'Normal', speed: 150, multiplier: 1.0, color: '#4ade80' }, // green-400
  { label: 'Rapide', speed: 100, multiplier: 1.5, color: '#fb923c' }, // orange-400
  { label: 'Très Rapide', speed: 75, multiplier: 2.0, color: '#f87171' } // red-400
];

export default function ChallengeSnakeGame({ user, updateUser, challenge, onComplete }: ChallengeSnakeGameProps) {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(challenge.timeLimit);
  const [cellSize, setCellSize] = useState(15);
  
  const [speedConfig, setSpeedConfig] = useState(SPEED_OPTIONS[1]);
  const [adjustedReward, setAdjustedReward] = useState(challenge.potential);

  const directionRef = useRef(direction);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gameOverRef = useRef(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem('blacksnack_speed_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          setSpeedConfig(parsed);
          setAdjustedReward((parseFloat(challenge.potential) * parsed.multiplier).toFixed(2));
        } else {
          setAdjustedReward(challenge.potential);
        }
      } catch (e) {
        console.log('Error loading settings', e);
      }
    };
    loadSettings();
  }, [challenge.potential]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // Calculate Cell Size
  useEffect(() => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const availableWidth = screenWidth - 40; // 20px padding
    const availableHeight = screenHeight - 420; // Increased buffer to ensure space for controls

    const sizeFromWidth = Math.floor(availableWidth / GRID_SIZE);
    const sizeFromHeight = Math.floor(availableHeight / GRID_SIZE);
    
    // Allows grid to dynamically grow but keeps enough space for buttons below
    setCellSize(Math.max(10, Math.min(sizeFromWidth, sizeFromHeight, 38)));
  }, []);
  useEffect(() => {
    if (isPaused || gameOver || !gameStarted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          setGameOver(true);
          gameOverRef.current = true;
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
      
      const timeout = setTimeout(() => {
        onComplete(score);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [gameOver, score, onComplete, isPaused]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

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

  const moveSnake = useCallback(() => {
    if (gameOverRef.current || isPaused) return;

    setSnake((prevSnake) => {
      if (gameOverRef.current) return prevSnake;
      
      const head = prevSnake[0];
      let newHead: Position;

      switch (directionRef.current) {
        case 'UP': newHead = { x: head.x, y: head.y - 1 }; break;
        case 'DOWN': newHead = { x: head.x, y: head.y + 1 }; break;
        case 'LEFT': newHead = { x: head.x - 1, y: head.y }; break;
        case 'RIGHT': newHead = { x: head.x + 1, y: head.y }; break;
        default: newHead = { ...head };
      }

      // Vérifier collision avec les murs - ARRÊT IMMÉDIAT
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        gameOverRef.current = true;
        setGameOver(true);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        return prevSnake;
      }

      // Vérifier collision avec soi-même - ARRÊT IMMÉDIAT
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        gameOverRef.current = true;
        setGameOver(true);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Vérifier si on mange la nourriture
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 1);
        generateFood(newSnake);
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
  }, [moveSnake, isPaused, gameOver, gameStarted, speedConfig.speed]);

  const handleDirectionChange = (newDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOver) return;
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

  // Si le jeu n'est pas encore commencé, afficher l'écran "Êtes-vous prêt ?"
  if (!gameStarted) {
    return (
      <ScrollView contentContainerStyle={tw`pb-4 w-full`} showsVerticalScrollIndicator={false} style={tw`flex-1 w-full max-h-[85vh]`}>
         <View style={tw`bg-zinc-900 rounded-lg border border-purple-700 p-6 sm:p-8 items-center max-w-xl mx-auto w-full`}>
            <LinearGradient colors={['#9333ea', '#3b82f6']} style={tw`p-5 sm:p-6 rounded-full w-24 h-24 items-center justify-center mb-6`}>
              <Play color="white" size={40} />
            </LinearGradient>
            <Text style={tw`text-white text-2xl sm:text-3xl font-bold mb-6`}>Êtes-vous prêt ?</Text>
            
            {/* Informations du défi */}
            <View style={tw`bg-zinc-800 rounded-lg p-4 mb-6 border border-purple-600/30 w-full`}>
              <Text style={tw`text-zinc-400 mb-2`}>Objectif : <Text style={tw`text-white font-semibold`}>{challenge.target} points</Text></Text>
              <Text style={tw`text-zinc-400 mb-2`}>Temps limite : <Text style={tw`text-white font-semibold`}>{challenge.timeLimit} secondes</Text></Text>
              <Text style={tw`text-purple-400 mb-2`}>Gains de base : <Text style={tw`text-green-500 font-bold line-through`}>{parseFloat(challenge.potential).toFixed(2)} $</Text></Text>
              <View style={tw`mt-3 pt-3 border-t border-purple-600/30 w-full`}>
                <Text style={tw`text-sm text-zinc-400 mb-1`}>Vitesse actuelle : <Text style={[tw`font-bold`, { color: speedConfig.color || '#4ade80' }]}>{speedConfig.label}</Text></Text>
                <Text style={tw`text-xs text-zinc-500 mb-2`}>Multiplicateur de gains : ×{speedConfig.multiplier}</Text>
                <Text style={[tw`text-3xl font-bold`, { color: speedConfig.color || '#4ade80' }]}>
                  {adjustedReward} $
                </Text>
              </View>
            </View>

            <Text style={tw`text-zinc-500 text-xs mb-6 italic text-center`}>
              Note: Vous pouvez modifier la vitesse globale dans l'onglet "Autres".
            </Text>
            
            <TouchableOpacity
              onPress={() => setGameStarted(true)}
              style={tw`w-full rounded-lg overflow-hidden shadow-lg transform transition-all active:scale-95`}
            >
              <LinearGradient colors={['#16a34a', '#14532d']} style={tw`py-4 items-center justify-center`}>
                 <Text style={tw`text-white font-bold text-lg`}>🎮 Commencer le défi !</Text>
              </LinearGradient>
            </TouchableOpacity>
         </View>
      </ScrollView>
    );
  }

  return (
    <View style={tw`bg-[#0a0a0a] rounded-xl border border-purple-800 p-4 w-full flex-1 mb-4`}>
      {/* Stats du défi */}
      <View style={tw`flex-row justify-between gap-2`}>
        <View style={tw`flex-1 bg-purple-600/20 rounded-lg p-3 items-center border border-purple-600`}>
          <Text style={tw`text-purple-400 text-xs mb-1 text-center`}>Score</Text>
          <Text style={tw`text-white text-xl font-bold`}>{score}</Text>
        </View>
        <View style={tw`flex-1 bg-blue-600/20 rounded-lg p-3 items-center border border-blue-600`}>
          <Text style={tw`text-blue-400 text-xs mb-1 text-center`}>Objectif</Text>
          <Text style={tw`text-white text-xl font-bold`}>{challenge.target}</Text>
        </View>
        <View style={tw`flex-1 rounded-lg p-3 items-center border ${timeLeft <= 10 ? 'bg-red-600/20 border-red-600' : 'bg-green-600/20 border-green-600'}`}>
          <Text style={tw`text-xs mb-1 text-center ${timeLeft <= 10 ? 'text-red-400' : 'text-green-500'}`}>Temps</Text>
          <Text style={tw`text-xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>{timeLeft}s</Text>
        </View>
      </View>

      {/* Bouton Pause (déplacé ici) */}
      <View style={tw`items-center my-3`}>
        <TouchableOpacity
          onPress={() => setIsPaused(!isPaused)}
          disabled={gameOver}
           style={tw`bg-purple-600 border border-purple-500 disabled:bg-zinc-700 px-8 py-2 rounded-lg flex-row items-center active:scale-95 shadow-md`}
        >
          {isPaused ? <Play color="#fff" size={16} /> : <Pause color="#fff" size={16} />}
          <Text style={tw`text-white font-bold ml-2 text-sm`}>{isPaused ? 'Reprendre' : 'Pause'}</Text>
        </TouchableOpacity>
      </View>

      {/* Grille de jeu */}
      <View style={tw`items-center justify-center mb-4`}>
        <View 
          {...panResponder.panHandlers}
          style={[
             tw`bg-zinc-800 border-[4px] border-purple-700 rounded-lg overflow-hidden relative shadow-lg`, 
             { width: GRID_SIZE * cellSize, height: GRID_SIZE * cellSize }
          ]}
        >
          {/* Serpent */}
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

          {/* Nourriture */}
          <View
            style={[
              tw`absolute rounded-full bg-red-500`,
              {
                left: food.x * cellSize + cellSize * 0.15,
                top: food.y * cellSize + cellSize * 0.15,
                width: cellSize * 0.7,
                height: cellSize * 0.7,
                shadowColor: '#ef4444', shadowRadius: 6, shadowOpacity: 1, shadowOffset: {width: 0, height: 0}
              }
            ]}
          />

          {/* Overlay Game Over */}
          {gameOver && (
            <View style={tw`absolute inset-0 bg-black/80 items-center justify-center rounded-lg p-4`}>
               <Text style={tw`text-white text-2xl font-black mb-2`}>Temps écoulé !</Text>
               <Text style={tw`text-purple-400 text-lg font-bold mb-6`}>Score: {score}</Text>
            </View>
          )}

          {/* Overlay Pause */}
          {isPaused && !gameOver && (
            <View style={tw`absolute inset-0 bg-black/80 items-center justify-center rounded-lg p-4`}>
               <Pause color="white" size={48} style={tw`mb-2`} />
               <Text style={tw`text-white text-xl font-bold`}>Pause</Text>
            </View>
          )}
        </View>
      </View>

      {/* Contrôles D-Pad (Réduits et en bas) */}
      <View style={tw`items-center mt-2 pb-1`}>
        <View style={tw`flex-col items-center gap-2`}>
          <TouchableOpacity onPress={() => handleDirectionChange('UP')} style={tw`bg-zinc-800/90 w-14 h-12 rounded-xl items-center justify-center active:bg-zinc-700 shadow-lg`}>
             <ArrowUp color="#fff" size={24} />
          </TouchableOpacity>
          <View style={tw`flex-row gap-4`}>
             <TouchableOpacity onPress={() => handleDirectionChange('LEFT')} style={tw`bg-zinc-800/90 w-14 h-12 rounded-xl items-center justify-center active:bg-zinc-700 shadow-lg`}>
                <ArrowLeft color="#fff" size={24} />
             </TouchableOpacity>
             <TouchableOpacity onPress={() => handleDirectionChange('DOWN')} style={tw`bg-zinc-800/90 w-14 h-12 rounded-xl items-center justify-center active:bg-zinc-700 shadow-lg`}>
                <ArrowDown color="#fff" size={24} />
             </TouchableOpacity>
             <TouchableOpacity onPress={() => handleDirectionChange('RIGHT')} style={tw`bg-zinc-800/90 w-14 h-12 rounded-xl items-center justify-center active:bg-zinc-700 shadow-lg`}>
                <ArrowRight color="#fff" size={24} />
             </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
