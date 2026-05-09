import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface EventItem { id: number; title: string; location: string; time: string; color: string; date: string; }

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const YEARS = Array.from({ length: 21 }, (_, i) => 2020 + i);

export default function Penyimpanan() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [checklistMap, setChecklistMap] = useState<Record<string, any>>({});
  
  // State untuk kalender aktif
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // State untuk modal picker (temp)
  const [showPicker, setShowPicker] = useState(false);
  const [tempMonth, setTempMonth] = useState(currentMonth);
  const [tempYear, setTempYear] = useState(currentYear);

  const STORAGE_KEY = 'MANAPP_EVENTS';
  const CHECKLIST_KEY = 'CHECKLIST_DATA';

  const getStatusColor = (statusArray: string[]) => {
    if (!statusArray || statusArray.length === 0) return "#FF4444";
    const allSelesai = statusArray.every(status => status === 'selesai');
    const hasRevisi = statusArray.some(status => status === 'revisi');
    const hasSelesai = statusArray.some(status => status === 'selesai');
    const hasBelum = statusArray.some(status => status === 'belum');
    if (allSelesai) return "#4CAF50";
    if (hasRevisi || (hasSelesai && hasBelum)) return "#FFD700";
    return "#FF4444";
  };

  const loadData = async () => {
    try {
      const savedEvents = await AsyncStorage.getItem(STORAGE_KEY);
      const savedChecklists = await AsyncStorage.getItem(CHECKLIST_KEY);
      let checklistData = savedChecklists ? JSON.parse(savedChecklists) : {};
      setChecklistMap(checklistData);

      let allEvents: EventItem[] = [];
      if (savedEvents) {
        const stored: Record<string, EventItem[]> = JSON.parse(savedEvents);
        Object.entries(stored).forEach(([date, items]) => {
          items.forEach(item => { 
            const statusArray = checklistData[item.title] || ["belum", "belum", "belum", "belum", "belum", "belum"];
            const color = getStatusColor(statusArray);
            allEvents.push({ ...item, date, color }); 
          });
        });
      }

      const filtered = allEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
      });
      setEvents(filtered);
    } catch (error) {
      setEvents([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [currentMonth, currentYear])
  );

  const changeMonth = (offset: number) => {
    let newMonth = currentMonth + offset;
    let newYear = currentYear;
    if (newMonth < 0) { newMonth = 11; newYear -= 1; }
    else if (newMonth > 11) { newMonth = 0; newYear += 1; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fixedSection}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Penyimpanan</Text>
        </View>

        {/* SEARCH */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#5C2C00" />
            <TextInput 
              placeholder="Search Dokumen" 
              style={styles.searchInput} 
              placeholderTextColor="rgba(92, 44, 0, 0.5)"
            />
          </View>
        </View>

        {/* MONTH PICKER (Samakan dengan Dashboard) */}
        <View style={styles.monthPicker}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navArrow}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {
              setTempMonth(currentMonth);
              setTempYear(currentYear);
              setShowPicker(true);
            }} 
            style={styles.monthTextContainer}
          >
            <Text style={styles.monthText}>{MONTHS[currentMonth]} {currentYear}</Text>
            <Ionicons name="caret-down" size={14} color="#FFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navArrow}>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* SCROLLABLE CARDS */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {events.length > 0 ? (
          events.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.eventCard}
              onPress={() => router.push({
                pathname: '/checklist',
                params: { eventName: item.title, eventDate: item.date, source: 'penyimpanan' }
              })} 
              activeOpacity={0.7}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventSubText}>{item.location}</Text>
                <Text style={styles.eventSubText}>
                  Tanggal {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
                <Text style={styles.eventSubText}>Pukul {item.time}</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: item.color }]} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada data di bulan ini</Text>
          </View>
        )}
      </ScrollView>

      {/* PICKER MODAL (Sama persis dengan Dashboard) */}
      <Modal visible={showPicker} transparent animationType="fade">
        <View style={pickerStyles.overlay}>
          <View style={pickerStyles.modal}>
            <Text style={pickerStyles.modalTitle}>Pilih Periode</Text>
            <View style={pickerStyles.listsContainer}>
              {/* Kolom Bulan */}
              <ScrollView style={pickerStyles.scrollCol}>
                {MONTHS.map((m, i) => (
                  <TouchableOpacity 
                    key={m} 
                    style={[pickerStyles.item, tempMonth === i && pickerStyles.activeItem]} 
                    onPress={() => setTempMonth(i)}
                  >
                    <Text style={[pickerStyles.itemText, tempMonth === i && pickerStyles.activeText]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {/* Kolom Tahun */}
              <ScrollView style={pickerStyles.scrollCol}>
                {YEARS.map((y) => (
                  <TouchableOpacity 
                    key={y} 
                    style={[pickerStyles.item, tempYear === y && pickerStyles.activeItem]} 
                    onPress={() => setTempYear(y)}
                  >
                    <Text style={[pickerStyles.itemText, tempYear === y && pickerStyles.activeText]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={pickerStyles.buttonRow}>
              <TouchableOpacity style={pickerStyles.cancelBtn} onPress={() => setShowPicker(false)}>
                <Text style={{color: '#5C2C00'}}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={pickerStyles.confirmBtn} 
                onPress={() => { 
                  setCurrentMonth(tempMonth); 
                  setCurrentYear(tempYear); 
                  setShowPicker(false); 
                }}
              >
                <Text style={{color: '#fff', fontWeight: 'bold'}}>Oke</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF2DB' },
  fixedSection: { paddingHorizontal: 25, backgroundColor: '#FEF2DB', paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  backButton: { backgroundColor: '#FF8F29', width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: '#5C2C00', marginRight: 45 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 15, height: 45, borderWidth: 1, borderColor: '#fff' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#5C2C00' },
  monthPicker: { backgroundColor: '#FF8F29', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 15, marginBottom: 10 },
  monthTextContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  monthText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  navArrow: { padding: 5 },
  scrollContent: { paddingHorizontal: 25, paddingTop: 10, paddingBottom: 40 },
  eventCard: { backgroundColor: '#FFFDF0', borderRadius: 20, padding: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  cardInfo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  eventTitle: { fontSize: 16, fontWeight: 'bold', color: '#5C2C00', textAlign: 'center', marginBottom: 6 },
  eventSubText: { fontSize: 13, color: '#5C2C00', textAlign: 'center', lineHeight: 18, opacity: 0.8 },
  statusDot: { width: 18, height: 18, borderRadius: 9, marginLeft: 10 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#5C2C00', opacity: 0.5, fontSize: 16 },
});

// Styles untuk Picker Modal (Sama dengan Dashboard)
const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '80%', height: 400, backgroundColor: '#fff', borderRadius: 25, padding: 20 },
  modalTitle: { fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#5C2C00', fontSize: 18 },
  listsContainer: { flex: 1, flexDirection: 'row', gap: 10 },
  scrollCol: { flex: 1, backgroundColor: '#F8F8F8', borderRadius: 10 },
  item: { padding: 12, alignItems: 'center' },
  activeItem: { backgroundColor: '#FF8F29', borderRadius: 8 },
  itemText: { color: '#5C2C00', fontSize: 14 },
  activeText: { color: '#fff', fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', marginTop: 15, gap: 10 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center' },
  confirmBtn: { flex: 1, backgroundColor: '#5C2C00', padding: 12, borderRadius: 10, alignItems: 'center' },
});