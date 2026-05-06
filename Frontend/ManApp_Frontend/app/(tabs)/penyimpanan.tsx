import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Data simulasi untuk list penyimpanan
const STORAGE_DATA = [
  {
    id: 1,
    title: "Webinar Ketua Osis se-Makassar",
    location: "Dian Auditorium UC Makassar",
    date: "03 Juni 2026",
    time: "10:00 - 12:30",
    statusColor: "#FFB300", 
  },
  {
    id: 2,
    title: "Pemilihan Duta Sulawesi Selatan",
    location: "Dian Auditorium UC Makassar",
    date: "03 Juni 2026",
    time: "11:00 - 13:30",
    statusColor: "#FFB300",
  },
  {
    id: 3,
    title: "Bazar Gramedia Mall Panakkukang Makassar",
    location: "Lapangan Basket UC Makassar",
    date: "18 Juni 2026",
    time: "15:00 - 22:30",
    statusColor: "#FF4444",
  },
  {
    id: 4,
    title: "Mayora Goes to Campus",
    location: "Classroom 608",
    date: "20 Juni 2026",
    time: "11:00 - 16:30",
    statusColor: "#FF4444",
  },
  {
    id: 5,
    title: "Webinar Ketua Osis se-Makassar",
    location: "Dian Auditorium UC Makassar",
    date: "03 Juni 2026",
    time: "10:00 - 12:30",
    statusColor: "#FFB300",
  },
];

export default function Penyimpanan() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Penyimpanan</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#A1887F" />
          <TextInput 
            placeholder="Search" 
            style={styles.searchInput} 
            placeholderTextColor="#A1887F"
          />
        </View>

        {/* MONTH PICKER SELECTION */}
        <View style={styles.monthPicker}>
          <TouchableOpacity>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.monthText}>Juni 2026</Text>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* LIST EVENT CARDS - SEKARANG BISA DIKLIK */}
        {STORAGE_DATA.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.eventCard}
            onPress={() => router.push('/checklist')} // Navigasi ke halaman checklist
            activeOpacity={0.7}
          >
            <View style={styles.cardInfo}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventSubText}>{item.location}</Text>
              <Text style={styles.eventSubText}>Tanggal {item.date}</Text>
              <Text style={styles.eventSubText}>Pukul {item.time}</Text>
            </View>
            
            {/* Indikator Status Bulat */}
            <View style={[styles.statusDot, { backgroundColor: item.statusColor }]} />
          </TouchableOpacity>
        ))}
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
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#FF8F29',
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5C2C00',
    marginRight: 45, 
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
    borderWidth: 1,
    borderColor: '#ffffff',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#5C2C00',
  },
  monthPicker: {
    backgroundColor: '#FF8F29',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  monthText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventCard: {
    backgroundColor: '#FFFDF0', 
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFFDF0',
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
    alignItems: 'center', 
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5C2C00',
    textAlign: 'center',
    marginBottom: 8,
  },
  eventSubText: {
    fontSize: 13,
    color: '#5C2C00',
    textAlign: 'center',
    lineHeight: 18,
  },
  statusDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: 10,
    marginTop: -5, 
  },
});