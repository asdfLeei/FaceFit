import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getApiAssetUrl, type AuthUser, type Salon } from '@/services/api';

type Props = {
  user: AuthUser | null;
  salons: Salon[];
  favoriteSalonIds: number[];
  savingFavoriteSalonIds: number[];
  unreadNotifications: number;
  loadingSalons: boolean;
  salonsError: string | null;
  loadingLocation: boolean;
  onNotifications: () => void;
  onScan: () => void;
  onMap: () => void;
  onReloadSalons: () => void;
  onOpenSalon: (salon: Salon) => void;
  onToggleFavorite: (salonId: number) => void;
};

const colors = { rose: '#A94F67', roseDark: '#743548', blush: '#F7E4E8', ink: '#292326', muted: '#7C7074', line: '#EDE3E5', white: '#FFFFFF', gold: '#C48B3A' };

export function CustomerDashboardScreen({ user, salons, favoriteSalonIds, savingFavoriteSalonIds, unreadNotifications, loadingSalons, salonsError, loadingLocation, onNotifications, onScan, onMap, onReloadSalons, onOpenSalon, onToggleFavorite }: Props) {
  return <>
    <View style={styles.topRow}>
      <View><Text style={styles.greeting}>Hello, {user?.fullName.split(' ')[0] || 'there'}</Text><Text style={styles.body}>Ready for a fresh look?</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={`${unreadNotifications} unread notifications`} onPress={onNotifications} style={styles.avatar}>
        <Ionicons name="notifications-outline" size={21} color={colors.roseDark} />
        {unreadNotifications > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadNotifications > 99 ? '99+' : unreadNotifications}</Text></View>}
      </Pressable>
    </View>

    <View style={styles.hero}>
      <View style={styles.grow}><Text style={styles.heroKicker}>AI FACE ANALYSIS</Text><Text style={styles.heroTitle}>Find the cut that fits you.</Text><Pressable accessibilityRole="button" onPress={onScan} style={styles.heroButton}><Text style={styles.heroButtonText}>Scan your face</Text><Ionicons name="arrow-forward" size={18} color={colors.roseDark} /></Pressable></View>
      <View style={styles.faceMini}><Ionicons name="scan" size={53} color={colors.rose} /></View>
    </View>

    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>Salons near you</Text>
      <Pressable accessibilityRole="button" disabled={loadingLocation} onPress={onMap} style={styles.mapAction}>{loadingLocation ? <ActivityIndicator size="small" color={colors.rose} /> : <><Text style={styles.link}>View map</Text><Ionicons name="map-outline" size={17} color={colors.rose} /></>}</Pressable>
    </View>

    {loadingSalons ? <ActivityIndicator color={colors.rose} style={styles.dataLoader} />
      : salonsError ? <Pressable onPress={onReloadSalons} style={styles.dataState}><Ionicons name="cloud-offline-outline" size={25} color={colors.rose} /><Text style={styles.cardTitle}>Could not load salons</Text><Text style={styles.small}>{salonsError} · Tap to retry</Text></Pressable>
      : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.salonRow}>{salons.slice(0, 6).map((salon, index) => {
        const favorite = favoriteSalonIds.includes(salon.id);
        const busy = savingFavoriteSalonIds.includes(salon.id);
        return <Pressable key={salon.id} onPress={() => onOpenSalon(salon)} style={styles.salonCard}>
          <View style={[styles.salonThumb, { backgroundColor: index % 2 ? '#ECD7D2' : '#F2E7DF' }]}>
            {salon.profileImageUrl ? <Image accessibilityLabel={`${salon.name} profile picture`} source={{ uri: getApiAssetUrl(salon.profileImageUrl)! }} style={styles.salonImage} /> : <Ionicons name="cut-outline" size={28} color={colors.rose} />}
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: favorite, busy }} accessibilityLabel={`${favorite ? 'Remove' : 'Add'} ${salon.name} ${favorite ? 'from' : 'to'} favorites`} hitSlop={8} disabled={busy} onPress={event => { event.stopPropagation(); onToggleFavorite(salon.id); }} style={({ pressed }) => [styles.favorite, favorite && styles.favoriteActive, pressed && styles.pressed]}>{busy ? <ActivityIndicator size="small" color={colors.rose} /> : <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={20} color={colors.rose} />}</Pressable>
          </View>
          <Text numberOfLines={1} style={styles.cardTitle}>{salon.name}</Text><Text numberOfLines={2} style={styles.small}>{salon.address}</Text>
        </Pressable>;
      })}</ScrollView>}

    <View style={styles.tip}><Ionicons name="sparkles" size={22} color={colors.gold} /><View style={styles.grow}><Text style={styles.cardTitle}>Stylist tip</Text><Text style={styles.small}>Soft layers are trending—and perfect for oval faces.</Text></View></View>
  </>;
}

const styles = StyleSheet.create({
  grow:{flex:1},topRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:22},greeting:{fontSize:25,fontWeight:'800',color:colors.ink,marginBottom:3},body:{fontSize:15,lineHeight:23,color:colors.muted,marginBottom:20},avatar:{width:46,height:46,borderRadius:23,backgroundColor:colors.blush,alignItems:'center',justifyContent:'center'},badge:{position:'absolute',right:-5,top:-5,minWidth:20,height:20,borderRadius:10,backgroundColor:'#C52F5D',borderWidth:2,borderColor:colors.white,paddingHorizontal:4,alignItems:'center',justifyContent:'center'},badgeText:{fontSize:9,fontWeight:'900',color:colors.white},hero:{minHeight:210,borderRadius:24,backgroundColor:colors.roseDark,padding:22,flexDirection:'row',alignItems:'center',overflow:'hidden',marginBottom:28},heroKicker:{fontSize:10,fontWeight:'800',letterSpacing:1.1,color:'#F2C7D2',marginBottom:8},heroTitle:{fontSize:27,lineHeight:33,fontWeight:'800',color:colors.white,maxWidth:210},heroButton:{marginTop:20,alignSelf:'flex-start',height:42,borderRadius:14,backgroundColor:colors.white,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:8},heroButtonText:{fontSize:13,fontWeight:'800',color:colors.roseDark},faceMini:{position:'absolute',right:-20,bottom:-20,width:130,height:170,borderWidth:2,borderColor:'#D88A9E',borderRadius:70,alignItems:'center',justifyContent:'center'},sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:4},sectionTitle:{fontSize:19,fontWeight:'800',color:colors.ink,marginVertical:15},mapAction:{minWidth:84,minHeight:40,flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:6},link:{color:colors.rose,fontSize:14,fontWeight:'700'},dataLoader:{marginVertical:32},dataState:{padding:20,borderRadius:18,backgroundColor:colors.white,borderWidth:1,borderColor:colors.line,alignItems:'center',gap:5,marginBottom:16},salonRow:{gap:12,paddingRight:10},salonCard:{width:150,padding:10,borderRadius:18,backgroundColor:colors.white,borderWidth:1,borderColor:colors.line},salonThumb:{height:85,borderRadius:14,alignItems:'center',justifyContent:'center',marginBottom:9,overflow:'hidden'},salonImage:{width:'100%',height:'100%',resizeMode:'cover'},favorite:{position:'absolute',right:7,top:7,width:34,height:34,borderRadius:17,backgroundColor:colors.white,alignItems:'center',justifyContent:'center'},favoriteActive:{backgroundColor:colors.blush,borderWidth:1,borderColor:'#E4B5C1'},pressed:{opacity:.75},cardTitle:{fontSize:15,fontWeight:'700',color:colors.ink,marginBottom:3},small:{fontSize:13,lineHeight:19,color:colors.muted},tip:{marginTop:25,padding:16,borderRadius:18,backgroundColor:'#FFF3DA',flexDirection:'row',gap:12},
});
