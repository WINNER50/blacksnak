import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, Animated, Dimensions, StyleSheet } from 'react-native';
import { Home, User, Wallet, Trophy, Target, MoreHorizontal, X } from 'lucide-react-native';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SidebarProps {
  isOpen: boolean;
  currentView: string;
  onSelect: (view: string) => void;
  onClose: () => void;
  hasPaymentMethods?: boolean;
}

export default function Sidebar({ isOpen, currentView, onSelect, onClose, hasPaymentMethods = true }: SidebarProps) {
  const menuItems = [
    { id: 'game', label: 'Jeu', icon: Home },
    { id: 'profile', label: 'Profil', icon: User },
    ...(hasPaymentMethods ? [{ id: 'wallet', label: 'Portefeuille', icon: Wallet }] : []),
    { id: 'tournaments', label: 'Tournois', icon: Trophy },
    { id: 'challenges', label: 'Défis Perso', icon: Target },
    { id: 'others', label: 'Autres', icon: MoreHorizontal }
  ];

  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isOpen ? 0 : -width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, [isOpen]);

  // Replaced if block

  return (
    <View style={[StyleSheet.absoluteFill, tw`flex-row z-50`, { display: isOpen ? 'flex' : 'none' }]}>
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Sidebar Content */}
      <Animated.View 
         style={[
           tw`h-full w-4/5 max-w-[300px] border-r border-purple-800 bg-black flex-col`,
           { transform: [{ translateX: slideAnim }] }
         ]}
      >
        <LinearGradient
            colors={['#18181b', '#000000']} // zinc-900 to black
            style={tw`flex-1`}
        >
          {/* Header Mobile Menu */}
          <View style={tw`p-4 border-b border-purple-800 flex-row items-center justify-between`}>
             <Text style={tw`text-white font-bold text-xl`}>Menu</Text>
             <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={24} color="white" />
             </TouchableOpacity>
          </View>

          {/* Navigation */}
          <View style={tw`p-4 flex-1`}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              if (isActive) {
                 return (
                    <TouchableOpacity key={item.id} onPress={() => onSelect(item.id)} activeOpacity={0.8} style={tw`mb-2`}>
                       <LinearGradient
                          colors={['#9333ea', '#6b21a8']}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={tw`w-full flex-row items-center gap-3 px-4 py-4 rounded-xl shadow-lg`}
                       >
                         <Icon size={24} color="white" />
                         <Text style={tw`text-white font-bold text-base ml-2`}>{item.label}</Text>
                       </LinearGradient>
                    </TouchableOpacity>
                 );
              }

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => onSelect(item.id)}
                  activeOpacity={0.7}
                  style={tw`w-full flex-row items-center gap-3 px-4 py-4 rounded-xl mb-2`}
                >
                  <Icon size={24} color="#a1a1aa" />
                  <Text style={tw`text-zinc-400 font-bold text-base ml-2`}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer */}
          <View style={tw`p-4 mb-4`}>
             <View style={tw`border border-purple-800 rounded-xl overflow-hidden`}>
                <LinearGradient
                  colors={['rgba(88,28,135,0.5)', 'rgba(30,58,138,0.5)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={tw`p-4`}
                >
                  <Text style={tw`text-purple-300 text-sm font-bold mb-1`}>Blacksnack</Text>
                  <Text style={tw`text-white text-xs`}>Version Native 1.0</Text>
                </LinearGradient>
             </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}
