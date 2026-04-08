import React, { useState } from 'react';
import { View, Text, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';

interface AuthFlowProps {
  onLogin: (user: any) => void;
}

export default function AuthFlow({ onLogin }: AuthFlowProps) {
  const [screen, setScreen] = useState<'login' | 'register' | 'forgot'>('login');

  return (
    <SafeAreaView style={tw`flex-1 bg-black`}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <ScrollView contentContainerStyle={tw`flex-grow justify-center px-6 py-12`}>
          <View style={tw`w-full max-w-md self-center`}>
            {/* Logo */}
            <View style={tw`items-center mb-12`}>
              <Text style={tw`text-5xl font-bold text-white mb-2`}>Blacksnack</Text>
              <LinearGradient
                colors={['#9333ea', '#3b82f6']} // from-purple-600 to-blue-500
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={tw`h-1.5 w-32 rounded-full`}
              />
            </View>

            {/* Contenu selon l'écran */}
            {screen === 'login' && (
              <Login
                onLogin={onLogin}
                onRegister={() => setScreen('register')}
                onForgotPassword={() => setScreen('forgot')}
              />
            )}

            {screen === 'register' && (
              <Register
                onBack={() => setScreen('login')}
                onLogin={onLogin}
              />
            )}

            {screen === 'forgot' && (
              <ForgotPassword
                onBack={() => setScreen('login')}
                onSuccess={() => setScreen('login')}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
