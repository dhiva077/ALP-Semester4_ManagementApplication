import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchEvents } from '../../src/services/eventService';
import { fetchFiles } from '../../src/services/fileApi';

interface EventItem { id: number; title: string; location: string; time: string; color: string; date: string; pic?: string; }

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const YEARS = Array.from({ length: 21 }, (_, i) => 2020 + i);

export default function Penyimpanan() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [showPicker, setShowPicker] = useState(false);
  const [tempMonth, setTempMonth] = useState(currentMonth);
  const [tempYear, setTempYear] = useState(currentYear);

  const getEventDate = (event: any) => {
    const start = event?.start_time || '';
    return start.includes('T') ? start.split('T')[0] : start.split(' ')[0];
  };

  const parseEventTime = (value?: string) => {
    if (!value) return null;
    const isoLike = value.includes('T') ? value : value.replace(' ', 'T');
    const parsed = new Date(isoLike);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getEventTime = (event: any) => {
    const startDate = parseEventTime(event?.start_time);
    const endDate = parseEventTime(event?.end_time);
    const startTime = startDate ? formatTime(startDate) : '';
    const endTime = endDate ? formatTime(endDate) : '';
    if (startTime && endTime) return `${startTime} - ${endTime}`;
    return startTime || endTime || '';
  };

  const toSnake = (value: string) => value.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

  const getStatusColor = (file: any) => {
    const statusKeys = [
      'statusFormChecklistSebelumAcara',
      'statusSuratPerjanjianKerjasama',
      'statusInvoice',
      'statusLembarDisposisi',
      'statusSuratIzinLoading',
      'statusFormChecklistSetelahAcara',
    ];
    const docKeys = [
      'form_checklist_sebelum_acara',
      'surat_perjanjian_kerjasama',
      'invoice',
      'lembar_disposisi',
      'surat_izin_loading',
      'form_checklist_setelah_acara',
    ];

    if (!file) return "#FF383C";

    const statusCodes = statusKeys.map((key, index) => {
      const hasFile = !!file?.[docKeys[index]];
      if (!hasFile) return 'B';
      const resolved = file?.[key] ?? file?.[toSnake(key)];
      if (resolved?.code) return resolved.code;
      return 'S';
    });

    const allSelesai = statusCodes.every(code => code === 'S');
    const allBelum = statusCodes.every(code => code === 'B');
    const anyRevisi = statusCodes.some(code => code === 'R');

    if (allBelum) return "#FF383C";
    if (allSelesai) return "#606C38";
    if (anyRevisi) return "#EA9B03";
    return "#EA9B03";
  };

  const loadData = async () => {
    try {
      const [eventsData, filesData] = await Promise.all([fetchEvents(), fetchFiles()]);

      const allEvents: EventItem[] = eventsData.map((event: any) => {
        const date = getEventDate(event);
        const time = getEventTime(event);
        const file = filesData.find((item: any) => String(item.event_id) === String(event.id));
        const color = getStatusColor(file);

        return {
          id: event.id,
          title: event.name,
          location: event.location,
          time,
          date,
          color,
          pic: event?.user?.name,
        };
      });

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
          <TouchableOpacity onPress={() => router.replace('/(tabs)/dashboard')} style={styles.backButton}>
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
                params: { eventName: item.title, eventDate: item.date, eventId: item.id, source: 'penyimpanan' }
              })}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventSubText}>PIC: {item.pic || '-'}</Text>
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
                  {'"'}<Text style={{ fontWeight: 'bold' }}>{searchQuery}</Text>{'"'} tidak ditemukan
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