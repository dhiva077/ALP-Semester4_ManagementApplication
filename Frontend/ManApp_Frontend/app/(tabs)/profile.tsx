import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
  Modal,
  FlatList,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AVATAR_PRESETS = [
  { id: '1', uri: 'https://api.dicebear.com/7.x/bottts/png?seed=Ginger&backgroundColor=fef2db' },
  { id: '2', uri: 'https://api.dicebear.com/7.x/bottts/png?seed=Amber&backgroundColor=ffedd5' },
  { id: '3', uri: 'https://api.dicebear.com/7.x/bottts/png?seed=Rusty&backgroundColor=ff9800' },
  { id: '4', uri: 'https://api.dicebear.com/7.x/bottts/png?seed=Coco&backgroundColor=4e342e' },
  { id: '5', uri: 'https://api.dicebear.com/7.x/bottts/png?seed=Honey&backgroundColor=fff5eb' },
  { id: '6', uri: 'https://api.dicebear.com/7.x/bottts/png?seed=Copper&backgroundColor=ffd1a9' },
];

export default function Profile() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].uri);
  const [expandedHistory, setExpandedHistory] = useState<boolean>(false);

  const handleSelectAvatar = (uri: string) => {
    setSelectedAvatar(uri);
    setModalVisible(false);
  };

  const toggleHistory = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedHistory(!expandedHistory);
  };

  // Fungsi Logout
  const handleLogout = () => {
    Alert.alert(
      "Konfirmasi Keluar",
      "Apakah Anda yakin ingin keluar dari akun?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Keluar", 
          style: "destructive",
          onPress: () => router.replace('/login') 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEF2DB" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Saya</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Profile Card Utama */}
        <View style={styles.profileMainCard}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: selectedAvatar }} style={styles.avatar} />
            <TouchableOpacity 
              style={styles.editBadge} 
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="face-recognition" size={16} color="#FFFDF0" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfoText}>
            <Text style={styles.userName}>Rasya Dema</Text>
            <View style={styles.badgeRow}>
              <MaterialCommunityIcons name="shield-check" size={14} color="#5C2C00" />
              <Text style={styles.userRole}>PIC Event</Text>
            </View>
          </View>
        </View>

        {/* Ringkasan Statistik */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Statistik Kontribusi</Text>
              <Feather name="activity" size={18} color="#FF8F29" />
          </View>
          <View style={styles.chartRow}>
            {[{ label: 'Jan', val: 40 }, { label: 'Feb', val: 70 }, { label: 'Mar', val: 50 }, { label: 'Apr', val: 90 }, { label: 'Mei', val: 65 }].map((item, index) => (
              <View key={index} style={styles.barWrapper}>
                <View style={[styles.bar, { height: item.val }]} />
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.statsFooter}>
            <View style={styles.footerItem}>
              <Text style={styles.footerVal}>12</Text>
              <Text style={styles.footerLabel}>Event Selesai</Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerItem}>
              <Text style={styles.footerVal}>94%</Text>
              <Text style={styles.footerLabel}>Kepuasan</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Aktivitas</Text>
        
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity 
            activeOpacity={0.9}
            style={[styles.actionMenuCard, expandedHistory && styles.menuOpened]} 
            onPress={toggleHistory}
          >
            <View style={styles.menuIconCircle}>
              <Feather name="clock" size={20} color="#5C2C00" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuLabel}>Riwayat Event Saya</Text>
              <Text style={styles.menuSubLabel}>Lihat daftar event yang telah selesai</Text>
            </View>
            <Ionicons 
                name={expandedHistory ? "chevron-down" : "chevron-forward"} 
                size={20} 
                color="#5C2C00" 
            />
          </TouchableOpacity>

          {expandedHistory && (
            <View style={styles.dropdownContent}>
              <View style={styles.eventItem}>
                <View style={styles.eventDot} />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>Webinar Nasional IT 2026</Text>
                  <Text style={styles.eventDate}>10 Mei 2026 • PIC Utama</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Selesai</Text>
                </View>
              </View>
              
              <View style={[styles.eventItem, { marginTop: 15 }]}>
                <View style={styles.eventDot} />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>Workshop React Native</Text>
                  <Text style={styles.eventDate}>15 April 2026 • Mentor</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Selesai</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutFullButton} onPress={handleLogout}>
          <Feather name="log-out" size={20} color="#FFFDF0" />
          <Text style={styles.logoutFullText}>Keluar dari Akun</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Maskot</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#5C2C00" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={AVATAR_PRESETS}
              numColumns={3}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.avatarOption, selectedAvatar === item.uri && styles.avatarOptionSelected]}
                  onPress={() => handleSelectAvatar(item.uri)}
                >
                  <Image source={{ uri: item.uri }} style={styles.presetImage} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF2DB' },
  scrollContainer: { paddingHorizontal: 25, paddingBottom: 50, paddingTop: 10 },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginTop: 10, 
    marginBottom: 10 
  },
  backButton: { 
    backgroundColor: '#FF8F29', 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 4 
  },
  headerTitle: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#5C2C00' 
  },

  profileMainCard: {
    backgroundColor: '#FFFDF0',
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#5C2C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#FFF5EB',
    marginTop: 10,
  },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#5C2C00', backgroundColor: '#5C2C00' },
  editBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#FF8F29', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  userInfoText: { alignItems: 'center' },
  userName: { fontSize: 22, fontWeight: '800', color: '#5C2C00' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: '#FEF2DB', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  userRole: { fontSize: 13, color: '#5C2C00', marginLeft: 6, fontWeight: '600' },

  cardContainer: { backgroundColor: '#FFFDF0', borderRadius: 20, padding: 15, marginBottom: 15, elevation: 2, borderWidth: 1, borderColor: '#FFFDF0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  cardTitle: { fontSize: 12, fontWeight: 'bold', color: '#5C2C00' },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 75, marginBottom: 15 },
  barWrapper: { alignItems: 'center' },
  bar: { width: 10, backgroundColor: '#5C2C00', borderRadius: 5, opacity: 0.8 },
  barLabel: { fontSize: 12, color: '#5C2C00', marginTop: 6 },
  statsFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#5C2C00', paddingTop: 12 },
  footerItem: { flex: 1, alignItems: 'center' },
  footerVal: { fontSize: 16, fontWeight: 'bold', color: '#FF8F29' },
  footerLabel: { fontSize: 10, color: '#5C2C00', marginTop: 2 },
  footerDivider: { width: 1, backgroundColor: '#5C2C00' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#5C2C00', marginBottom: 12, marginLeft: 5 },
  
  dropdownWrapper: { marginBottom: 30 },
  actionMenuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF0',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#5C2C00',
    elevation: 2,
  },
  menuOpened: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  menuIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: { flex: 1, marginLeft: 15 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: '#5C2C00' },
  menuSubLabel: { fontSize: 11, color: '#5C2C00', marginTop: 2 },
  
  dropdownContent: {
    backgroundColor: '#FFFDF0',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: '#5C2C00',
    borderTopWidth: 0,
    elevation: 2,
  },
  eventItem: { flexDirection: 'row', alignItems: 'center' },
  eventDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#606C38', marginRight: 12 },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 14, fontWeight: '600', color: '#4E342E' },
  eventDate: { fontSize: 11, color: '#5C2C00', marginTop: 2 },
  statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#606C38' },

  logoutFullButton: {
    backgroundColor: '#FF383C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#FF383C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  logoutFullText: {
    color: '#FFFDF0',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 28, padding: 25, maxHeight: '60%' },
  modalDragHandle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#4E342E' },
  avatarOption: { flex: 1, alignItems: 'center', padding: 5, margin: 5, borderRadius: 15, borderWidth: 2, borderColor: '#F5F5F5' },
  avatarOptionSelected: { borderColor: '#FF9800', backgroundColor: '#FFF9F2' },
  presetImage: { width: width * 0.18, height: width * 0.18, borderRadius: 40 },
});