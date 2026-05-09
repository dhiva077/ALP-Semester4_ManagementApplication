import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'MANAPP_EVENTS';

export default function NotifikasiDetail() {
  const router = useRouter();
  const { eventName, eventDate } = useLocalSearchParams();
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const title = typeof eventName === 'string' ? eventName : 'Detail Notifikasi';
  const date = typeof eventDate === 'string' ? eventDate : '';

  const loadEvent = async () => {
    try {
      const savedEvents = await AsyncStorage.getItem(STORAGE_KEY);
      const events = savedEvents ? JSON.parse(savedEvents) : {};
      const eventList = events[date] || [];
      const foundEvent = eventList.find((item: any) => item.title === title);
      setEventData(foundEvent || null);
    } catch (error) {
      setEventData(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEvent();
    }, [date, title])
  );

  const handleGoToChecklist = () => {
    router.push({
      pathname: '/(tabs)/checklist',
      params: { eventName: title, eventDate: date, source: 'notifikasi' },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* FIX: Tombol Back sekarang mengarah ke halaman Dashboard */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push('/(tabs)/dashboard')}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Notifikasi</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#FF8C2B" style={{ marginTop: 60 }} />
        ) : eventData ? (
          <View style={styles.card}>
            <Text style={styles.title}>{eventData.title}</Text>
            
            <Text style={styles.subtitle}>Tanggal Event</Text>
            <Text style={styles.detailText}>{date}</Text>
            
            <Text style={styles.subtitle}>Lokasi</Text>
            <Text style={styles.detailText}>{eventData.location}</Text>
            
            <Text style={styles.subtitle}>Waktu</Text>
            <Text style={styles.detailText}>{eventData.time}</Text>
            
            <Text style={styles.subtitle}>Pesan</Text>
            <Text style={styles.detailText}>{`Masih ada beberapa file yang belum lengkap. Segera cek checklist agar persiapan event berjalan lancar.`}</Text>

            <TouchableOpacity style={styles.actionButton} onPress={handleGoToChecklist} activeOpacity={0.8}>
              <Text style={styles.actionText}>Lanjut ke Checklist</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Data event tidak ditemukan.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF2DB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18 },
  backButton: { backgroundColor: '#FF8C2B', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#5D4037' },
  spacer: { width: 45 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { backgroundColor: '#FFFDF0', borderRadius: 20, padding: 24, elevation: 2, marginTop: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#5D4037', marginBottom: 18 },
  subtitle: { fontSize: 13, color: '#8D6E63', marginTop: 12, marginBottom: 4, textTransform: 'uppercase' },
  detailText: { fontSize: 16, color: '#5D4037', lineHeight: 24 },
  actionButton: { marginTop: 30, backgroundColor: '#FF8C2B', borderRadius: 14, justifyContent: 'center', alignItems: 'center', paddingVertical: 14 },
  actionText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  emptyState: { marginTop: 80, alignItems: 'center' },
  emptyText: { color: '#5D4037', textAlign: 'center' },
});