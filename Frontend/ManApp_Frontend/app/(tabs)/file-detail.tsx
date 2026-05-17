import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';

export default function FileDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { title, eventName, eventDate, source, fileUri, checklistId } = params;

  const [currentFileUri, setCurrentFileUri] = useState<string | null>(fileUri as string || null);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setIsManager(parsed?.email?.toLowerCase() === 'wulan.purnamasari@ciputra.ac.id');
        }
      } catch (error) {
        console.error('Failed to load current user:', error);
      }
    };

    loadCurrentUser();
  }, []);

  // Fungsi navigasi balik ke page Checklist dengan membawa parameter state data event asal
  const handleBackToChecklist = () => {
    router.replace({
      pathname: '/(tabs)/checklist',
      params: { 
        eventName, 
        eventDate,
        source
      }
    });
  };

  const navigateBackWithStatus = (statusColor: 'yellow' | 'green' | 'red') => {
    router.replace({
      pathname: '/(tabs)/checklist',
      params: { 
        eventName, 
        eventDate,
        source,
        updatedStatus: statusColor,
        checklistId, // Kirim ID balik agar Checklist tahu lampu mana yang berubah
        docTitle: title
      }
    });
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
      if (!result.canceled) {
        setCurrentFileUri(result.assets[0].uri);
        Alert.alert("Berhasil", "File berhasil diganti.");
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteFile = () => {
    Alert.alert("Hapus File", "Apakah Anda yakin ingin menghapus file ini?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: () => navigateBackWithStatus('red') }
    ]);
  };

  const handleViewFile = async () => {
    if (currentFileUri) {
      const canOpen = await Linking.canOpenURL(currentFileUri);
      if (canOpen) await Linking.openURL(currentFileUri);
      else Alert.alert("Info", "Tidak ada aplikasi untuk membuka file ini.");
    } else Alert.alert("Gagal", "File tidak ditemukan.");
  };

  const handleSelesai = () => {
    Alert.alert("Konfirmasi Selesai", "Dokumen ini akan ditandai sebagai Selesai.", [
      { text: "Batal", style: "cancel" },
      { text: "Ya, Selesai", onPress: () => navigateBackWithStatus('green') }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* Tombol back diubah dari router.back() menjadi handleBackToChecklist() */}
        <TouchableOpacity onPress={handleBackToChecklist} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Detail Dokumen'}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.previewCard}>
          <View style={styles.cardHeader}><Text style={styles.cardHeaderText}>{title}</Text></View>
          <View style={styles.documentPlaceholder}>
             <Ionicons name="document-text" size={80} color="rgba(255,255,255,0.2)" />
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionItem} onPress={handlePickFile}>
              <MaterialCommunityIcons name="swap-horizontal" size={20} color="#EA9B03" /><Text style={[styles.actionText, { color: '#EA9B03' }]}>Ganti File</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleDeleteFile}>
              <Ionicons name="trash-outline" size={20} color="#FF383C" /><Text style={[styles.actionText, { color: '#FF383C' }]}>Hapus File</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleViewFile}>
              <Ionicons name="eye-outline" size={20} color="#5C2C00" /><Text style={[styles.actionText, { color: '#5C2C00' }]}>Lihat File</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isManager && (
          <View style={styles.decisionRow}>
            <TouchableOpacity style={[styles.btnDecision, styles.btnRevisi]} onPress={() => navigateBackWithStatus('yellow')}>
              <Ionicons name="alert-circle" size={20} color="#FFF" /><Text style={styles.btnDecisionText}>Revisi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnDecision, styles.btnSelesai]} onPress={handleSelesai}>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" /><Text style={styles.btnDecisionText}>Selesai</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF5E6',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 40,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF8F29',
    elevation: 4,
  },

  headerTitle: {
    flex: 1,
    marginLeft: 15,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5C2C00',
  },

  content: {
    paddingHorizontal: 25,
    alignItems: 'center',
  },

  previewCard: {
    width: '100%',
    marginBottom: 30,
    borderRadius: 15,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    elevation: 5,
  },

  cardHeader: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#5C2C00',
  },

  cardHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },

  documentPlaceholder: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4E2A00',
  },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#FFF',
  },

  actionItem: {
    alignItems: 'center',
    gap: 5,
  },

  actionText: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  decisionRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 15,
  },

  btnDecision: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
  },

  btnRevisi: {
    backgroundColor: '#EA9B03',
  },

  btnSelesai: {
    backgroundColor: '#606C38',
  },

  btnDecisionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
});