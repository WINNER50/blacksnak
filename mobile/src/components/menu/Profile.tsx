import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Camera, Save, User as UserIcon } from 'lucide-react-native';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import apiService from '../../services/api';
import config from '../../config';

interface ProfileProps {
  user: any;
  onUpdate: () => void;
}

export default function Profile({ user, onUpdate }: ProfileProps) {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.username}`);
  const [isUploading, setIsUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <View style={tw`flex-1 p-4 bg-black justify-center items-center`}>
        <Text style={tw`text-white`}>Chargement du profil...</Text>
      </View>
    );
  }

  const handlePhotoClick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Désolé, nous avons besoin de la permission d\'accéder à vos photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Set to false to avoid system-specific cropping issues
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur image picker', err);
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    setAvatarUrl(uri);
    
    try {
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      const formData = new FormData();
      // @ts-ignore - FormData expects string | Blob, but RN expects this object
      formData.append('avatar', {
        uri,
        name: filename,
        type,
      });

      const token = await SecureStore.getItemAsync(config.TOKEN_KEY);
      
      const response = await fetch(`${config.API_URL}/users/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur upload');
      }

      setAvatarUrl(data.avatar_url);
      onUpdate();
      Alert.alert('Succès', 'Photo de profil mise à jour !');
      
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Erreur', err.message || 'Erreur lors de l\'upload');
      setAvatarUrl(user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.username}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiService.updateSettings({ name, phone });
      onUpdate();
      setEditing(false);
      Alert.alert('Succès', 'Profil mis à jour !');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={tw`p-4 sm:p-6 bg-black flex-grow`}>
      <Text style={tw`text-white text-3xl font-bold mb-6`}>Mon Profil</Text>

      <View style={tw`bg-zinc-900 rounded-xl border border-purple-800 p-6 mb-6`}>
        {/* Photo de profil */}
        <View style={tw`items-center mb-8`}>
          <TouchableOpacity onPress={handlePhotoClick} disabled={isUploading} style={tw`relative`}>
            <Image
              source={{ uri: avatarUrl }}
              style={tw`w-32 h-32 rounded-full border-4 border-purple-500`}
            />
            {isUploading && (
              <View style={tw`absolute inset-0 items-center justify-center rounded-full bg-black/60`}>
                <ActivityIndicator size="large" color="#c084fc" />
              </View>
            )}
            <View style={tw`absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full`}>
               <Camera size={20} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={tw`text-zinc-400 text-sm mt-3`}>@{user.username}</Text>
          {isUploading && <Text style={tw`text-purple-400 text-xs mt-1`}>Upload en cours...</Text>}
        </View>

        {/* Formulaire */}
        <View style={tw`gap-4`}>
          <View>
            <Text style={tw`text-purple-400 text-sm mb-2`}>Nom complet</Text>
            <TextInput
              style={tw`w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700`}
              value={name}
              onChangeText={(val) => {
                 setName(val);
                 setEditing(true);
              }}
              placeholderTextColor="#666"
            />
          </View>

          <View>
            <Text style={tw`text-purple-400 text-sm mb-2`}>Nom d'utilisateur</Text>
            <TextInput
              style={tw`w-full bg-zinc-800 text-zinc-500 px-4 py-3 rounded-lg border border-zinc-700`}
              value={user.username}
              editable={false}
            />
            <Text style={tw`text-zinc-500 text-xs mt-2`}>Le nom d'utilisateur ne peut pas être modifié</Text>
          </View>

          <View>
            <Text style={tw`text-purple-400 text-sm mb-2`}>Numéro de téléphone</Text>
            <TextInput
              style={tw`w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700`}
              value={phone}
              onChangeText={(val) => {
                 setPhone(val);
                 setEditing(true);
              }}
              placeholderTextColor="#666"
              keyboardType="phone-pad"
            />
          </View>

          {editing && (
            <TouchableOpacity 
               onPress={handleSave}
               disabled={loading}
               style={tw`mt-4 rounded-xl overflow-hidden`}
            >
               <LinearGradient colors={['#9333ea', '#6b21a8']} style={tw`py-4 items-center justify-center flex-row opacity-${loading ? '50' : '100'}`}>
                  {loading ? <ActivityIndicator color="white" style={tw`mr-2`} /> : <Save size={20} color="white" style={tw`mr-2`} />}
                  <Text style={tw`text-white font-bold text-base`}>
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Text>
               </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Statistiques */}
      <View style={tw`flex-row gap-4 mb-8`}>
        <View style={tw`flex-1 bg-zinc-900 border border-purple-800 rounded-xl p-4`}>
          <Text style={tw`text-purple-400 text-sm mb-1`}>Membre depuis</Text>
          <Text style={tw`text-white text-lg font-semibold`}>
            {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
          </Text>
        </View>
        <View style={tw`flex-1 bg-zinc-900 border border-purple-800 rounded-xl p-4`}>
          <Text style={tw`text-purple-400 text-sm mb-1`}>Solde</Text>
          <Text style={tw`text-white text-lg font-semibold`}>{parseFloat(user.balance_usd || 0).toFixed(2)} $</Text>
        </View>
      </View>
    </ScrollView>
  );
}
