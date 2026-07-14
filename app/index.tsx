import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { FaceScanScreen } from '@/components/face-scan-screen';
import { LocationMap, type MapCoordinate } from '@/components/location-map';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { SalonMap } from '@/components/salon-map';
import { createBooking, getBookings, getSalons, getSalonServices, login as loginUser, signup as signupUser, type AuthUser, type Booking, type Salon, type SalonService } from '@/services/api';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Screen =
  | 'splash' | 'onboarding' | 'login' | 'signup' | 'consent' | 'home'
  | 'scan' | 'processing' | 'result' | 'recommendations' | 'style-detail'
  | 'salons' | 'salon-detail' | 'service' | 'stylist' | 'datetime' | 'summary' | 'success'
  | 'bookings' | 'profile' | 'saved' | 'notifications' | 'reviews' | 'settings'
  | 'stylist-dashboard' | 'stylist-appointments' | 'stylist-detail' | 'stylist-status' | 'stylist-notifications'
  | 'owner-dashboard' | 'owner-bookings' | 'owner-services' | 'owner-staff' | 'owner-profile' | 'owner-reviews';

const C = { rose: '#A94F67', roseDark: '#743548', blush: '#F7E4E8', pale: '#FFF8F6', ink: '#292326', muted: '#7C7074', line: '#EDE3E5', white: '#FFFFFF', green: '#4F826B', gold: '#C48B3A' };
const artwork = require('../assets/images/facefit-styles.png');
const stylesList = [
  { name: 'Soft Layered Lob', match: '96%', reason: 'Frames an oval face without hiding its balance.' },
  { name: 'Textured Pixie', match: '92%', reason: 'Adds lift and highlights your cheekbones.' },
  { name: 'Curly Shag', match: '89%', reason: 'Soft volume complements your natural proportions.' },
  { name: 'Curtain Layers', match: '86%', reason: 'Face-framing movement creates gentle definition.' },
];

function Button({ label, onPress, secondary = false, icon, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean }) {
  return <Pressable disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.buttonSecondary, disabled && s.buttonDisabled, pressed && s.pressed]}>
    {icon && <Ionicons name={icon} size={19} color={secondary ? C.rose : C.white} />}
    <Text style={[s.buttonText, secondary && s.buttonTextSecondary]}>{label}</Text>
  </Pressable>;
}

function Header({ title, onBack, action }: { title: string; onBack?: () => void; action?: keyof typeof Ionicons.glyphMap }) {
  return <View style={s.header}>
    {onBack ? <Pressable onPress={onBack} style={s.iconButton}><Ionicons name="chevron-back" size={22} color={C.ink} /></Pressable> : <View style={s.logoSmall}><Text style={s.logoMark}>F</Text></View>}
    <Text style={s.headerTitle}>{title}</Text>
    <View style={s.iconButton}>{action && <Ionicons name={action} size={21} color={C.ink} />}</View>
  </View>;
}

function SectionTitle({ title, action, onAction, actionLoading = false }: { title: string; action?: string; onAction?: () => void; actionLoading?: boolean }) {
  return <View style={s.sectionHead}><Text style={s.sectionTitle}>{title}</Text>{action && (onAction ? <Pressable accessibilityRole="button" disabled={actionLoading} onPress={onAction} style={({ pressed }) => [s.sectionAction, pressed && s.pressed]}>{actionLoading ? <ActivityIndicator size="small" color={C.rose} /> : <><Text style={s.link}>{action}</Text><Ionicons name="map-outline" size={17} color={C.rose} /></>}</Pressable> : <Text style={s.link}>{action}</Text>)}</View>;
}

function Art({ height = 160, quadrant }: { height?: number; quadrant?: number }) {
  if (quadrant === undefined) return <Image source={artwork} style={[s.art, { height }]} />;
  return <View style={[s.artCrop, { height }]}><Image source={artwork} style={[s.artSheet, quadrant === 1 && s.q1, quadrant === 2 && s.q2, quadrant === 3 && s.q3]} /></View>;
}

function Field({ placeholder, secure, icon, value, onChangeText, keyboardType = 'default', autoCapitalize = 'sentences' }: { placeholder: string; secure?: boolean; icon: keyof typeof Ionicons.glyphMap; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'email-address' | 'phone-pad'; autoCapitalize?: 'none' | 'sentences' }) {
  return <View style={s.field}><Ionicons name={icon} size={19} color={C.muted} /><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#A89DA0" secureTextEntry={secure} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={s.input} /></View>;
}

function SalonLogo({ name, large = false }: { name: string; large?: boolean }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  return <View style={[s.salonLogo, large && s.salonLogoLarge]}><Ionicons name="cut" size={large ? 34 : 19} color={C.white} /><Text style={[s.salonLogoText, large && s.salonLogoTextLarge]}>{initials}</Text></View>;
}

function TabBar({ screen, go }: { screen: Screen; go: (x: Screen) => void }) {
  const tabs: { key: Screen; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'home', label: 'Home', icon: 'home-outline' }, { key: 'scan', label: 'Scan', icon: 'scan-outline' },
    { key: 'bookings', label: 'Bookings', icon: 'calendar-outline' }, { key: 'profile', label: 'Profile', icon: 'person-outline' },
  ];
  return <View style={s.tabBar}>{tabs.map(t => {
    const active = screen === t.key || (t.key === 'scan' && ['processing', 'result', 'recommendations', 'style-detail'].includes(screen));
    return <Pressable key={t.key} onPress={() => go(t.key)} style={s.tabItem}><Ionicons name={active ? (t.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : t.icon} size={22} color={active ? C.rose : C.muted} /><Text style={[s.tabLabel, active && s.tabActive]}>{t.label}</Text></Pressable>;
  })}</View>;
}

function ScreenFrame({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;
  return <View style={[s.webShell, isDesktopWeb && s.webShellDesktop]}><SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>{scroll ? <ScrollView contentContainerStyle={[s.scroll, isDesktopWeb && s.scrollDesktop]} showsVerticalScrollIndicator={false}>{children}</ScrollView> : children}</SafeAreaView></View>;
}

function DesktopNavigation({ screen, go }: { screen: Screen; go: (screen: Screen) => void }) {
  const items: { key: Screen; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'home', label: 'Overview', icon: 'grid-outline' },
    { key: 'scan', label: 'Face scan', icon: 'scan-outline' },
    { key: 'salons', label: 'Find salons', icon: 'storefront-outline' },
    { key: 'bookings', label: 'Bookings', icon: 'calendar-outline' },
    { key: 'saved', label: 'Saved styles', icon: 'heart-outline' },
    { key: 'profile', label: 'Profile', icon: 'person-outline' },
  ];
  return <View style={s.desktopNav}>
    <View style={s.desktopBrand}><View style={s.logoSmall}><Text style={s.logoMark}>F</Text></View><Text style={s.desktopBrandText}>FACE-FIT</Text></View>
    <Text style={s.desktopNavLabel}>MENU</Text>
    <View style={s.desktopNavItems}>{items.map(item => {
      const active = screen === item.key || (item.key === 'scan' && ['processing', 'result', 'recommendations', 'style-detail'].includes(screen));
      return <Pressable accessibilityRole="button" key={item.key} onPress={() => go(item.key)} style={({ pressed }) => [s.desktopNavItem, active && s.desktopNavItemActive, pressed && s.pressed]}><Ionicons name={active ? (item.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : item.icon} size={20} color={active ? C.rose : C.muted} /><Text style={[s.desktopNavText, active && s.desktopNavTextActive]}>{item.label}</Text></Pressable>;
    })}</View>
    <View style={s.desktopHelp}><Ionicons name="sparkles" size={21} color={C.gold} /><Text style={s.cardTitle}>Your style space</Text><Text style={s.small}>Scan, discover, and book your next look.</Text></View>
  </View>;
}

export default function FaceFitPrototype() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;
  const [screen, setScreen] = useState<Screen>('splash');
  const [faceAnalysisConsent, setFaceAnalysisConsent] = useState(false);
  const [locationConsent, setLocationConsent] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<MapCoordinate | null>(null);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [salonRecords, setSalonRecords] = useState<Salon[]>([]);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [salonServices, setSalonServices] = useState<SalonService[]>([]);
  const [salonsLoading, setSalonsLoading] = useState(true);
  const [salonsError, setSalonsError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [bookingRecords, setBookingRecords] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [accountRole, setAccountRole] = useState<'customer' | 'owner'>('customer');
  const [salonView, setSalonView] = useState<'list' | 'map'>('list');
  const [selectedService, setSelectedService] = useState<SalonService | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const back = (fallback: Screen = 'home') => setScreen(fallback);
  const mainScreens = ['home', 'scan', 'processing', 'result', 'recommendations', 'style-detail', 'bookings', 'profile'] as Screen[];

  useEffect(() => { if (screen === 'splash') { const t = setTimeout(() => setScreen('onboarding'), 1400); return () => clearTimeout(t); } }, [screen]);
  useEffect(() => { if (screen === 'processing') { const t = setTimeout(() => setScreen('result'), 2200); return () => clearTimeout(t); } }, [screen]);
  const loadSalons = useCallback(async () => {
    setSalonsLoading(true);
    setSalonsError(null);
    try {
      setSalonRecords(await getSalons());
    } catch (error) {
      setSalonsError(error instanceof Error ? error.message : 'Unable to load salons.');
    } finally {
      setSalonsLoading(false);
    }
  }, []);
  useEffect(() => { void loadSalons(); }, [loadSalons]);
  const loadBookings = useCallback(async () => {
    if (!authToken) return;
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      setBookingRecords(await getBookings(authToken));
    } catch (error) {
      setBookingsError(error instanceof Error ? error.message : 'Unable to load bookings.');
    } finally {
      setBookingsLoading(false);
    }
  }, [authToken]);
  useEffect(() => { if (screen === 'bookings') void loadBookings(); }, [loadBookings, screen]);

  const openSalon = async (salon: Salon) => {
    setSelectedSalon(salon);
    setSalonServices([]);
    setScreen('salon-detail');
    try {
      setSalonServices(await getSalonServices(salon.id));
    } catch {
      setSalonServices([]);
    }
  };

  const submitAuth = async (isSignup: boolean) => {
    if (authLoading) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = isSignup
        ? await signupUser({ fullName, email, phone, password, role: accountRole })
        : await loginUser({ email, password });
      setAuthUser(result.user);
      setAuthToken(result.token);
      setPassword('');
      setScreen(result.user.role === 'owner' ? 'owner-dashboard' : 'consent');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to authenticate.');
    } finally {
      setAuthLoading(false);
    }
  };

  const confirmBooking = async () => {
    if (!authToken || !selectedService || !selectedDate || !selectedTime || bookingLoading) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      await createBooking(authToken, { serviceId: selectedService.id, appointmentAt: `${selectedDate} ${selectedTime}:00` });
      await loadBookings();
      setScreen('success');
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Unable to create booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const toDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const mondayOffset = (new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay() + 6) % 7;
  const calendarDays = [...Array(mondayOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const timeOptions = [{ label: '9:00 AM', value: '09:00' }, { label: '10:30 AM', value: '10:30' }, { label: '1:00 PM', value: '13:00' }, { label: '2:30 PM', value: '14:30' }, { label: '4:00 PM', value: '16:00' }, { label: '5:30 PM', value: '17:30' }];
  const isTimePast = (value: string) => {
    if (!selectedDate || selectedDate !== toDateKey(today)) return false;
    const [hours, minutes] = value.split(':').map(Number);
    const slot = new Date();
    slot.setHours(hours, minutes, 0, 0);
    return slot <= new Date();
  };
  const selectedAppointment = selectedDate && selectedTime ? new Date(`${selectedDate}T${selectedTime}:00`) : null;
  const selectedDateLabel = selectedAppointment?.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) || 'Choose a date';
  const selectedTimeLabel = selectedAppointment?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) || 'Choose a time';

  const processScan = (uri: string) => {
    setUploaded(uri);
    setScreen('processing');
  };
  const openCurrentLocationMap = async () => {
    if (isGettingLocation) return;
    setIsGettingLocation(true);
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert('Location is turned off', 'Turn on location services, then try View map again.');
        return;
      }

      const permissionResult = await Location.requestForegroundPermissionsAsync();
      if (permissionResult.status !== Location.PermissionStatus.GRANTED) {
        Alert.alert('Location permission needed', 'Allow location while using FaceFit to open a map at your current position.');
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentLocation({ latitude: coords.latitude, longitude: coords.longitude });
      setMapVisible(true);
    } catch {
      Alert.alert('Unable to open the map', 'We could not get your current location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const auth = (signup = false) => <ScreenFrame><Header title={signup ? 'Create account' : 'Welcome back'} onBack={() => setScreen('onboarding')} />
    <View style={s.authIntro}><Text style={s.eyebrow}>YOUR BEST LOOK STARTS HERE</Text><Text style={s.title}>{signup ? 'Join FACE-FIT' : 'Good to see you'}</Text><Text style={s.body}>Personalized hair, trusted salons, one easy booking.</Text></View>
    {signup && <><Text style={s.accountTypeLabel}>I&apos;m creating an account as</Text><View style={s.accountTypeRow}><Pressable accessibilityRole="radio" accessibilityState={{ checked: accountRole === 'customer' }} onPress={() => setAccountRole('customer')} style={[s.accountTypeCard, accountRole === 'customer' && s.accountTypeCardActive]}><Ionicons name="person-outline" size={24} color={accountRole === 'customer' ? C.rose : C.muted} /><Text style={[s.accountTypeTitle, accountRole === 'customer' && s.accountTypeTitleActive]}>Customer</Text><Text style={s.accountTypeCaption}>Discover styles and book salons</Text></Pressable><Pressable accessibilityRole="radio" accessibilityState={{ checked: accountRole === 'owner' }} onPress={() => setAccountRole('owner')} style={[s.accountTypeCard, accountRole === 'owner' && s.accountTypeCardActive]}><Ionicons name="storefront-outline" size={24} color={accountRole === 'owner' ? C.rose : C.muted} /><Text style={[s.accountTypeTitle, accountRole === 'owner' && s.accountTypeTitleActive]}>Business owner</Text><Text style={s.accountTypeCaption}>Manage a salon and bookings</Text></Pressable></View></>}
    {signup && <Field icon="person-outline" placeholder="Full name" value={fullName} onChangeText={setFullName} />}<Field icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />{signup && <Field icon="call-outline" placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />}<Field icon="lock-closed-outline" placeholder="Password (at least 8 characters)" value={password} onChangeText={setPassword} secure autoCapitalize="none" />
    {!signup && <Text style={[s.link, { textAlign: 'right', marginBottom: 22 }]}>Forgot password?</Text>}
    {authError && <View style={s.authError}><Ionicons name="alert-circle-outline" size={20} color="#9C3045" /><Text style={s.authErrorText}>{authError}</Text></View>}
    <Button label={authLoading ? 'Please wait…' : signup ? 'Create account' : 'Log in'} disabled={authLoading} onPress={() => void submitAuth(signup)} />
    <Pressable onPress={() => { setAuthError(null); setScreen(signup ? 'login' : 'signup'); }}><Text style={s.authSwitch}>{signup ? 'Already have an account? Log in' : 'New here? Create an account'}</Text></Pressable>
  </ScreenFrame>;

  const home = <ScreenFrame><View style={s.topRow}><View><Text style={s.greeting}>Hello, {authUser?.fullName.split(' ')[0] || 'there'}</Text><Text style={s.body}>Ready for a fresh look?</Text></View><Pressable onPress={() => setScreen('notifications')} style={s.avatar}><Ionicons name="notifications-outline" size={21} color={C.roseDark} /></Pressable></View>
    <View style={s.hero}><View style={{ flex: 1 }}><Text style={s.heroKicker}>AI FACE ANALYSIS</Text><Text style={s.heroTitle}>Find the cut that fits you.</Text><Pressable onPress={() => setScreen('scan')} style={s.heroButton}><Text style={s.heroButtonText}>Scan your face</Text><Ionicons name="arrow-forward" size={18} color={C.roseDark} /></Pressable></View><View style={s.faceMini}><Ionicons name="scan" size={53} color={C.rose} /></View></View>
    <SectionTitle title="Salons near you" action="View map" onAction={openCurrentLocationMap} actionLoading={isGettingLocation} />{salonsLoading ? <ActivityIndicator color={C.rose} style={s.dataLoader} /> : salonsError ? <Pressable onPress={loadSalons} style={s.dataState}><Ionicons name="cloud-offline-outline" size={25} color={C.rose} /><Text style={s.cardTitle}>Could not load salons</Text><Text style={s.small}>{salonsError} · Tap to retry</Text></Pressable> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hRow}>{salonRecords.slice(0, 6).map((salon, i) => <Pressable key={salon.id} onPress={() => void openSalon(salon)} style={s.salonCard}><View style={[s.salonThumb, { backgroundColor: i % 2 ? '#ECD7D2' : '#F2E7DF' }]}><Ionicons name="cut-outline" size={28} color={C.rose} /></View><Text numberOfLines={1} style={s.cardTitle}>{salon.name}</Text><Text numberOfLines={2} style={s.small}>{salon.address}</Text></Pressable>)}</ScrollView>}
    <View style={s.tip}><Ionicons name="sparkles" size={22} color={C.gold} /><View style={{ flex: 1 }}><Text style={s.cardTitle}>Stylist tip</Text><Text style={s.small}>Soft layers are trending—and perfect for oval faces.</Text></View></View>
  </ScreenFrame>;

  const scan = <FaceScanScreen onBack={() => back()} onCaptured={processScan} />;

  const processing = <ScreenFrame scroll={false}><View style={s.centerPage}><View style={s.processIcon}><Ionicons name="scan" size={50} color={C.rose} /><ActivityIndicator color={C.rose} size="large" style={StyleSheet.absoluteFill} /></View><Text style={s.title}>Analyzing your face shape…</Text><Text style={[s.body, s.centerText]}>Mapping landmarks, measuring proportions, and ranking hairstyles for you.</Text><View style={s.steps}>{['Preprocessing image', 'Detecting face landmarks', 'Classifying face shape', 'Matching hairstyles'].map((x, i) => <View style={s.step} key={x}><View style={[s.stepDot, i < 2 && s.stepDone]}>{i < 2 && <Ionicons name="checkmark" size={13} color={C.white} />}</View><Text style={s.small}>{x}</Text></View>)}</View></View></ScreenFrame>;

  const result = <ScreenFrame><Header title="Your result" onBack={() => setScreen('home')} action="share-outline" /><Text style={s.eyebrow}>FACE SHAPE DETECTED</Text><Text style={s.display}>Oval</Text><View style={s.resultVisual}>{uploaded ? <Image source={{ uri: uploaded }} style={s.resultImage} /> : <Art height={230} quadrant={0} />}<View style={s.outlineOval} /><View style={s.confidence}><Text style={s.confidenceText}>94% confidence</Text></View></View><Text style={s.sectionTitle}>Balanced & versatile</Text><Text style={s.body}>Your face is slightly longer than it is wide, with a gently rounded jaw. Most cuts suit you—especially styles that preserve your natural balance.</Text><View style={s.chipRow}>{['Soft layers', 'Curtain bangs', 'Textured bob'].map(x => <View style={s.chip} key={x}><Text style={s.chipText}>{x}</Text></View>)}</View><Button label="See my hairstyle matches" onPress={() => setScreen('recommendations')} icon="sparkles" /><Button label="Scan again" onPress={() => setScreen('scan')} secondary /></ScreenFrame>;

  const recommendations = <ScreenFrame><Header title="Top matches" onBack={() => setScreen('result')} action="heart-outline" /><Text style={s.body}>Ranked for your oval face, texture, and style goals.</Text><View style={s.chatBox}><Ionicons name="sparkles" size={19} color={C.rose} /><TextInput style={s.chatInput} placeholder="Refine: shorter, curly, low-maintenance…" placeholderTextColor="#9A8D91" /><Ionicons name="arrow-up-circle" size={27} color={C.rose} /></View>{stylesList.map((item, i) => <Pressable onPress={() => setScreen('style-detail')} style={s.recCard} key={item.name}><Art height={142} quadrant={i} /><View style={s.matchBadge}><Text style={s.matchText}>{item.match} match</Text></View><View style={s.recBody}><View style={s.sectionHead}><Text style={s.cardTitle}>{item.name}</Text><Ionicons name="heart-outline" size={20} color={C.rose} /></View><Text style={s.small}>{item.reason}</Text></View></Pressable>)}</ScreenFrame>;

  const styleDetail = <ScreenFrame><Header title="Style details" onBack={() => setScreen('recommendations')} action="heart-outline" /><Art height={330} quadrant={0} /><View style={s.detailTitle}><View><Text style={s.title}>Soft Layered Lob</Text><Text style={s.matchText}>96% match for you</Text></View><View style={s.scoreCircle}><Text style={s.scoreText}>96</Text></View></View><Text style={s.sectionTitle}>Why it suits you</Text><Text style={s.body}>{"The collarbone length preserves your face's balanced proportions. Soft layers add movement around the cheeks without making the face appear longer."}</Text><View style={s.chipRow}>{['Medium length', 'Low upkeep', 'Works wavy'].map(x => <View style={s.chip} key={x}><Text style={s.chipText}>{x}</Text></View>)}</View><Button label="Find a salon for this style" onPress={() => setScreen('salons')} icon="location" /></ScreenFrame>;

  const mappedSalons = salonRecords.flatMap(salon => salon.latitude != null && salon.longitude != null ? [{ id: salon.id, name: salon.name, address: salon.address, latitude: salon.latitude, longitude: salon.longitude }] : []);
  const salons = <ScreenFrame><Header title="Nasugbu salons" onBack={() => setScreen('home')} action="options-outline" /><View style={s.segment}><Pressable onPress={() => setSalonView('list')} style={salonView === 'list' ? s.segmentActive : s.segmentItem}><Ionicons name="list" size={17} color={salonView === 'list' ? C.rose : C.muted} /><Text style={salonView === 'list' ? s.segmentText : s.small}>List</Text></Pressable><Pressable onPress={() => setSalonView('map')} style={salonView === 'map' ? s.segmentActive : s.segmentItem}><Ionicons name="map-outline" size={17} color={salonView === 'map' ? C.rose : C.muted} /><Text style={salonView === 'map' ? s.segmentText : s.small}>Map</Text></Pressable></View>{salonsLoading ? <ActivityIndicator color={C.rose} style={s.dataLoader} /> : salonsError ? <Pressable onPress={loadSalons} style={s.dataState}><Text style={s.cardTitle}>Unable to reach the FaceFit API</Text><Text style={s.small}>{salonsError} · Tap to retry</Text></Pressable> : salonView === 'map' ? <><SalonMap salons={mappedSalons} onSelectSalon={salonId => { const salon = salonRecords.find(item => item.id === salonId); if (salon) void openSalon(salon); }} />{mappedSalons.length === 0 && <View style={s.mapNotice}><Ionicons name="location-outline" size={21} color={C.rose} /><Text style={s.small}>No verified coordinates are available yet. Run the salon coordinate importer before displaying markers.</Text></View>}<Text style={s.mapAttribution}>Map data © OpenStreetMap contributors</Text></> : salonRecords.length === 0 ? <View style={s.dataState}><Text style={s.cardTitle}>No salons found</Text><Text style={s.small}>Run npm run db:init in the server directory.</Text></View> : salonRecords.map(salon => <Pressable key={salon.id} onPress={() => void openSalon(salon)} style={s.listCard}><View style={s.salonSquare}><Ionicons name="cut" size={28} color={C.rose} /></View><View style={{ flex: 1 }}><Text style={s.cardTitle}>{salon.name}</Text><Text style={s.small}>{salon.address}</Text><Text style={s.small}>{salon.phone || salon.city}</Text></View><Ionicons name="chevron-forward" size={20} color={C.muted} /></Pressable>)}</ScreenFrame>;

  const salonDetail = <ScreenFrame><Header title="Salon profile" onBack={() => setScreen('salons')} action="heart-outline" />{selectedSalon ? <><View style={s.salonIdentity}><SalonLogo name={selectedSalon.name} large /><Text style={s.salonIdentityName}>{selectedSalon.name}</Text><Text style={[s.small, s.centerText]}>{selectedSalon.address} · {selectedSalon.city}</Text></View><View style={s.chipRow}>{selectedSalon.phone && <View style={s.chip}><Text style={s.chipText}>{selectedSalon.phone}</Text></View>}{selectedSalon.opening_time && <View style={s.chip}><Text style={s.chipText}>Opens {selectedSalon.opening_time.slice(0, 5)}</Text></View>}<View style={s.chip}><Text style={s.chipText}>Verified source</Text></View></View><Text style={s.body}>{selectedSalon.description}</Text><SectionTitle title="Services" />{salonServices.length ? salonServices.map(service => <Pressable onPress={() => { setSelectedService(service); setScreen('datetime'); }} style={s.serviceRow} key={service.id}><View><Text style={s.cardTitle}>{service.name}</Text><Text style={s.small}>₱{service.price.toLocaleString()} · {service.duration_minutes} min</Text></View><Ionicons name="add-circle" size={27} color={C.rose} /></Pressable>) : <View style={s.dataState}><Text style={s.cardTitle}>Services coming soon</Text><Text style={s.small}>This salon has no services entered in the database yet.</Text></View>}<Button label="Choose a service" disabled={salonServices.length === 0} onPress={() => setScreen('service')} /></> : <View style={s.dataState}><Text style={s.cardTitle}>Choose a salon first</Text><Button label="Browse salons" onPress={() => setScreen('salons')} /></View>}</ScreenFrame>;

  const selection = (_kind: 'service' | 'stylist') => <ScreenFrame><Header title="Choose a service" onBack={() => setScreen('salon-detail')} /><View style={s.progress}><View style={[s.progressFill, { width: '50%' }]} /></View><Text style={s.body}>Step 1 of 2 · {selectedSalon?.name}</Text>{salonServices.map(service => <Pressable key={service.id} onPress={() => setSelectedService(service)} style={[s.choiceCard, selectedService?.id === service.id && s.choiceSelected]}><View style={s.choiceIcon}><Ionicons name="cut" size={24} color={C.rose} /></View><View style={{ flex: 1 }}><Text style={s.cardTitle}>{service.name}</Text><Text style={s.small}>₱{service.price.toLocaleString()} · {service.duration_minutes} min</Text></View><Ionicons name={selectedService?.id === service.id ? 'radio-button-on' : 'radio-button-off'} size={22} color={selectedService?.id === service.id ? C.rose : C.muted} /></Pressable>)}<View style={s.bottomSpace} /><Button label="Choose date & time" disabled={!selectedService} onPress={() => setScreen('datetime')} /></ScreenFrame>;

  const datetime = <ScreenFrame><Header title="Date & time" onBack={() => setScreen('service')} /><View style={s.progress}><View style={[s.progressFill, { width: '100%' }]} /></View><Text style={s.body}>Step 2 of 2</Text><View style={s.monthRow}><Pressable disabled={calendarMonth <= new Date(today.getFullYear(), today.getMonth(), 1)} onPress={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={calendarMonth <= new Date(today.getFullYear(), today.getMonth(), 1) && s.disabledControl}><Ionicons name="chevron-back" size={22} color={C.muted} /></Pressable><Text style={s.sectionTitle}>{calendarMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}</Text><Pressable onPress={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Ionicons name="chevron-forward" size={22} color={C.muted} /></Pressable></View><View style={s.calendar}>{['M','T','W','T','F','S','S'].map((label, index) => <View key={`${label}${index}`} style={s.day}><Text style={s.calendarWeekday}>{label}</Text></View>)}{calendarDays.map((day, index) => { if (day === null) return <View key={`blank${index}`} style={s.day} />; const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day); const key = toDateKey(date); const disabled = date < today; const active = selectedDate === key; return <Pressable accessibilityRole="button" accessibilityState={{ disabled, selected: active }} disabled={disabled} onPress={() => { setSelectedDate(key); setSelectedTime(null); }} key={key} style={[s.day, active && s.dayActive]}><Text style={[s.dayText, disabled && s.dayTextDisabled, active && s.dayTextActive]}>{day}</Text></Pressable>; })}</View><SectionTitle title="Available times" />{!selectedDate && <Text style={s.body}>Select an available date first.</Text>}<View style={s.timeGrid}>{timeOptions.map(option => { const disabled = !selectedDate || isTimePast(option.value); const active = selectedTime === option.value; return <Pressable disabled={disabled} onPress={() => setSelectedTime(option.value)} style={[s.time, active && s.timeActive, disabled && s.timeDisabled]} key={option.value}><Text style={[s.chipText, active && s.timeTextActive, disabled && s.dayTextDisabled]}>{option.label}</Text></Pressable>; })}</View><Button label="Review booking" disabled={!selectedService || !selectedDate || !selectedTime} onPress={() => setScreen('summary')} /></ScreenFrame>;

  const summary = <ScreenFrame><Header title="Review booking" onBack={() => setScreen('datetime')} /><View style={s.summaryCard}>{selectedSalon && <SalonLogo name={selectedSalon.name} />}<Text style={s.title}>{selectedSalon?.name}</Text><Text style={s.body}>{selectedService?.name}</Text><View style={s.divider} />{[['calendar',selectedDateLabel],['time',`${selectedTimeLabel} · ${selectedService?.duration_minutes || 0} min`],['location',selectedSalon?.address || 'Nasugbu, Batangas']].map(x => <View style={s.summaryRow} key={x[0]}><Ionicons name={x[0] as keyof typeof Ionicons.glyphMap} size={21} color={C.rose} /><Text style={s.cardTitle}>{x[1]}</Text></View>)}<View style={s.divider} /><View style={s.sectionHead}><Text style={s.cardTitle}>Estimated total</Text><Text style={s.price}>₱{selectedService?.price.toLocaleString()}</Text></View></View><View style={s.notice}><Ionicons name="information-circle" size={21} color={C.rose} /><Text style={s.small}>Starter prices are estimates. Confirm final pricing with the salon.</Text></View>{bookingError && <View style={s.authError}><Text style={s.authErrorText}>{bookingError}</Text></View>}<Button label={bookingLoading ? 'Confirming…' : 'Confirm booking'} disabled={!selectedService || !selectedDate || !selectedTime || bookingLoading} onPress={() => void confirmBooking()} /></ScreenFrame>;

  const success = <ScreenFrame scroll={false}><View style={s.centerPage}><View style={s.successIcon}><Ionicons name="checkmark" size={52} color={C.white} /></View><Text style={s.display}>{"You're booked!"}</Text><Text style={[s.body, s.centerText]}>Your appointment at {selectedSalon?.name} was saved.</Text><View style={s.ticket}><Text style={s.eyebrow}>{selectedDateLabel.toUpperCase()} · {selectedTimeLabel.toUpperCase()}</Text><Text style={s.title}>{selectedService?.name}</Text><Text style={s.body}>Status: pending confirmation</Text></View><Button label="View my bookings" onPress={() => setScreen('bookings')} /><Button label="Back to home" onPress={() => setScreen('home')} secondary /></View></ScreenFrame>;

  const bookings = <ScreenFrame><Header title="My bookings" action="notifications-outline" />{bookingsLoading ? <ActivityIndicator color={C.rose} style={s.dataLoader} /> : bookingsError ? <Pressable onPress={() => void loadBookings()} style={s.dataState}><Ionicons name="cloud-offline-outline" size={28} color={C.rose} /><Text style={s.cardTitle}>Could not load bookings</Text><Text style={s.small}>{bookingsError} · Tap to retry</Text></Pressable> : bookingRecords.length === 0 ? <View style={s.empty}><Ionicons name="calendar-outline" size={40} color="#CDBEC2" /><Text style={s.cardTitle}>No appointments yet</Text><Text style={s.small}>Bookings you make with a salon will appear here.</Text></View> : bookingRecords.map(booking => <View style={s.bookingCard} key={booking.id}><Text style={s.eyebrow}>{new Date(booking.appointmentAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }).toUpperCase()}</Text><Text style={s.title}>{booking.serviceName}</Text><Text style={s.body}>{booking.salonName}{booking.stylistName ? ` · ${booking.stylistName}` : ''}</Text><View style={s.divider} /><View style={s.bookingMeta}><Text style={s.chipText}>₱{booking.price.toLocaleString()}</Text><Text style={s.chipText}>{booking.durationMinutes} min</Text><Text style={s.bookingStatus}>{booking.status}</Text></View></View>)}</ScreenFrame>;

  const profile = <ScreenFrame><Header title="Profile" action="settings-outline" /><View style={s.profileHead}><View style={s.profileAvatar}><Text style={s.profileInitial}>{authUser?.fullName.charAt(0).toUpperCase() || '?'}</Text></View><View><Text style={s.title}>{authUser?.fullName || 'FaceFit user'}</Text><Text style={s.body}>{authUser?.email || 'Sign in to view your profile'}</Text></View></View><View style={s.preferenceCard}><Text style={s.eyebrow}>MY HAIR PROFILE</Text><View style={s.preferenceRow}>{[['Type','Wavy'],['Length','Medium'],['Texture','Fine']].map(x => <View key={x[0]}><Text style={s.small}>{x[0]}</Text><Text style={s.cardTitle}>{x[1]}</Text></View>)}</View></View>{[
    ['heart-outline','Saved hairstyles','saved'], ['notifications-outline','Notifications','notifications'], ['star-outline','My reviews','reviews'], ['shield-checkmark-outline','Privacy & settings','settings']
  ].map(x => <Pressable key={x[1]} onPress={() => setScreen(x[2] as Screen)} style={s.menuRow}><View style={s.menuIcon}><Ionicons name={x[0] as keyof typeof Ionicons.glyphMap} size={21} color={C.rose} /></View><Text style={[s.cardTitle, { flex: 1 }]}>{x[1]}</Text><Ionicons name="chevron-forward" size={20} color={C.muted} /></Pressable>)}<SectionTitle title="Professional portals" /><View style={s.roleRow}><Pressable onPress={() => setScreen('stylist-dashboard')} style={s.roleCard}><Ionicons name="cut" size={26} color={C.rose} /><Text style={s.cardTitle}>Hairstylist</Text></Pressable><Pressable onPress={() => setScreen('owner-dashboard')} style={s.roleCard}><Ionicons name="business" size={26} color={C.rose} /><Text style={s.cardTitle}>Salon owner</Text></Pressable></View></ScreenFrame>;

  const simplePage = (title: string, rows: string[]) => <ScreenFrame><Header title={title} onBack={() => setScreen('profile')} />{title === 'Saved hairstyles' && <Art height={190} />}{rows.map((x, i) => <View style={s.listCard} key={x}><View style={s.menuIcon}><Ionicons name={title === 'Notifications' ? 'notifications' : title === 'My reviews' ? 'star' : 'shield-checkmark'} size={20} color={C.rose} /></View><View style={{ flex: 1 }}><Text style={s.cardTitle}>{x}</Text><Text style={s.small}>{i === 0 ? 'Updated today' : 'Tap to view details'}</Text></View><Ionicons name="chevron-forward" size={18} color={C.muted} /></View>)}{title === 'My reviews' && <Button label="Leave a review" onPress={() => {}} icon="camera-outline" />}{title === 'Settings' && <Button label="Log out" onPress={() => setScreen('login')} secondary />}</ScreenFrame>;

  const rolePage = (role: 'stylist' | 'owner', page: string) => {
    const owner = role === 'owner';
    const nav: { label: string; icon: keyof typeof Ionicons.glyphMap; target: Screen }[] = owner ? [
      { label: 'Manage booking requests', icon: 'calendar', target: 'owner-bookings' }, { label: 'Services & pricing', icon: 'pricetag', target: 'owner-services' }, { label: 'Staff & specializations', icon: 'people', target: 'owner-staff' }, { label: 'Business profile & portfolio', icon: 'business', target: 'owner-profile' }, { label: 'Reviews & ratings', icon: 'star', target: 'owner-reviews' }
    ] : [
      { label: 'Upcoming appointments', icon: 'calendar', target: 'stylist-appointments' }, { label: 'Client appointment detail', icon: 'person', target: 'stylist-detail' }, { label: 'Availability & service status', icon: 'toggle', target: 'stylist-status' }, { label: 'Notifications', icon: 'notifications', target: 'stylist-notifications' }
    ];
    return <ScreenFrame><Header title={page} onBack={() => page.includes('Dashboard') ? setScreen('profile') : setScreen(owner ? 'owner-dashboard' : 'stylist-dashboard')} />{page.includes('Dashboard') && <><Text style={s.greeting}>{owner ? 'Luna & Co.' : 'Hi, Aya'}</Text><Text style={s.body}>{owner ? 'Here’s how your salon is doing today.' : 'You have 4 clients on your schedule.'}</Text><View style={s.stats}>{[[owner ? '8' : '4','Today'],[owner ? '₱12.4k' : '2','Confirmed'],['4.9','Rating']].map(x => <View style={s.stat} key={x[1]}><Text style={s.statValue}>{x[0]}</Text><Text style={s.small}>{x[1]}</Text></View>)}</View></>}{page.includes('Dashboard') ? nav.map(x => <Pressable onPress={() => setScreen(x.target)} style={s.menuRow} key={x.label}><View style={s.menuIcon}><Ionicons name={x.icon} size={21} color={C.rose} /></View><Text style={[s.cardTitle,{flex:1}]}>{x.label}</Text><Ionicons name="chevron-forward" size={20} color={C.muted} /></Pressable>) : <><View style={s.bookingCard}><Text style={s.eyebrow}>{owner ? 'SALON MANAGEMENT' : 'UPCOMING • 1:00 PM'}</Text><Text style={s.title}>{owner ? page : 'Mia Torres'}</Text><Text style={s.body}>{owner ? 'Review and update your salon information.' : 'Oval face • Wavy, medium hair • Soft Layered Lob'}</Text><Art height={150} quadrant={0} /><View style={s.chipRow}><View style={s.chip}><Text style={s.chipText}>{owner ? 'Active' : 'AI recommendation attached'}</Text></View></View></View>{owner && page === 'Booking requests' && <View style={s.roleRow}><Button label="Approve" onPress={() => {}} /><Button label="Decline" onPress={() => {}} secondary /></View>}<Button label={page.includes('Services') ? 'Add service' : page.includes('Staff') ? 'Add hairstylist' : 'Update status'} onPress={() => {}} /></>}</ScreenFrame>;
  };

  let content: React.ReactNode;
  if (screen === 'splash') content = <ScreenFrame scroll={false}><View style={s.splash}><View style={s.logo}><Text style={s.logoMarkBig}>F</Text></View><Text style={s.brand}>FACE-FIT</Text><Text style={s.splashTag}></Text><ActivityIndicator color={C.rose} style={{ marginTop: 38 }} /></View></ScreenFrame>;
  else if (screen === 'onboarding') content = <ScreenFrame scroll={false}><OnboardingScreen onGetStarted={() => setScreen('signup')} onLogin={() => setScreen('login')} /></ScreenFrame>;
  else if (screen === 'login') content = auth(false); else if (screen === 'signup') content = auth(true);
  else if (screen === 'consent') content = <ScreenFrame><Header title="Before your scan" onBack={() => setScreen('signup')} /><View style={s.consentHero}><Ionicons name="shield-checkmark" size={52} color={C.rose} /></View><Text style={s.title}>Your face data stays yours</Text><Text style={s.body}>We use your photo only to analyze facial proportions and recommend hairstyles. You control whether it is saved or deleted.</Text>{[['camera','Camera access','Needed to capture your guided face scan.'],['location','Location access','Used while the app is open to show nearby salons.'],['lock-closed','Private by design','Images and location are handled securely and never used for ads.'],['trash','Your control','Delete your scan and results from Settings anytime.']].map(x => <View style={s.consentRow} key={x[0]}><View style={s.menuIcon}><Ionicons name={x[0] as keyof typeof Ionicons.glyphMap} size={21} color={C.rose} /></View><View style={{flex:1}}><Text style={s.cardTitle}>{x[1]}</Text><Text style={s.small}>{x[2]}</Text></View></View>)}<Pressable accessibilityRole="checkbox" accessibilityState={{ checked: faceAnalysisConsent }} onPress={() => setFaceAnalysisConsent(value => !value)} style={({ pressed }) => [s.checkRow, pressed && s.pressed]}><Ionicons name={faceAnalysisConsent ? 'checkbox' : 'square-outline'} size={24} color={faceAnalysisConsent ? C.rose : C.muted} /><Text style={[s.small,{flex:1}]}>I understand and consent to face-shape analysis as described in the Privacy Notice.</Text></Pressable><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: locationConsent }} onPress={() => setLocationConsent(value => !value)} style={({ pressed }) => [s.checkRow, s.locationCheckRow, pressed && s.pressed]}><Ionicons name={locationConsent ? 'checkbox' : 'square-outline'} size={24} color={locationConsent ? C.rose : C.muted} /><Text style={[s.small,{flex:1}]}>I consent to location access while using the app so FaceFit can show salons near me.</Text></Pressable><Button label="Agree & continue" disabled={!faceAnalysisConsent || !locationConsent} onPress={() => setScreen('home')} /><Text style={[s.link,s.centerText]}>Read the full Privacy Notice</Text></ScreenFrame>;
  else if (screen === 'home') content = home; else if (screen === 'scan') content = scan; else if (screen === 'processing') content = processing; else if (screen === 'result') content = result; else if (screen === 'recommendations') content = recommendations; else if (screen === 'style-detail') content = styleDetail; else if (screen === 'salons') content = salons; else if (screen === 'salon-detail') content = salonDetail; else if (screen === 'service') content = selection('service'); else if (screen === 'stylist') content = selection('stylist'); else if (screen === 'datetime') content = datetime; else if (screen === 'summary') content = summary; else if (screen === 'success') content = success; else if (screen === 'bookings') content = bookings; else if (screen === 'profile') content = profile;
  else if (screen === 'saved') content = simplePage('Saved hairstyles', ['Soft Layered Lob', 'Textured Pixie', 'Curtain Layers']); else if (screen === 'notifications') content = simplePage('Notifications', ['Booking confirmed for July 16', 'Your new style matches are ready', 'Luna & Co. replied to your review']); else if (screen === 'reviews') content = simplePage('My reviews', ['Luna & Co. • 5 stars', 'Rose Room • 4 stars']); else if (screen === 'settings') content = simplePage('Settings', ['Edit profile', 'Privacy controls', 'Camera & location permissions', 'Delete face scan data']);
  else if (screen === 'stylist-dashboard') content = rolePage('stylist', 'Stylist Dashboard'); else if (screen === 'stylist-appointments') content = rolePage('stylist', 'Appointments'); else if (screen === 'stylist-detail') content = rolePage('stylist', 'Appointment detail'); else if (screen === 'stylist-status') content = rolePage('stylist', 'Service & availability'); else if (screen === 'stylist-notifications') content = rolePage('stylist', 'Notifications');
  else if (screen === 'owner-dashboard') content = rolePage('owner', 'Owner Dashboard'); else if (screen === 'owner-bookings') content = rolePage('owner', 'Booking requests'); else if (screen === 'owner-services') content = rolePage('owner', 'Services & pricing'); else if (screen === 'owner-staff') content = rolePage('owner', 'Staff management'); else if (screen === 'owner-profile') content = rolePage('owner', 'Business profile'); else content = rolePage('owner', 'Reviews & ratings');

  const showAppNavigation = mainScreens.includes(screen) || ['salons', 'salon-detail', 'service', 'stylist', 'datetime', 'summary', 'success', 'saved', 'notifications', 'reviews', 'settings'].includes(screen);
  return <KeyboardAvoidingView style={s.app} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><StatusBar style={screen === 'scan' ? 'light' : 'dark'} /><View style={[s.appViewport, isDesktopWeb && s.appViewportDesktop]}>{isDesktopWeb && showAppNavigation && <DesktopNavigation screen={screen} go={setScreen} />}<View style={s.contentViewport}>{content}</View></View>{!isDesktopWeb && mainScreens.includes(screen) && !['scan','processing','result','recommendations','style-detail'].includes(screen) && <View style={s.tabShell}><TabBar screen={screen} go={setScreen} /></View>}<Modal visible={mapVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setMapVisible(false)}><SafeAreaView style={s.mapModal}><View style={s.mapHeader}><View><Text style={s.mapTitle}>Your location</Text><Text style={s.small}>Explore salons around your current position</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close map" onPress={() => setMapVisible(false)} style={s.mapClose}><Ionicons name="close" size={24} color={C.ink} /></Pressable></View>{currentLocation && <LocationMap coordinate={currentLocation} />}</SafeAreaView></Modal></KeyboardAvoidingView>;
}

const s = StyleSheet.create({
  app:{flex:1,backgroundColor:'#EFE8E8'},appViewport:{flex:1,width:'100%'},appViewportDesktop:{width:'100%',maxWidth:1440,alignSelf:'center',flexDirection:'row',backgroundColor:C.pale,shadowColor:'#3B252B',shadowOpacity:.1,shadowRadius:28},contentViewport:{flex:1,minWidth:0},webShell:{flex:1,width:'100%',maxWidth:430,alignSelf:'center',backgroundColor:C.pale,overflow:'hidden'},webShellDesktop:{maxWidth:960},safe:{flex:1},scroll:{padding:20,paddingBottom:120},scrollDesktop:{paddingHorizontal:48,paddingTop:30,paddingBottom:60},pressed:{opacity:.82,transform:[{scale:.985}]},
  desktopNav:{width:264,paddingHorizontal:22,paddingVertical:28,backgroundColor:C.white,borderRightWidth:1,borderRightColor:C.line},desktopBrand:{height:52,flexDirection:'row',alignItems:'center',gap:12,marginBottom:38},desktopBrandText:{fontSize:19,fontWeight:'900',letterSpacing:1.5,color:C.roseDark},desktopNavLabel:{fontSize:10,fontWeight:'800',letterSpacing:1.4,color:'#A89DA0',marginLeft:12,marginBottom:10},desktopNavItems:{gap:7},desktopNavItem:{height:48,borderRadius:14,paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:12},desktopNavItemActive:{backgroundColor:C.blush},desktopNavText:{fontSize:14,fontWeight:'700',color:C.muted},desktopNavTextActive:{color:C.roseDark},desktopHelp:{marginTop:'auto',padding:17,borderRadius:18,backgroundColor:'#FFF3DA',gap:6},
  header:{height:56,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18},headerTitle:{fontSize:17,fontWeight:'700',color:C.ink},iconButton:{width:40,height:40,borderRadius:20,backgroundColor:C.white,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:C.line},logoSmall:{width:36,height:36,borderRadius:12,backgroundColor:C.rose,alignItems:'center',justifyContent:'center'},logoMark:{fontSize:21,fontWeight:'900',fontStyle:'italic',color:C.white},
  title:{fontSize:25,lineHeight:31,fontWeight:'800',color:C.ink},display:{fontSize:38,lineHeight:46,fontWeight:'800',color:C.ink,marginBottom:10},body:{fontSize:15,lineHeight:23,color:C.muted,marginBottom:20},small:{fontSize:13,lineHeight:19,color:C.muted},lightSmall:{fontSize:12,color:C.white,marginTop:4},eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:1.2,color:C.rose,marginBottom:8},link:{color:C.rose,fontSize:14,fontWeight:'700'},mutedLink:{color:C.muted,fontSize:14,fontWeight:'700'},centerText:{textAlign:'center'},
  button:{minHeight:54,borderRadius:18,backgroundColor:C.rose,flexDirection:'row',gap:9,alignItems:'center',justifyContent:'center',paddingHorizontal:18,marginTop:12},buttonSecondary:{backgroundColor:C.white,borderWidth:1,borderColor:'#DDBFC7'},buttonDisabled:{opacity:.45},buttonText:{fontSize:16,fontWeight:'800',color:C.white},buttonTextSecondary:{color:C.rose},
  splash:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:C.pale},logo:{width:104,height:104,borderRadius:34,backgroundColor:C.rose,alignItems:'center',justifyContent:'center',shadowColor:C.rose,shadowOpacity:.25,shadowRadius:24,elevation:8},logoMarkBig:{fontSize:62,fontWeight:'900',fontStyle:'italic',color:C.white},brand:{fontSize:28,fontWeight:'900',letterSpacing:2.2,color:C.roseDark,marginTop:22},splashTag:{fontSize:14,color:C.muted,marginTop:6},
  authSwitch:{textAlign:'center',color:C.roseDark,fontWeight:'700',fontSize:14,marginTop:22},
  authError:{padding:13,borderRadius:14,backgroundColor:'#FCE8EC',flexDirection:'row',alignItems:'center',gap:9,marginBottom:4},authErrorText:{flex:1,fontSize:13,lineHeight:19,color:'#81263A',fontWeight:'600'},
  accountTypeLabel:{fontSize:13,fontWeight:'700',color:C.ink,marginBottom:10},accountTypeRow:{flexDirection:'row',gap:10,marginBottom:16},accountTypeCard:{flex:1,minHeight:125,padding:14,borderRadius:17,backgroundColor:C.white,borderWidth:1,borderColor:C.line,gap:6},accountTypeCardActive:{borderWidth:2,borderColor:C.rose,backgroundColor:'#FFF9FA'},accountTypeTitle:{fontSize:14,fontWeight:'800',color:C.ink},accountTypeTitleActive:{color:C.roseDark},accountTypeCaption:{fontSize:11,lineHeight:16,color:C.muted},
  authIntro:{marginVertical:15},field:{height:56,borderRadius:17,backgroundColor:C.white,borderWidth:1,borderColor:C.line,flexDirection:'row',alignItems:'center',paddingHorizontal:16,gap:10,marginBottom:13},input:{flex:1,fontSize:15,color:C.ink,outlineStyle:'none' as never},
  consentHero:{height:150,borderRadius:28,backgroundColor:C.blush,alignItems:'center',justifyContent:'center',marginBottom:24},consentRow:{flexDirection:'row',gap:13,marginTop:18},checkRow:{padding:15,borderRadius:16,backgroundColor:C.white,flexDirection:'row',alignItems:'flex-start',gap:11,marginTop:25},locationCheckRow:{marginTop:10},menuIcon:{width:42,height:42,borderRadius:14,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},
  topRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:22},greeting:{fontSize:25,fontWeight:'800',color:C.ink,marginBottom:3},avatar:{width:46,height:46,borderRadius:23,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},hero:{minHeight:210,borderRadius:24,backgroundColor:C.roseDark,padding:22,flexDirection:'row',alignItems:'center',overflow:'hidden',marginBottom:28},heroKicker:{fontSize:10,fontWeight:'800',letterSpacing:1.1,color:'#F2C7D2',marginBottom:8},heroTitle:{fontSize:27,lineHeight:33,fontWeight:'800',color:C.white,maxWidth:210},heroButton:{marginTop:20,alignSelf:'flex-start',height:42,borderRadius:14,backgroundColor:C.white,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:8},heroButtonText:{fontSize:13,fontWeight:'800',color:C.roseDark},faceMini:{position:'absolute',right:-20,bottom:-20,width:130,height:170,borderWidth:2,borderColor:'#D88A9E',borderRadius:70,alignItems:'center',justifyContent:'center'},
  sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:4},sectionTitle:{fontSize:19,fontWeight:'800',color:C.ink,marginVertical:15},sectionAction:{minWidth:84,minHeight:40,flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:6},art:{width:'100%',borderRadius:20,resizeMode:'cover'},artCrop:{width:'100%',borderRadius:18,overflow:'hidden',backgroundColor:C.blush},artSheet:{width:'200%',height:'200%',resizeMode:'cover'},q1:{transform:[{translateX:'-50%'}]},q2:{transform:[{translateY:'-50%'}]},q3:{transform:[{translateX:'-50%'},{translateY:'-50%'}]},overlayPill:{position:'absolute',bottom:12,left:12,backgroundColor:'rgba(41,35,38,.85)',paddingVertical:8,paddingHorizontal:12,borderRadius:12},overlayText:{color:C.white,fontSize:12,fontWeight:'700'},hRow:{gap:12,paddingRight:10},salonCard:{width:150,padding:10,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderColor:C.line},salonThumb:{height:85,borderRadius:14,alignItems:'center',justifyContent:'center',marginBottom:9},cardTitle:{fontSize:15,fontWeight:'700',color:C.ink,marginBottom:3},tip:{marginTop:25,padding:16,borderRadius:18,backgroundColor:'#FFF3DA',flexDirection:'row',gap:12},
  tabShell:{position:'absolute',bottom:0,left:0,right:0,alignItems:'center'},tabBar:{width:'100%',maxWidth:430,height:82,paddingBottom:15,backgroundColor:C.white,borderTopWidth:1,borderTopColor:C.line,flexDirection:'row',shadowColor:'#000',shadowOpacity:.08,shadowRadius:16,elevation:12},tabItem:{flex:1,alignItems:'center',justifyContent:'center',gap:3},tabLabel:{fontSize:11,fontWeight:'600',color:C.muted},tabActive:{color:C.rose,fontWeight:'800'},
  centerPage:{flex:1,padding:24,alignItems:'center',justifyContent:'center'},processIcon:{width:105,height:105,borderRadius:53,backgroundColor:C.blush,alignItems:'center',justifyContent:'center',marginBottom:28},steps:{width:'100%',padding:20,borderRadius:20,backgroundColor:C.white,marginTop:20},step:{flexDirection:'row',gap:12,alignItems:'center',marginVertical:8},stepDot:{width:21,height:21,borderRadius:11,borderWidth:2,borderColor:'#D8C9CD',alignItems:'center',justifyContent:'center'},stepDone:{backgroundColor:C.green,borderColor:C.green},
  resultVisual:{height:285,borderRadius:24,overflow:'hidden',marginBottom:12,position:'relative'},resultImage:{width:'100%',height:'100%',resizeMode:'cover'},outlineOval:{position:'absolute',width:150,height:210,borderRadius:75,borderWidth:2,borderColor:C.white,alignSelf:'center',top:34},confidence:{position:'absolute',right:12,bottom:12,backgroundColor:C.white,borderRadius:12,padding:9},confidenceText:{fontSize:12,fontWeight:'800',color:C.green},chipRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:18},chip:{backgroundColor:C.blush,borderRadius:99,paddingHorizontal:12,paddingVertical:8},chipText:{fontSize:12,fontWeight:'700',color:C.roseDark},
  chatBox:{height:54,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderColor:'#E2C8CF',flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:13,marginBottom:20},chatInput:{flex:1,fontSize:13,color:C.ink,outlineStyle:'none' as never},recCard:{backgroundColor:C.white,borderRadius:20,overflow:'hidden',marginBottom:18,borderWidth:1,borderColor:C.line},recBody:{padding:14},matchBadge:{position:'absolute',top:12,right:12,backgroundColor:C.white,borderRadius:10,padding:8},matchText:{fontSize:12,fontWeight:'800',color:C.rose},detailTitle:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:20},scoreCircle:{width:54,height:54,borderRadius:27,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},scoreText:{fontSize:18,fontWeight:'900',color:C.rose},
  segment:{height:48,borderRadius:15,backgroundColor:'#EEE6E7',padding:4,flexDirection:'row',marginBottom:17},segmentActive:{flex:1,borderRadius:12,backgroundColor:C.white,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},segmentItem:{flex:1,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},segmentText:{fontSize:13,fontWeight:'800',color:C.rose},mapMock:{height:150,borderRadius:22,backgroundColor:'#EFE6E0',alignItems:'center',justifyContent:'center',marginBottom:14,overflow:'hidden'},pin:{position:'absolute',top:25,right:80,width:38,height:38,borderRadius:19,backgroundColor:C.rose,alignItems:'center',justifyContent:'center'},listCard:{minHeight:82,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderColor:C.line,padding:13,flexDirection:'row',alignItems:'center',gap:12,marginBottom:12},salonSquare:{width:58,height:58,borderRadius:16,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},
  mapModal:{flex:1,backgroundColor:C.pale},mapHeader:{minHeight:82,paddingHorizontal:18,paddingVertical:12,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},mapTitle:{fontSize:19,fontWeight:'800',color:C.ink,marginBottom:2},mapClose:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:C.pale,borderWidth:1,borderColor:C.line},
  mapNotice:{marginTop:12,padding:14,borderRadius:15,backgroundColor:C.blush,flexDirection:'row',alignItems:'center',gap:10},mapAttribution:{fontSize:10,color:C.muted,textAlign:'right',marginTop:7},
  dataLoader:{marginVertical:32},dataState:{padding:20,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderColor:C.line,alignItems:'center',gap:5,marginBottom:16},
  salonHero:{height:250,borderRadius:23,overflow:'hidden',marginBottom:14},salonHeroShade:{position:'absolute',left:0,right:0,bottom:0,padding:16,backgroundColor:'rgba(40,25,30,.62)'},salonHeroTitle:{fontSize:23,fontWeight:'800',color:C.white},serviceRow:{paddingVertical:14,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},stylistMini:{width:112,padding:12,borderRadius:18,backgroundColor:C.white},stylistAvatar:{width:50,height:50,borderRadius:25,backgroundColor:C.blush,alignItems:'center',justifyContent:'center',marginBottom:8},quote:{fontSize:15,lineHeight:23,fontStyle:'italic',color:C.muted,backgroundColor:C.white,padding:17,borderRadius:17},
  salonIdentity:{minHeight:245,borderRadius:24,backgroundColor:C.blush,alignItems:'center',justifyContent:'center',padding:24,gap:10,marginBottom:16},salonIdentityName:{fontSize:24,fontWeight:'900',color:C.roseDark,textAlign:'center'},salonLogo:{width:58,height:58,borderRadius:18,backgroundColor:C.rose,alignItems:'center',justifyContent:'center',gap:1,marginBottom:12},salonLogoLarge:{width:104,height:104,borderRadius:32,marginBottom:5},salonLogoText:{fontSize:10,fontWeight:'900',letterSpacing:1,color:C.white},salonLogoTextLarge:{fontSize:16},
  progress:{height:5,borderRadius:3,backgroundColor:'#E7D9DC',overflow:'hidden',marginBottom:12},progressFill:{width:'66%',height:'100%',backgroundColor:C.rose},choiceCard:{minHeight:78,padding:13,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderColor:C.line,flexDirection:'row',alignItems:'center',gap:12,marginBottom:12},choiceSelected:{borderWidth:2,borderColor:C.rose,backgroundColor:'#FFF9FA'},choiceIcon:{width:48,height:48,borderRadius:16,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},bottomSpace:{height:60},monthRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},disabledControl:{opacity:.25},calendar:{flexDirection:'row',flexWrap:'wrap',marginBottom:20},calendarWeekday:{fontSize:11,fontWeight:'800',color:C.muted},day:{width:'14.28%',aspectRatio:1,alignItems:'center',justifyContent:'center',borderRadius:99},dayActive:{backgroundColor:C.rose},dayText:{fontSize:13,fontWeight:'700',color:C.ink},dayTextActive:{color:C.white},dayTextDisabled:{color:'#CFC5C8'},timeGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:18},time:{width:'31%',paddingVertical:13,borderRadius:13,backgroundColor:C.white,alignItems:'center',borderWidth:1,borderColor:C.line},timeActive:{backgroundColor:C.rose,borderColor:C.rose},timeDisabled:{backgroundColor:'#F2EDEE',borderColor:'#EBE4E6'},timeTextActive:{color:C.white},
  summaryCard:{padding:20,borderRadius:22,backgroundColor:C.white,borderWidth:1,borderColor:C.line},summaryLogo:{width:58,height:58,borderRadius:18,backgroundColor:C.blush,alignItems:'center',justifyContent:'center',marginBottom:17},divider:{height:1,backgroundColor:C.line,marginVertical:17},summaryRow:{flexDirection:'row',gap:12,alignItems:'center',marginVertical:9},price:{fontSize:22,fontWeight:'900',color:C.rose},notice:{padding:14,borderRadius:16,backgroundColor:C.blush,flexDirection:'row',gap:10,marginTop:15},successIcon:{width:100,height:100,borderRadius:50,backgroundColor:C.green,alignItems:'center',justifyContent:'center',marginBottom:24},ticket:{width:'100%',padding:20,borderRadius:20,backgroundColor:C.white,alignItems:'center',marginVertical:15},
  bookingCard:{padding:19,borderRadius:21,backgroundColor:C.white,borderWidth:1,borderColor:C.line,marginBottom:22},bookingActions:{flexDirection:'row',justifyContent:'space-around'},bookingMeta:{flexDirection:'row',alignItems:'center',gap:12},bookingStatus:{marginLeft:'auto',fontSize:11,fontWeight:'800',textTransform:'uppercase',color:C.green,backgroundColor:'#E8F3ED',paddingHorizontal:10,paddingVertical:6,borderRadius:99},empty:{alignItems:'center',padding:35,borderRadius:20,borderStyle:'dashed',borderWidth:1,borderColor:'#D9CACE',gap:6},profileHead:{flexDirection:'row',alignItems:'center',gap:15,marginBottom:22},profileAvatar:{width:74,height:74,borderRadius:37,backgroundColor:C.rose,alignItems:'center',justifyContent:'center'},profileInitial:{fontSize:30,fontWeight:'900',color:C.white},preferenceCard:{padding:17,borderRadius:20,backgroundColor:C.blush,marginBottom:20},preferenceRow:{flexDirection:'row',justifyContent:'space-between'},menuRow:{minHeight:68,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',alignItems:'center',gap:13},roleRow:{flexDirection:'row',gap:12},roleCard:{flex:1,padding:17,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderColor:C.line,gap:10},stats:{flexDirection:'row',gap:10,marginVertical:20},stat:{flex:1,padding:14,borderRadius:17,backgroundColor:C.white,alignItems:'center'},statValue:{fontSize:21,fontWeight:'900',color:C.roseDark},
});
