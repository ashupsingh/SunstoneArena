import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../config/api';

export default function CampusScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [crowdData, setCrowdData] = useState<any[]>([]);
  const [campusMeta, setCampusMeta] = useState<any | null>(null);
  const [selectedBlock, setSelectedBlock] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERCROWDED'>('ALL');
  const [selectedSource, setSelectedSource] = useState<'ALL' | 'LIVE' | 'SPORTS'>('ALL');
  const [pickerOpen, setPickerOpen] = useState<null | 'block' | 'level' | 'source'>(null);

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

  const levelColor = (level: string) => {
    if (level === 'LOW') return '#22c55e';
    if (level === 'MEDIUM') return '#f59e0b';
    if (level === 'HIGH') return '#f97316';
    return '#ef4444';
  };

  const inferBlock = (name?: string, location?: string): string => {
    const text = `${name || ''} ${location || ''}`.toUpperCase();
    const m = text.match(/\b(?:BLOCK\s+)?([A-L]|HE)\s*BLOCK\b|\bBLOCK\s+([A-L]|HE)\b|\bACADEMIC\s+BLOCK\s+([A-L]|HE)\b/i);
    const code = (m?.[1] || m?.[2] || m?.[3] || '').toUpperCase();
    if (code) return code;
    if (text.includes('HE') && text.includes('K')) return 'HE-K';
    if (text.includes('GROUND')) return 'GROUND';
    return 'OTHER';
  };

  const mergedEntries = useMemo(() => {
    const live = crowdData.map((item) => ({
      id: item._id,
      name: item.foodCourtId?.name || 'Unknown',
      location: item.foodCourtId?.location || 'Campus',
      peopleCount: item.peopleCount,
      capacity: item.foodCourtId?.capacity || 0,
      crowdLevel: item.crowdLevel || 'LOW',
      source: 'LIVE' as const,
      block: inferBlock(item.foodCourtId?.name, item.foodCourtId?.location),
    }));

    const sports = (campusMeta?.sportsAndGroundVenues || []).map((v: any, idx: number) => ({
      id: `sports-${idx}`,
      name: v.venueName,
      location: v.zone,
      peopleCount: v.peopleCount,
      capacity: v.capacity,
      crowdLevel: v.crowdLevel,
      source: 'SPORTS' as const,
      block: v.blockCode,
    }));

    return [...live, ...sports];
  }, [crowdData, campusMeta]);

  const availableBlocks = useMemo(() => {
    const fromMeta = (campusMeta?.blocks || []).map((b: any) => b.code);
    const fromEntries = Array.from(new Set(mergedEntries.map((e) => e.block)));
    return ['ALL', ...Array.from(new Set([...fromMeta, ...fromEntries]))];
  }, [campusMeta, mergedEntries]);

  const filteredEntries = useMemo(() => {
    return mergedEntries.filter((item) => {
      if (selectedBlock !== 'ALL' && item.block !== selectedBlock) return false;
      if (selectedLevel !== 'ALL' && item.crowdLevel !== selectedLevel) return false;
      if (selectedSource !== 'ALL' && item.source !== selectedSource) return false;
      return true;
    });
  }, [mergedEntries, selectedBlock, selectedLevel, selectedSource]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Campus Live</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Real-time crowd insights across blocks, canteens, and sports zones.</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setRefreshing(true);
            fetchCrowd();
          }}
          style={[styles.refreshBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {campusMeta ? (
        <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.metaTitle, { color: colors.text }]}>University Snapshot</Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>
            {campusMeta.university?.name} - {campusMeta.university?.campusName}
          </Text>
          <View style={styles.metaStatsRow}>
            <Text style={{ color: colors.textSecondary }}>Blocks: <Text style={{ color: colors.text, fontWeight: '700' }}>{campusMeta.blocks?.length || 0}</Text></Text>
            <Text style={{ color: colors.textSecondary }}>Lab Types: <Text style={{ color: colors.text, fontWeight: '700' }}>{campusMeta.labCategories?.length || 0}</Text></Text>
            <Text style={{ color: colors.textSecondary }}>Programs: <Text style={{ color: colors.text, fontWeight: '700' }}>{campusMeta.programPortfolio?.length || 0}</Text></Text>
          </View>
        </View>
      ) : null}

      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Filters</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{filteredEntries.length} areas</Text>
      </View>

      <View style={styles.dropdownGrid}>
        <TouchableOpacity
          onPress={() => setPickerOpen('block')}
          style={[styles.dropdownBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Block</Text>
          <View style={styles.dropdownValueRow}>
            <Text numberOfLines={1} style={[styles.dropdownValue, { color: colors.text }]}>{selectedBlock}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setPickerOpen('level')}
          style={[styles.dropdownBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Crowd Level</Text>
          <View style={styles.dropdownValueRow}>
            <Text numberOfLines={1} style={[styles.dropdownValue, { color: colors.text }]}>{selectedLevel}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setPickerOpen('source')}
          style={[styles.dropdownBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Source</Text>
          <View style={styles.dropdownValueRow}>
            <Text numberOfLines={1} style={[styles.dropdownValue, { color: colors.text }]}>{selectedSource}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setSelectedBlock('ALL');
            setSelectedLevel('ALL');
            setSelectedSource('ALL');
          }}
          style={[styles.resetBtn, { borderColor: colors.border }]}
        >
          <Ionicons name="refresh" size={14} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontWeight: '700', marginLeft: 6 }}>Reset</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={pickerOpen !== null} transparent animationType="fade" onRequestClose={() => setPickerOpen(null)}>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.pickerHead}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                {pickerOpen === 'block' ? 'Select Block' : pickerOpen === 'level' ? 'Select Crowd Level' : 'Select Source'}
              </Text>
              <TouchableOpacity onPress={() => setPickerOpen(null)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {(pickerOpen === 'block' ? availableBlocks : pickerOpen === 'level' ? ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'OVERCROWDED'] : ['ALL', 'LIVE', 'SPORTS']).map((option) => {
              const active =
                (pickerOpen === 'block' && selectedBlock === option) ||
                (pickerOpen === 'level' && selectedLevel === option) ||
                (pickerOpen === 'source' && selectedSource === option);

              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    if (pickerOpen === 'block') setSelectedBlock(option);
                    if (pickerOpen === 'level') setSelectedLevel(option as any);
                    if (pickerOpen === 'source') setSelectedSource(option as any);
                    setPickerOpen(null);
                  }}
                  style={[
                    styles.pickerOption,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primaryBg : colors.background,
                    },
                  ]}
                >
                  <Text style={{ color: active ? colors.primary : colors.text, fontWeight: '700' }}>{option}</Text>
                  {active ? <Ionicons name="checkmark" size={16} color={colors.primary} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchCrowd();
        }}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No areas match selected filters.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.topRow}>
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.level, { color: levelColor(item.crowdLevel) }]}>{item.crowdLevel}</Text>
            </View>
            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>{item.location}</Text>
            <View style={styles.metricsRow}>
              <Text style={{ color: colors.textSecondary }}>People: <Text style={{ color: colors.text, fontWeight: '700' }}>{item.peopleCount}</Text></Text>
              <Text style={{ color: colors.textSecondary }}>Capacity: <Text style={{ color: colors.text, fontWeight: '700' }}>{item.capacity || '-'}</Text></Text>
            </View>
            <Text style={{ color: colors.textSecondary, marginTop: 6, fontSize: 12 }}>Block: {item.block} | Source: {item.source}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 56 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 12 },
  refreshBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: 0.2 },
  subtitle: { fontSize: 14, marginTop: 6, lineHeight: 20, maxWidth: 290 },
  metaCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 14 },
  metaTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  metaStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  dropdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dropdownBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 58,
    width: '48%',
  },
  dropdownLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  dropdownValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dropdownValue: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  resetBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 58,
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pickerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    maxHeight: '70%',
  },
  pickerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  pickerOption: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: 22, fontWeight: '800', flex: 1, paddingRight: 10 },
  level: { fontSize: 13, fontWeight: '800' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
