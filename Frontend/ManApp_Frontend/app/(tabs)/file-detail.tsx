import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import { buildFileUrl, fetchFiles, updateFileStatus, uploadEventPdf } from '../../src/services/fileApi';

export default function FileDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { title, eventName, eventDate, source, fileUrl, filePath, docKey, eventId } = params;

  const [currentFileUri, setCurrentFileUri] = useState<string | null>(
    (fileUrl as string) || buildFileUrl(filePath as string) || null
  );
  const [isManager, setIsManager] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionComment, setRevisionComment] = useState('');

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setIsManager(parsed?.role === 'manager' || parsed?.email?.toLowerCase() === 'wulan.purnamasari@ciputra.ac.id');
        }
      } catch (error) {
        console.error('Failed to load current user:', error);
      }
    };

    loadCurrentUser();
  }, []);

  useEffect(() => {
    const loadLatestFile = async () => {
      if (!eventId || !docKey) return;
      try {
        const files = await fetchFiles();
        const record = files.find((item: any) => String(item.event_id) === String(eventId));
        if (!record) return;

        const pathValue = record?.[String(docKey)] || null;
        const urlValue = record?.[`${String(docKey)}_url`] || null;
        const resolved = urlValue || buildFileUrl(pathValue);
        if (resolved) setCurrentFileUri(resolved);
      } catch (error) {
        console.error('Failed to refresh file detail:', error);
      }
    };

    loadLatestFile();
  }, [eventId, docKey]);

  // Fungsi navigasi balik ke page Checklist dengan membawa parameter state data event asal
  const handleBackToChecklist = () => {
    router.replace({
      pathname: '/(tabs)/checklist',
      params: { 
        eventName, 
        eventDate,
        source,
        eventId,
      }
    });
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
      if (!result.canceled) {
        if (!eventId || !docKey) {
          Alert.alert('Gagal', 'Event atau dokumen tidak valid.');
          return;
        }

        setIsSubmitting(true);
        const uploaded = await uploadEventPdf(
          Number(eventId),
          result.assets[0].uri,
          result.assets[0].name,
          String(docKey)
        );
        const newUrl = buildFileUrl(uploaded?.path) || result.assets[0].uri;
        setCurrentFileUri(newUrl);
        Alert.alert("Berhasil", "File berhasil diganti.", [
          { text: 'OK', onPress: () => handleBackToChecklist() },
        ]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengganti file.';
      Alert.alert('Gagal', msg);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFile = () => {
    Alert.alert("Hapus File", "Apakah Anda yakin ingin menghapus file ini?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
          if (!eventId || !docKey) {
            Alert.alert('Gagal', 'Event atau dokumen tidak valid.');
            return;
          }
          try {
            setIsSubmitting(true);
            await updateFileStatus(Number(eventId), String(docKey), 'B');
            handleBackToChecklist();
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Gagal menghapus file.';
            Alert.alert('Gagal', msg);
          } finally {
            setIsSubmitting(false);
          }
        }
      }
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
      { text: "Ya, Selesai", onPress: async () => {
          if (!eventId || !docKey) {
            Alert.alert('Gagal', 'Event atau dokumen tidak valid.');
            return;
          }
          try {
            setIsSubmitting(true);
            await updateFileStatus(Number(eventId), String(docKey), 'S');
            handleBackToChecklist();
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Gagal memperbarui status.';
            Alert.alert('Gagal', msg);
          } finally {
            setIsSubmitting(false);
          }
        } }
    ]);
  };

  const handleRevisiSubmit = async () => {
    if (!revisionComment.trim()) {
      Alert.alert('Peringatan', 'Komentar revisi tidak boleh kosong.');
      return;
    }

    if (!eventId || !docKey) {
      Alert.alert('Gagal', 'Event atau dokumen tidak valid.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateFileStatus(Number(eventId), String(docKey), 'R', revisionComment);
      setShowRevisionModal(false);
      handleBackToChecklist();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Gagal memperbarui status.';
      Alert.alert('Gagal', msg);
    } finally {
      setIsSubmitting(false);
    }
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
            <TouchableOpacity
              style={[styles.btnDecision, styles.btnRevisi, isSubmitting && { opacity: 0.6 }]}
              onPress={() => setShowRevisionModal(true)}
              disabled={isSubmitting}
            >
              <Ionicons name="alert-circle" size={20} color="#FFF" /><Text style={styles.btnDecisionText}>Revisi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnDecision, styles.btnSelesai, isSubmitting && { opacity: 0.6 }]} onPress={handleSelesai} disabled={isSubmitting}>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" /><Text style={styles.btnDecisionText}>Selesai</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        visible={showRevisionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRevisionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Komentar Revisi</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Masukkan alasan revisi..."
              multiline
              numberOfLines={4}
              value={revisionComment}
              onChangeText={setRevisionComment}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnCancel]} 
                onPress={() => setShowRevisionModal(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnConfirm]} 
                onPress={handleRevisiSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.modalBtnTextConfirm}>Kirim Revisi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2DB',
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContent: {
    width: '100%',
    backgroundColor: '#FFFDF0',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5C2C00',
    marginBottom: 15,
    textAlign: 'center',
  },

  commentInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D2B48C',
    borderRadius: 10,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    color: '#5C2C00',
    marginBottom: 20,
  },

  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  modalBtn: {
    flex: 1,
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBtnCancel: {
    borderWidth: 1,
    borderColor: '#5C2C00',
  },

  modalBtnConfirm: {
    backgroundColor: '#5C2C00',
  },

  modalBtnTextCancel: {
    color: '#5C2C00',
    fontWeight: '600',
  },

  modalBtnTextConfirm: {
    color: '#FFF',
    fontWeight: '600',
  },
});