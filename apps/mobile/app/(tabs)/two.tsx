import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const campusShuttle = [
  { route: 'Main Gate -> L Block Loop', pickup: 'ADTU Main Gate', times: ['08:00', '08:15', '08:30'], drop: 'L Block', note: 'Runs every 10-20 mins during class hours' },
  { route: 'Main Gate -> Ground Shuttle', pickup: 'ADTU Main Gate', times: ['08:05', '08:25', '08:40'], drop: 'Sports Ground', note: 'Quick loop service for sports and events' },
  { route: 'L Block -> Ground Connector', pickup: 'L Block', times: ['08:10', '08:30', '08:50'], drop: 'Sports Ground', note: 'Bidirectional connector inside campus' },
];

const cityConnect = [
  { route: 'ADTU <-> Six Mile', pickup: 'ADTU Main Gate', times: ['15:30', '16:20', '17:15'], drop: 'Six Mile Flyover', note: 'Best for hostellers and market access' },
  { route: 'ADTU <-> Chandmari', pickup: 'ADTU Main Gate', times: ['15:45', '16:40', '17:35'], drop: 'Chandmari Bus Stand', note: 'City transfer line with evening return options' },
  { route: 'ADTU <-> Jalukbari', pickup: 'ADTU Main Gate', times: ['16:00', '17:00', '18:00'], drop: 'Jalukbari Point', note: 'Long route with fewer direct buses' },
];

export default function TransportScreen() {
  const { colors } = useTheme();

  const renderRow = (item: any, index: number) => (
    <View key={`${item.route}-${index}`} style={[styles.routeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <Text style={[styles.routeTitle, { color: colors.text }]}>{item.route}</Text>
      <Text style={{ color: colors.textSecondary, marginTop: 6 }}>Pickup: {item.pickup}</Text>
      <Text style={{ color: colors.textSecondary, marginTop: 2 }}>Drop: {item.drop}</Text>
      <Text style={{ color: colors.text, marginTop: 10, fontWeight: '700' }}>Timings: {item.times.join(' | ')}</Text>
      {item.note ? <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>{item.note}</Text> : null}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Transport Services</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Campus shuttle and city bus timings around ADTU Panikhaiti.</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Ionicons name="bus-outline" size={18} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Campus Shuttle</Text>
      </View>
      {campusShuttle.map(renderRow)}

      <View style={[styles.infoStrip, { backgroundColor: colors.primaryBg, borderColor: colors.border }]}> 
        <Ionicons name="time-outline" size={16} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.text }]}>Next campus shuttle usually arrives within 10-20 minutes.</Text>
      </View>

      <View style={[styles.sectionHeader, { marginTop: 14 }]}>
        <Ionicons name="navigate-outline" size={18} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>City Connect</Text>
      </View>
      {cityConnect.map(renderRow)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 56 },
  header: { marginBottom: 14 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginLeft: 8 },
  infoStrip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoText: { fontSize: 13, flex: 1 },
  routeCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  routeTitle: { fontSize: 18, fontWeight: '800' },
});
