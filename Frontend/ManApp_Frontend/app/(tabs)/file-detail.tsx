import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import { buildFileUrl, fetchFiles, updateFileStatus, uploadEventPdf, aiRevalidateFile } from '../../src/services/fileApi';

const PdfComponent = (() => {
  try {
    // Avoid crashing in Expo Go when native module is unavailable.
    return require('react-native-pdf').default as React.ComponentType<any>;
  } catch (error) {
    return null;
  }
})();

export default function FileDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { title, eventName, eventDate, source, fileUrl, filePath, docKey, eventId } = params;

  const [currentFileUri, setCurrentFileUri] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [revisionComment, setRevisionComment] = useState('');
  const [isLoadingFile, setIsLoadingFile] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [aiValidation, setAiValidation] = useState<{
    ai_valid: boolean | null;
    ai_detected_type: string | null;
    ai_confidence: string | null;
    ai_explanation: string | null;
    ai_processed: boolean;
  } | null>(null);

  // Helper to get AI field from record (supports both old and new format)
  const getAiField = (record: any, field: string) => {
    // Try direct field first (database column)
    if (record?.[field] !== undefined && record?.[field] !== null) return record[field];
    // Try snake_case
    const snake = field.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    if (record?.[snake] !== undefined && record?.[snake] !== null) return record[snake];
    return null;
  };
  const previewUrl = currentFileUri || null;

  const buildCacheBustedUrl = (url: string) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${Date.now()}`;
  };

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
      if (!eventId || !docKey) {
        setIsLoadingFile(false);
        return;
      }
      try {
        setIsLoadingFile(true);
        // Paksa fetch dari server (bypass cache) untuk dapat data terbaru
        const files = await fetchFiles({ force: true });
        const record = files.find((item: any) => String(item.event_id) === String(eventId));
        if (!record) return;

        const urlValue = record?.[`${String(docKey)}_url`] || null;
        const pathValue = record?.[String(docKey)] || null;
        const resolved = urlValue || buildFileUrl(pathValue);
        if (resolved) {
          setCurrentFileUri(buildCacheBustedUrl(resolved));
        }

        // Load AI validation data
        if (record) {
          setAiValidation({
            ai_valid: getAiField(record, 'ai_valid'),
            ai_detected_type: getAiField(record, 'ai_detected_type'),
            ai_confidence: getAiField(record, 'ai_confidence'),
            ai_explanation: getAiField(record, 'ai_explanation'),
            ai_processed: getAiField(record, 'ai_processed') === true || getAiField(record, 'ai_processed') === 1,
          });
        }
      } catch (error) {
        console.error('Failed to refresh file detail:', error);
        // Jika fetch gagal, tetap gunakan URL dari params (jika ada)
        if (!currentFileUri) {
          const fallbackUrl = (fileUrl as string) || buildFileUrl(filePath as string) || null;
          if (fallbackUrl) setCurrentFileUri(buildCacheBustedUrl(fallbackUrl));
        }
      } finally {
        setIsLoadingFile(false);
      }
    };

    loadLatestFile();
  }, [eventId, docKey, refreshKey]);

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
        // Paksa refresh data dari API setelah upload
        const uploadedUrl = uploaded?.url || buildFileUrl(uploaded?.path);
        if (uploadedUrl) {
          setCurrentFileUri(buildCacheBustedUrl(uploadedUrl));
        }
        setRefreshKey((k) => k + 1);
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
    if (!previewUrl) {
      Alert.alert('Gagal', 'File tidak ditemukan.');
      return;
    }

    if (!PdfComponent) {
      await WebBrowser.openBrowserAsync(previewUrl);
      return;
    }

    // Force re-render PDF modal with fresh URL
    setShowPdfModal(true);
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
        {isLoadingFile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF8F29" />
            <Text style={styles.loadingText}>Memuat file...</Text>
          </View>
        ) : (
        <View style={styles.previewCard}>
          <View style={styles.cardHeader}><Text style={styles.cardHeaderText}>{title}</Text></View>
          <View style={styles.documentPlaceholder}>
            {previewUrl && PdfComponent ? (
              <View pointerEvents="none" style={styles.pdfPreviewWrapper}>
                <PdfComponent
                  source={{ uri: previewUrl, cache: false }}
                  style={styles.pdfPreview}
                  trustAllCerts={false}
                  page={1}
                  enablePaging={false}
                  fitPolicy={2}
                  scale={1.2}
                  minScale={1.2}
                  maxScale={1.2}
                  spacing={0}
                  onError={(error: unknown) => console.error('PDF preview error:', error)}
                />
              </View>
            ) : (
              <Ionicons name="document-text" size={80} color="rgba(255,255,255,0.2)" />
            )}
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
        )}

        {/* AI Validation Card */}
        {aiValidation && aiValidation.ai_processed && (
          <View style={[
            styles.aiValidationCard,
            aiValidation.ai_valid === true && styles.aiValidationSuccess,
            aiValidation.ai_valid === false && styles.aiValidationError,
            aiValidation.ai_valid === null && styles.aiValidationNeutral,
          ]}>
            <View style={styles.aiValidationHeader}>
              <Ionicons
                name={aiValidation.ai_valid === true ? 'checkmark-circle' : aiValidation.ai_valid === false ? 'alert-circle' : 'help-circle'}
                size={22}
                color={aiValidation.ai_valid === true ? '#2E7D32' : aiValidation.ai_valid === false ? '#D32F2F' : '#EA9B03'}
              />
              <Text style={[
                styles.aiValidationTitle,
                { color: aiValidation.ai_valid === true ? '#2E7D32' : aiValidation.ai_valid === false ? '#D32F2F' : '#EA9B03' }
              ]}>
                AI Validation {aiValidation.ai_valid === true ? '✓ Sesuai' : aiValidation.ai_valid === false ? '✗ Tidak Sesuai' : '? Belum Divalidasi'}
              </Text>
              {aiValidation.ai_confidence && (
                <View style={[
                  styles.confidenceBadge,
                  aiValidation.ai_confidence === 'tinggi' && styles.confidenceHigh,
                  aiValidation.ai_confidence === 'sedang' && styles.confidenceMedium,
                  aiValidation.ai_confidence === 'rendah' && styles.confidenceLow,
                ]}>
                  <Text style={styles.confidenceBadgeText}>
                    {aiValidation.ai_confidence === 'tinggi' ? 'Tinggi' : aiValidation.ai_confidence === 'sedang' ? 'Sedang' : 'Rendah'}
                  </Text>
                </View>
              )}
            </View>
            {aiValidation.ai_detected_type && (
              <Text style={styles.aiValidationType}>
                Terdeteksi: {aiValidation.ai_detected_type.replace(/_/g, ' ')}
              </Text>
            )}
            {aiValidation.ai_explanation && (
              <Text style={styles.aiValidationExplanation}>{aiValidation.ai_explanation}</Text>
            )}
            <TouchableOpacity
              style={styles.aiRevalidateBtn}
              onPress={async () => {
                if (!eventId || !docKey) return;
                try {
                  const result = await aiRevalidateFile(Number(eventId), String(docKey));
                  if (result?.ai_validation) {
                    setAiValidation({
                      ai_valid: result.ai_validation.is_valid,
                      ai_detected_type: result.ai_validation.type || result.ai_validation.detected_type,
                      ai_confidence: result.ai_validation.confidence,
                      ai_explanation: result.ai_validation.explanation,
                      ai_processed: result.ai_validation.ai_processed,
                    });
                  }
                  Alert.alert('Berhasil', 'Validasi AI berhasil diperbarui.');
                } catch (error) {
                  Alert.alert('Gagal', 'Gagal melakukan validasi ulang AI.');
                }
              }}
            >
              <Ionicons name="refresh" size={16} color="#FF8F29" />
              <Text style={styles.aiRevalidateText}>Validasi Ulang dengan AI</Text>
            </TouchableOpacity>
          </View>
        )}

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
        visible={showPdfModal}
        animationType="slide"
        onRequestClose={() => setShowPdfModal(false)}
      >
        <SafeAreaView style={styles.pdfModalContainer}>
          <View style={styles.pdfModalHeader}>
            <TouchableOpacity onPress={() => setShowPdfModal(false)} style={styles.pdfCloseButton}>
              <Ionicons name="close" size={24} color="#5C2C00" />
            </TouchableOpacity>
            <Text style={styles.pdfModalTitle} numberOfLines={1}>{title || 'Dokumen'}</Text>
          </View>
          {previewUrl && PdfComponent ? (
            <PdfComponent
              source={{ uri: previewUrl, cache: false }}
              style={styles.pdfModalViewer}
              trustAllCerts={false}
              enablePaging
              fitPolicy={0}
              scale={1}
              minScale={1}
              maxScale={4}
              spacing={0}
              enableAntialiasing
              enableAnnotationRendering
              onError={(error: unknown) => console.error('PDF modal error:', error)}
            />
          ) : (
            <View style={styles.pdfModalEmpty}>
              <Text style={styles.pdfModalEmptyText}>
                {previewUrl ? 'Preview PDF tidak tersedia di Expo Go.' : 'File tidak ditemukan.'}
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

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

  pdfPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4E2A00',
  },

  pdfPreviewWrapper: {
    width: '100%',
    height: '100%',
  },

  pdfModalContainer: {
    flex: 1,
    backgroundColor: '#FFFDF0',
  },

  pdfModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6D3B0',
    gap: 12,
  },

  pdfCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE2B8',
  },

  pdfModalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#5C2C00',
  },

  pdfModalViewer: {
    flex: 1,
    backgroundColor: '#FFFDF0',
  },

  pdfModalEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pdfModalEmptyText: {
    color: '#5C2C00',
    fontSize: 14,
  },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E6D3B0',
  },

  actionItem: {
    alignItems: 'center',
    gap: 5,
  },

  actionText: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#5C2C00',
    fontWeight: '600',
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

  aiValidationCard: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    elevation: 3,
  },

  aiValidationSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },

  aiValidationError: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF9A9A',
  },

  aiValidationNeutral: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
  },

  aiValidationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },

  aiValidationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },

  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  confidenceHigh: {
    backgroundColor: '#C8E6C9',
  },

  confidenceMedium: {
    backgroundColor: '#FFF9C4',
  },

  confidenceLow: {
    backgroundColor: '#FFCDD2',
  },

  confidenceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5C2C00',
  },

  aiValidationType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5C2C00',
    marginBottom: 4,
  },

  aiValidationExplanation: {
    fontSize: 12,
    color: '#5C2C00',
    lineHeight: 18,
    marginBottom: 8,
  },

  aiRevalidateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 143, 41, 0.1)',
    alignSelf: 'flex-start',
  },

  aiRevalidateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF8F29',
  },
});