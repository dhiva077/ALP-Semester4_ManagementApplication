import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function FileDetail() {
  const router = useRouter();
  // Tangkap parameter lengkap
  const { title, eventName, eventDate, source } = useLocalSearchParams();

  const handleBack = () => {
    // Kembali ke Checklist dengan membawa parameter asal (source)
    // Jika source-nya 'penyimpanan', tab bar akan tetap fokus di sana
    router.replace({
      pathname: '/(tabs)/checklist',
      params: { 
        eventName: eventName, 
        eventDate: eventDate,
        source: source // Kirimkan kembali source agar Checklist tahu harus kemana saat di-back
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Detail Dokumen'}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.previewCard}>
          <View style={styles.cardHeader}>
             <Text style={styles.cardHeaderText}>{title}</Text>
          </View>
          
          <View style={styles.documentPlaceholder} />

          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionItem}>
              <MaterialCommunityIcons name="swap-horizontal" size={20} color="#EA9B03" />
              <Text style={[styles.actionText, { color: '#EA9B03' }]}>Ganti File</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="trash-outline" size={20} color="#FF383C" />
              <Text style={[styles.actionText, { color: '#FF383C' }]}>Hapus File</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="eye-outline" size={20} color="#5C2C00" />
              <Text style={[styles.actionText, { color: '#5C2C00' }]}>Lihat File</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.decisionRow}>
          <TouchableOpacity style={[styles.btnDecision, styles.btnRevisi]}>
            <Ionicons name="alert-circle" size={20} color="#FFF" />
            <Text style={styles.btnDecisionText}>Revisi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btnDecision, styles.btnSelesai]}>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={styles.btnDecisionText}>Selesai</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF5E6' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 40 },
  backButton: { backgroundColor: '#FF9800', width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  headerTitle: { marginLeft: 15, fontSize: 20, fontWeight: 'bold', color: '#5C2C00', flex: 1 },
  content: { paddingHorizontal: 25, alignItems: 'center' },
  previewCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 15, overflow: 'hidden', elevation: 5, marginBottom: 30 },
  cardHeader: { backgroundColor: '#5C2C00', paddingVertical: 12, alignItems: 'center' },
  cardHeaderText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  documentPlaceholder: { height: 180, backgroundColor: '#4E2A00', width: '100%' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, backgroundColor: '#FFF' },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 12, fontWeight: 'bold' },
  decisionRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15 },
  btnDecision: { flex: 1, flexDirection: 'row', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 3 },
  btnRevisi: { backgroundColor: '#EA9B03' },
  btnSelesai: { backgroundColor: '#606C38' },
  btnDecisionText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});