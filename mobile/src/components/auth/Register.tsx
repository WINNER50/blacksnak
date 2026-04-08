import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../../../src/services/api';

interface RegisterProps {
  onBack: () => void;
  onLogin: (user: any) => void;
}

export default function Register({ onBack, onLogin }: RegisterProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setError('');

    if (step === 1) {
      if (!name.trim() || !phone.trim() || !username.trim()) {
        setError('Tous les champs sont requis');
        return;
      }
      if (phone.length < 9) {
        setError('Le numéro de téléphone doit contenir au moins 9 chiffres');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }

      setLoading(true);
      try {
        const response = await apiService.register(name, username, phone, password);
        onLogin(response.user);
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue lors de la création du compte');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    } else {
      onBack();
    }
  };

  const isPasswordMatch = confirmPassword && password === confirmPassword;

  return (
    <View style={tw`flex-col flex`}>
      <TouchableOpacity onPress={handleBack} style={tw`flex-row items-center mb-6`} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <ArrowLeft size={20} color="#c084fc" />
        <Text style={tw`text-purple-400 text-base font-medium ml-2`}>Retour</Text>
      </TouchableOpacity>

      {/* Progress Indicator */}
      <View style={tw`flex-row gap-2 mb-8`}>
        {[1, 2].map((s) => (
          <View key={s} style={tw`h-1 flex-1 rounded-full overflow-hidden`}>
             {s <= step ? (
                 <LinearGradient 
                     colors={['#9333ea', '#3b82f6']} 
                     start={{x: 0, y: 0}} end={{x: 1, y: 0}} 
                     style={tw`flex-1`}
                 />
             ) : (
                 <View style={tw`flex-1 bg-zinc-700`} />
             )}
          </View>
        ))}
      </View>

      {step === 1 && (
        <View style={tw`mb-2`}>
          <Text style={tw`text-2xl font-bold text-white mb-6`}>Informations personnelles</Text>

          <Text style={tw`text-xs font-bold text-zinc-500 uppercase mb-2 ml-1`}>Nom complet</Text>
          <View style={tw`bg-zinc-900 border border-zinc-700 rounded-xl mb-6 px-4 h-14`}>
            <TextInput
              style={tw`flex-1 text-white text-base`}
              placeholder="Ex: Jean Dupont"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={tw`text-xs font-bold text-zinc-500 uppercase mb-2 ml-1`}>Numéro de téléphone</Text>
          <View style={tw`bg-zinc-900 border border-zinc-700 rounded-xl mb-6 px-4 h-14`}>
            <TextInput
              style={tw`flex-1 text-white text-base`}
              placeholder="+243 XXX XXX XXX"
              placeholderTextColor="#666"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={tw`text-xs font-bold text-zinc-500 uppercase mb-2 ml-1`}>Nom d'utilisateur</Text>
          <View style={tw`bg-zinc-900 border border-zinc-700 rounded-xl mb-6 px-4 h-14`}>
            <TextInput
              style={tw`flex-1 text-white text-base`}
              placeholder="pseudo_unique"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
        </View>
      )}

      {step === 2 && (
        <View style={tw`mb-2`}>
          <Text style={tw`text-2xl font-bold text-white mb-2`}>Sécurité</Text>
          <Text style={tw`text-zinc-400 mb-6 text-sm`}>Choisissez un mot de passe solide pour votre compte.</Text>

          <View style={tw`bg-zinc-900 border border-zinc-700 rounded-xl mb-6 flex-row items-center px-4 h-14`}>
            <TextInput
              style={tw`flex-1 text-white text-base h-full`}
              placeholder="Mot de passe"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={tw`p-2 z-10`} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              {showPassword ? <EyeOff size={20} color="#a1a1aa" /> : <Eye size={20} color="#a1a1aa" />}
            </TouchableOpacity>
          </View>

          <View style={tw`bg-zinc-900 rounded-xl mb-2 flex-row items-center px-4 h-14 ${confirmPassword ? (isPasswordMatch ? 'border-2 border-green-500' : 'border-2 border-red-500') : 'border border-zinc-700'}`}>
            <TextInput
              style={tw`flex-1 text-white text-base h-full`}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#666"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={tw`p-2 z-10`} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              {showConfirmPassword ? <EyeOff size={20} color="#a1a1aa" /> : <Eye size={20} color="#a1a1aa" />}
            </TouchableOpacity>
          </View>

          {isPasswordMatch ? (
             <Text style={tw`text-xs text-green-500 mb-6 font-medium mt-1 ml-1`}>✓ Les mots de passe correspondent</Text>
          ) : <View style={tw`mb-6`} />}
        </View>
      )}

      {error ? (
        <View style={tw`bg-red-500/10 border border-red-500 rounded-xl p-3 mb-6`}>
          <Text style={tw`text-red-500 text-sm font-medium`}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity 
        onPress={handleNext} 
        disabled={loading}
        activeOpacity={0.8}
        style={tw`mb-4 mt-2`}
      >
        <LinearGradient
          colors={['#9333ea', '#6b21a8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tw`h-14 rounded-xl items-center justify-center flex-row ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? (
            <ActivityIndicator color="white" style={tw`mr-2`} />
          ) : null}
          <Text style={tw`text-white text-lg font-bold`}>
             {loading ? 'Création du compte...' : (step === 2 ? 'Créer mon compte' : 'Continuer')}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
