import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, StyleSheet, Image, Animated, StatusBar } from 'react-native';
import tw from 'twrnc';
import apiService from './src/services/api';
import * as SecureStore from 'expo-secure-store';
import config from './src/config';

import AuthFlow from './src/components/auth/AuthFlow';

interface User {
  username: string;
  balance_usd: number;
}

import GameInterface from './src/components/GameInterface';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    SecureStore.getItemAsync(config.TOKEN_KEY)
      .then(token => {
        if (token) {
          apiService.getProfile().then((profile) => {
            setUser(profile);
            setIsAuthenticated(true);
          }).catch((error) => {
            if (error.status === 401) {
              // Token invalide ou expiré définitivement
              SecureStore.deleteItemAsync(config.TOKEN_KEY);
              SecureStore.deleteItemAsync(config.REFRESH_TOKEN_KEY);
              setIsAuthenticated(false);
            } else if (error.isNetworkError) {
              // Problème d'internet : on garde l'authentification locale
              // Le profil a peut-être été chargé depuis le cache par ApiService.getProfile()
              setIsAuthenticated(true);
            } else {
              // Erreur serveur ou autre : on reste connecté par défaut
              setIsAuthenticated(true);
            }
          }).finally(() => {
            setIsChecking(false);
          });
        } else {
          setIsAuthenticated(false);
          setIsChecking(false);
        }
      });
  }, []);

  if (isChecking) {
    return (
      <View style={tw`flex-1 bg-black justify-center items-center`}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Image
            source={require('./assets/logo.png')}
            style={tw`w-80 h-80 rounded-3xl`}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color="#9333ea" style={tw`mt-4`} />
          <Text style={tw`text-white/20 text-xs mt-10 uppercase tracking-[4px] font-bold`}>Blacksnack</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-black`}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      {isAuthenticated ? (
        <GameInterface
          user={user}
          onLogout={() => {
            apiService.logout();
            setIsAuthenticated(false);
            setUser(null);
          }}
        />
      ) : (
        <AuthFlow onLogin={(userProfile) => {
          setUser(userProfile);
          setIsAuthenticated(true);
        }} />
      )}
    </SafeAreaView>
  );
}
