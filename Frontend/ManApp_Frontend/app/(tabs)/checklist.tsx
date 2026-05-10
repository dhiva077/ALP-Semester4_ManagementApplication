import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView, 
  ScrollView,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const BASE_CHECKLIST = [
  { id: 1, title: "From Checklist Sebelum Acara" },
  { id: 2, title: "Surat Perjanjian Kerjasama" },
  { id: 3, title: "Invoice" },
  { id: 4, title: "Lembar Disposisi" },
  { id: 5, title: "Surat Izin Loading" },
  { id: 6, title: "From Checklist Setelah Acara" },
];

const EVENT_STATUS_CONFIG: Record<string, string[]> = {
  "Meeting Koordinasi": ["belum", "belum", "belum", "belum", "belum", "belum"],
  "Wisuda Santri TK/TPA Barokah": ["selesai", "selesai", "selesai", "selesai", "selesai", "selesai"],
  "Pameran Buku by Gramedia": ["selesai", "revisi", "selesai", "belum", "selesai", "belum"],
  "Mayora Goes to Campus": ["selesai", "selesai", "revisi", "revisi", "belum", "belum"],
};

export default function Checklist() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { eventName, eventDate, source, updatedStatus, checklistId } = params;

  const [searchQuery, setSearchQuery] = useState('');
  const [checklistMap, setChecklistMap] = useState<Record<string, string[]>>({});

  const currentEventName = typeof eventName === 'string' ? eventName : "Detail Event";
  const sourceFrom = typeof source === 'string' ? source : 'dashboard';
  const CHECKLIST_KEY = 'CHECKLIST_DATA';

  const loadChecklist = async () => {
    try {
      const saved = await AsyncStorage.getItem(CHECKLIST_KEY);
      const data = saved ? JSON.parse(saved) : {};
      setChecklistMap(data);
    } catch (error) {
      setChecklistMap({});
    }
  };

  useEffect(() => {
    if (updatedStatus && checklistId) {
      const updateStatusPermanently = async () => {
        try {
          const saved = await AsyncStorage.getItem(CHECKLIST_KEY);
          let data = saved ? JSON.parse(saved) : {};
          
          let currentStatuses = data[currentEventName] || 
            EVENT_STATUS_CONFIG[currentEventName] || 
            ["belum", "belum", "belum", "belum", "belum", "belum"];

          const idx = parseInt(checklistId as string) - 1;
          
          let newStatus = "belum";
          if (updatedStatus === 'green') newStatus = "selesai";
          if (updatedStatus === 'yellow') newStatus = "revisi";
          if (updatedStatus === 'red') newStatus = "belum";

          currentStatuses[idx] = newStatus;
          data[currentEventName] = [...currentStatuses];

          await AsyncStorage.setItem(CHECKLIST_KEY, JSON.stringify(data));
          setChecklistMap({...data});

          router.setParams({ updatedStatus: undefined, checklistId: undefined });
        } catch (e) {
          console.error("Sync Error:", e);
        }
      };
      updateStatusPermanently();
    }
  }, [updatedStatus, checklistId]);

  useFocusEffect(
    useCallback(() => {
      loadChecklist();
    }, [])
  );

  const statusArray =
    checklistMap[currentEventName] ||
    EVENT_STATUS_CONFIG[currentEventName] ||
    ["belum", "belum", "belum", "belum", "belum", "belum"];

  const filteredChecklist = BASE_CHECKLIST.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selesai': return '#606C38';
      case 'revisi': return '#EA9B03';
      case 'belum': return '#FF383C';
      default: return '#CCC';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (sourceFrom === 'penyimpanan') router.push('/(tabs)/penyimpanan');
              else if (sourceFrom === 'notifikasi') {
                router.push({ pathname: '/(tabs)/notifikasi-detail', params: { eventName: currentEventName, eventDate } });
              } else router.push('/(tabs)/dashboard');
            }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{currentEventName}</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#5C2C00" />
            <TextInput
              placeholder="Search Dokumen"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push({ pathname: '/(tabs)/edit-event', params: { eventName: currentEventName, eventDate, source: 'checklist' } })}>
            <MaterialCommunityIcons name="pencil" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.orangeBanner}>
          <Text style={styles.bannerText}>{currentEventName}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* LOGIKA PENGECEKAN DATA KOSONG */}
        {filteredChecklist.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-search-outline" size={80} color="#D2B48C" />
            <Text style={styles.emptyText}>
              "<Text style={{ fontWeight: 'bold' }}>{searchQuery}</Text>" tidak ditemukan
            </Text>
          </View>
        ) : (
          filteredChecklist.map((item) => {
            const originalIndex = BASE_CHECKLIST.findIndex(baseItem => baseItem.id === item.id);
            const currentStatus = statusArray[originalIndex];

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.checklistCard}
                onPress={() => {
                  const path = currentStatus === 'belum' ? '/(tabs)/input-file' : '/(tabs)/file-detail';
                  router.push({
                    pathname: path,
                    params: {
                      title: item.title,
                      eventName: currentEventName,
                      eventDate: eventDate,
                      checklistId: item.id,
                      source: sourceFrom
                    }
                  });
                }}
              >
                <Text style={styles.checklistTitle}>{item.title}</Text>
                <View style={[styles.statusCircle, { backgroundColor: getStatusColor(currentStatus) }]} />
              </TouchableOpacity>
            );
          })
        )}

        {/* LEGEND hanya tampil jika ada data atau search box kosong */}
        {filteredChecklist.length > 0 && (
          <View style={styles.legendContainer}>
            <Text style={styles.legendHeader}>Keterangan:</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.miniDot, { backgroundColor: '#FF383C' }]} /><Text style={styles.legendText}>Belum ada file</Text></View>
              <View style={styles.legendItem}><View style={[styles.miniDot, { backgroundColor: '#EA9B03' }]} /><Text style={styles.legendText}>Revisi</Text></View>
              <View style={styles.legendItem}><View style={[styles.miniDot, { backgroundColor: '#606C38' }]} /><Text style={styles.legendText}>Selesai</Text></View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF2DB' },
  fixedHeader: { paddingHorizontal: 25, backgroundColor: '#FEF2DB' },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 35, justifyContent: 'center' },
  backButton: { backgroundColor: '#FF8F29', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4, position: 'absolute', left: 0 },
  titleContainer: { maxWidth: '70%' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#5C2C00', textAlign: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 15, height: 45, borderWidth: 1, borderColor: '#fff' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#5C2C00' },
  editButton: { backgroundColor: '#5C2C00', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  orangeBanner: { backgroundColor: '#FF8F29', paddingVertical: 16, borderRadius: 15, marginBottom: 10, elevation: 3 },
  bannerText: { color: '#FFFDF0', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  scrollContent: { paddingHorizontal: 25, paddingTop: 10, paddingBottom: 40 },
  checklistCard: { backgroundColor: '#FFFDF0', borderRadius: 18, paddingVertical: 18, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, elevation: 2 },
  checklistTitle: { fontSize: 15, fontWeight: 'bold', color: '#5C2C00', flex: 1 },
  statusCircle: { width: 20, height: 20, borderRadius: 10 },
  legendContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 15, marginTop: 10, elevation: 3, alignItems: 'center' },
  legendHeader: { fontSize: 12, fontWeight: 'bold', color: '#5C2C00', marginBottom: 8, alignSelf: 'flex-start' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniDot: { width: 13, height: 13, borderRadius: 10 },
  legendText: { fontSize: 13, fontWeight: '600', color: '#5C2C00' },
  // STYLE TAMBAHAN UNTUK EMPTY STATE
  emptyContainer: { alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
  emptyText: { marginTop: 15, fontSize: 16, color: '#5C2C00', textAlign: 'center' },
});