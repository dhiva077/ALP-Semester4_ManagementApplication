import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import useProfileViewModel from '../../src/viewmodels/useProfileViewModel';

export default function Profile() {
  const router = useRouter();

  const { profileImage, pickImage } = useProfileViewModel();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.avatarWrapper}>
        <View style={styles.avatarBorder}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : {
                    uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
                  }
            }
            style={styles.avatar}
          />
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={pickImage}
        >
          <Ionicons name="pencil-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.name}>Rasya Dema - PIC Event</Text>

      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardText}>Riwayat Event Saya</Text>

        <Ionicons
          name="chevron-forward"
          size={28}
          color="#6A3500"
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton}>
        <Ionicons
          name="log-out-outline"
          size={24}
          color="#FF3B30"
        />

        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6ECD7',
    paddingHorizontal: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9328',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6A3500',
  },

  avatarWrapper: {
    marginTop: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarBorder: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 3,
    borderColor: '#6A3500',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  avatar: {
    width: 178,
    height: 178,
    borderRadius: 89,
  },

  editButton: {
    position: 'absolute',
    right: 78,
    bottom: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9328',
    justifyContent: 'center',
    alignItems: 'center',
  },

  name: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '700',
    color: '#6A3500',
  },

  card: {
    marginTop: 28,
    backgroundColor: '#FDFBF4',
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  cardText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A3500',
  },

  logoutButton: {
    marginTop: 'auto',
    marginBottom: 34,
    alignSelf: 'center',
    width: '85%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FDFBF4',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  logoutText: {
    marginLeft: 8,
    color: '#FF3B30',
    fontWeight: '700',
    fontSize: 17,
  },
});