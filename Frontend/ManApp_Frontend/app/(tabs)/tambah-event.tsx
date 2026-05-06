import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView, 
  ScrollView 
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function TambahEvent() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Event</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* INPUT FIELDS */}
        <View style={styles.inputContainer}>
          <Ionicons name="people-outline" size={20} color="#8D6E63" style={styles.icon} />
          <TextInput placeholder="Nama PIC Event" style={styles.input} placeholderTextColor="#A1887F" />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="person-add-outline" size={20} color="#8D6E63" style={styles.icon} />
          <TextInput placeholder="Masukkan Nama Event" style={styles.input} placeholderTextColor="#A1887F" />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="calendar-outline" size={20} color="#8D6E63" style={styles.icon} />
          <TextInput placeholder="Masukkan Tanggal Event" style={styles.input} placeholderTextColor="#A1887F" />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="location-outline" size={20} color="#8D6E63" style={styles.icon} />
          <TextInput placeholder="Masukkan Lokasi Event" style={styles.input} placeholderTextColor="#A1887F" />
        </View>

        {/* TIME ROW */}
        <View style={styles.timeRow}>
          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Ionicons name="time-outline" size={20} color="#8D6E63" style={styles.icon} />
            <TextInput placeholder="Jam Mulai" style={styles.input} placeholderTextColor="#A1887F" />
          </View>
          <Text style={styles.dash}>-</Text>
          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Ionicons name="time-outline" size={20} color="#8D6E63" style={styles.icon} />
            <TextInput placeholder="Jam Selesai" style={styles.input} placeholderTextColor="#A1887F" />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="note-add" size={20} color="#8D6E63" style={styles.icon} />
          <TextInput placeholder="Tambahkan Deskripsi" style={styles.input} placeholderTextColor="#A1887F" />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="drive-folder-upload" size={20} color="#8D6E63" style={styles.icon} />
          <TextInput placeholder="Tambahkan File" style={styles.input} placeholderTextColor="#A1887F" />
        </View>

        {/* BUTTON SIMPAN */}
        <TouchableOpacity style={styles.btnSimpan} activeOpacity={0.8}>
          <Text style={styles.btnText}>Simpan Event</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FDF5E6' // Warna latar krem sesuai gambar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 30,
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
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4E342E',
    marginRight: 45, // Untuk mengimbangi posisi backButton agar teks tetap di tengah
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 15,
    // Shadow Styling
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#4E342E',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dash: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4E342E',
    marginBottom: 15,
  },
  btnSimpan: {
    backgroundColor: '#FF8C00', // Warna oranye tombol
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 5,
  },
  btnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});