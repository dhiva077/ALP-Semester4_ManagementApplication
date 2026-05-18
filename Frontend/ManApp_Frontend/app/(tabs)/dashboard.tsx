import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchEvents } from '../../src/services/eventService';
import { fetchFiles } from '../../src/services/fileApi';

// --- DATA PEMBANTU ---
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const YEARS = Array.from({ length: 21 }, (_, i) => 2020 + i);

interface EventItem {
  id: number;
  title: string;
  location: string;
  time: string;
  color: string;
  date: string;
  pic?: string;
}

interface EventData { [key: string]: EventItem[]; }

export default function Dashboard() {
  const router = useRouter();
  
  const getTodayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [events, setEvents] = useState<EventData>({});
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [tempMonth, setTempMonth] = useState(currentDate.getMonth());
  const [tempYear, setTempYear] = useState(currentDate.getFullYear());

  const PROFILE_IMAGE_KEY = 'USER_PROFILE_IMAGE'; 
  const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/bottts/png?seed=Ginger&backgroundColor=fef2db';
  const todayStr = getTodayStr();

  const getEventDate = (event: any) => {
    const start = event?.start_time || '';
    return start.includes('T') ? start.split('T')[0] : start.split(' ')[0];
  };

  const getEventTime = (event: any) => {
    const start = event?.start_time || '';
    const end = event?.end_time || '';
    const startTime = start.includes('T') ? start.split('T')[1]?.slice(0, 5) : start.split(' ')[1]?.slice(0, 5);
    const endTime = end.includes('T') ? end.split('T')[1]?.slice(0, 5) : end.split(' ')[1]?.slice(0, 5);
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

    const statusCodes = statusKeys.map((key, index) => {
      const resolved = file?.[key] ?? file?.[toSnake(key)];
      if (resolved?.code) return resolved.code;
      if (file?.[docKeys[index]]) return 'S';
      return 'B';
    });

    const allSelesai = statusCodes.every(code => code === 'S');
    const allBelum = statusCodes.every(code => code === 'B');

    if (allSelesai) return "#606C38";
    if (allBelum) return "#FF383C";
    return "#EA9B03";
  };

  // --- REFRESH DATA SAAT HALAMAN DIFOKUSKAN ---
  useFocusEffect(
    useCallback(() => {
      loadProfileData();
      loadEvents();
    }, []) 
  );

  const loadProfileData = async () => {
    try {
      const savedImage = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
      const savedUser = await AsyncStorage.getItem('user');
      setProfileImage(savedImage || DEFAULT_AVATAR);
      setCurrentUser(savedUser ? JSON.parse(savedUser) : null);
    } catch (e) {
      console.error(e);
      setProfileImage(DEFAULT_AVATAR);
      setCurrentUser(null);
    }
  };

  const loadEvents = async () => {
    try {
      const [eventsData, filesData] = await Promise.all([fetchEvents(), fetchFiles()]);
      const mergedEvents: EventData = {};

      eventsData.forEach((event: any) => {
        const date = getEventDate(event);
        const time = getEventTime(event);
        const file = filesData.find((item: any) => String(item.event_id) === String(event.id));
        const color = getStatusColor(file);

        const item: EventItem = {
          id: event.id,
          title: event.name,
          location: event.location,
          time,
          date,
          color,
          pic: event?.user?.name,
        };

        mergedEvents[date] = [...(mergedEvents[date] || []), item];
      });

      setEvents(mergedEvents);
    } catch (error) {
      setEvents({});
    }
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
  };
  
  const handleConfirmPicker = () => {
    setCurrentDate(new Date(tempYear, tempMonth, 1));
    setShowPicker(false);
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const shiftFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    let days = [];
    for (let i = 0; i < shiftFirstDay; i++) days.push(<View key={`empty-${i}`} style={calendarStyles.dateCell} />);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const isRealToday = dateStr === todayStr;
      const isBooked = !!events[dateStr];

      days.push(
        <TouchableOpacity key={d} style={calendarStyles.dateCell} onPress={() => setSelectedDate(dateStr)}>
          <Text style={[calendarStyles.dateText, isSelected && calendarStyles.selectedText]}>{String(d).padStart(2, '0')}</Text>
          {isRealToday && <View style={calendarStyles.orangeIndicator} />}
          {isBooked && !isRealToday && <View style={calendarStyles.bookedIndicator} />}
        </TouchableOpacity>
      );
    }
    return days;
  };

  return (
    <SafeAreaView style={mainStyles.container}>
      {/* HEADER */}
      <View style={headerStyles.container}>
        <View style={headerStyles.profile}>
          <TouchableOpacity style={headerStyles.avatar} onPress={() => router.push('/profile')}>
            <Image 
              source={{ uri: profileImage || DEFAULT_AVATAR }} 
              style={headerStyles.avatarImg} 
            />
          </TouchableOpacity>
          <View>
            <Text style={headerStyles.greeting}>Hello,</Text>
            <Text style={headerStyles.name}>{currentUser?.name ?? 'Guest'}</Text>
          </View>
        </View>
        <TouchableOpacity style={headerStyles.notificationBtn} onPress={() => router.push('/notifikasi')}>
          <Ionicons name="notifications" size={24} color="#fff" />
          <View style={headerStyles.notifBadge} />
        </TouchableOpacity>
      </View>

      {/* CALENDAR */}
      <View style={calendarStyles.card}>
        <View style={calendarStyles.header}>
          <TouchableOpacity onPress={() => changeMonth(-1)}><Ionicons name="chevron-back" size={20} color="#fff" /></TouchableOpacity>
          <TouchableOpacity style={calendarStyles.titleBtn} onPress={() => setShowPicker(true)}>
            <Text style={calendarStyles.title}>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</Text>
            <Ionicons name="caret-down" size={14} color="#fff" style={{marginLeft: 5}} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeMonth(1)}><Ionicons name="chevron-forward" size={20} color="#fff" /></TouchableOpacity>
        </View>
        <View style={calendarStyles.body}>
          <View style={calendarStyles.weekRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => <Text key={i} style={calendarStyles.dayLabel}>{day}</Text>)}
          </View>
          <View style={calendarStyles.dateGrid}>{renderCalendar()}</View>
        </View>
      </View>

      {/* PICKER MODAL */}
      <Modal visible={showPicker} transparent animationType="fade">
        <View style={pickerStyles.overlay}>
          <View style={pickerStyles.modal}>
            <Text style={pickerStyles.modalTitle}>Pilih Bulan & Tahun</Text>
            <View style={pickerStyles.listsContainer}>
              <ScrollView style={pickerStyles.scrollCol} showsVerticalScrollIndicator={false}>
                {MONTHS.map((m, idx) => (
                  <TouchableOpacity key={m} style={[pickerStyles.item, tempMonth === idx && pickerStyles.activeItem]} onPress={() => setTempMonth(idx)}>
                    <Text style={[pickerStyles.itemText, tempMonth === idx && pickerStyles.activeText]}>{m}</Text>
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
              <TouchableOpacity style={pickerStyles.cancelBtn} onPress={() => setShowPicker(false)}><Text style={pickerStyles.cancelBtnText}>Batal</Text></TouchableOpacity>
              <TouchableOpacity style={pickerStyles.confirmBtn} onPress={handleConfirmPicker}><Text style={pickerStyles.confirmBtnText}>Oke</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* LEGEND */}
      <View style={legendStyles.pill}>
        <Text style={legendStyles.title}>Keterangan:</Text>
        <View style={legendStyles.item}><View style={[legendStyles.line, { backgroundColor: '#FF8C00' }]} /><Text style={legendStyles.label}>Hari ini</Text></View>
        <View style={legendStyles.item}><View style={[legendStyles.line, { backgroundColor: '#5C2C00' }]} /><Text style={legendStyles.label}>Terbooking</Text></View>
      </View>
      <View style={mainStyles.divider} />
      
      {/* EVENT LIST */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={mainStyles.listContent}>
        {events[selectedDate] ? events[selectedDate].map((event) => (
          <TouchableOpacity 
            key={`${selectedDate}-${event.id}`} 
            style={eventStyles.card} 
            onPress={() => {
              router.push({
                pathname: '/checklist',
                params: {
                  eventName: event.title,
                  eventDate: selectedDate,
                  eventId: event.id,
                  source: 'dashboard',
                  location: event.location,
                  pic: event.pic,
                }
              });
            }}
          >
            <View style={eventStyles.content}>
              <Text style={eventStyles.title}>{event.title}</Text>
              <Text style={eventStyles.subText}>{event.location}</Text>
              <Text style={eventStyles.subText}>Pukul {event.time}</Text>
            </View>
            <View style={[eventStyles.dot, { backgroundColor: event.color }]} />
          </TouchableOpacity>
        )) : <Text style={mainStyles.emptyText}>Tidak ada event.</Text>}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={fabStyles.button} onPress={() => router.push('/tambah-event')}>
        <Ionicons name="calendar-outline" size={26} color="#fff" />
        <View style={fabStyles.plusIcon}><Ionicons name="add" size={14} color="#5C2C00" /></View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modal: {
    width: '85%',
    height: 420,
    padding: 20,
    borderRadius: 25,
    backgroundColor: '#FFF',
    elevation: 10,
  },

  modalTitle: {
    marginBottom: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5C2C00',
    textAlign: 'center',
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
    borderRadius: 10,
  },

  activeItem: {
    backgroundColor: '#FF8F29',
  },

  itemText: {
    fontSize: 14,
    color: '#5C2C00',
  },

  activeText: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },

  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5C2C00',
    alignItems: 'center',
  },

  cancelBtnText: {
    color: '#5C2C00',
    fontWeight: 'bold',
  },

  confirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#5C2C00',
  },

  confirmBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

const mainStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2DB',
  },

  listContent: {
    paddingHorizontal: 0,
    paddingBottom: 170,
  },

  divider: {
    height: 1,
    margin: 20,
    backgroundColor: '#5C2C00',
    opacity: 0.3,
  },

  emptyText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#5C2C00',
    opacity: 0.6,
  },
});

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 10,
  },

  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#5C2C00',
    overflow: 'hidden',
  },

  avatarImg: {
    width: '100%',
    height: '100%',
  },

  greeting: {
    fontSize: 14,
    color: '#5C2C00',
  },

  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5C2C00',
  },

  notificationBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5C2C00',
  },

  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    borderWidth: 1,
    borderColor: '#5C2C00',
  },
});

const calendarStyles = StyleSheet.create({
  card: {
    margin: 25,
    borderRadius: 25,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 4,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FF8F29',
  },

  titleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },

  body: {
    padding: 15,
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  dayLabel: {
    width: '14%',
    textAlign: 'center',
    color: '#5C2C00',
    fontWeight: '600',
  },

  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dateCell: {
    width: '14%',
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dateText: {
    fontSize: 14,
    color: '#5C2C00',
  },

  selectedText: {
    color: '#FF8C00',
    fontWeight: 'bold',
  },

  orangeIndicator: {
    width: 18,
    height: 3,
    marginTop: 5,
    borderRadius: 2,
    backgroundColor: '#FF8C00',
  },

  bookedIndicator: {
    width: 18,
    height: 3,
    marginTop: 2,
    borderRadius: 2,
    backgroundColor: '#5C2C00',
  },
});

const legendStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 1,
    marginHorizontal: 35,
    padding: 12,
    borderRadius: 30,
    backgroundColor: '#FFF',
    elevation: 2,
  },

  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5C2C00',
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  line: {
    width: 15,
    height: 4,
    borderRadius: 2,
  },

  label: {
    fontSize: 11,
    color: '#5C2C00',
  },
});

const eventStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 25,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FFFDF0',
  },

  content: {
    flex: 1,
    alignItems: 'center',
  },

  title: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5C2C00',
    textAlign: 'left',
  },

  subText: {
    fontSize: 12,
    color: '#5C2C00',
    textAlign: 'left',
  },

  dot: {
    width: 20,
    height: 20,
    marginLeft: 15,
    borderRadius: 10,
    elevation: 2,
  },
});

const fabStyles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 25,
    bottom: 110,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5C2C00',
    elevation: 8,
  },

  plusIcon: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 16,
    height: 16,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
});