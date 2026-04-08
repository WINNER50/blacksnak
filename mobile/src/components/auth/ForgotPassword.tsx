import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../../../src/services/api';

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function ForgotPassword({ onBack, onSuccess }: ForgotPasswordProps) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');

  const handlePhoneSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await apiService.forgotPassword(phone);
      setUsername(response.username);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      await apiService.verifyResetCode(username, code);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Code de validation incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setError('');

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await apiService.resetPassword(username, newPassword, code);
      Alert.alert('Succès', 'Mot de passe modifié avec succès !', [{ text: 'OK', onPress: onSuccess }]);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
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

  return (
    <View style={tw`flex-col flex`}>
      <TouchableOpacity 
         onPress={handleBack} 
         disabled={loading}
         style={tw`flex-row items-center mb-6 ${loading ? 'opacity-50' : ''}`} 
         hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft size={20} color="#c084fc" />
        <Text style={tw`text-purple-400 text-base font-medium ml-2`}>Retour</Text>
      </TouchableOpacity>

      {/* Indicateur d'étapes */}
      <View style={tw`flex-row gap-2 mb-8`}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={tw`h-1 flex-1 rounded-full overflow-hidden bg-zinc-700`}>
             {s <= step ? (
                 <LinearGradient 
                     colors={['#9333ea', '#3b82f6']} 
                     start={{x: 0, y: 0}} end={{x: 1, y: 0}} 
                     style={tw`flex-1`}
                 />
             ) : null}
          </View>
        ))}
      </View>

      {step === 1 && (
        <View style={tw`mb-2`}>
          <Text style={tw`text-2xl font-bold text-white mb-2`}>Récupération du compte</Text>
          <Text style={tw`text-zinc-400 mb-6 text-sm text-center`}>Entrez votre numéro de téléphone</Text>

          <View style={tw`bg-zinc-900 border border-zinc-700 rounded-xl mb-6 px-4 h-14`}>
            <TextInput
              style={tw`flex-1 text-white text-base`}
              placeholder="+243 XXX XXX XXX"
              placeholderTextColor="#666"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>
        </View>
      )}

      {step === 2 && (
        <View style={tw`mb-2`}>
          <Text style={tw`text-2xl font-bold text-white mb-2`}>Code de validation</Text>
          <Text style={tw`text-zinc-400 mb-6 text-sm`}>Entrez le code reçu sur WhatsApp</Text>

          <View style={tw`bg-zinc-900 border border-zinc-700 rounded-xl mb-6 px-4 h-14 justify-center`}>
            <TextInput
              style={tw`flex-1 text-white text-2xl tracking-widest text-center`}
              placeholder="1234567"
              placeholderTextColor="#666"
              value={code}
              onChangeText={(val) => setCode(val.replace(/\D/g, '').slice(0, 7))}
              keyboardType="number-pad"
              maxLength={7}
              editable={!loading}
            />
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={tw`mb-2`}>
          <Text style={tw`text-2xl font-bold text-white mb-2`}>Nouveau mot de passe</Text>
          <Text style={tw`text-zinc-400 mb-6 text-sm`}>Choisissez un nouveau mot de passe</Text>

          <View style={tw`bg-zinc-900 border border-zinc-700 rounded-xl mb-6 flex-row items-center px-4 h-14`}>
            <TextInput
              style={tw`flex-1 text-white text-base h-full`}
              placeholder="Nouveau mot de passe"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={tw`p-2 z-10`} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} disabled={loading}>
              {showPassword ? <EyeOff size={20} color="#a1a1aa" /> : <Eye size={20} color="#a1a1aa" />}
            </TouchableOpacity>
          </View>

          <View style={tw`bg-zinc-900 border border-zinc-700 rounded-xl mb-6 flex-row items-center px-4 h-14`}>
            <TextInput
              style={tw`flex-1 text-white text-base h-full`}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#666"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={tw`p-2 z-10`} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} disabled={loading}>
              {showConfirmPassword ? <EyeOff size={20} color="#a1a1aa" /> : <Eye size={20} color="#a1a1aa" />}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {error ? (
        <View style={tw`bg-red-500/10 border border-red-500 rounded-xl p-3 mb-6`}>
          <Text style={tw`text-red-500 text-sm font-medium`}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity 
        onPress={step === 1 ? handlePhoneSubmit : step === 2 ? handleCodeSubmit : handlePasswordSubmit} 
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
             {loading ? 'Veuillez patienter...' : (step === 1 ? 'Envoyer le code' : step === 2 ? 'Vérifier' : 'Modifier le mot de passe')}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
