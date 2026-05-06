import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MOCK_NOTIF = [
  {
    id: 1,
    title: 'Mayora Goes to Campus',
    desc: 'Peringatan H-3 Event! Ayo buruan dicek, masih ada beberapa file yang masih perlu diperhatikan',
  },
  {
    id: 2,
    title: 'Mayora Goes to Campus',
    desc: 'Peringatan H-3 Event! Ayo buruan dicek, masih ada beberapa file yang masih perlu diperhatikan',
  },
  {
    id: 3,
    title: 'Mayora Goes to Campus',
    desc: 'Peringatan H-3 Event! Ayo buruan dicek, masih ada beberapa file yang masih perlu diperhatikan',
  },
  {
    id: 4,
    title: 'Mayora Goes to Campus',
    desc: 'Peringatan H-3 Event! Ayo buruan dicek, masih ada beberapa file yang masih perlu diperhatikan',
  },
];

export default function Notifikasi() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifikasi</Text>

        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_NOTIF.map((item) => (
          <View key={item.id} style={styles.notifCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="folder" size={32} color="#5D4037" />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.notifTitle}>{item.title}</Text>
              <Text style={styles.notifDesc}>{item.desc}</Text>
            </View>

            <View style={styles.orangeBadge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    backgroundColor: '#FF8C2B',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5D4037',
  },
  spacer: {
    width: 45,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  notifCard: {
    backgroundColor: '#FFFDF0',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D4037',
    marginBottom: 4,
  },
  notifDesc: {
    fontSize: 11,
    color: '#8D6E63',
    lineHeight: 16,
  },
  orangeBadge: {
    backgroundColor: '#FF8C2B',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});