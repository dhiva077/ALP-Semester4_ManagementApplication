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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface EventItem { id: number; title: string; location: string; time: string; color: string; date: string; }

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const YEARS = Array.from({ length: 21 }, (_, i) => 2020 + i);

const EVENT_STATUS_CONFIG: Record<string, string[]> = {
  "Meeting Koordinasi": ["belum", "belum", "belum", "belum", "belum", "belum"],
  "Wisuda Santri TK/TPA Barokah": ["selesai", "selesai", "selesai", "selesai", "selesai", "selesai"],
  "Pameran Buku by Gramedia": ["selesai", "revisi", "selesai", "belum", "selesai", "belum"],
  "Mayora Goes to Campus": ["selesai", "selesai", "revisi", "revisi", "belum", "belum"],
};

export default function Penyimpanan() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [showPicker, setShowPicker] = useState(false);
  const [tempMonth, setTempMonth] = useState(currentMonth);
  const [tempYear, setTempYear] = useState(currentYear);

  const STORAGE_KEY = 'MANAPP_EVENTS';
  const CHECKLIST_KEY = 'CHECKLIST_DATA';

  const getStatusColor = (statusArray: string[]) => {
    if (!statusArray || statusArray.length === 0) return "#FF383C";
    const allSelesai = statusArray.every(s => s === 'selesai');
    const hasRevisi = statusArray.some(s => s === 'revisi');
    const hasSelesai = statusArray.some(s => s === 'selesai');
    const hasBelum = statusArray.some(s => s === 'belum');
    if (allSelesai) return "#606C38";
    if (hasRevisi || (hasSelesai && hasBelum)) return "#EA9B03";
    return "#FF383C";
  };

  const loadData = async () => {
    try {
      const savedEvents = await AsyncStorage.getItem(STORAGE_KEY);
      const savedChecklists = await AsyncStorage.getItem(CHECKLIST_KEY);
      let checklistData = savedChecklists ? JSON.parse(savedChecklists) : {};

      let allEvents: EventItem[] = [];
      if (savedEvents) {
        const stored: Record<string, EventItem[]> = JSON.parse(savedEvents);
        Object.entries(stored).forEach(([date, items]) => {
          items.forEach(item => { 
            const statusArray = checklistData[item.title] || EVENT_STATUS_CONFIG[item.title] || ["belum"];
            const color = getStatusColor(statusArray);
            allEvents.push({ ...item, date, color }); 
          });
        });
      }
      setEvents(allEvents);
    } catch (error) {
      console.error(error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const filteredEvents = events.filter(event => {
    if (searchQuery.trim() !== '') {
      return event.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    const eventDate = new Date(event.date);
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
  });

  const changeMonth = (offset: number) => {
    let newMonth = currentMonth + offset;
    let newYear = currentYear;
    if (newMonth < 0) { newMonth = 11; newYear -= 1; }
    else if (newMonth > 11) { newMonth = 0; newYear += 1; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fixedSection}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Penyimpanan</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#5C2C00" />
            <TextInput 
              placeholder="Search Dokumen" 
              style={styles.searchInput} 
              placeholderTextColor="rgba(92, 44, 0, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#5C2C00" opacity={0.5} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.monthPicker}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navArrow}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.monthTextContainer}>
            <Text style={styles.monthText}>{MONTHS[currentMonth]} {currentYear}</Text>
            <Ionicons name="caret-down" size={14} color="#FFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navArrow}>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredEvents.length > 0 ? (
          filteredEvents.map((item) => (
            <TouchableOpacity 
              key={`${item.date}-${item.id}`} 
              style={styles.eventCard}
              onPress={() => router.push({
                pathname: '/checklist',
                params: { eventName: item.title, eventDate: item.date, source: 'penyimpanan' }
              })}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventSubText}>{item.location}</Text>
                <Text style={styles.eventSubText}>
                  {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
                <Text style={styles.eventSubText}>Pukul {item.time}</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: item.color }]} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            {/* IKON DINAMIS SESUAI SEARCH */}
            <MaterialCommunityIcons 
              name={searchQuery ? "calendar-search" : "calendar-blank-outline"} 
              size={80} 
              color="#D2B48C" 
            />
            <Text style={styles.emptyText}>
              {searchQuery ? (
                <Text>
                  "<Text style={{ fontWeight: 'bold' }}>{searchQuery}</Text>" tidak ditemukan
                </Text>
              ) : (
                "Tidak ada data di periode ini"
              )}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showPicker} transparent animationType="fade">
        <View style={pickerStyles.overlay}>
          <View style={pickerStyles.modal}>
            <Text style={pickerStyles.modalTitle}>Pilih Periode</Text>
            <View style={pickerStyles.listsContainer}>
              <ScrollView style={pickerStyles.scrollCol} showsVerticalScrollIndicator={false}>
                {MONTHS.map((m, i) => (
                  <TouchableOpacity key={m} style={[pickerStyles.item, tempMonth === i && pickerStyles.activeItem]} onPress={() => setTempMonth(i)}>
                    <Text style={[pickerStyles.itemText, tempMonth === i && pickerStyles.activeText]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={pickerStyles.scrollCol} showsVerticalScrollIndicator={false}>
                {YEARS.map((y) => (
                  <TouchableOpacity key={y} style={[pickerStyles.item, tempYear === y && pickerStyles.activeItem]} onPress={() => setTempYear(y)}>
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
                onPress={() => { setCurrentMonth(tempMonth); setCurrentYear(tempYear); setShowPicker(false); setSearchQuery(''); }}
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
  container: {
    flex: 1,
    backgroundColor: '#FEF2DB',
  },

  fixedSection: {
    paddingHorizontal: 25,
    backgroundColor: '#FEF2DB',
    paddingBottom: 5,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },

  backButton: {
    backgroundColor: '#FF8F29',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5C2C00',
    marginRight: 45,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 45,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#5C2C00',
  },

  monthPicker: {
    backgroundColor: '#FF8F29',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 15,
  },

  monthTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  monthText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  navArrow: {
    padding: 5,
  },

  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 30,
  },

  eventCard: {
    backgroundColor: '#FFFDF0',
    borderRadius: 25,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },

  cardInfo: {
    flex: 1,
    alignItems: 'center',
    marginLeft: 28,
  },

  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5C2C00',
    textAlign: 'center',
    marginBottom: 6,
  },

  eventSubText: {
    fontSize: 13,
    color: '#5C2C00',
    textAlign: 'center',
    opacity: 0.8,
  },

  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 10,
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },

  emptyText: {
    color: '#5C2C00',
    opacity: 0.6,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
  },
});

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modal: {
    width: '85%',
    height: 420,
    backgroundColor: '#FFFDF0',
    borderRadius: 25,
    padding: 20,
  },

  modalTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#5C2C00',
    fontSize: 18,
  },

  listsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },

  scrollCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 15,
  },

  item: {
    padding: 15,
    alignItems: 'center',
  },

  activeItem: {
    backgroundColor: '#FF8F29',
    borderRadius: 10,
  },

  itemText: {
    color: '#5C2C00',
    fontSize: 14,
  },

  activeText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },

  cancelBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5C2C00',
  },

  confirmBtn: {
    flex: 1,
    backgroundColor: '#5C2C00',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});