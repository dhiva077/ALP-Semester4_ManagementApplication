import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// --- INTERFACES & MOCK DATA ---
interface EventItem { id: number; title: string; location: string; time: string; color: string; }
interface EventData { [key: string]: EventItem[]; }

const MOCK_EVENTS: EventData = {
  "2026-06-03": [{ id: 1, title: "Wisuda Santri TK/TPA Barokah", location: "Dian Auditorium UC Makassar", time: "10:00 - 12:30", color: "#6B8E23" }],
  "2026-06-27": [
    { id: 5, title: "Pameran Buku by Gramedia", location: "Lapangan Basket UC Makassar", time: "10:00 - 17:30", color: "#FF8C00" },
    { id: 6, title: "Mayora Goes to Campus", location: "Classroom 303", time: "07:00 - 15:30", color: "#FF8C00" }
  ]
};

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function Dashboard() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 5, 1));
  const [selectedDate, setSelectedDate] = useState<string>("2026-06-03");

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const changeMonth = (offset: number) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  const formatDisplayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d} ${MONTHS[parseInt(m) - 1]} ${y}`;
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
      const isBooked = !!MOCK_EVENTS[dateStr];

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
      {/* HEADER SECTION */}
      <View style={headerStyles.container}>
        <View style={headerStyles.profile}>
          <View style={headerStyles.avatar}><Ionicons name="person" size={28} color="#5D4037" /></View>
          <View>
            <Text style={headerStyles.greeting}>Hello,</Text>
            <Text style={headerStyles.name}>Rasya Dema</Text>
          </View>
        </View>
        <TouchableOpacity style={headerStyles.notificationBtn} onPress={() => router.push('/notifikasi')}>
          <Ionicons name="notifications" size={24} color="#fff" />
          <View style={headerStyles.notifBadge} />
        </TouchableOpacity>
      </View>

      {/* CALENDAR SECTION */}
      <View style={calendarStyles.card}>
        <View style={calendarStyles.header}>
          <TouchableOpacity onPress={() => changeMonth(-1)}><Ionicons name="chevron-back" size={20} color="#fff" /></TouchableOpacity>
          <Text style={calendarStyles.title}>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)}><Ionicons name="chevron-forward" size={20} color="#fff" /></TouchableOpacity>
        </View>
        <View style={calendarStyles.body}>
          <View style={calendarStyles.weekRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => <Text key={i} style={calendarStyles.dayLabel}>{day}</Text>)}
          </View>
          <View style={calendarStyles.dateGrid}>{renderCalendar()}</View>
        </View>
      </View>

      {/* LEGEND SECTION */}
      <View style={legendStyles.pill}>
        <Text style={legendStyles.title}>Keterangan:</Text>
        <View style={legendStyles.item}><View style={[legendStyles.line, { backgroundColor: '#FF8C00' }]} /><Text style={legendStyles.label}>Hari ini</Text></View>
        <View style={legendStyles.item}><View style={[legendStyles.line, { backgroundColor: '#4E342E' }]} /><Text style={legendStyles.label}>Ada Event</Text></View>
      </View>

      <View style={mainStyles.divider} />
      <Text style={mainStyles.sectionTitle}>Event Tanggal {formatDisplayDate(selectedDate)}</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={mainStyles.listContent}>
        {MOCK_EVENTS[selectedDate] ? (
          MOCK_EVENTS[selectedDate].map((event) => (
            <TouchableOpacity key={event.id} style={eventStyles.card} onPress={() => router.push('/checklist')}>
              <View style={eventStyles.content}>
                <Text style={eventStyles.title}>{event.title}</Text>
                <Text style={eventStyles.subText}>{event.location}</Text>
                <Text style={eventStyles.subText}>Pukul {event.time}</Text>
              </View>
              <View style={[eventStyles.dot, { backgroundColor: event.color }]} />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={mainStyles.emptyText}>Tidak ada event.</Text>
        )}
      </ScrollView>

      {/* FAB SECTION */}
      <TouchableOpacity style={fabStyles.button} onPress={() => router.push('/tambah-event')}>
        <Ionicons name="calendar-outline" size={26} color="#fff" />
        <View style={fabStyles.plusIcon}><Ionicons name="add" size={14} color="#4E342E" /></View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- STYLES PISAH-PISAH ---

const mainStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF2DB' },
  listContent: { paddingHorizontal: 0, paddingBottom: 170 },
  divider: { height: 1, backgroundColor: '#5C2C00', margin: 20 },
  sectionTitle: { marginHorizontal: 20, fontWeight: 'bold', color: '#5C2C00', marginBottom: 15 },
  emptyText: { textAlign: 'center', color: '#5C2C00', marginTop: 20 },
});

/*Profile Header*/
const headerStyles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, marginTop: 40, alignItems: 'center' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#5C2C00' },
  greeting: { fontSize: 14, color: '#8D6E63' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#4E342E' },
  notificationBtn: { backgroundColor: '#4E342E', padding: 10, borderRadius: 12 },
  notifBadge: { width: 8, height: 8, backgroundColor: 'red', borderRadius: 4, position: 'absolute', top: 8, right: 8, borderWidth: 1, borderColor: '#4E342E' },
});

/*Calendar Styles*/
const calendarStyles = StyleSheet.create({
  card: { margin: 20, backgroundColor: '#FFFDF0', borderRadius: 20, overflow: 'hidden', elevation: 4 },
  header: { backgroundColor: '#FF8F29', padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  body: { padding: 15 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dayLabel: { width: '14%', textAlign: 'center', color: '#A1887F', fontWeight: '600' },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateCell: { width: '14%', alignItems: 'center', height: 45, justifyContent: 'center' },
  dateText: { color: '#4E342E', fontSize: 14 },
  selectedText: { color: '#FF8C00', fontWeight: 'bold' },
  orangeIndicator: { width: 18, height: 3, backgroundColor: '#FF8C00', marginTop: 2, borderRadius: 2 },
  bookedIndicator: { width: 18, height: 3, backgroundColor: '#4E342E', marginTop: 2, borderRadius: 2 },
});

const legendStyles = StyleSheet.create({
  pill: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, padding: 12, borderRadius: 30, justifyContent: 'center', gap: 15, elevation: 2 },
  title: { fontSize: 12, fontWeight: 'bold', color: '#4E342E' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  line: { width: 15, height: 4, borderRadius: 2 },
  label: { fontSize: 11, color: '#4E342E' },
});

/*Event Card Styles*/
const eventStyles = StyleSheet.create({
  card: { backgroundColor: '#FFFDF0', marginHorizontal: 20, padding: 20, borderRadius: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FFECB3' },
  content: { flex: 1, alignItems: 'center' },
  title: { fontWeight: 'bold', color: '#5C2C00', marginBottom: 5, textAlign: 'center', fontSize: 16 },
  subText: { fontSize: 12, color: '#5C2C00', textAlign: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7 },
});

const fabStyles = StyleSheet.create({
  button: { position: 'absolute', bottom: 110, right: 25, backgroundColor: '#4E342E', width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  plusIcon: { position: 'absolute', bottom: 10, right: 10, backgroundColor: '#FFF', width: 16, height: 16, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
});