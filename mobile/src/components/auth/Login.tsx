import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../../../src/services/api';

interface LoginProps {
  onLogin: (user: any) => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

export default function Login({ onLogin, onRegister, onForgotPassword }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await apiService.login(username, password);
      const profile = await apiService.getProfile();
      onLogin(profile);
    } catch (err: any) {
      setError(err.message || 'Nom d\'utilisateur ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-col flex`}>
      <View style={tw`${isUsernameFocused ? 'border-purple-600 border-2' : 'border border-zinc-700'} bg-zinc-900 rounded-xl mb-6 flex-row items-center px-4 h-14`}>
        <TextInput
          style={tw`flex-1 text-white text-base h-full`}
          placeholder="Nom d'utilisateur"
          placeholderTextColor="#666"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          onFocus={() => setIsUsernameFocused(true)}
          onBlur={() => setIsUsernameFocused(false)}
        />
      </View>

      <View style={tw`${isPasswordFocused ? 'border-purple-600 border-2' : 'border border-zinc-700'} bg-zinc-900 rounded-xl mb-6 flex-row items-center px-4 h-14`}>
        <TextInput
          style={tw`flex-1 text-white text-base h-full`}
          placeholder="Mot de passe"
          placeholderTextColor="#666"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          onFocus={() => setIsPasswordFocused(true)}
          onBlur={() => setIsPasswordFocused(false)}
        />
        <TouchableOpacity 
          onPress={() => setShowPassword(!showPassword)}
          style={tw`p-2 z-10`}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {showPassword ? <EyeOff size={20} color="#a1a1aa" /> : <Eye size={20} color="#a1a1aa" />}
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={tw`bg-red-500/10 border border-red-500 rounded-xl p-3 mb-6`}>
          <Text style={tw`text-red-500 text-sm font-medium`}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity 
        onPress={handleSubmit} 
        disabled={loading}
        activeOpacity={0.8}
        style={tw`mb-8`}
      >
        <LinearGradient
          colors={['#9333ea', '#6b21a8']} // from-purple-600 to-purple-800
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tw`h-14 rounded-xl items-center justify-center flex-row ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={tw`text-white text-lg font-bold`}>Se connecter</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={tw`flex-row justify-between items-center px-1`}>
        <TouchableOpacity onPress={onForgotPassword} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={tw`text-purple-400 font-medium`}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRegister} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={tw`text-blue-400 font-medium`}>Créer un compte</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
