import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { getApiAssetUrl, type AuthUser, type OwnerDashboard } from '@/services/api';

const faceFitLogo = require('../../assets/images/facefit-logo.png');

type OwnerDestination = 'owner-bookings' | 'owner-services' | 'owner-staff' | 'owner-profile' | 'owner-reviews';

type Props = {
  dashboard: OwnerDashboard | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  unreadNotifications: number;
  desktop: boolean;
  onNotifications: () => void;
  onNavigate: (destination: OwnerDestination) => void;
  onReload: () => void;
  onLogout: () => void;
};

const colors = { rose: '#A94F67', roseDark: '#743548', blush: '#F7E4E8', ink: '#292326', muted: '#7C7074', line: '#EDE3E5', white: '#FFFFFF', green: '#4F826B' };

const navigation: { label: string; icon: keyof typeof Ionicons.glyphMap; destination: OwnerDestination }[] = [
  { label: 'Manage booking requests', icon: 'calendar', destination: 'owner-bookings' },
  { label: 'Services & pricing', icon: 'pricetag', destination: 'owner-services' },
  { label: 'Staff & specializations', icon: 'people', destination: 'owner-staff' },
  { label: 'Business profile & portfolio', icon: 'business', destination: 'owner-profile' },
  { label: 'Reviews & ratings', icon: 'star', destination: 'owner-reviews' },
];

export function OwnerDashboardScreen({ dashboard, user, loading, error, unreadNotifications, desktop, onNotifications, onNavigate, onReload, onLogout }: Props) {
  const metrics = [
    { label: 'Today', value: String(dashboard?.todayBookings ?? 0), caption: 'appointments', icon: 'calendar-clear-outline' as const, tone: styles.metricRose },
    { label: 'Pending', value: String(dashboard?.pendingBookings ?? 0), caption: 'need attention', icon: 'time-outline' as const, tone: styles.metricGold },
    { label: 'Rating', value: (dashboard?.rating ?? 0).toFixed(1), caption: `${dashboard?.reviewCount ?? 0} reviews`, icon: 'star-outline' as const, tone: styles.metricPurple },
    { label: 'Team', value: String(dashboard?.availableStaff ?? 0), caption: 'available staff', icon: 'people-outline' as const, tone: styles.metricGreen },
  ];

  return <>
    <View style={styles.header}>
      <View style={styles.logo}><Image accessibilityLabel="FaceFit logo" source={faceFitLogo} style={styles.logoImage} /></View>
      <Text style={styles.headerTitle}>Salon dashboard</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${unreadNotifications} unread notifications`} onPress={onNotifications} style={styles.headerAction}>
        <Ionicons name="notifications-outline" size={21} color={colors.ink} />
        {unreadNotifications > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadNotifications > 99 ? '99+' : unreadNotifications}</Text></View>}
      </Pressable>
    </View>

    <View style={styles.hero}>
      <View style={styles.heroGlow} />
      <View style={styles.heroTop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Log out of FaceFit" onPress={onLogout} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>
          <Ionicons name="log-out-outline" size={17} color={colors.white} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
        <View style={styles.status}><Ionicons name="checkmark-circle" size={16} color="#BDE8D3" /><Text style={styles.statusText}>Salon active</Text></View>
      </View>
      <View style={styles.identity}>
        {dashboard?.profileImageUrl
          ? <Image accessibilityLabel={`${dashboard.name} profile picture`} source={{ uri: getApiAssetUrl(dashboard.profileImageUrl)! }} style={styles.photo} />
          : <View style={styles.photoFallback}><Ionicons name="storefront-outline" size={34} color={colors.white} /></View>}
        <View style={styles.heroCopy}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.heroTitle}>{dashboard?.name || user?.fullName || 'Your salon'}</Text>
          <View style={styles.meta}><Ionicons name="location-outline" size={15} color="#F3CCD6" /><Text numberOfLines={1} style={styles.metaText}>{dashboard?.address || 'Manage your salon from one place'}</Text></View>
        </View>
      </View>
    </View>

    {loading && !dashboard ? <View style={styles.state}><ActivityIndicator color={colors.rose} /><Text style={styles.small}>Loading live salon data...</Text></View>
      : error ? <Pressable onPress={onReload} style={styles.state}><Ionicons name="cloud-offline-outline" size={30} color={colors.rose} /><Text style={styles.cardTitle}>Could not refresh your dashboard</Text><Text style={styles.small}>{error} · Tap to retry</Text></Pressable>
      : <>
        <SectionHeading eyebrow="PERFORMANCE" title="Today at a glance" />
        <View style={styles.metricsGrid}>{metrics.map(metric => <View key={metric.label} style={[styles.metricCard, { flexBasis: desktop ? '22%' : '46%' }]}><View style={[styles.metricIcon, metric.tone]}><Ionicons name={metric.icon} size={21} color={colors.roseDark} /></View><Text style={styles.metricValue}>{metric.value}</Text><Text style={styles.metricLabel}>{metric.label}</Text><Text style={styles.metricCaption}>{metric.caption}</Text></View>)}</View>
        <SectionHeading eyebrow="QUICK ACCESS" title="Manage your salon" />
        <View style={styles.managementGrid}>{navigation.map((item, index) => <Pressable accessibilityRole="button" key={item.label} onPress={() => onNavigate(item.destination)} style={({ pressed }) => [styles.managementCard, { flexBasis: desktop ? '30%' : '100%' }, pressed && styles.pressed]}><View style={[styles.managementIcon, index % 3 === 1 && styles.metricGold, index % 3 === 2 && styles.metricGreen]}><Ionicons name={item.icon} size={22} color={colors.roseDark} /></View><View style={styles.grow}><Text style={styles.managementTitle}>{item.label}</Text><Text style={styles.managementDescription}>{index === 0 ? `${dashboard?.pendingBookings ?? 0} requests waiting` : index === 1 ? `${dashboard?.serviceCount ?? 0} published services` : index === 2 ? `${dashboard?.availableStaff ?? 0} team members available` : index === 3 ? 'Update salon information' : `${dashboard?.reviewCount ?? 0} customer reviews`}</Text></View><Ionicons name="arrow-forward" size={18} color={colors.rose} /></Pressable>)}</View>
        <View style={styles.health}><View style={styles.healthIcon}><Ionicons name="shield-checkmark" size={24} color={colors.white} /></View><View style={styles.grow}><Text style={styles.healthTitle}>Your salon is ready for bookings</Text><Text style={styles.healthText}>{dashboard?.serviceCount ?? 0} services are visible to FaceFit customers.</Text></View><Ionicons name="sparkles-outline" size={24} color="#8EBFA9" /></View>
      </>}
  </>;
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <View style={styles.sectionHeading}><View><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text></View></View>;
}

const styles = StyleSheet.create({
  header:{minHeight:78,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12},logo:{width:54,height:54,borderRadius:16,backgroundColor:colors.white,alignItems:'center',justifyContent:'center',overflow:'hidden'},logoImage:{width:'100%',height:'100%',resizeMode:'contain'},headerTitle:{fontSize:20,fontWeight:'900',color:colors.ink},headerAction:{width:46,height:46,borderRadius:23,backgroundColor:colors.white,borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center'},badge:{position:'absolute',right:-3,top:-5,minWidth:21,height:21,borderRadius:11,backgroundColor:'#C52E59',alignItems:'center',justifyContent:'center',paddingHorizontal:4},badgeText:{fontSize:10,fontWeight:'900',color:colors.white},
  hero:{minHeight:220,borderRadius:28,backgroundColor:colors.roseDark,padding:23,overflow:'hidden',marginBottom:25},heroGlow:{position:'absolute',width:230,height:230,borderRadius:115,right:-72,top:-90,backgroundColor:'rgba(255,255,255,.07)'},heroTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:22},logout:{minHeight:38,borderRadius:12,backgroundColor:'rgba(255,255,255,.16)',borderWidth:1,borderColor:'rgba(255,255,255,.24)',paddingHorizontal:13,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},logoutText:{fontSize:12,fontWeight:'900',color:colors.white},status:{flexDirection:'row',alignItems:'center',gap:5},statusText:{fontSize:10,fontWeight:'800',color:'#D8F3E6'},identity:{flexDirection:'row',alignItems:'center',gap:17},photo:{width:86,height:86,borderRadius:25,resizeMode:'cover',backgroundColor:colors.blush,borderWidth:2,borderColor:'rgba(255,255,255,.45)'},photoFallback:{width:86,height:86,borderRadius:25,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,.14)',borderWidth:2,borderColor:'rgba(255,255,255,.28)'},heroCopy:{flex:1,minWidth:0},greeting:{fontSize:13,fontWeight:'600',color:'#F3CCD6',marginBottom:4},heroTitle:{fontSize:29,lineHeight:35,fontWeight:'900',color:colors.white,letterSpacing:-.6},meta:{flexDirection:'row',alignItems:'center',gap:6,marginTop:12,maxWidth:500},metaText:{flexShrink:1,fontSize:12,color:'#F3CCD6'},
  state:{minHeight:145,borderRadius:20,backgroundColor:colors.white,borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center',gap:8,padding:18,marginBottom:18},small:{fontSize:11,lineHeight:17,color:colors.muted},cardTitle:{fontSize:15,fontWeight:'700',color:colors.ink},sectionHeading:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',marginTop:5,marginBottom:13},eyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:colors.rose,marginBottom:4},sectionTitle:{fontSize:19,fontWeight:'900',color:colors.ink},metricsGrid:{flexDirection:'row',flexWrap:'wrap',gap:11,marginBottom:27},metricCard:{flexGrow:1,minWidth:135,minHeight:158,borderRadius:21,backgroundColor:colors.white,borderWidth:1,borderColor:colors.line,padding:15},metricIcon:{width:40,height:40,borderRadius:13,alignItems:'center',justifyContent:'center',marginBottom:15},metricRose:{backgroundColor:'#F7E4E8'},metricGold:{backgroundColor:'#FFF0D9'},metricPurple:{backgroundColor:'#EFE8FA'},metricGreen:{backgroundColor:'#E5F2EC'},metricValue:{fontSize:25,lineHeight:29,fontWeight:'900',color:colors.ink},metricLabel:{fontSize:12,fontWeight:'800',color:colors.roseDark,marginTop:2},metricCaption:{fontSize:10,color:colors.muted,marginTop:3},managementGrid:{flexDirection:'row',flexWrap:'wrap',gap:11,marginBottom:24},managementCard:{flexGrow:1,minWidth:240,minHeight:88,borderRadius:20,backgroundColor:colors.white,borderWidth:1,borderColor:colors.line,padding:13,flexDirection:'row',alignItems:'center',gap:12},managementIcon:{width:45,height:45,borderRadius:15,backgroundColor:colors.blush,alignItems:'center',justifyContent:'center'},grow:{flex:1,minWidth:0},managementTitle:{fontSize:13,fontWeight:'800',color:colors.ink},managementDescription:{fontSize:10.5,lineHeight:15,color:colors.muted,marginTop:3},health:{minHeight:90,borderRadius:21,backgroundColor:'#E8F3ED',borderWidth:1,borderColor:'#CFE6DA',padding:15,flexDirection:'row',alignItems:'center',gap:12},healthIcon:{width:46,height:46,borderRadius:15,backgroundColor:colors.green,alignItems:'center',justifyContent:'center'},healthTitle:{fontSize:13,fontWeight:'900',color:'#315F4B'},healthText:{fontSize:10.5,lineHeight:15,color:'#5A7B6C',marginTop:3},pressed:{opacity:.72},
});
