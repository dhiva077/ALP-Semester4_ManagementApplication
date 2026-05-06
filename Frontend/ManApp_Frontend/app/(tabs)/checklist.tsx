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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// 1. Mock Data sesuai dengan gambar checklist
const CHECKLIST_DATA = [
  { id: 1, title: "From Checklist Sebelum Acara", status: "selesai" },
  { id: 2, title: "Surat Perjanjian Kerjasama", status: "selesai" },
  { id: 3, title: "Invoice", status: "selesai" },
  { id: 4, title: "Lembar Disposisi", status: "selesai" },
  { id: 5, title: "Surat Izin Loading", status: "selesai" },
  { id: 6, title: "From Checklist Setelah Acara", status: "belum" },
];

export default function Checklist() {
  const router = useRouter();

  // Helper untuk menentukan warna indikator bulat
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selesai': return '#6B8E23'; // Hijau zaitun (Selesai)
      case 'revisi': return '#FFB300';  // Oranye (Revisi)
      case 'belum': return '#FF4444';   // Merah (Belum ada file)
      default: return '#CCC';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER UTAMA */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Event GDG OG UNM X UC Makassar
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* BARIS PENCARIAN & TOMBOL EDIT */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#A1887F" />
            <TextInput 
              placeholder="Search" 
              style={styles.searchInput} 
              placeholderTextColor="#A1887F"
            />
          </View>
          <TouchableOpacity style={styles.editButton}>
            <MaterialCommunityIcons name="pencil" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* BANNER NAMA EVENT (ORANYE) */}
        <View style={styles.orangeBanner}>
          <TouchableOpacity>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.bannerText}>Event GDG OG UNM X UC Makassar</Text>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* DAFTAR CHECKLIST */}
        {CHECKLIST_DATA.map((item) => (
          <View key={item.id} style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>{item.title}</Text>
            <View style={[styles.statusCircle, { backgroundColor: getStatusColor(item.status) }]} />
          </View>
        ))}

        {/* BOX KETERANGAN / LEGENDA */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendHeader}>Keterangan:</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.miniDot, { backgroundColor: '#FF4444' }]} />
              <Text style={styles.legendText}>Belum ada file</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.miniDot, { backgroundColor: '#FFB300' }]} />
              <Text style={styles.legendText}>Revisi</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.miniDot, { backgroundColor: '#6B8E23' }]} />
              <Text style={styles.legendText}>Selesai</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF5E6', // Warna krem latar belakang sesuai gambar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#FF9800',
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4E342E',
    marginLeft: 15,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 100, // Memberikan ruang agar tidak tertutup navbar
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 45,
    borderWidth: 1,
    borderColor: '#D7CCC8',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  editButton: {
    backgroundColor: '#4E342E',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  orangeBanner: {
    backgroundColor: '#FF8C00',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 25,
    elevation: 3,
  },
  bannerText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  checklistCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#EFEBE9',
  },
  checklistTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4E342E',
    flex: 1,
  },
  statusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  legendContainer: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 20,
    marginTop: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    alignItems: 'center',
  },
  legendHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4E342E',
    marginBottom: 15,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4E342E',
  },
});