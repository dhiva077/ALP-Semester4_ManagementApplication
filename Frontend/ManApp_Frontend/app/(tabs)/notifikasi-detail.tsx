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
import { fetchEvents } from '../../src/services/eventService';

export default function NotifikasiDetail() {
  const router = useRouter();
  const { eventName, eventDate, eventId } = useLocalSearchParams();
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const title = typeof eventName === 'string' ? eventName : 'Detail Notifikasi';
  const date = typeof eventDate === 'string' ? eventDate : '';

  const loadEvent = async () => {
    try {
      const allEvents = await fetchEvents();
      const foundEvent = allEvents.find((item: any) => item.name === title && item.start_time === date);
      setEventData(foundEvent || null);
    } catch (error) {
      console.error("error fetching event:", error);
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
      params: {
        eventName: title,
        eventDate: date,
        eventId: eventData?.id || eventId,
        source: 'notifikasi',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push('/(tabs)/notifikasi')}
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
            <Text style={styles.title}>{eventData.name}</Text>
            
            <Text style={styles.subtitle}>Tanggal Event</Text>
            <Text style={styles.detailText}>{date}</Text>
            
            <Text style={styles.subtitle}>Lokasi</Text>
            <Text style={styles.detailText}>{eventData.location}</Text>
            
            {eventData.time && (
              <>
                <Text style={styles.subtitle}>Waktu</Text>
                <Text style={styles.detailText}>{eventData.time}</Text>
              </>
            )}
            
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
  container: {
    flex: 1,
    backgroundColor: '#FEF2DB',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FF8C2B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5D4037',
  },

  spacer: {
    width: 45,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  card: {
    marginTop: 20,
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#FFFDF0',
    elevation: 2,
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5D4037',
    marginBottom: 18,
  },

  subtitle: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 13,
    color: '#8D6E63',
    textTransform: 'uppercase',
  },

  detailText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5D4037',
  },

  actionButton: {
    marginTop: 30,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FF8C2B',
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },

  emptyState: {
    marginTop: 80,
    alignItems: 'center',
  },

  emptyText: {
    color: '#5D4037',
    textAlign: 'center',
  },
});