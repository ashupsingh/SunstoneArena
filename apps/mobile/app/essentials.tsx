import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

const essentials = [
  {
    id: 'nirvaan-stationery',
    name: 'Nirvaan Stationery',
    category: 'Stationery',
    address: 'Khankar Gaon, Panikhaiti, Assam 781026',
    phone: 'Public phone not listed',
    source: 'https://www.indiainfo.net/places-in/khankar-gaon-1450267-area-of-amgaon-781026',
  },
  {
    id: 'pallabi-store',
    name: 'Pallabi Store',
    category: 'General Store',
    address: 'Khankar Gaon, Panikhaiti, Assam 781026',
    phone: 'Public phone not listed',
    source: 'https://www.indiainfo.net/places-in/khankar-gaon-1450267-area-of-amgaon-781026',
  },
  {
    id: 'panikhaiti-medical-hall',
    name: 'Panikhaiti Medical Hall',
    category: 'Medical Store',
    address: 'Panikhaiti, Chandrapur Road, Khankar Gaon, Guwahati 781004',
    phone: 'Public phone not listed',
    source: 'https://www.justdial.com/Guwahati/Panikhaiti-Medical-Hall-Panikhaiti/9999PX361-X361-250628105832-H5M6_BZDET',
  },
  {
    id: 'shivam-hair-cutting-salon',
    name: 'Shivam Hair Cutting Salon',
    category: 'Barber Shop',
    address: 'Barchapari, Near Circle Office, Chandrapur Road, Panikhaiti, Guwahati 781026',
    phone: 'Public phone not listed',
    source: 'https://www.justdial.com/Guwahati/Shivam-Hair-Cutting-Salon-Near-Circle-Office-Panikhaiti/9999PX361-X361-230920214607-N9N7_BZDET',
  },
  {
    id: 'adtu-healthcare',
    name: 'ADTU General OPD',
    category: 'Campus Health',
    address: 'Assam down town University, Panikhaiti, Guwahati 781026',
    phone: 'Public phone not listed',
    source: 'https://hcf.adtu.in/',
  },
  {
    id: 'khoka-eats',
    name: 'Khoka Eats',
    category: 'Restaurant',
    address: 'Khankar Gaon, Chandrapur Road, Panikhaiti, Guwahati 781026',
    phone: 'Public phone not listed',
    source: 'https://www.zomato.com/guwahati/khoka-eats-beltola',
  },
  {
    id: 'the-tribe-kitchen',
    name: 'The Tribe Kitchen',
    category: 'Restaurant',
    address: 'Panikhaiti area, Guwahati, Assam',
    phone: 'Public phone not listed',
    source: 'https://www.zomato.com/guwahati/restaurants/panikhaiti',
  },
  {
    id: 'bajrang-store',
    name: 'Bajrang Store',
    category: 'General Store',
    address: 'Khankar Gaon, Panikhaiti, Assam 781026',
    phone: 'Public phone not listed',
    source: 'https://www.indiainfo.net/places-in/khankar-gaon-1450267-area-of-amgaon-781026',
  },
];

const mapsUrl = (name: string, address: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${name}, ${address}`)}`;

export default function EssentialsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        <Text style={[styles.backText, { color: colors.textSecondary }]}>Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>Essentials</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Nearby student-useful places around Assam down town University, grouped so you can quickly call, compare, or open directions.</Text>

      {essentials.map((item) => (
        <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHead}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryBg }]}>
              <Ionicons
                name={
                  item.category === 'Medical Store' || item.category === 'Campus Health'
                    ? 'medical-outline'
                    : item.category === 'Barber Shop'
                    ? 'cut-outline'
                    : item.category === 'Stationery'
                    ? 'document-text-outline'
                    : item.category === 'Restaurant'
                    ? 'restaurant-outline'
                    : 'storefront-outline'
                }
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.cardTag, { color: colors.primary }]}>{item.category}</Text>
            </View>
          </View>

          <Text style={[styles.cardText, { color: colors.textSecondary }]}>Address: {item.address}</Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>Contact: {item.phone}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => Linking.openURL(mapsUrl(item.name, item.address))}>
              <Ionicons name="navigate-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Open in Maps</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => Linking.openURL(item.source)}>
              <Ionicons name="globe-outline" size={16} color={colors.text} />
              <Text style={[styles.secondaryText, { color: colors.text }]}>Source</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 96 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backText: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  title: { fontSize: 34, fontWeight: '800', marginBottom: 10 },
  subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 24 },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardTag: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  cardText: { fontSize: 14, lineHeight: 21, marginBottom: 6 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  secondaryBtn: {
    minWidth: 110,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  secondaryText: { fontSize: 14, fontWeight: '700' },
});
