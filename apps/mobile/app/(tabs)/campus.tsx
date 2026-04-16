import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../config/api';

type PickerType = 'block' | 'level' | 'source' | null;

export default function CampusScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [crowdData, setCrowdData] = useState<any[]>([]);
  const [campusMeta, setCampusMeta] = useState<any | null>(null);
  const [selectedBlock, setSelectedBlock] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERCROWDED'>('ALL');
  const [selectedSource, setSelectedSource] = useState<'ALL' | 'LIVE' | 'SPORTS'>('ALL');
  const [pickerOpen, setPickerOpen] = useState<PickerType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [demoTick, setDemoTick] = useState(0);

  const fetchCrowd = async () => {
    try {
      const [{ data: crowd }, { data: meta }] = await Promise.all([
        apiClient.get('/crowd/status'),
        apiClient.get('/campus/meta'),
      ]);
      setCrowdData(Array.isArray(crowd) ? crowd : []);
      setCampusMeta(meta || null);
    } catch (_error) {
      setCrowdData([]);
      setCampusMeta(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCrowd();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setDemoTick((value) => value + 1), 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!pickerOpen) setSearchQuery('');
  }, [pickerOpen]);

  const inferBlock = (name?: string, location?: string): string => {
    const text = `${name || ''} ${location || ''}`.toUpperCase();
    const match = text.match(/\b(?:BLOCK\s+)?([A-L]|HE)\s*BLOCK\b|\bBLOCK\s+([A-L]|HE)\b|\bACADEMIC\s+BLOCK\s+([A-L]|HE)\b/i);
    const code = (match?.[1] || match?.[2] || match?.[3] || '').toUpperCase();
    if (code) return code;
    if (text.includes('GROUND')) return 'GROUND';
    if (text.includes('AMP')) return 'AMP';
    return 'OTHER';
  };

  const baseEntries = useMemo(() => {
    const live = crowdData.map((item) => ({
      id: item._id,
      name: item.foodCourtId?.name || 'Unknown zone',
      location: item.foodCourtId?.location || 'Campus',
      peopleCount: item.peopleCount || 0,
      capacity: item.foodCourtId?.capacity || 0,
      crowdLevel: item.crowdLevel || 'LOW',
      source: 'LIVE' as const,
      block: inferBlock(item.foodCourtId?.name, item.foodCourtId?.location),
    }));

    const sports = (campusMeta?.sportsAndGroundVenues || []).map((item: any, index: number) => ({
      id: `sports-${index}`,
      name: item.venueName,
      location: item.zone,
      peopleCount: item.peopleCount || 0,
      capacity: item.capacity || 0,
      crowdLevel: item.crowdLevel || 'LOW',
      source: 'SPORTS' as const,
      block: item.blockCode || 'OTHER',
    }));

    return [...live, ...sports];
  }, [crowdData, campusMeta]);

  const demoEntries = useMemo(() => {
    return baseEntries.map((item, index) => {
      const capacity = item.capacity || 220;
      const wave = Math.abs(Math.sin((demoTick + index + 1) * 0.65));
      const peopleCount = Math.max(0, Math.min(capacity, Math.round(capacity * (0.18 + wave * 0.72))));
      const ratio = capacity > 0 ? peopleCount / capacity : 0;
      let crowdLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERCROWDED' = 'LOW';
      if (ratio >= 0.9) crowdLevel = 'OVERCROWDED';
      else if (ratio >= 0.68) crowdLevel = 'HIGH';
      else if (ratio >= 0.42) crowdLevel = 'MEDIUM';
      return { ...item, peopleCount, crowdLevel };
    });
  }, [baseEntries, demoTick]);

  const availableBlocks = useMemo(() => {
    const fromMeta = (campusMeta?.blocks || []).map((item: any) => item.code);
    const fromEntries = Array.from(new Set(demoEntries.map((item) => item.block)));
    return ['ALL', ...Array.from(new Set([...fromMeta, ...fromEntries]))];
  }, [campusMeta, demoEntries]);

  const filteredEntries = useMemo(() => {
    return demoEntries.filter((item) => {
      if (selectedBlock !== 'ALL' && item.block !== selectedBlock) return false;
      if (selectedLevel !== 'ALL' && item.crowdLevel !== selectedLevel) return false;
      if (selectedSource !== 'ALL' && item.source !== selectedSource) return false;
      return true;
    });
  }, [demoEntries, selectedBlock, selectedLevel, selectedSource]);

  const pickerOptions = useMemo(() => {
    const options =
      pickerOpen === 'block'
        ? availableBlocks
        : pickerOpen === 'level'
          ? ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'OVERCROWDED']
          : ['ALL', 'LIVE', 'SPORTS'];

    if (pickerOpen === 'block' && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      return options.filter((item) => item.toLowerCase().includes(query));
    }

    return options;
  }, [pickerOpen, availableBlocks, searchQuery]);

  const crowdedCount = useMemo(
    () => filteredEntries.filter((item) => item.crowdLevel === 'HIGH' || item.crowdLevel === 'OVERCROWDED').length,
    [filteredEntries]
  );

  const averageOccupancy = useMemo(() => {
    if (filteredEntries.length === 0) return 0;
    const total = filteredEntries.reduce((sum, item) => {
      const capacity = item.capacity || 1;
      return sum + Math.min(100, Math.round((item.peopleCount / capacity) * 100));
    }, 0);
    return Math.round(total / filteredEntries.length);
  }, [filteredEntries]);

  const hotspot = useMemo(() => {
    return [...filteredEntries].sort((a, b) => b.peopleCount - a.peopleCount)[0] || null;
  }, [filteredEntries]);

  const getLevelColors = (level: string) => {
    if (level === 'LOW') return { text: '#16a34a', bg: '#dcfce7' };
    if (level === 'MEDIUM') return { text: '#b45309', bg: '#fef3c7' };
    if (level === 'HIGH') return { text: '#ea580c', bg: '#ffedd5' };
    return { text: '#dc2626', bg: '#fee2e2' };
  };

  const applyPickerOption = (option: string) => {
    if (pickerOpen === 'block') setSelectedBlock(option);
    if (pickerOpen === 'level') setSelectedLevel(option as any);
    if (pickerOpen === 'source') setSelectedSource(option as any);
    setPickerOpen(null);
  };

  const compactFilters = [
    { key: 'block', label: 'Block', value: selectedBlock, icon: 'business-outline' as const },
    { key: 'level', label: 'Level', value: selectedLevel, icon: 'pulse-outline' as const },
    { key: 'source', label: 'Source', value: selectedSource, icon: 'layers-outline' as const },
  ];

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchCrowd();
        }}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.heroRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.text }]}>Campus Live</Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Demo-powered density view for live blocks and activity zones.</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setRefreshing(true);
                    fetchCrowd();
                  }}
                  style={[styles.refreshBtn, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Ionicons name="refresh" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{filteredEntries.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Zones</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{crowdedCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Busy</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{averageOccupancy}%</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg. Occupancy</Text>
                </View>
              </View>

              {hotspot ? (
                <View style={[styles.hotspotCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.hotspotLabel, { color: colors.textSecondary }]}>Most active right now</Text>
                  <Text style={[styles.hotspotTitle, { color: colors.text }]}>{hotspot.name}</Text>
                  <Text style={[styles.hotspotMeta, { color: colors.textSecondary }]}>{hotspot.location}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.filtersHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Filters</Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedBlock('ALL');
                  setSelectedLevel('ALL');
                  setSelectedSource('ALL');
                }}>
                <Text style={[styles.resetText, { color: colors.primary }]}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterStrip}>
              {compactFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  onPress={() => setPickerOpen(filter.key as PickerType)}
                  style={[styles.filterPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name={filter.icon} size={16} color={colors.primary} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={[styles.filterPillLabel, { color: colors.textSecondary }]}>{filter.label}</Text>
                    <Text style={[styles.filterPillValue, { color: colors.text }]}>{filter.value}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={15} color={colors.textSecondary} style={{ marginLeft: 10 }} />
                </TouchableOpacity>
              ))}

              <View style={[styles.snapshotPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.filterPillLabel, { color: colors.textSecondary }]}>Snapshot</Text>
                <Text style={[styles.snapshotTitle, { color: colors.text }]}>{campusMeta?.university?.campusName || 'Panikhaiti Campus'}</Text>
                <Text style={[styles.snapshotSub, { color: colors.textSecondary }]}>Blocks: {campusMeta?.blocks?.length || 0}</Text>
              </View>
            </ScrollView>

            <View style={styles.resultsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Areas</Text>
              <Text style={[styles.resultsText, { color: colors.textSecondary }]}>{filteredEntries.length} results</Text>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No live areas match your current filters.</Text>}
        renderItem={({ item }) => {
          const levelColors = getLevelColors(item.crowdLevel);
          const occupancy = item.capacity ? Math.min(100, Math.round((item.peopleCount / item.capacity) * 100)) : 0;

          return (
            <View style={[styles.zoneCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.zoneHead}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.zoneTitle, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.zoneLocation, { color: colors.textSecondary }]}>{item.location}</Text>
                </View>
                <View style={[styles.levelPill, { backgroundColor: levelColors.bg }]}>
                  <Text style={[styles.levelText, { color: levelColors.text }]}>{item.crowdLevel}</Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>People</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{item.peopleCount}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Capacity</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{item.capacity || '-'}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Block</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{item.block}</Text>
                </View>
              </View>

              <View style={styles.progressWrap}>
                <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
                  <View style={[styles.progressFill, { width: `${occupancy}%`, backgroundColor: levelColors.text }]} />
                </View>
                <Text style={[styles.progressMeta, { color: colors.textSecondary }]}>{occupancy}% occupancy | {item.source}</Text>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={pickerOpen !== null} transparent animationType="fade" onRequestClose={() => setPickerOpen(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHead}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {pickerOpen === 'block' ? 'Choose block' : pickerOpen === 'level' ? 'Choose congestion level' : 'Choose source'}
              </Text>
              <TouchableOpacity onPress={() => setPickerOpen(null)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {pickerOpen === 'block' ? (
              <View style={[styles.searchWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="search" size={16} color={colors.textSecondary} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search block or area"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.searchInput, { color: colors.text }]}
                />
              </View>
            ) : null}

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={pickerOpen === 'block' ? styles.blockGrid : undefined}>
                {pickerOptions.map((option) => {
                  const active =
                    (pickerOpen === 'block' && selectedBlock === option) ||
                    (pickerOpen === 'level' && selectedLevel === option) ||
                    (pickerOpen === 'source' && selectedSource === option);

                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => applyPickerOption(option)}
                      style={[
                        pickerOpen === 'block' ? styles.blockCell : styles.optionItem,
                        {
                          backgroundColor: active ? colors.primaryBg : colors.background,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}>
                      <Text style={{ color: active ? colors.primary : colors.text, fontWeight: '700' }}>{option}</Text>
                      {active ? <Ionicons name="checkmark" size={15} color={colors.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {pickerOptions.length === 0 ? <Text style={[styles.emptySearch, { color: colors.textSecondary }]}>No matching blocks found.</Text> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 28 },
  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 34, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  hotspotCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  hotspotLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  hotspotTitle: { fontSize: 18, fontWeight: '800' },
  hotspotMeta: { fontSize: 13, marginTop: 4 },
  filtersHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  resetText: { fontSize: 13, fontWeight: '700' },
  filterStrip: { paddingBottom: 24, paddingRight: 18, gap: 10 },
  filterPill: {
    minWidth: 148,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPillLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  filterPillValue: { fontSize: 15, fontWeight: '800', marginTop: 3 },
  snapshotPill: {
    width: 188,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  snapshotTitle: { fontSize: 15, fontWeight: '800', marginTop: 3 },
  snapshotSub: { fontSize: 12, marginTop: 6 },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  resultsText: { fontSize: 12, fontWeight: '600' },
  zoneCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  zoneHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  zoneTitle: { fontSize: 24, fontWeight: '800' },
  zoneLocation: { fontSize: 14, marginTop: 4 },
  levelPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  levelText: { fontSize: 11, fontWeight: '800' },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  metricBox: { flex: 1 },
  metricLabel: { fontSize: 12, marginBottom: 6 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  progressWrap: { gap: 8 },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  progressMeta: { fontSize: 12, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 36, fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  searchWrap: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, paddingVertical: 0 },
  optionItem: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  blockCell: {
    width: '22%',
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  emptySearch: { textAlign: 'center', fontSize: 13, marginTop: 18, marginBottom: 8 },
});
