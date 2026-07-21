import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaceScanScreen } from '@/components/face-scan-screen';
import { FaceLandmarkOverlay } from '@/components/face-landmark-overlay';
import { CustomerDashboardScreen } from '@/components/dashboards/customer-dashboard-screen';
import { OwnerDashboardScreen } from '@/components/dashboards/owner-dashboard-screen';
import { OwnerSalonSetupScreen } from '@/components/dashboards/owner-salon-setup-screen';
import { LocationMap, type MapCoordinate } from '@/components/location-map';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { CustomerSettingsScreen } from '@/components/profile/customer-settings-screen';
import { SalonMap } from '@/components/salon-map';
import { SalonLocationPicker } from '@/components/salon-location-picker';
import { createBooking, createOwnerPortfolioImage, createOwnerReviewReply, createOwnerSalon, createOwnerService, createOwnerStaff, createSalonReview, getAccountItems, getApiAssetUrl, getBookings, getFavoriteSalons, getMySalonReviews, getOwnerDashboard, getOwnerManagement, getProfile, getSalonPortfolio, getSalonReviews, getSalons, getSalonServices, getSalonStaff, getUnreadNotificationCount, login as loginUser, markNotificationRead, removeOwnerPortfolioImage, removeOwnerReviewReply, removeOwnerService, removeOwnerStaff, saveHairstyle, setFavoriteSalon, signup as signupUser, updateOwnerBooking, updateOwnerProfile, updateOwnerService, updateOwnerStaff, updateSalonReview, type AccountItem, type AuthUser, type Booking, type OwnerDashboard, type OwnerManagement, type PortfolioImage, type Salon, type SalonReview, type SalonReviewSummary, type SalonService, type SalonStaff, type UserProfile , analyzeFace, type FaceAnalysis } from '@/services/api';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Linking,
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
  | 'bookings' | 'profile' | 'saved' | 'saved-style-detail' | 'saved-salons' | 'notifications' | 'reviews' | 'settings'
  | 'stylist-dashboard' | 'stylist-appointments' | 'stylist-detail' | 'stylist-status' | 'stylist-notifications'
  | 'owner-dashboard' | 'owner-bookings' | 'owner-services' | 'owner-staff' | 'owner-profile' | 'owner-reviews' | 'owner-notifications';

type OwnerEditor =
  | { kind: 'service'; id?: number; name: string; description: string; price: string; durationMinutes: string; isActive: boolean }
  | { kind: 'staff'; id?: number; name: string; email: string; phone: string; specialties: string; password: string; isAvailable: boolean; imageUri: string | null; imageData?: string | null }
  | { kind: 'profile'; name: string; description: string; address: string; city: string; phone: string; website: string; openingTime: string; closingTime: string; imageUri: string | null; imageData?: string | null }
  | { kind: 'reply'; reviewId: number; reviewerName: string; message: string; imageUri: string | null; imageData?: string | null };

async function chooseImage(context: string) {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', `Allow FaceFit to choose a photo for ${context}.`);
      return null;
    }
  }
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.65, base64: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset.base64 || asset.base64.length * 0.75 > 2.5 * 1024 * 1024) {
    Alert.alert('Photo could not be used', 'Choose a JPG, PNG, or WebP photo smaller than 2.5 MB.');
    return null;
  }
  const mimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(asset.mimeType || '') ? asset.mimeType : 'image/jpeg';
  return { uri: asset.uri, data: `data:${mimeType};base64,${asset.base64}` };
}

const C = { rose: '#A94F67', roseDark: '#743548', blush: '#F7E4E8', pale: '#FFF8F6', ink: '#292326', muted: '#7C7074', line: '#EDE3E5', white: '#FFFFFF', green: '#4F826B', gold: '#C48B3A' };
const artwork = require('../assets/images/facefit-styles.png');
const faceFitLogo = require('../assets/images/facefit-logo.png');
const shapeCopy: Record<FaceAnalysis['faceShape'], { title: string; description: string }> = {
  oval: { title: 'Balanced & versatile', description: 'Your face is slightly longer than it is wide, with a softly tapered jaw.' },
  round: { title: 'Soft & proportionate', description: 'Your face length and width are similar, with a gently curved jawline.' },
  square: { title: 'Defined & structured', description: 'Your forehead, cheekbones, and jaw have similar widths with a defined jawline.' },
  heart: { title: 'Broad & tapered', description: 'Your forehead is wider while the lower face narrows toward the chin.' },
  oblong: { title: 'Long & elegant', description: 'Your face is noticeably longer than it is wide with relatively even side proportions.' },
  diamond: { title: 'Angular & sculpted', description: 'Your cheekbones are the widest point, with a narrower forehead and jaw.' },
};

function Button({ label, onPress, secondary = false, icon, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean }) {
  return <Pressable disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.buttonSecondary, disabled && s.buttonDisabled, pressed && s.pressed]}>
    {icon && <Ionicons name={icon} size={19} color={secondary ? C.rose : C.white} />}
    <Text style={[s.buttonText, secondary && s.buttonTextSecondary]}>{label}</Text>
  </Pressable>;
}

function FavoriteIcon({ active, busy = false, size = 21 }: { active: boolean; busy?: boolean; size?: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: active ? 1.28 : 0.86, speed: 30, bounciness: 7, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(scale, { toValue: 1, speed: 24, bounciness: 6, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [active, scale]);

  return <Animated.View style={{ opacity: busy ? 0.62 : 1, transform: [{ scale }] }}>
    <Ionicons name={active ? 'heart' : 'heart-outline'} size={size} color={C.rose} />
  </Animated.View>;
}

function FavoriteToast({ toast, onDismiss }: { toast: { message: string; success: boolean } | null; onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const scale = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    if (!toast) return;
    const useNativeDriver = Platform.OS !== 'web';
    opacity.setValue(0);
    translateY.setValue(18);
    scale.setValue(0.97);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver }),
      Animated.spring(translateY, { toValue: 0, speed: 22, bounciness: 4, useNativeDriver }),
      Animated.spring(scale, { toValue: 1, speed: 22, bounciness: 3, useNativeDriver }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver }),
        Animated.timing(translateY, { toValue: 10, duration: 220, useNativeDriver }),
        Animated.timing(scale, { toValue: 0.98, duration: 220, useNativeDriver }),
      ]).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }, 2300);

    return () => {
      clearTimeout(timer);
      opacity.stopAnimation();
      translateY.stopAnimation();
      scale.stopAnimation();
    };
  }, [onDismiss, opacity, scale, toast, translateY]);

  if (!toast) return null;
  return <Animated.View
    pointerEvents="none"
    accessibilityLiveRegion="polite"
    style={[
      s.favoriteToast,
      !toast.success && s.favoriteToastError,
      { opacity, transform: [{ translateY }, { scale }] },
    ]}
  >
    <View style={s.favoriteToastIcon}><Ionicons name={toast.success ? 'sparkles' : 'alert-circle'} size={22} color={C.white} /></View>
    <Text style={s.favoriteToastText}>{toast.message}</Text>
  </Animated.View>;
}

function NotificationBadge({ count }: { count: number }) {
  if (count < 1) return null;
  return <View style={s.notificationBadge}><Text style={s.notificationBadgeText}>{count > 99 ? '99+' : count}</Text></View>;
}

function Header({ title, onBack, action, onAction, actionColor = C.ink, favoriteActive, actionBusy = false, actionBadge = 0 }: { title: string; onBack?: () => void; action?: keyof typeof Ionicons.glyphMap; onAction?: () => void; actionColor?: string; favoriteActive?: boolean; actionBusy?: boolean; actionBadge?: number }) {
  return <View style={s.header}>
    {onBack ? <Pressable onPress={onBack} style={s.iconButton}><Ionicons name="chevron-back" size={22} color={C.ink} /></Pressable> : <View style={s.logoSmall}><Image accessibilityLabel="FaceFit logo" source={faceFitLogo} style={s.logoImageSmall} /></View>}
    <Text style={s.headerTitle}>{title}</Text>
    {onAction ? <Pressable accessibilityRole="button" accessibilityState={{ checked: favoriteActive, busy: actionBusy }} hitSlop={8} onPress={onAction} style={({ pressed }) => [s.iconButton, favoriteActive && s.favoriteButtonActive, pressed && s.favoritePressed]}>{favoriteActive === undefined ? action && <Ionicons name={action} size={21} color={actionColor} /> : <FavoriteIcon active={favoriteActive} busy={actionBusy} />}<NotificationBadge count={actionBadge} /></Pressable> : <View style={s.iconButton}>{action && <Ionicons name={action} size={21} color={actionColor} />}<NotificationBadge count={actionBadge} /></View>}
  </View>;
}

function SectionTitle({ title, action, onAction, actionLoading = false }: { title: string; action?: string; onAction?: () => void; actionLoading?: boolean }) {
  return <View style={s.sectionHead}><Text style={s.sectionTitle}>{title}</Text>{action && (onAction ? <Pressable accessibilityRole="button" disabled={actionLoading} onPress={onAction} style={({ pressed }) => [s.sectionAction, pressed && s.pressed]}>{actionLoading ? <ActivityIndicator size="small" color={C.rose} /> : <><Text style={s.link}>{action}</Text><Ionicons name="map-outline" size={17} color={C.rose} /></>}</Pressable> : <Text style={s.link}>{action}</Text>)}</View>;
}

function Art({ height = 160, quadrant }: { height?: number; quadrant?: number }) {
  if (quadrant === undefined) return <Image source={artwork} style={[s.art, { height }]} />;
  return <View style={[s.artCrop, { height }]}><Image source={artwork} style={[s.artSheet, quadrant === 1 && s.q1, quadrant === 2 && s.q2, quadrant === 3 && s.q3]} /></View>;
}

function Field({ placeholder, secure, icon, value, onChangeText, keyboardType = 'default', autoCapitalize = 'sentences' }: { placeholder: string; secure?: boolean; icon: keyof typeof Ionicons.glyphMap; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'decimal-pad'; autoCapitalize?: 'none' | 'sentences' }) {
  return <View style={s.field}><Ionicons name={icon} size={19} color={C.muted} /><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#A89DA0" secureTextEntry={secure} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={s.input} /></View>;
}

function SalonLogo({ name, large = false, imageUrl }: { name: string; large?: boolean; imageUrl?: string | null }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  if (imageUrl) return <Image source={{ uri: getApiAssetUrl(imageUrl)! }} style={[s.salonLogo, s.salonLogoImage, large && s.salonLogoLarge]} />;
  return <View style={[s.salonLogo, large && s.salonLogoLarge]}><Ionicons name="storefront" size={large ? 34 : 19} color={C.white} /><Text style={[s.salonLogoText, large && s.salonLogoTextLarge]}>{initials}</Text></View>;
}

function TabBar({ screen, go }: { screen: Screen; go: (x: Screen) => void }) {
  const tabs: { key: Screen; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'home', label: 'Home', icon: 'home-outline' }, { key: 'scan', label: 'Scan', icon: 'scan-outline' },
    { key: 'salons', label: 'Salons', icon: 'storefront-outline' }, { key: 'bookings', label: 'Bookings', icon: 'calendar-outline' },
    { key: 'profile', label: 'Profile', icon: 'person-outline' },
  ];
  return <View style={[s.tabBar, Platform.OS === 'web' && s.tabBarWeb]}>{tabs.map(t => {
    const active = screen === t.key
      || (t.key === 'scan' && ['processing', 'result', 'recommendations', 'style-detail'].includes(screen))
      || (t.key === 'profile' && screen === 'settings');
    return <Pressable key={t.key} onPress={() => go(t.key)} style={s.tabItem}><Ionicons name={active ? (t.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : t.icon} size={22} color={active ? C.rose : C.muted} /><Text style={[s.tabLabel, active && s.tabActive]}>{t.label}</Text></Pressable>;
  })}</View>;
}

function ScreenFrame({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;
  return <View style={[s.webShell, isWeb && s.webShellWeb, isDesktopWeb && s.webShellDesktop]}><SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>{scroll ? <ScrollView contentContainerStyle={[s.scroll, isDesktopWeb && s.scrollDesktop]} showsVerticalScrollIndicator={false}>{children}</ScrollView> : children}</SafeAreaView></View>;
}

function OwnerEditorField({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, secureTextEntry = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric' | 'decimal-pad' | 'url'; multiline?: boolean; secureTextEntry?: boolean }) {
  return <View style={s.ownerEditorFieldWrap}>
    <Text style={s.ownerEditorLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#A89DA0"
      keyboardType={keyboardType}
      multiline={multiline}
      secureTextEntry={secureTextEntry}
      autoCapitalize={keyboardType === 'email-address' || keyboardType === 'url' ? 'none' : 'sentences'}
      style={[s.ownerEditorInput, multiline && s.ownerEditorTextarea]}
    />
  </View>;
}

function OwnerEditorModal({ editor, setEditor, saving, error, onSave }: { editor: OwnerEditor | null; setEditor: React.Dispatch<React.SetStateAction<OwnerEditor | null>>; saving: boolean; error: string | null; onSave: () => void }) {
  if (!editor) return null;
  const patchEditor = (patch: object) => setEditor(current => current ? { ...current, ...patch } as OwnerEditor : current);
  const title = editor.kind === 'service' ? `${editor.id ? 'Edit' : 'Add'} service` : editor.kind === 'staff' ? `${editor.id ? 'Edit' : 'Add'} staff member` : editor.kind === 'profile' ? 'Edit business portfolio' : `Reply to ${editor.reviewerName}`;

  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => !saving && setEditor(null)}>
    <SafeAreaView style={s.ownerEditorSafe}>
      <KeyboardAvoidingView style={s.ownerEditorSafe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.ownerEditorHeader}>
          <View><Text style={s.ownerEditorKicker}>SALON MANAGEMENT</Text><Text style={s.ownerEditorTitle}>{title}</Text></View>
          <Pressable disabled={saving} onPress={() => setEditor(null)} style={s.iconButton}><Ionicons name="close" size={22} color={C.ink} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={s.ownerEditorScroll} keyboardShouldPersistTaps="handled">
          {editor.kind === 'service' && <>
            <OwnerEditorField label="Service name" value={editor.name} onChangeText={name => patchEditor({ name })} placeholder="e.g. Layered haircut" />
            <OwnerEditorField label="Description" value={editor.description} onChangeText={description => patchEditor({ description })} placeholder="Describe what is included" multiline />
            <View style={s.ownerEditorRow}>
              <View style={s.ownerEditorHalf}><OwnerEditorField label="Price (₱)" value={editor.price} onChangeText={price => patchEditor({ price })} placeholder="350" keyboardType="decimal-pad" /></View>
              <View style={s.ownerEditorHalf}><OwnerEditorField label="Duration (minutes)" value={editor.durationMinutes} onChangeText={durationMinutes => patchEditor({ durationMinutes })} placeholder="60" keyboardType="numeric" /></View>
            </View>
            <Pressable onPress={() => patchEditor({ isActive: !editor.isActive })} style={s.ownerToggleRow}><View><Text style={s.cardTitle}>Visible to customers</Text><Text style={s.small}>Customers can book this service when enabled.</Text></View><Ionicons name={editor.isActive ? 'toggle' : 'toggle-outline'} size={38} color={editor.isActive ? C.rose : C.muted} /></Pressable>
          </>}
          {editor.kind === 'staff' && <>
            {editor.imageUri ? <View style={s.ownerEditorPhotoPreview}><Image source={{ uri: editor.imageUri }} style={s.ownerEditorPhoto} /><Pressable onPress={() => patchEditor({ imageUri: null, imageData: null })} style={s.ownerEditorPhotoRemove}><Ionicons name="trash-outline" size={17} color={C.white} /><Text style={s.reviewPhotoRemoveText}>Remove photo</Text></Pressable></View> : <Pressable onPress={() => void chooseImage('the staff profile').then(photo => photo && patchEditor({ imageUri: photo.uri, imageData: photo.data }))} style={s.ownerEditorPhotoPicker}><Ionicons name="person-circle-outline" size={32} color={C.rose} /><View style={s.salonCardGrow}><Text style={s.cardTitle}>Add profile photo</Text><Text style={s.small}>Shown to customers choosing a stylist</Text></View><Ionicons name="camera-outline" size={22} color={C.rose} /></Pressable>}
            <OwnerEditorField label="Full name" value={editor.name} onChangeText={name => patchEditor({ name })} placeholder="Staff member name" />
            <OwnerEditorField label="Email address" value={editor.email} onChangeText={email => patchEditor({ email })} placeholder="stylist@example.com" keyboardType="email-address" />
            <OwnerEditorField label="Phone" value={editor.phone} onChangeText={phone => patchEditor({ phone })} placeholder="09XX XXX XXXX" keyboardType="phone-pad" />
            <OwnerEditorField label="Specialties" value={editor.specialties} onChangeText={specialties => patchEditor({ specialties })} placeholder="Hair color, styling, treatments" multiline />
            <OwnerEditorField label={editor.id ? 'New password (optional)' : 'Temporary password'} value={editor.password} onChangeText={password => patchEditor({ password })} placeholder={editor.id ? 'Leave blank to keep current password' : 'At least 8 characters'} secureTextEntry />
            <Pressable onPress={() => patchEditor({ isAvailable: !editor.isAvailable })} style={s.ownerToggleRow}><View><Text style={s.cardTitle}>Available for bookings</Text><Text style={s.small}>Show this team member to customers.</Text></View><Ionicons name={editor.isAvailable ? 'toggle' : 'toggle-outline'} size={38} color={editor.isAvailable ? C.rose : C.muted} /></Pressable>
          </>}
          {editor.kind === 'profile' && <>
            {editor.imageUri ? <View style={s.ownerSalonPhotoPreview}><Image source={{ uri: editor.imageUri }} style={s.ownerSalonPhoto} /><View style={s.ownerSalonPhotoActions}><Pressable onPress={() => void chooseImage('the salon profile').then(photo => photo && patchEditor({ imageUri: photo.uri, imageData: photo.data }))} style={s.ownerPhotoAction}><Ionicons name="camera-outline" size={17} color={C.white} /><Text style={s.reviewPhotoRemoveText}>Replace</Text></Pressable><Pressable onPress={() => patchEditor({ imageUri: null, imageData: null })} style={[s.ownerPhotoAction, s.ownerPhotoRemoveAction]}><Ionicons name="trash-outline" size={17} color={C.white} /><Text style={s.reviewPhotoRemoveText}>Remove</Text></Pressable></View></View> : <Pressable onPress={() => void chooseImage('the salon profile').then(photo => photo && patchEditor({ imageUri: photo.uri, imageData: photo.data }))} style={s.ownerSalonPhotoPicker}><View style={s.ownerSalonPhotoPlaceholder}><Ionicons name="storefront-outline" size={36} color={C.rose} /></View><View style={s.salonCardGrow}><Text style={s.cardTitle}>Add salon profile picture</Text><Text style={s.small}>This will be the main photo customers see.</Text></View><Ionicons name="camera-outline" size={23} color={C.rose} /></Pressable>}
            <OwnerEditorField label="Business name" value={editor.name} onChangeText={name => patchEditor({ name })} />
            <OwnerEditorField label="About your salon" value={editor.description} onChangeText={description => patchEditor({ description })} placeholder="Tell customers about your salon and expertise" multiline />
            <OwnerEditorField label="Address" value={editor.address} onChangeText={address => patchEditor({ address })} />
            <OwnerEditorField label="City" value={editor.city} onChangeText={city => patchEditor({ city })} />
            <OwnerEditorField label="Phone" value={editor.phone} onChangeText={phone => patchEditor({ phone })} keyboardType="phone-pad" />
            <OwnerEditorField label="Website or social page" value={editor.website} onChangeText={website => patchEditor({ website })} placeholder="https://..." keyboardType="url" />
            <View style={s.ownerEditorRow}>
              <View style={s.ownerEditorHalf}><OwnerEditorField label="Opening time" value={editor.openingTime} onChangeText={openingTime => patchEditor({ openingTime })} placeholder="09:00" /></View>
              <View style={s.ownerEditorHalf}><OwnerEditorField label="Closing time" value={editor.closingTime} onChangeText={closingTime => patchEditor({ closingTime })} placeholder="18:00" /></View>
            </View>
          </>}
          {editor.kind === 'reply' && <>
            <View style={s.ownerReplyNotice}><Ionicons name="chatbubble-ellipses-outline" size={22} color={C.rose} /><Text style={[s.small, { flex: 1 }]}>Publish as many replies as needed. Each reply appears in order below the customer’s review.</Text></View>
            {editor.imageUri ? <View style={s.ownerEditorPhotoPreview}><Image source={{ uri: editor.imageUri }} style={s.ownerEditorPhoto} /><Pressable onPress={() => patchEditor({ imageUri: null, imageData: null })} style={s.ownerEditorPhotoRemove}><Ionicons name="trash-outline" size={17} color={C.white} /><Text style={s.reviewPhotoRemoveText}>Remove photo</Text></Pressable></View> : <Pressable onPress={() => void chooseImage('your review reply').then(photo => photo && patchEditor({ imageUri: photo.uri, imageData: photo.data }))} style={s.ownerEditorPhotoPicker}><Ionicons name="images-outline" size={29} color={C.rose} /><View style={s.salonCardGrow}><Text style={s.cardTitle}>Attach a reply photo</Text><Text style={s.small}>Optional · JPG, PNG, or WebP</Text></View><Ionicons name="add-circle" size={23} color={C.rose} /></Pressable>}
            <OwnerEditorField label="Public reply" value={editor.message} onChangeText={message => patchEditor({ message })} placeholder="Thank the customer or address their feedback..." multiline />
            <Text style={s.ownerEditorCount}>{editor.message.length}/1000</Text>
          </>}
          {error && <View style={s.authError}><Ionicons name="alert-circle" size={20} color="#81263A" /><Text style={s.authErrorText}>{error}</Text></View>}
        </ScrollView>
        <View style={s.ownerEditorFooter}>
          <Pressable disabled={saving} onPress={() => setEditor(null)} style={[s.ownerEditorButton, s.ownerEditorCancel]}><Text style={s.ownerEditorCancelText}>Cancel</Text></Pressable>
          <Pressable disabled={saving} onPress={onSave} style={[s.ownerEditorButton, s.ownerEditorSave, saving && s.buttonDisabled]}>{saving ? <ActivityIndicator color={C.white} /> : <><Ionicons name="checkmark" size={19} color={C.white} /><Text style={s.ownerEditorSaveText}>{editor.kind === 'reply' ? 'Publish reply' : 'Save changes'}</Text></>}</Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}

function DesktopNavigation({ screen, go }: { screen: Screen; go: (screen: Screen) => void }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const navWidth = useRef(new Animated.Value(76)).current;
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expanded = hovered || pinned;

  const openNavigation = () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = null;
    setHovered(true);
  };

  const scheduleNavigationClose = () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => {
      setHovered(false);
      collapseTimer.current = null;
    }, 900);
  };

  const selectNavigationItem = (destination: Screen) => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = null;
    setPinned(false);
    setHovered(false);
    go(destination);
  };

  useEffect(() => {
    Animated.timing(navWidth, {
      toValue: expanded ? 264 : 76,
      duration: expanded ? 260 : 220,
      useNativeDriver: false,
    }).start();
  }, [expanded, navWidth]);

  useEffect(() => () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
  }, []);

  const detailOpacity = navWidth.interpolate({ inputRange: [76, 180, 264], outputRange: [0, 0.2, 1], extrapolate: 'clamp' });
  const items: { key: Screen; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'home', label: 'Overview', icon: 'grid-outline' },
    { key: 'scan', label: 'Face scan', icon: 'scan-outline' },
    { key: 'salons', label: 'Find salons', icon: 'storefront-outline' },
    { key: 'bookings', label: 'Bookings', icon: 'calendar-outline' },
    { key: 'saved', label: 'Saved styles', icon: 'heart-outline' },
    { key: 'profile', label: 'Profile', icon: 'person-outline' },
  ];
  return <View style={s.desktopNavRail}><Animated.View onPointerEnter={openNavigation} onPointerLeave={scheduleNavigationClose} style={[s.desktopNav, { width: navWidth }]}>
    <View style={s.desktopNavHoverArea}>
    <Pressable accessibilityRole="button" accessibilityLabel={pinned ? 'Collapse FaceFit menu' : 'Keep FaceFit menu open'} onPress={() => setPinned(value => !value)} style={s.desktopBrand}><View style={s.logoSmall}><Image accessibilityLabel="FaceFit logo" source={faceFitLogo} style={s.logoImageSmall} /></View><Animated.Text numberOfLines={1} style={[s.desktopBrandText, { opacity: detailOpacity }]}>FACEFIT</Animated.Text></Pressable>
    <Animated.Text style={[s.desktopNavLabel, { opacity: detailOpacity }]}>MENU</Animated.Text>
    <View style={s.desktopNavItems}>{items.map(item => {
      const active = screen === item.key
        || (item.key === 'scan' && ['processing', 'result', 'recommendations', 'style-detail'].includes(screen))
        || (item.key === 'profile' && screen === 'settings');
      return <Pressable accessibilityRole="button" accessibilityLabel={item.label} key={item.key} onPress={() => selectNavigationItem(item.key)} style={({ pressed }) => [s.desktopNavItem, active && s.desktopNavItemActive, pressed && s.pressed]}><View style={s.desktopNavIcon}><Ionicons name={active ? (item.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : item.icon} size={20} color={active ? C.rose : C.muted} /></View><Animated.Text numberOfLines={1} style={[s.desktopNavText, active && s.desktopNavTextActive, { opacity: detailOpacity }]}>{item.label}</Animated.Text></Pressable>;
    })}</View>
    <Animated.View pointerEvents={expanded ? 'auto' : 'none'} style={[s.desktopHelp, { opacity: detailOpacity }]}><Ionicons name="sparkles" size={21} color={C.gold} /><Text style={s.cardTitle}>Your style space</Text><Text style={s.small}>Scan, discover, and book your next look.</Text></Animated.View>
    </View>
  </Animated.View></View>;
}

export default function FaceFitPrototype() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;
  const [screen, setScreen] = useState<Screen>('splash');
  const [faceAnalysisConsent, setFaceAnalysisConsent] = useState(false);
  const [locationConsent, setLocationConsent] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [salonDetailReturn, setSalonDetailReturn] = useState<'salons' | 'nearby-map' | 'saved-salons' | 'reviews'>('salons');
  const [currentLocation, setCurrentLocation] = useState<MapCoordinate | null>(null);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [faceAnalysis, setFaceAnalysis] = useState<FaceAnalysis | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<FaceAnalysis['recommendations'][number] | null>(null);
  const [salonRecords, setSalonRecords] = useState<Salon[]>([]);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [salonServices, setSalonServices] = useState<SalonService[]>([]);
  const [salonStaff, setSalonStaff] = useState<SalonStaff[]>([]);
  const [salonPortfolioImages, setSalonPortfolioImages] = useState<PortfolioImage[]>([]);
  const [salonReviews, setSalonReviews] = useState<SalonReview[]>([]);
  const [salonReviewSummary, setSalonReviewSummary] = useState<SalonReviewSummary>({ count: 0, average: 0 });
  const [salonDetailLoading, setSalonDetailLoading] = useState(false);
  const [salonDetailError, setSalonDetailError] = useState<string | null>(null);
  const salonLoadRequestRef = useRef(0);
  const [salonsLoading, setSalonsLoading] = useState(true);
  const [salonsError, setSalonsError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [ownerDashboard, setOwnerDashboard] = useState<OwnerDashboard | null>(null);
  const [ownerDashboardLoading, setOwnerDashboardLoading] = useState(false);
  const [ownerDashboardError, setOwnerDashboardError] = useState<string | null>(null);
  const [ownerManagement, setOwnerManagement] = useState<OwnerManagement | null>(null);
  const [ownerManagementLoading, setOwnerManagementLoading] = useState(false);
  const [ownerManagementError, setOwnerManagementError] = useState<string | null>(null);
  const [ownerBookingUpdating, setOwnerBookingUpdating] = useState<number | null>(null);
  const [ownerEditor, setOwnerEditor] = useState<OwnerEditor | null>(null);
  const [ownerEditorSaving, setOwnerEditorSaving] = useState(false);
  const [ownerEditorError, setOwnerEditorError] = useState<string | null>(null);
  const [ownerRemoving, setOwnerRemoving] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [accountItems, setAccountItems] = useState<AccountItem[]>([]);
  const [selectedAccountItem, setSelectedAccountItem] = useState<AccountItem | null>(null);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notificationReturnScreen, setNotificationReturnScreen] = useState<Screen>('home');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [favoriteSalonIds, setFavoriteSalonIds] = useState<number[]>([]);
  const [savingFavoriteSalonIds, setSavingFavoriteSalonIds] = useState<number[]>([]);
  const [favoriteToast, setFavoriteToast] = useState<{ message: string; success: boolean } | null>(null);
  const dismissFavoriteToast = useCallback(() => setFavoriteToast(null), []);
  const favoriteSalonIdsRef = useRef<number[]>([]);
  const favoriteMutationsRef = useRef(new Map<number, { desired: boolean; confirmed: boolean; running: boolean }>());
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
  const [salonName, setSalonName] = useState('');
  const [salonAddress, setSalonAddress] = useState('');
  const [salonCity, setSalonCity] = useState('Nasugbu');
  const [salonLatitude, setSalonLatitude] = useState('14.0667');
  const [salonLongitude, setSalonLongitude] = useState('120.6333');
  const [salonLogoUri, setSalonLogoUri] = useState<string | null>(null);
  const [salonLogoData, setSalonLogoData] = useState<string | undefined>();
  const [ownerSalonRecoveryAttempted, setOwnerSalonRecoveryAttempted] = useState(false);
  const [salonView, setSalonView] = useState<'list' | 'map'>('list');
  const [salonSearchQuery, setSalonSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<SalonService | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<SalonStaff | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImageData, setReviewImageData] = useState<string | null | undefined>(undefined);
  const [reviewImageUri, setReviewImageUri] = useState<string | null>(null);
  const [mySalonReviewIds, setMySalonReviewIds] = useState<number[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const back = (fallback: Screen = 'home') => setScreen(fallback);
  const mainScreens = ['home', 'scan', 'processing', 'result', 'recommendations', 'style-detail', 'salons', 'bookings', 'profile'] as Screen[];

  useEffect(() => { if (screen === 'splash') { const t = setTimeout(() => setScreen('onboarding'), 1400); return () => clearTimeout(t); } }, [screen]);
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
  const loadProfile = useCallback(async () => {
    if (!authToken) return;
    setProfileLoading(true);
    setProfileError(null);
    try {
      const profileData = await getProfile(authToken);
      setUserProfile(profileData);
      setAuthUser(profileData);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to load your profile.');
    } finally {
      setProfileLoading(false);
    }
  }, [authToken]);
  useEffect(() => { if (screen === 'profile') void loadProfile(); }, [loadProfile, screen]);
  const loadOwnerDashboard = useCallback(async () => {
    if (!authToken || authUser?.role !== 'owner') return;
    setOwnerDashboardLoading(true);
    setOwnerDashboardError(null);
    try {
      setOwnerDashboard(await getOwnerDashboard(authToken));
    } catch (error) {
      setOwnerDashboardError(error instanceof Error ? error.message : 'Unable to load the salon dashboard.');
    } finally {
      setOwnerDashboardLoading(false);
    }
  }, [authToken, authUser?.role]);
  useEffect(() => { if (screen === 'owner-dashboard') void loadOwnerDashboard(); }, [loadOwnerDashboard, screen]);
  useEffect(() => {
    if (screen !== 'owner-dashboard' || !authToken || authUser?.role !== 'owner') return;
    const refreshTimer = setInterval(() => void loadOwnerDashboard(), 10000);
    return () => clearInterval(refreshTimer);
  }, [authToken, authUser?.role, loadOwnerDashboard, screen]);
  useEffect(() => {
    if (ownerSalonRecoveryAttempted || !authToken || authUser?.role !== 'owner' || !ownerDashboardError?.includes('No salon is linked') || !salonName || !salonAddress || !salonCity) return;
    setOwnerSalonRecoveryAttempted(true);
    void createOwnerSalon(authToken, { name: salonName, address: salonAddress, city: salonCity, latitude: Number(salonLatitude), longitude: Number(salonLongitude), logoData: salonLogoData })
      .then(() => Promise.all([loadOwnerDashboard(), loadSalons()]))
      .catch(error => setOwnerDashboardError(error instanceof Error ? error.message : 'Unable to finish salon setup.'));
  }, [authToken, authUser?.role, loadOwnerDashboard, loadSalons, ownerDashboardError, ownerSalonRecoveryAttempted, salonAddress, salonCity, salonLatitude, salonLogoData, salonLongitude, salonName]);
  const loadOwnerManagement = useCallback(async () => {
    if (!authToken || authUser?.role !== 'owner') return;
    setOwnerManagementLoading(true);
    setOwnerManagementError(null);
    try {
      setOwnerManagement(await getOwnerManagement(authToken));
    } catch (error) {
      setOwnerManagementError(error instanceof Error ? error.message : 'Unable to load salon management data.');
    } finally {
      setOwnerManagementLoading(false);
    }
  }, [authToken, authUser?.role]);
  useEffect(() => {
    if (screen.startsWith('owner-') && screen !== 'owner-dashboard' && screen !== 'owner-notifications') void loadOwnerManagement();
  }, [loadOwnerManagement, screen]);

  const changeOwnerBookingStatus = async (bookingId: number, status: 'confirmed' | 'completed' | 'cancelled') => {
    if (!authToken || ownerBookingUpdating) return;
    setOwnerBookingUpdating(bookingId);
    try {
      await updateOwnerBooking(authToken, bookingId, status);
      await Promise.all([loadOwnerManagement(), loadOwnerDashboard()]);
    } catch (error) {
      Alert.alert('Unable to update booking', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setOwnerBookingUpdating(null);
    }
  };

  const saveOwnerEditor = async () => {
    if (!authToken || !ownerEditor || ownerEditorSaving) return;
    setOwnerEditorSaving(true);
    setOwnerEditorError(null);
    try {
      if (ownerEditor.kind === 'service') {
        const input = { name: ownerEditor.name, description: ownerEditor.description, price: Number(ownerEditor.price), durationMinutes: Number(ownerEditor.durationMinutes), isActive: ownerEditor.isActive };
        if (ownerEditor.id) await updateOwnerService(authToken, ownerEditor.id, input);
        else await createOwnerService(authToken, input);
      } else if (ownerEditor.kind === 'staff') {
        const input = { name: ownerEditor.name, email: ownerEditor.email, phone: ownerEditor.phone, specialties: ownerEditor.specialties, password: ownerEditor.password, isAvailable: ownerEditor.isAvailable, imageData: ownerEditor.imageData };
        if (ownerEditor.id) await updateOwnerStaff(authToken, ownerEditor.id, input);
        else await createOwnerStaff(authToken, input);
      } else if (ownerEditor.kind === 'profile') {
        const { name, description, address, city, phone, website, openingTime, closingTime, imageData } = ownerEditor;
        await updateOwnerProfile(authToken, { name, description, address, city, phone, website, openingTime, closingTime, imageData });
      } else {
        await createOwnerReviewReply(authToken, ownerEditor.reviewId, ownerEditor.message, ownerEditor.imageData);
      }
      setOwnerEditor(null);
      await Promise.all([loadOwnerManagement(), loadOwnerDashboard()]);
    } catch (error) {
      setOwnerEditorError(error instanceof Error ? error.message : 'Unable to save your changes.');
    } finally {
      setOwnerEditorSaving(false);
    }
  };

  const confirmOwnerRemoval = (kind: 'service' | 'staff', id: number, label: string) => {
    if (!authToken || ownerRemoving) return;
    const message = `${label} will no longer appear in your management list or to customers. Existing booking history will be kept.`;
    const remove = () => {
      setOwnerRemoving(`${kind}-${id}`);
      const request = kind === 'service' ? removeOwnerService(authToken, id) : removeOwnerStaff(authToken, id);
      void request.then(() => Promise.all([loadOwnerManagement(), loadOwnerDashboard()])).catch(error => {
        Alert.alert(`Unable to remove ${kind}`, error instanceof Error ? error.message : 'Please try again.');
      }).finally(() => setOwnerRemoving(null));
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`Remove ${kind}?\n\n${message}`)) remove();
      return;
    }
    Alert.alert(
      `Remove ${kind}?`,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: remove },
      ],
    );
  };

  const addPortfolioPhoto = async () => {
    if (!authToken || ownerRemoving) return;
    const photo = await chooseImage('your business portfolio');
    if (!photo) return;
    setOwnerRemoving('portfolio-add');
    try {
      await createOwnerPortfolioImage(authToken, photo.data);
      await loadOwnerManagement();
    } catch (error) {
      Alert.alert('Unable to add portfolio photo', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setOwnerRemoving(null);
    }
  };

  const confirmMediaRemoval = (kind: 'portfolio photo' | 'reply', id: number) => {
    if (!authToken || ownerRemoving) return;
    const remove = () => {
      setOwnerRemoving(`${kind}-${id}`);
      const request = kind === 'portfolio photo' ? removeOwnerPortfolioImage(authToken, id) : removeOwnerReviewReply(authToken, id);
      void request.then(() => loadOwnerManagement()).catch(error => Alert.alert(`Unable to remove ${kind}`, error instanceof Error ? error.message : 'Please try again.')).finally(() => setOwnerRemoving(null));
    };
    const message = `This ${kind} will be removed from the customer view.`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`Remove ${kind}?\n\n${message}`)) remove();
      return;
    }
    Alert.alert(`Remove ${kind}?`, message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: remove }]);
  };

  const loadAccountScreen = useCallback(async () => {
    if (!authToken || !['saved', 'saved-salons', 'notifications', 'owner-notifications', 'reviews'].includes(screen)) return;
    setAccountLoading(true);
    setAccountError(null);
    try {
      setAccountItems(await getAccountItems(authToken, screen === 'saved-salons' ? 'salons' : screen === 'owner-notifications' ? 'notifications' : screen as 'saved' | 'notifications' | 'reviews'));
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Unable to load this page.');
    } finally {
      setAccountLoading(false);
    }
  }, [authToken, screen]);
  useEffect(() => { void loadAccountScreen(); }, [loadAccountScreen]);

  const loadNotificationCount = useCallback(async () => {
    if (!authToken) {
      setNotificationUnreadCount(0);
      return;
    }
    try {
      setNotificationUnreadCount(await getUnreadNotificationCount(authToken));
    } catch {
      // Keep the last known badge count when the API is temporarily unavailable.
    }
  }, [authToken]);
  useEffect(() => { void loadNotificationCount(); }, [loadNotificationCount, screen]);

  const openNotification = async (item: AccountItem, owner: boolean) => {
    if (!owner && item.destination === 'reviews' && item.salonId) {
      const salonId = Number(item.salonId);
      let salon = salonRecords.find(record => record.id === salonId);

      if (!salon) {
        try {
          const latestSalons = await getSalons();
          setSalonRecords(latestSalons);
          salon = latestSalons.find(record => record.id === salonId);
        } catch {
          // The standard reviews destination below remains available if salons cannot be refreshed.
        }
      }

      if (salon) {
        await openSalon(salon);
        return;
      }
    }

    const destinations: Record<string, Screen> = {
      bookings: 'bookings',
      reviews: 'reviews',
      'owner-bookings': 'owner-bookings',
      'owner-reviews': 'owner-reviews',
    };
    const target = item.destination ? destinations[item.destination] : undefined;
    if (target && (owner ? target.startsWith('owner-') : !target.startsWith('owner-'))) setScreen(target);
  };

  const showNotifications = (returnScreen: Screen) => {
    setNotificationReturnScreen(returnScreen);
    setScreen('notifications');
  };

  const readNotification = (item: AccountItem) => {
    if (!authToken || Boolean(item.isRead)) return;
    setAccountItems(items => items.map(notification => notification.id === item.id ? { ...notification, isRead: true } : notification));
    setNotificationUnreadCount(count => Math.max(0, count - 1));
    void markNotificationRead(authToken, item.id).catch(() => {
      setAccountItems(items => items.map(notification => notification.id === item.id ? { ...notification, isRead: false } : notification));
      setNotificationUnreadCount(count => count + 1);
    });
  };

  useEffect(() => {
    if (!authToken) {
      favoriteSalonIdsRef.current = [];
      favoriteMutationsRef.current.clear();
      setFavoriteSalonIds([]);
      return;
    }
    void getFavoriteSalons(authToken).then(ids => {
      const visibleIds = new Set(ids);
      favoriteMutationsRef.current.forEach((mutation, salonId) => {
        if (mutation.desired) visibleIds.add(salonId);
        else visibleIds.delete(salonId);
      });
      favoriteSalonIdsRef.current = [...visibleIds];
      setFavoriteSalonIds([...visibleIds]);
    }).catch(() => {
      if (favoriteMutationsRef.current.size === 0) {
        favoriteSalonIdsRef.current = [];
        setFavoriteSalonIds([]);
      }
    });
  }, [authToken]);

  const showFavoriteState = (salonId: number, favorite: boolean) => {
    const next = favorite
      ? [...new Set([...favoriteSalonIdsRef.current, salonId])]
      : favoriteSalonIdsRef.current.filter(id => id !== salonId);
    favoriteSalonIdsRef.current = next;
    setFavoriteSalonIds(next);
  };

  const syncFavoriteSalon = async (salonId: number, salonName: string, token: string) => {
    const mutation = favoriteMutationsRef.current.get(salonId);
    if (!mutation || mutation.running) return;
    mutation.running = true;
    setSavingFavoriteSalonIds(ids => ids.includes(salonId) ? ids : [...ids, salonId]);

    try {
      while (mutation.confirmed !== mutation.desired) {
        const target = mutation.desired;
        await setFavoriteSalon(token, salonId, target);
        mutation.confirmed = target;
      }
      setFavoriteToast({
        message: mutation.confirmed ? `${salonName} saved to your favorites` : `${salonName} removed from saved salons`,
        success: true,
      });
    } catch (error) {
      showFavoriteState(salonId, mutation.confirmed);
      setFavoriteToast({ message: error instanceof Error ? error.message : 'Unable to update favorite', success: false });
    } finally {
      favoriteMutationsRef.current.delete(salonId);
      setSavingFavoriteSalonIds(ids => ids.filter(id => id !== salonId));
    }
  };

  const toggleFavoriteSalon = (salonId: number) => {
    if (!authToken) {
      Alert.alert('Log in required', 'Log in to save favorite salons.');
      return;
    }
    const currentFavorite = favoriteSalonIdsRef.current.includes(salonId);
    const desired = !currentFavorite;
    const salonName = salonRecords.find(salon => salon.id === salonId)?.name || 'Salon';
    showFavoriteState(salonId, desired);

    const existing = favoriteMutationsRef.current.get(salonId);
    if (existing) {
      existing.desired = desired;
      return;
    }
    favoriteMutationsRef.current.set(salonId, { desired, confirmed: currentFavorite, running: false });
    void syncFavoriteSalon(salonId, salonName, authToken);
  };

  const openSalon = async (salon: Salon, returnTo: 'salons' | 'nearby-map' | 'saved-salons' | 'reviews' = 'salons') => {
    const requestId = ++salonLoadRequestRef.current;
    setSalonDetailReturn(returnTo);
    setSelectedSalon(salon);
    setSalonServices([]);
    setSalonStaff([]);
    setSalonPortfolioImages([]);
    setSalonReviews([]);
    setSalonReviewSummary({ count: 0, average: 0 });
    setSelectedStylist(null);
    setReviewRating(0);
    setReviewComment('');
    setReviewImageData(undefined);
    setReviewImageUri(null);
    setMySalonReviewIds([]);
    setEditingReviewId(null);
    setSalonDetailError(null);
    setSalonDetailLoading(true);
    setScreen('salon-detail');
    const [servicesResult, staffResult, portfolioResult, reviewsResult, myReviewResult] = await Promise.allSettled([
      getSalonServices(salon.id),
      getSalonStaff(salon.id),
      getSalonPortfolio(salon.id),
      getSalonReviews(salon.id),
      authToken ? getMySalonReviews(authToken, salon.id) : Promise.resolve([]),
    ]);
    if (requestId !== salonLoadRequestRef.current) return;
    if (servicesResult.status === 'fulfilled') setSalonServices(servicesResult.value);
    if (staffResult.status === 'fulfilled') setSalonStaff(staffResult.value);
    if (portfolioResult.status === 'fulfilled') setSalonPortfolioImages(portfolioResult.value);
    if (reviewsResult.status === 'fulfilled') {
      setSalonReviews(reviewsResult.value.reviews);
      setSalonReviewSummary(reviewsResult.value.summary);
    }
    if (myReviewResult.status === 'fulfilled') setMySalonReviewIds(myReviewResult.value.map(review => review.id));
    if ([servicesResult, staffResult, portfolioResult, reviewsResult, myReviewResult].some(result => result.status === 'rejected')) {
      setSalonDetailError('Some salon information could not be loaded. Tap to try again.');
    }
    setSalonDetailLoading(false);
  };

  const submitSalonReview = async () => {
    if (!authToken || !selectedSalon || reviewSaving || reviewRating === 0) return;
    setReviewSaving(true);
    try {
      const input = { rating: reviewRating, comment: reviewComment, imageData: reviewImageData };
      if (editingReviewId) await updateSalonReview(authToken, editingReviewId, input);
      else await createSalonReview(authToken, selectedSalon.id, input);
      const [latest, mine] = await Promise.all([getSalonReviews(selectedSalon.id), getMySalonReviews(authToken, selectedSalon.id)]);
      setSalonReviews(latest.reviews);
      setSalonReviewSummary(latest.summary);
      setMySalonReviewIds(mine.map(review => review.id));
      const wasEditing = editingReviewId !== null;
      setReviewRating(0);
      setReviewComment('');
      setReviewImageUri(null);
      setReviewImageData(undefined);
      setEditingReviewId(null);
      setFavoriteToast({ message: `Your review for ${selectedSalon.name} was ${wasEditing ? 'updated' : 'published'}`, success: true });
    } catch (error) {
      setFavoriteToast({ message: error instanceof Error ? error.message : 'Unable to save your review', success: false });
    } finally {
      setReviewSaving(false);
    }
  };

  const editSalonReview = (review: SalonReview) => {
    setEditingReviewId(review.id);
    setReviewRating(review.rating);
    setReviewComment(review.comment || '');
    setReviewImageUri(getApiAssetUrl(review.imageUrl));
    setReviewImageData(undefined);
  };

  const cancelReviewEdit = () => {
    setEditingReviewId(null);
    setReviewRating(0);
    setReviewComment('');
    setReviewImageUri(null);
    setReviewImageData(undefined);
  };

  const pickReviewImage = async () => {
    const photo = await chooseImage('your review');
    if (!photo) return;
    setReviewImageUri(photo.uri);
    setReviewImageData(photo.data);
  };

  const submitAuth = async (isSignup: boolean) => {
    if (authLoading) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = isSignup
        ? await signupUser({ fullName, email, phone, password, role: accountRole, ...(accountRole === 'owner' ? { salonName, salonAddress, salonCity, latitude: Number(salonLatitude), longitude: Number(salonLongitude), salonLogoData } : {}) })
        : await loginUser({ email, password });
      setAuthUser(result.user);
      setAuthToken(result.token);
      setUserProfile(null);
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
      await createBooking(authToken, { serviceId: selectedService.id, stylistId: selectedStylist?.id, appointmentAt: `${selectedDate} ${selectedTime}:00` });
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

  const processScan = async ({ uri, imageData }: { uri: string; imageData: string }) => {
    if (!authToken) {
      Alert.alert('Log in required', 'Please log in before analyzing your face.');
      setScreen('login');
      return;
    }
    setUploaded(uri);
    setFaceAnalysis(null);
    setSelectedRecommendation(null);
    setScreen('processing');
    try {
      setFaceAnalysis(await analyzeFace(authToken, imageData));
      setScreen('result');
    } catch (error) {
      Alert.alert('Face analysis failed', error instanceof Error ? error.message : 'Please try another photo.');
      setScreen('scan');
    }
  };
  const openCurrentLocationMap = async () => {
    if (isGettingLocation) return;
    setIsGettingLocation(true);
    try {
      const permissionResult = await Location.requestForegroundPermissionsAsync();
      if (permissionResult.status !== Location.PermissionStatus.GRANTED) {
        if (!permissionResult.canAskAgain) {
          Alert.alert(
            'Location permission is blocked',
            'Open FaceFit settings and allow location access to use the nearby map.',
            [{ text: 'Cancel', style: 'cancel' }, { text: 'Open settings', onPress: () => void Linking.openSettings() }],
          );
        } else {
          Alert.alert('Location permission needed', 'Tap View map again and choose Allow while using the app.');
        }
        return;
      }

      let servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled && Platform.OS === 'android') {
        try {
          await Location.enableNetworkProviderAsync();
          servicesEnabled = await Location.hasServicesEnabledAsync();
        } catch {
          // The user can still enable location from the system settings.
        }
      }
      if (!servicesEnabled) {
        Alert.alert('Location is turned off', 'Turn on device location, then try View map again.');
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
    {signup && accountRole === 'owner' && <View style={s.ownerSignupSection}><Text style={s.ownerSignupTitle}>Salon information</Text><Text style={s.small}>Register your business and pin its exact customer-facing map location.</Text><Field icon="storefront-outline" placeholder="Salon name" value={salonName} onChangeText={setSalonName} /><Field icon="location-outline" placeholder="Complete salon address" value={salonAddress} onChangeText={setSalonAddress} /><Field icon="business-outline" placeholder="City or municipality" value={salonCity} onChangeText={setSalonCity} /><Pressable accessibilityRole="button" onPress={() => void chooseImage('your salon logo').then(photo => { if (photo) { setSalonLogoUri(photo.uri); setSalonLogoData(photo.data); } })} style={s.salonSignupLogoPicker}>{salonLogoUri ? <Image source={{ uri: salonLogoUri }} style={s.salonSignupLogo} /> : <View style={s.salonSignupLogoFallback}><Ionicons name="images-outline" size={27} color={C.rose} /></View>}<View style={s.salonCardGrow}><Text style={s.cardTitle}>{salonLogoUri ? 'Change salon logo' : 'Add salon logo'}</Text><Text style={s.small}>Shown on your profile and customer map</Text></View><Ionicons name="add-circle" size={24} color={C.rose} /></Pressable><Text style={s.accountTypeLabel}>Pin your salon location</Text><SalonLocationPicker latitude={Number(salonLatitude) || 14.0667} longitude={Number(salonLongitude) || 120.6333} onChange={coordinate => { setSalonLatitude(coordinate.latitude.toFixed(7)); setSalonLongitude(coordinate.longitude.toFixed(7)); }} /><View style={s.coordinateRow}><View style={s.coordinateField}><Field icon="navigate-outline" placeholder="Latitude" value={salonLatitude} onChangeText={setSalonLatitude} keyboardType="phone-pad" /></View><View style={s.coordinateField}><Field icon="navigate-outline" placeholder="Longitude" value={salonLongitude} onChangeText={setSalonLongitude} keyboardType="phone-pad" /></View></View></View>}
    {!signup && <Text style={[s.link, { textAlign: 'right', marginBottom: 22 }]}>Forgot password?</Text>}
    {authError && <View style={s.authError}><Ionicons name="alert-circle-outline" size={20} color="#9C3045" /><Text style={s.authErrorText}>{authError}</Text></View>}
    <Button label={authLoading ? 'Please wait…' : signup ? 'Create account' : 'Log in'} disabled={authLoading} onPress={() => void submitAuth(signup)} />
    <Pressable onPress={() => { setAuthError(null); setScreen(signup ? 'login' : 'signup'); }}><Text style={s.authSwitch}>{signup ? 'Already have an account? Log in' : 'New here? Create an account'}</Text></Pressable>
  </ScreenFrame>;

  const home = <ScreenFrame><CustomerDashboardScreen user={authUser} salons={salonRecords} favoriteSalonIds={favoriteSalonIds} savingFavoriteSalonIds={savingFavoriteSalonIds} unreadNotifications={notificationUnreadCount} loadingSalons={salonsLoading} salonsError={salonsError} loadingLocation={isGettingLocation} onNotifications={() => showNotifications('home')} onScan={() => setScreen('scan')} onMap={openCurrentLocationMap} onReloadSalons={() => void loadSalons()} onOpenSalon={salon => void openSalon(salon)} onToggleFavorite={toggleFavoriteSalon} /></ScreenFrame>;

  const scan = <FaceScanScreen onBack={() => back()} onCaptured={processScan} />;

  const processing = <ScreenFrame scroll={false}><View style={s.centerPage}><View style={s.processIcon}><Ionicons name="scan" size={50} color={C.rose} /><ActivityIndicator color={C.rose} size="large" style={StyleSheet.absoluteFill} /></View><Text style={s.title}>Analyzing your face shape…</Text><Text style={[s.body, s.centerText]}>Mapping landmarks, measuring proportions, and ranking hairstyles for you.</Text><View style={s.steps}>{['Preprocessing image', 'Detecting face landmarks', 'Classifying face shape', 'Matching hairstyles'].map((x, i) => <View style={s.step} key={x}><View style={[s.stepDot, i < 2 && s.stepDone]}>{i < 2 && <Ionicons name="checkmark" size={13} color={C.white} />}</View><Text style={s.small}>{x}</Text></View>)}</View></View></ScreenFrame>;

  const result = faceAnalysis ? <ScreenFrame><Header title="Your result" onBack={() => setScreen('home')} action="share-outline" /><Text style={s.eyebrow}>MOST LIKELY FACE SHAPE</Text><Text style={s.display}>{faceAnalysis.faceShape.charAt(0).toUpperCase() + faceAnalysis.faceShape.slice(1)}</Text><View style={s.resultVisual}>{uploaded ? <FaceLandmarkOverlay uri={uploaded} imageSize={faceAnalysis.imageSize} landmarks={faceAnalysis.landmarks} /> : <Art height={230} quadrant={0} />}</View><Text style={s.sectionTitle}>{shapeCopy[faceAnalysis.faceShape].title}</Text><Text style={s.body}>{shapeCopy[faceAnalysis.faceShape].description} This estimate comes from normalized facial-landmark measurements.</Text><Text style={s.eyebrow}>SCAN MEASUREMENTS</Text><View style={s.chipRow}><View style={s.chip}><Text style={s.chipText}>Length {faceAnalysis.measurements.lengthToWidth.toFixed(2)}× width</Text></View><View style={s.chip}><Text style={s.chipText}>Jaw {faceAnalysis.measurements.jawToCheek.toFixed(2)}× cheeks</Text></View><View style={s.chip}><Text style={s.chipText}>Forehead {faceAnalysis.measurements.foreheadToCheek.toFixed(2)}× cheeks</Text></View></View><Button label="See my hairstyle matches" onPress={() => setScreen('recommendations')} icon="sparkles" /><Button label="Scan again" onPress={() => setScreen('scan')} secondary /></ScreenFrame> : processing;

  const menMatches = (faceAnalysis?.recommendations || []).filter(item => item.audience === 'men');
  const recommendationCard = (item: FaceAnalysis['recommendations'][number]) => <Pressable onPress={() => { setSelectedRecommendation(item); setScreen('style-detail'); }} style={s.recCard} key={`${item.audience}-${item.name}`}><View style={s.matchBadge}><Text style={s.matchText}>{item.score}% match</Text></View><View style={s.recBody}><View style={s.sectionHead}><Text style={s.cardTitle}>{item.name}</Text><Ionicons name="chevron-forward" size={20} color={C.rose} /></View><Text style={s.small}>{item.reason}</Text></View></Pressable>;
  const recommendations = <ScreenFrame><Header title="Men's top matches" onBack={() => setScreen('result')} action="heart-outline" /><Text style={s.body}>Men&apos;s hairstyles ranked for your {faceAnalysis?.faceShape || 'detected'} face shape and facial proportions.</Text><View style={s.chatBox}><Ionicons name="sparkles" size={19} color={C.rose} /><TextInput style={s.chatInput} placeholder="Refine: shorter, curly, low-maintenance…" placeholderTextColor="#9A8D91" /><Ionicons name="arrow-up-circle" size={27} color={C.rose} /></View><Text style={s.matchSectionTitle}>Recommended for you</Text><Text style={s.matchSectionCopy}>Shapes and finishes selected for your facial structure.</Text>{menMatches.map(recommendationCard)}</ScreenFrame>;

  const styleDetail = selectedRecommendation ? <ScreenFrame><Header title="Style details" onBack={() => setScreen('recommendations')} action="heart-outline" /><View style={s.detailTitle}><View style={{flex:1}}><Text style={s.eyebrow}>{selectedRecommendation.audience === 'men' ? "MEN'S STYLE" : "WOMEN'S STYLE"}</Text><Text style={s.title}>{selectedRecommendation.name}</Text><Text style={s.matchText}>{selectedRecommendation.score}% match for you</Text></View><View style={s.scoreCircle}><Text style={s.scoreText}>{selectedRecommendation.score}</Text></View></View><Text style={s.sectionTitle}>Why it suits you</Text><Text style={s.body}>{selectedRecommendation.reason}</Text><View style={s.chipRow}><View style={s.chip}><Text style={s.chipText}>{faceAnalysis?.faceShape} face</Text></View><View style={s.chip}><Text style={s.chipText}>Landmark matched</Text></View></View><Button label="Save hairstyle" disabled={!authToken} onPress={() => { if (authToken) void saveHairstyle(authToken, selectedRecommendation.name).then(() => Alert.alert('Saved', `${selectedRecommendation.name} was added to your saved hairstyles.`)).catch(error => Alert.alert('Unable to save', error.message)); }} icon="heart" /><Button label="Find a salon for this style" onPress={() => setScreen('salons')} icon="location" /></ScreenFrame> : recommendations;

  const normalizedSalonSearch = salonSearchQuery.trim().toLowerCase();
  const filteredSalonRecords = normalizedSalonSearch
    ? salonRecords.filter(salon => [salon.name, salon.address, salon.city, salon.phone].some(value => value?.toLowerCase().includes(normalizedSalonSearch)))
    : salonRecords;
  const mappedSalons = salonRecords.flatMap(salon => salon.latitude != null && salon.longitude != null ? [{ id: salon.id, name: salon.name, address: salon.address, latitude: salon.latitude, longitude: salon.longitude, profileImageUrl: getApiAssetUrl(salon.profileImageUrl) }] : []);
  const filteredMappedSalons = filteredSalonRecords.flatMap(salon => salon.latitude != null && salon.longitude != null ? [{ id: salon.id, name: salon.name, address: salon.address, latitude: salon.latitude, longitude: salon.longitude, profileImageUrl: getApiAssetUrl(salon.profileImageUrl) }] : []);
  const salons = <ScreenFrame><Header title="Nasugbu salons" onBack={() => setScreen('home')} action="options-outline" /><View style={s.salonSearch}><Ionicons name="search" size={20} color={C.muted} /><TextInput accessibilityLabel="Search Nasugbu salons" value={salonSearchQuery} onChangeText={setSalonSearchQuery} placeholder="Search salon, address, or city" placeholderTextColor="#A89DA0" returnKeyType="search" clearButtonMode="while-editing" style={s.salonSearchInput} />{salonSearchQuery.length > 0 && Platform.OS !== 'ios' && <Pressable accessibilityRole="button" accessibilityLabel="Clear salon search" hitSlop={8} onPress={() => setSalonSearchQuery('')} style={({ pressed }) => [s.searchClear, pressed && s.pressed]}><Ionicons name="close-circle" size={20} color={C.muted} /></Pressable>}</View><View style={s.segment}><Pressable onPress={() => setSalonView('list')} style={salonView === 'list' ? s.segmentActive : s.segmentItem}><Ionicons name="list" size={17} color={salonView === 'list' ? C.rose : C.muted} /><Text style={salonView === 'list' ? s.segmentText : s.small}>List</Text></Pressable><Pressable onPress={() => setSalonView('map')} style={salonView === 'map' ? s.segmentActive : s.segmentItem}><Ionicons name="map-outline" size={17} color={salonView === 'map' ? C.rose : C.muted} /><Text style={salonView === 'map' ? s.segmentText : s.small}>Map</Text></Pressable></View>{salonsLoading ? <ActivityIndicator color={C.rose} style={s.dataLoader} /> : salonsError ? <Pressable onPress={loadSalons} style={s.dataState}><Text style={s.cardTitle}>Unable to reach the FaceFit API</Text><Text style={s.small}>{salonsError} · Tap to retry</Text></Pressable> : filteredSalonRecords.length === 0 ? <View style={s.dataState}><Ionicons name="search-outline" size={30} color={C.rose} /><Text style={s.cardTitle}>{normalizedSalonSearch ? 'No matching salons' : 'No salons found'}</Text><Text style={s.small}>{normalizedSalonSearch ? `Try another search for “${salonSearchQuery.trim()}”.` : 'Run npm run db:init in the server directory.'}</Text>{normalizedSalonSearch && <Pressable accessibilityRole="button" onPress={() => setSalonSearchQuery('')} style={s.clearSearchButton}><Text style={s.link}>Clear search</Text></Pressable>}</View> : salonView === 'map' ? <><SalonMap salons={filteredMappedSalons} onSelectSalon={salonId => { const salon = filteredSalonRecords.find(item => item.id === salonId); if (salon) void openSalon(salon); }} />{filteredMappedSalons.length === 0 && <View style={s.mapNotice}><Ionicons name="location-outline" size={21} color={C.rose} /><Text style={s.small}>The matching salons do not have verified map coordinates yet.</Text></View>}<Text style={s.mapAttribution}>Showing {filteredSalonRecords.length} salon{filteredSalonRecords.length === 1 ? '' : 's'} · Map data © OpenStreetMap contributors</Text></> : filteredSalonRecords.map(salon => { const favorite = favoriteSalonIds.includes(salon.id); const busy = savingFavoriteSalonIds.includes(salon.id); return <Pressable key={salon.id} onPress={() => void openSalon(salon)} style={s.listCard}><View style={s.salonSquare}>{salon.profileImageUrl ? <Image accessibilityLabel={`${salon.name} profile picture`} source={{ uri: getApiAssetUrl(salon.profileImageUrl)! }} style={s.salonSquareImage} /> : <Ionicons name="cut" size={28} color={C.rose} />}</View><View style={{ flex: 1 }}><Text style={s.cardTitle}>{salon.name}</Text><Text style={s.small}>{salon.address}</Text><Text style={s.small}>{salon.phone || salon.city}</Text></View><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: favorite, busy }} accessibilityLabel={`${favorite ? 'Remove' : 'Add'} ${salon.name} ${favorite ? 'from' : 'to'} favorites`} hitSlop={8} onPress={event => { event.stopPropagation(); toggleFavoriteSalon(salon.id); }} style={({ pressed }) => [s.listFavorite, favorite && s.favoriteButtonActive, pressed && s.favoritePressed]}><FavoriteIcon active={favorite} busy={busy} /></Pressable><Ionicons name="chevron-forward" size={20} color={C.muted} /></Pressable>; })}</ScreenFrame>;

  const salonDetailFavorite = selectedSalon ? favoriteSalonIds.includes(selectedSalon.id) : false;
  const salonDetailFavoriteBusy = selectedSalon ? savingFavoriteSalonIds.includes(selectedSalon.id) : false;
  const salonHours = selectedSalon?.opening_time
    ? `${selectedSalon.opening_time.slice(0, 5)}${selectedSalon.closing_time ? `–${selectedSalon.closing_time.slice(0, 5)}` : ''}`
    : 'Contact for hours';
  const salonDetail = <ScreenFrame><Header title="Salon profile" onBack={() => { if (salonDetailReturn === 'nearby-map') { setScreen('home'); setMapVisible(true); } else { setScreen(salonDetailReturn); } }} action="heart-outline" favoriteActive={salonDetailFavorite} actionBusy={salonDetailFavoriteBusy} actionColor={C.rose} onAction={selectedSalon ? () => toggleFavoriteSalon(selectedSalon.id) : undefined} />{selectedSalon ? <>
    <View style={s.salonProfileHero}>
      <SalonLogo name={selectedSalon.name} imageUrl={selectedSalon.profileImageUrl} large />
      <View style={s.salonHeroContent}><Text style={s.salonProfileName}>{selectedSalon.name}</Text><View style={s.salonRatingRow}><Ionicons name="star" size={17} color="#FFD58A" /><Text style={s.salonRatingText}>{salonReviewSummary.count ? salonReviewSummary.average.toFixed(1) : 'New'}</Text><Text style={s.salonHeroMeta}>{salonReviewSummary.count ? `${salonReviewSummary.count} review${salonReviewSummary.count === 1 ? '' : 's'}` : 'Be the first to review'}</Text></View><Text style={s.salonHeroAddress}>{selectedSalon.address} · {selectedSalon.city}</Text></View>
    </View>
    <View style={s.salonInfoGrid}>
      <View style={s.salonInfoCard}><Ionicons name="time-outline" size={21} color={C.rose} /><Text style={s.salonInfoLabel}>Hours</Text><Text style={s.salonInfoValue}>{salonHours}</Text></View>
      <View style={s.salonInfoCard}><Ionicons name="call-outline" size={21} color={C.rose} /><Text style={s.salonInfoLabel}>Contact</Text><Text numberOfLines={1} style={s.salonInfoValue}>{selectedSalon.phone || 'Not published'}</Text></View>
      <View style={s.salonInfoCard}><Ionicons name="people-outline" size={21} color={C.rose} /><Text style={s.salonInfoLabel}>Available staff</Text><Text style={s.salonInfoValue}>{salonStaff.length}</Text></View>
    </View>
    {selectedSalon.description && <View style={s.salonAbout}><Text style={s.salonSectionKicker}>ABOUT</Text><Text style={s.body}>{selectedSalon.description}</Text></View>}
    {salonDetailError && <Pressable onPress={() => void openSalon(selectedSalon, salonDetailReturn)} style={s.salonLoadWarning}><Ionicons name="refresh-circle" size={22} color={C.rose} /><Text style={s.authErrorText}>{salonDetailError}</Text></Pressable>}
    {salonDetailLoading ? <ActivityIndicator color={C.rose} style={s.dataLoader} /> : <>
      {salonPortfolioImages.length > 0 && <><SectionTitle title="Business portfolio" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.portfolioGallery}>{salonPortfolioImages.map(image => <View style={s.portfolioCustomerCard} key={image.id}><Image source={{ uri: getApiAssetUrl(image.imageUrl)! }} style={s.portfolioCustomerImage} />{image.caption && <Text numberOfLines={2} style={s.portfolioCaption}>{image.caption}</Text>}</View>)}</ScrollView></>}
      <SectionTitle title="Services & pricing" />
      {salonServices.length ? <View style={s.salonDetailGrid}>{salonServices.map(service => <Pressable onPress={() => { setSelectedService(service); setScreen('datetime'); }} style={({ pressed }) => [s.salonServiceCard, pressed && s.pressed]} key={service.id}><View style={s.salonServiceIcon}><Ionicons name="cut-outline" size={22} color={C.rose} /></View><View style={s.salonCardGrow}><Text style={s.cardTitle}>{service.name}</Text>{service.description && <Text numberOfLines={2} style={s.small}>{service.description}</Text>}<View style={s.salonServiceMeta}><Text style={s.salonPrice}>₱{service.price.toLocaleString()}</Text><Text style={s.small}>{service.duration_minutes} min</Text></View></View><Ionicons name="arrow-forward-circle" size={26} color={C.rose} /></Pressable>)}</View> : <View style={s.salonEmptyCard}><Ionicons name="cut-outline" size={28} color={C.rose} /><View><Text style={s.cardTitle}>Services coming soon</Text><Text style={s.small}>This salon has not published its menu yet.</Text></View></View>}

      <SectionTitle title="Available staff" />
      {salonStaff.length ? <View style={s.salonDetailGrid}>{salonStaff.map(staff => { const selected = selectedStylist?.id === staff.id; return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => setSelectedStylist(selected ? null : staff)} style={({ pressed }) => [s.staffCard, selected && s.staffCardSelected, pressed && s.pressed]} key={staff.id}>{staff.imageUrl ? <Image source={{ uri: getApiAssetUrl(staff.imageUrl)! }} style={[s.staffAvatarImage, selected && s.staffAvatarSelected]} /> : <View style={[s.staffAvatar, selected && s.staffAvatarSelected]}><Text style={s.staffInitial}>{staff.name.charAt(0).toUpperCase()}</Text></View>}<View style={s.salonCardGrow}><Text style={s.cardTitle}>{staff.name}</Text><Text style={s.small}>{staff.specialties || 'Salon professional'}</Text><View style={s.availableBadge}><View style={s.availableDot} /><Text style={s.availableText}>Available</Text></View></View><Ionicons name={selected ? 'checkmark-circle' : 'add-circle-outline'} size={25} color={C.rose} /></Pressable>; })}</View> : <View style={s.salonEmptyCard}><Ionicons name="people-outline" size={28} color={C.rose} /><View><Text style={s.cardTitle}>No staff profiles published yet</Text><Text style={s.small}>You can still book and the salon will assign an available professional.</Text></View></View>}

      <View style={s.reviewHeading}><SectionTitle title="Customer reviews" /><View style={s.reviewSummaryPill}><Ionicons name="star" size={15} color={C.gold} /><Text style={s.reviewSummaryText}>{salonReviewSummary.count ? `${salonReviewSummary.average.toFixed(1)} (${salonReviewSummary.count})` : 'No ratings'}</Text></View></View>
      {salonReviews.length ? <View style={s.reviewList}>{salonReviews.map(review => <View style={[s.reviewCard, editingReviewId === review.id && s.reviewCardEditing]} key={review.id}><View style={s.reviewTop}><View style={s.reviewAvatar}><Text style={s.reviewInitial}>{review.reviewerName.charAt(0).toUpperCase()}</Text></View><View style={s.salonCardGrow}><Text style={s.cardTitle}>{review.reviewerName}</Text><Text style={s.small}>{new Date(review.createdAt).toLocaleDateString()}</Text></View><View style={s.reviewActions}><View style={s.reviewStars}>{[1,2,3,4,5].map(star => <Ionicons key={star} name={star <= review.rating ? 'star' : 'star-outline'} size={14} color={C.gold} />)}</View>{mySalonReviewIds.includes(review.id) && <Pressable accessibilityRole="button" accessibilityLabel="Edit this review" onPress={() => editSalonReview(review)} style={({ pressed }) => [s.reviewEditButton, pressed && s.pressed]}><Ionicons name="create-outline" size={15} color={C.rose} /><Text style={s.reviewEditText}>Edit</Text></Pressable>}</View></View>{review.imageUrl && <Image source={{ uri: getApiAssetUrl(review.imageUrl)! }} style={s.reviewPhoto} />}{review.comment && <Text style={s.reviewComment}>{review.comment}</Text>}{review.replies.map(reply => <View style={s.salonOwnerReply} key={reply.id}><View style={s.salonOwnerReplyHead}><Ionicons name="storefront" size={16} color={C.rose} /><Text style={s.salonOwnerReplyLabel}>{(reply.salonName || selectedSalon?.name || 'SALON').toUpperCase()} REPLIED</Text></View>{reply.imageUrl && <Image source={{ uri: getApiAssetUrl(reply.imageUrl)! }} style={s.replyPhoto} />}{reply.message && <Text style={s.salonOwnerReplyText}>{reply.message}</Text>}<Text style={s.salonOwnerReplyDate}>{new Date(reply.createdAt).toLocaleString()}</Text></View>)}</View>)}</View> : <View style={s.salonEmptyCard}><Ionicons name="chatbubble-ellipses-outline" size={28} color={C.rose} /><View><Text style={s.cardTitle}>No reviews yet</Text><Text style={s.small}>Share the first verified FaceFit review for this salon.</Text></View></View>}

      {authToken ? <View style={s.reviewComposer}><View style={s.reviewComposerHeading}><View><Text style={s.cardTitle}>{editingReviewId ? 'Edit selected review' : 'Write another review'}</Text><Text style={s.small}>{editingReviewId ? 'Only this review will be updated.' : 'You can publish as many separate reviews as you need.'}</Text></View>{editingReviewId && <Pressable accessibilityRole="button" onPress={cancelReviewEdit} style={({ pressed }) => [s.reviewCancelButton, pressed && s.pressed]}><Text style={s.reviewCancelText}>Cancel edit</Text></Pressable>}</View><View style={s.reviewPicker}>{[1,2,3,4,5].map(star => <Pressable accessibilityRole="radio" accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`} accessibilityState={{ checked: reviewRating === star }} hitSlop={5} onPress={() => setReviewRating(star)} key={star}><Ionicons name={star <= reviewRating ? 'star' : 'star-outline'} size={30} color={C.gold} /></Pressable>)}</View>{reviewImageUri ? <View style={s.reviewPhotoPreview}><Image source={{ uri: reviewImageUri }} style={s.reviewPreviewImage} /><Pressable accessibilityRole="button" accessibilityLabel="Remove review photo" onPress={() => { setReviewImageUri(null); setReviewImageData(null); }} style={({ pressed }) => [s.reviewPhotoRemove, pressed && s.pressed]}><Ionicons name="trash-outline" size={18} color={C.white} /><Text style={s.reviewPhotoRemoveText}>Remove</Text></Pressable></View> : <Pressable accessibilityRole="button" onPress={() => void pickReviewImage()} style={({ pressed }) => [s.reviewPhotoPicker, pressed && s.pressed]}><View style={s.reviewPhotoPickerIcon}><Ionicons name="camera-outline" size={23} color={C.rose} /></View><View style={s.salonCardGrow}><Text style={s.cardTitle}>Add a review photo</Text><Text style={s.small}>JPG, PNG, or WebP · up to 2.5 MB</Text></View><Ionicons name="add-circle" size={25} color={C.rose} /></Pressable>}<TextInput value={reviewComment} onChangeText={setReviewComment} maxLength={500} multiline placeholder="What stood out about your visit?" placeholderTextColor="#A89DA0" style={s.reviewInput} /><Text style={s.reviewCharacterCount}>{reviewComment.length}/500</Text><Button label={reviewSaving ? 'Saving…' : editingReviewId ? 'Save review changes' : 'Publish new review'} disabled={reviewRating === 0 || reviewSaving} onPress={() => void submitSalonReview()} icon="send" /></View> : <View style={s.salonEmptyCard}><Ionicons name="log-in-outline" size={28} color={C.rose} /><View><Text style={s.cardTitle}>Log in to leave a review</Text><Text style={s.small}>Reviews are connected to verified FaceFit accounts.</Text></View></View>}
      <Button label="Choose a service" disabled={salonServices.length === 0} onPress={() => setScreen('service')} icon="calendar-outline" />
    </>}
  </> : <View style={s.dataState}><Text style={s.cardTitle}>Choose a salon first</Text><Button label="Browse salons" onPress={() => setScreen('salons')} /></View>}</ScreenFrame>;

  const selection = (_kind: 'service' | 'stylist') => <ScreenFrame><Header title="Choose a service" onBack={() => setScreen('salon-detail')} /><View style={s.progress}><View style={[s.progressFill, { width: '50%' }]} /></View><Text style={s.body}>Step 1 of 2 · {selectedSalon?.name}</Text>{salonServices.map(service => <Pressable key={service.id} onPress={() => setSelectedService(service)} style={[s.choiceCard, selectedService?.id === service.id && s.choiceSelected]}><View style={s.choiceIcon}><Ionicons name="cut" size={24} color={C.rose} /></View><View style={{ flex: 1 }}><Text style={s.cardTitle}>{service.name}</Text><Text style={s.small}>₱{service.price.toLocaleString()} · {service.duration_minutes} min</Text></View><Ionicons name={selectedService?.id === service.id ? 'radio-button-on' : 'radio-button-off'} size={22} color={selectedService?.id === service.id ? C.rose : C.muted} /></Pressable>)}<View style={s.bottomSpace} /><Button label="Choose date & time" disabled={!selectedService} onPress={() => setScreen('datetime')} /></ScreenFrame>;

  const datetime = <ScreenFrame><Header title="Date & time" onBack={() => setScreen('service')} /><View style={s.progress}><View style={[s.progressFill, { width: '100%' }]} /></View><Text style={s.body}>Step 2 of 2</Text><View style={s.monthRow}><Pressable disabled={calendarMonth <= new Date(today.getFullYear(), today.getMonth(), 1)} onPress={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={calendarMonth <= new Date(today.getFullYear(), today.getMonth(), 1) && s.disabledControl}><Ionicons name="chevron-back" size={22} color={C.muted} /></Pressable><Text style={s.sectionTitle}>{calendarMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}</Text><Pressable onPress={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Ionicons name="chevron-forward" size={22} color={C.muted} /></Pressable></View><View style={s.calendar}>{['M','T','W','T','F','S','S'].map((label, index) => <View key={`${label}${index}`} style={s.day}><Text style={s.calendarWeekday}>{label}</Text></View>)}{calendarDays.map((day, index) => { if (day === null) return <View key={`blank${index}`} style={s.day} />; const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day); const key = toDateKey(date); const disabled = date < today; const active = selectedDate === key; return <Pressable accessibilityRole="button" accessibilityState={{ disabled, selected: active }} disabled={disabled} onPress={() => { setSelectedDate(key); setSelectedTime(null); }} key={key} style={[s.day, active && s.dayActive]}><Text style={[s.dayText, disabled && s.dayTextDisabled, active && s.dayTextActive]}>{day}</Text></Pressable>; })}</View><SectionTitle title="Available times" />{!selectedDate && <Text style={s.body}>Select an available date first.</Text>}<View style={s.timeGrid}>{timeOptions.map(option => { const disabled = !selectedDate || isTimePast(option.value); const active = selectedTime === option.value; return <Pressable disabled={disabled} onPress={() => setSelectedTime(option.value)} style={[s.time, active && s.timeActive, disabled && s.timeDisabled]} key={option.value}><Text style={[s.chipText, active && s.timeTextActive, disabled && s.dayTextDisabled]}>{option.label}</Text></Pressable>; })}</View><Button label="Review booking" disabled={!selectedService || !selectedDate || !selectedTime} onPress={() => setScreen('summary')} /></ScreenFrame>;

  const summary = <ScreenFrame><Header title="Review booking" onBack={() => setScreen('datetime')} /><View style={s.summaryCard}>{selectedSalon && <SalonLogo name={selectedSalon.name} imageUrl={selectedSalon.profileImageUrl} />}<Text style={s.title}>{selectedSalon?.name}</Text><Text style={s.body}>{selectedService?.name}</Text><View style={s.divider} />{[['calendar',selectedDateLabel],['time',`${selectedTimeLabel} · ${selectedService?.duration_minutes || 0} min`],['person',selectedStylist?.name || 'Any available professional'],['location',selectedSalon?.address || 'Nasugbu, Batangas']].map(x => <View style={s.summaryRow} key={x[0]}><Ionicons name={x[0] as keyof typeof Ionicons.glyphMap} size={21} color={C.rose} /><Text style={s.cardTitle}>{x[1]}</Text></View>)}<View style={s.divider} /><View style={s.sectionHead}><Text style={s.cardTitle}>Estimated total</Text><Text style={s.price}>₱{selectedService?.price.toLocaleString()}</Text></View></View><View style={s.notice}><Ionicons name="information-circle" size={21} color={C.rose} /><Text style={s.small}>Starter prices are estimates. Confirm final pricing with the salon.</Text></View>{bookingError && <View style={s.authError}><Text style={s.authErrorText}>{bookingError}</Text></View>}<Button label={bookingLoading ? 'Confirming…' : 'Confirm booking'} disabled={!selectedService || !selectedDate || !selectedTime || bookingLoading} onPress={() => void confirmBooking()} /></ScreenFrame>;

  const success = <ScreenFrame scroll={false}><View style={s.centerPage}><View style={s.successIcon}><Ionicons name="checkmark" size={52} color={C.white} /></View><Text style={s.display}>{"You're booked!"}</Text><Text style={[s.body, s.centerText]}>Your appointment at {selectedSalon?.name} was saved.</Text><View style={s.ticket}><Text style={s.eyebrow}>{selectedDateLabel.toUpperCase()} · {selectedTimeLabel.toUpperCase()}</Text><Text style={s.title}>{selectedService?.name}</Text><Text style={s.body}>Status: pending confirmation</Text></View><Button label="View my bookings" onPress={() => setScreen('bookings')} /><Button label="Back to home" onPress={() => setScreen('home')} secondary /></View></ScreenFrame>;

  const bookings = <ScreenFrame><Header title="My bookings" action="notifications-outline" onAction={() => showNotifications('bookings')} actionBadge={notificationUnreadCount} />{bookingsLoading ? <ActivityIndicator color={C.rose} style={s.dataLoader} /> : bookingsError ? <Pressable onPress={() => void loadBookings()} style={s.dataState}><Ionicons name="cloud-offline-outline" size={28} color={C.rose} /><Text style={s.cardTitle}>Could not load bookings</Text><Text style={s.small}>{bookingsError} · Tap to retry</Text></Pressable> : bookingRecords.length === 0 ? <View style={s.empty}><Ionicons name="calendar-outline" size={40} color="#CDBEC2" /><Text style={s.cardTitle}>No appointments yet</Text><Text style={s.small}>Bookings you make with a salon will appear here.</Text></View> : bookingRecords.map(booking => <View style={s.bookingCard} key={booking.id}><Text style={s.eyebrow}>{new Date(booking.appointmentAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }).toUpperCase()}</Text><Text style={s.title}>{booking.serviceName}</Text><Text style={s.body}>{booking.salonName}{booking.stylistName ? ` · ${booking.stylistName}` : ''}</Text><View style={s.divider} /><View style={s.bookingMeta}><Text style={s.chipText}>₱{booking.price.toLocaleString()}</Text><Text style={s.chipText}>{booking.durationMinutes} min</Text><Text style={s.bookingStatus}>{booking.status}</Text></View></View>)}</ScreenFrame>;

  const profile = <ScreenFrame><Header title="Profile" action="settings-outline" />{profileLoading && !userProfile ? <ActivityIndicator color={C.rose} style={s.dataLoader} /> : profileError && !userProfile ? <Pressable onPress={() => void loadProfile()} style={s.dataState}><Ionicons name="cloud-offline-outline" size={26} color={C.rose} /><Text style={s.cardTitle}>Could not load profile</Text><Text style={s.small}>{profileError} · Tap to retry</Text></Pressable> : <><View style={s.profileHead}>{userProfile?.profileImageUrl ? <Image accessibilityLabel="Profile picture" source={{ uri: getApiAssetUrl(userProfile.profileImageUrl)! }} style={s.profileAvatarImage} /> : <View style={s.profileAvatar}><Text style={s.profileInitial}>{authUser?.fullName.charAt(0).toUpperCase() || '?'}</Text></View>}<View style={{ flex: 1 }}><Text style={s.title}>{userProfile?.fullName || authUser?.fullName || 'FaceFit user'}</Text></View></View><View style={s.preferenceCard}><Text style={s.eyebrow}>MY HAIR PROFILE</Text><View style={s.preferenceRow}>{[['Type',userProfile?.hairType],['Length',userProfile?.hairLength],['Texture',userProfile?.hairTexture],['Face',userProfile?.faceShape]].map(x => <View style={s.preferenceItem} key={x[0]}><Text style={s.small}>{x[0]}</Text><Text style={s.cardTitle}>{x[1] || 'Not set'}</Text></View>)}</View></View></>}{[
    ['heart-outline','Saved hairstyles','saved'], ['storefront-outline','Saved salons','saved-salons'], ['notifications-outline','Notifications','notifications'], ['star-outline','My reviews','reviews'], ['shield-checkmark-outline','Settings','settings']
  ].map(x => <Pressable key={x[1]} onPress={() => x[2] === 'notifications' ? showNotifications('profile') : setScreen(x[2] as Screen)} style={s.menuRow}><View style={s.menuIcon}><Ionicons name={x[0] as keyof typeof Ionicons.glyphMap} size={21} color={C.rose} /></View><Text style={[s.cardTitle, { flex: 1 }]}>{x[1]}</Text>{x[2] === 'notifications' && notificationUnreadCount > 0 && <View style={s.notificationMenuCount}><Text style={s.notificationBadgeText}>{notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}</Text></View>}<Ionicons name="chevron-forward" size={20} color={C.muted} /></Pressable>)}</ScreenFrame>;

  const notificationPage = (owner: boolean) => <ScreenFrame><Header title="Notifications" onBack={() => setScreen(owner ? 'owner-dashboard' : notificationReturnScreen)} />{accountLoading ? <ActivityIndicator color={C.rose} style={s.dataLoader} /> : accountError ? <Pressable onPress={() => void loadAccountScreen()} style={s.dataState}><Text style={s.cardTitle}>Could not load notifications</Text><Text style={s.small}>{accountError} · Tap to retry</Text></Pressable> : accountItems.length === 0 ? <View style={s.empty}><Ionicons name="notifications-outline" size={40} color="#CDBEC2" /><Text style={s.cardTitle}>No notifications yet</Text><Text style={s.small}>Booking and review updates will appear here.</Text></View> : <View style={s.notificationList}>{accountItems.map(item => { const unread = !Boolean(item.isRead); return <Pressable accessibilityRole="button" accessibilityState={{ selected: unread }} key={item.id} onPress={() => void openNotification(item, owner)} style={({ pressed }) => [s.notificationCard, unread && s.notificationCardUnread, pressed && s.pressed]}><View style={[s.notificationIcon, unread && s.notificationIconUnread]}><Ionicons name={item.destination?.includes('review') ? 'star-outline' : 'calendar-outline'} size={21} color={unread ? C.white : C.rose} /></View><View style={s.salonCardGrow}><View style={s.notificationTitleRow}><Text style={[s.cardTitle, !unread && s.notificationTitleRead]}>{item.title}</Text>{unread && <View style={s.notificationUnreadDot} />}</View>{item.detail && <Text style={s.small}>{item.detail}</Text>}<View style={s.notificationFooter}><Text style={s.notificationDate}>{new Date(item.createdAt).toLocaleString()}</Text>{unread && <Pressable accessibilityRole="button" accessibilityLabel={`Mark ${item.title} as read`} onPress={event => { event.stopPropagation(); readNotification(item); }} style={({ pressed }) => [s.notificationReadButton, pressed && s.pressed]}><Ionicons name="checkmark" size={14} color={C.roseDark} /><Text style={s.notificationReadButtonText}>Mark as read</Text></Pressable>}</View></View>{item.destination && <Ionicons name="chevron-forward" size={19} color={C.muted} />}</Pressable>; })}</View>}</ScreenFrame>;

  const openAccountItem = async (item: AccountItem, section: 'saved' | 'saved-salons' | 'reviews') => {
    if (section === 'saved') {
      setSelectedAccountItem(item);
      setScreen('saved-style-detail');
      return;
    }
    if (!item.salonId) return;
    let salon = salonRecords.find(record => record.id === Number(item.salonId));
    if (!salon) {
      try {
        const latestSalons = await getSalons();
        setSalonRecords(latestSalons);
        salon = latestSalons.find(record => record.id === Number(item.salonId));
      } catch (error) {
        Alert.alert('Unable to open salon', error instanceof Error ? error.message : 'Please try again.');
        return;
      }
    }
    if (salon) await openSalon(salon, section);
  };

  const accountPage = (title: string, section: 'saved' | 'saved-salons' | 'reviews') => <ScreenFrame><Header title={title} onBack={() => setScreen('profile')} />{accountLoading ? <ActivityIndicator color={C.rose} style={s.dataLoader} /> : accountError ? <Pressable onPress={() => void loadAccountScreen()} style={s.dataState}><Text style={s.cardTitle}>Could not load {title.toLowerCase()}</Text><Text style={s.small}>{accountError} · Tap to retry</Text></Pressable> : accountItems.length === 0 ? <View style={s.empty}><Ionicons name={title === 'My reviews' ? 'star-outline' : 'heart-outline'} size={40} color="#CDBEC2" /><Text style={s.cardTitle}>Nothing here yet</Text><Text style={s.small}>Your {title.toLowerCase()} will appear here.</Text></View> : accountItems.map(item => <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} onPress={() => void openAccountItem(item, section)} style={({ pressed }) => [s.listCard, pressed && s.pressed]} key={item.id}><View style={s.menuIcon}><Ionicons name={title === 'My reviews' ? 'star' : section === 'saved-salons' ? 'storefront' : 'heart'} size={20} color={C.rose} /></View><View style={{ flex: 1 }}><Text style={s.cardTitle}>{item.title}</Text>{item.detail && <Text style={s.small}>{item.detail}</Text>}<Text style={s.small}>{new Date(item.createdAt).toLocaleDateString()}</Text></View><Ionicons name="chevron-forward" size={20} color={C.muted} /></Pressable>)}</ScreenFrame>;

  const savedStyleDetail = <ScreenFrame><Header title="Saved hairstyle" onBack={() => setScreen('saved')} />{selectedAccountItem && <><View style={s.consentHero}><Ionicons name="cut" size={52} color={C.rose} /></View><Text style={s.title}>{selectedAccountItem.title}</Text><Text style={s.body}>This hairstyle is saved to your FaceFit account.</Text><Text style={s.small}>Saved on {new Date(selectedAccountItem.createdAt).toLocaleDateString()}</Text><Button label="Find a salon for this style" onPress={() => setScreen('salons')} icon="storefront-outline" /><Button label="Back to saved hairstyles" onPress={() => setScreen('saved')} secondary /></>}</ScreenFrame>;

  const settingsPage = <ScreenFrame>{authToken && userProfile ? <CustomerSettingsScreen token={authToken} profile={userProfile} onBack={() => setScreen('profile')} onSaved={updated => { setUserProfile(updated); setAuthUser(current => current ? { ...current, fullName: updated.fullName, email: updated.email, phone: updated.phone } : current); Alert.alert('Profile updated', 'Your personal information has been saved.'); }} onLogout={() => { setAuthUser(null); setAuthToken(null); setUserProfile(null); setScreen('login'); }} /> : <View style={s.dataState}><ActivityIndicator color={C.rose} /><Text style={s.small}>Loading your profile...</Text></View>}</ScreenFrame>;

  const ownerManagementPage = (page: Exclude<Screen, 'owner-dashboard' | 'owner-notifications'>) => {
    const titles: Partial<Record<Screen, string>> = {
      'owner-bookings': 'Booking requests', 'owner-services': 'Services & pricing',
      'owner-staff': 'Staff management', 'owner-profile': 'Business profile',
      'owner-reviews': 'Reviews & ratings',
    };
    const title = titles[page] || 'Salon management';
    let body: React.ReactNode = null;
    if (ownerManagementLoading && !ownerManagement) body = <ActivityIndicator color={C.rose} style={s.dataLoader} />;
    else if (ownerManagementError) body = <Pressable onPress={() => void loadOwnerManagement()} style={s.dataState}><Ionicons name="cloud-offline-outline" size={28} color={C.rose} /><Text style={s.cardTitle}>Could not load {title.toLowerCase()}</Text><Text style={s.small}>{ownerManagementError} · Tap to retry</Text></Pressable>;
    else if (ownerManagement) {
      if (page === 'owner-bookings') body = ownerManagement.bookings.length ? ownerManagement.bookings.map(booking => <View style={s.bookingCard} key={booking.id}><View style={s.ownerCardTop}><View style={s.salonCardGrow}><Text style={s.eyebrow}>{new Date(booking.appointmentAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }).toUpperCase()}</Text><Text style={s.title}>{booking.customerName}</Text></View><Text style={s.bookingStatus}>{booking.status}</Text></View><Text style={s.body}>{booking.serviceName} · ₱{booking.price.toLocaleString()} · {booking.durationMinutes} min</Text><Text style={s.small}>{booking.customerEmail}{booking.customerPhone ? ` · ${booking.customerPhone}` : ''}</Text><Text style={s.small}>{booking.stylistName ? `Staff: ${booking.stylistName}` : 'Staff will be assigned by the salon'}</Text>{booking.notes && <Text style={s.ownerNote}>“{booking.notes}”</Text>}{booking.status === 'pending' && <View style={s.ownerActionRow}><Button label={ownerBookingUpdating === booking.id ? 'Updating…' : 'Confirm'} disabled={ownerBookingUpdating !== null} onPress={() => void changeOwnerBookingStatus(booking.id, 'confirmed')} /><Button label="Decline" disabled={ownerBookingUpdating !== null} secondary onPress={() => void changeOwnerBookingStatus(booking.id, 'cancelled')} /></View>}{booking.status === 'confirmed' && <View style={s.ownerActionRow}><Button label={ownerBookingUpdating === booking.id ? 'Updating…' : 'Mark completed'} disabled={ownerBookingUpdating !== null} onPress={() => void changeOwnerBookingStatus(booking.id, 'completed')} /><Button label="Cancel" disabled={ownerBookingUpdating !== null} secondary onPress={() => void changeOwnerBookingStatus(booking.id, 'cancelled')} /></View>}</View>) : <View style={s.empty}><Ionicons name="calendar-outline" size={40} color="#CDBEC2" /><Text style={s.cardTitle}>No client bookings yet</Text><Text style={s.small}>Appointments booked from the Teves client page will appear here.</Text></View>;
      else if (page === 'owner-services') body = <><View style={s.ownerPageActions}><View><Text style={s.sectionTitle}>Your service menu</Text><Text style={s.small}>{ownerManagement.services.length} service{ownerManagement.services.length === 1 ? '' : 's'}</Text></View><Pressable onPress={() => { setOwnerEditorError(null); setOwnerEditor({ kind: 'service', name: '', description: '', price: '', durationMinutes: '60', isActive: true }); }} style={s.ownerAddButton}><Ionicons name="add" size={19} color={C.white} /><Text style={s.ownerAddButtonText}>Add service</Text></Pressable></View>{ownerManagement.services.length ? <View style={s.salonDetailGrid}>{ownerManagement.services.map(service => <View style={s.ownerEditableCard} key={service.id}><View style={s.salonServiceIcon}><Ionicons name="cut-outline" size={22} color={C.rose} /></View><View style={s.salonCardGrow}><View style={s.ownerCardTop}><Text style={s.cardTitle}>{service.name}</Text><Text style={[s.ownerState, !service.isActive && s.ownerStateOff]}>{service.isActive ? 'Active' : 'Hidden'}</Text></View>{service.description && <Text style={s.small}>{service.description}</Text>}<View style={s.salonServiceMeta}><Text style={s.salonPrice}>₱{service.price.toLocaleString()}</Text><Text style={s.small}>{service.duration_minutes} min</Text></View><View style={s.ownerInlineActions}><Pressable onPress={() => { setOwnerEditorError(null); setOwnerEditor({ kind: 'service', id: service.id, name: service.name, description: service.description || '', price: String(service.price), durationMinutes: String(service.duration_minutes), isActive: service.isActive }); }} style={s.ownerEditAction}><Ionicons name="create-outline" size={16} color={C.rose} /><Text style={s.ownerEditActionText}>Edit</Text></Pressable><Pressable disabled={ownerRemoving === `service-${service.id}`} onPress={() => confirmOwnerRemoval('service', service.id, service.name)} style={s.ownerRemoveAction}>{ownerRemoving === `service-${service.id}` ? <ActivityIndicator size="small" color="#A33A4E" /> : <><Ionicons name="trash-outline" size={16} color="#A33A4E" /><Text style={s.ownerRemoveActionText}>Remove</Text></>}</Pressable></View></View></View>)}</View> : <View style={s.empty}><Ionicons name="pricetag-outline" size={40} color="#CDBEC2" /><Text style={s.cardTitle}>No services published</Text><Text style={s.small}>Add your first service so customers can book it.</Text></View>}</>;
      else if (page === 'owner-staff') body = <><View style={s.ownerPageActions}><View><Text style={s.sectionTitle}>Your salon team</Text><Text style={s.small}>{ownerManagement.staff.length} staff profile{ownerManagement.staff.length === 1 ? '' : 's'}</Text></View><Pressable onPress={() => { setOwnerEditorError(null); setOwnerEditor({ kind: 'staff', name: '', email: '', phone: '', specialties: '', password: '', isAvailable: true, imageUri: null, imageData: undefined }); }} style={s.ownerAddButton}><Ionicons name="person-add-outline" size={18} color={C.white} /><Text style={s.ownerAddButtonText}>Add staff</Text></Pressable></View>{ownerManagement.staff.length ? <View style={s.salonDetailGrid}>{ownerManagement.staff.map(staff => <View style={s.ownerEditableCard} key={staff.id}>{staff.imageUrl ? <Image source={{ uri: getApiAssetUrl(staff.imageUrl)! }} style={s.staffAvatarImage} /> : <View style={s.staffAvatar}><Text style={s.staffInitial}>{staff.name.charAt(0).toUpperCase()}</Text></View>}<View style={s.salonCardGrow}><View style={s.ownerCardTop}><Text style={s.cardTitle}>{staff.name}</Text><Text style={[s.ownerState, !staff.isAvailable && s.ownerStateOff]}>{staff.isAvailable ? 'Available' : 'Unavailable'}</Text></View><Text style={s.small}>{staff.specialties || 'Salon professional'}</Text><Text style={s.small}>{staff.email}{staff.phone ? ` · ${staff.phone}` : ''}</Text><View style={s.ownerInlineActions}><Pressable onPress={() => { setOwnerEditorError(null); setOwnerEditor({ kind: 'staff', id: staff.id, name: staff.name, email: staff.email, phone: staff.phone || '', specialties: staff.specialties || '', password: '', isAvailable: staff.isAvailable, imageUri: getApiAssetUrl(staff.imageUrl), imageData: undefined }); }} style={s.ownerEditAction}><Ionicons name="create-outline" size={16} color={C.rose} /><Text style={s.ownerEditActionText}>Edit</Text></Pressable><Pressable disabled={ownerRemoving === `staff-${staff.id}`} onPress={() => confirmOwnerRemoval('staff', staff.id, staff.name)} style={s.ownerRemoveAction}>{ownerRemoving === `staff-${staff.id}` ? <ActivityIndicator size="small" color="#A33A4E" /> : <><Ionicons name="trash-outline" size={16} color="#A33A4E" /><Text style={s.ownerRemoveActionText}>Remove</Text></>}</Pressable></View></View></View>)}</View> : <View style={s.empty}><Ionicons name="people-outline" size={40} color="#CDBEC2" /><Text style={s.cardTitle}>No staff profiles yet</Text><Text style={s.small}>Add a stylist profile to build your team.</Text></View>}</>;
      else if (page === 'owner-profile') body = <>
        <View style={s.ownerPageActions}>
          <View><Text style={s.sectionTitle}>Customer-facing portfolio</Text><Text style={s.small}>Keep your public business details current.</Text></View>
          <Pressable onPress={() => {
            const salon = ownerManagement.salon;
            setOwnerEditorError(null);
            setOwnerEditor({ kind: 'profile', name: salon.name, description: salon.description || '', address: salon.address, city: salon.city, phone: salon.phone || '', website: salon.website || '', openingTime: salon.openingTime?.slice(0, 5) || '', closingTime: salon.closingTime?.slice(0, 5) || '', imageUri: getApiAssetUrl(salon.profileImageUrl), imageData: undefined });
          }} style={s.ownerAddButton}><Ionicons name="create-outline" size={18} color={C.white} /><Text style={s.ownerAddButtonText}>Edit details</Text></Pressable>
        </View>
        <View style={s.salonProfileHero}><SalonLogo name={ownerManagement.salon.name} imageUrl={ownerManagement.salon.profileImageUrl} large /><View style={s.salonHeroContent}><Text style={s.salonProfileName}>{ownerManagement.salon.name}</Text><Text style={s.salonHeroAddress}>{ownerManagement.salon.address}, {ownerManagement.salon.city}</Text><View style={s.salonRatingRow}><Ionicons name="star" size={18} color="#FFD98A" /><Text style={s.salonRatingText}>{Number(ownerManagement.salon.rating).toFixed(1)}</Text></View></View></View>
        <View style={s.ownerProfileGrid}>{[['Phone', ownerManagement.salon.phone || 'Not provided'], ['Website', ownerManagement.salon.website || 'Not provided'], ['Opening time', ownerManagement.salon.openingTime || 'Not provided'], ['Closing time', ownerManagement.salon.closingTime || 'Not provided']].map(item => <View style={s.salonInfoCard} key={item[0]}><Text style={s.salonInfoLabel}>{item[0]}</Text><Text style={s.salonInfoValue}>{item[1]}</Text></View>)}</View>
        <View style={s.salonAbout}><Text style={s.salonSectionKicker}>ABOUT</Text><Text style={s.body}>{ownerManagement.salon.description || 'No salon description has been added.'}</Text></View>
        <View style={s.ownerPageActions}><View><Text style={s.sectionTitle}>Portfolio gallery</Text><Text style={s.small}>{ownerManagement.portfolioImages.length}/12 photos</Text></View><Pressable disabled={ownerRemoving === 'portfolio-add'} onPress={() => void addPortfolioPhoto()} style={s.ownerAddButton}>{ownerRemoving === 'portfolio-add' ? <ActivityIndicator color={C.white} /> : <><Ionicons name="images-outline" size={18} color={C.white} /><Text style={s.ownerAddButtonText}>Add photo</Text></>}</Pressable></View>
        {ownerManagement.portfolioImages.length ? <View style={s.ownerPortfolioGrid}>{ownerManagement.portfolioImages.map(image => <View style={s.ownerPortfolioCard} key={image.id}><Image source={{ uri: getApiAssetUrl(image.imageUrl)! }} style={s.ownerPortfolioImage} /><Pressable onPress={() => confirmMediaRemoval('portfolio photo', image.id)} style={s.ownerPortfolioRemove}><Ionicons name="trash" size={17} color={C.white} /></Pressable></View>)}</View> : <View style={s.empty}><Ionicons name="images-outline" size={38} color="#CDBEC2" /><Text style={s.cardTitle}>No portfolio photos yet</Text><Text style={s.small}>Show customers your salon, team, and finished work.</Text></View>}
      </>;
      else body = ownerManagement.reviews.length ? <View style={s.reviewList}>{ownerManagement.reviews.map(review => <View style={s.reviewCard} key={review.id}><View style={s.reviewTop}><View style={s.reviewAvatar}><Text style={s.reviewInitial}>{review.reviewerName.charAt(0).toUpperCase()}</Text></View><View style={s.salonCardGrow}><Text style={s.cardTitle}>{review.reviewerName}</Text><Text style={s.small}>{new Date(review.createdAt).toLocaleDateString()}</Text></View><View style={s.reviewStars}>{[1,2,3,4,5].map(star => <Ionicons key={star} name={star <= review.rating ? 'star' : 'star-outline'} size={15} color={C.gold} />)}</View></View>{review.imageUrl && <Image source={{ uri: getApiAssetUrl(review.imageUrl)! }} style={s.reviewPhoto} />}{review.comment && <Text style={s.reviewComment}>{review.comment}</Text>}{review.replies.map(reply => <View style={s.salonOwnerReply} key={reply.id}><View style={s.salonOwnerReplyHead}><Ionicons name="storefront" size={16} color={C.rose} /><Text style={s.salonOwnerReplyLabel}>YOUR REPLY · {new Date(reply.createdAt).toLocaleString()}</Text><Pressable onPress={() => confirmMediaRemoval('reply', reply.id)} hitSlop={8}><Ionicons name="trash-outline" size={17} color="#A33A4E" /></Pressable></View>{reply.imageUrl && <Image source={{ uri: getApiAssetUrl(reply.imageUrl)! }} style={s.replyPhoto} />}{reply.message && <Text style={s.salonOwnerReplyText}>{reply.message}</Text>}</View>)}<Pressable onPress={() => { setOwnerEditorError(null); setOwnerEditor({ kind: 'reply', reviewId: review.id, reviewerName: review.reviewerName, message: '', imageUri: null, imageData: undefined }); }} style={s.ownerReplyButton}><Ionicons name="chatbubble-outline" size={17} color={C.rose} /><Text style={s.ownerReplyButtonText}>Add another reply</Text></Pressable></View>)}</View> : <View style={s.empty}><Ionicons name="star-outline" size={40} color="#CDBEC2" /><Text style={s.cardTitle}>No reviews yet</Text><Text style={s.small}>Client reviews for your salon will appear here.</Text></View>;
    }
    return <ScreenFrame><Header title={title} onBack={() => setScreen('owner-dashboard')} /><View style={s.ownerSalonStrip}><SalonLogo name={ownerManagement?.salon.name || 'Teves Salon & Spa'} imageUrl={ownerManagement?.salon.profileImageUrl} /><View style={s.salonCardGrow}><Text style={s.cardTitle}>{ownerManagement?.salon.name || 'Teves Salon & Spa'}</Text></View>{ownerManagementLoading && ownerManagement && <ActivityIndicator size="small" color={C.rose} />}</View>{body}</ScreenFrame>;
  };

  const rolePage = (role: 'stylist' | 'owner', page: string) => {
    const owner = role === 'owner';
    const nav: { label: string; icon: keyof typeof Ionicons.glyphMap; target: Screen }[] = owner ? [
      { label: 'Manage booking requests', icon: 'calendar', target: 'owner-bookings' }, { label: 'Services & pricing', icon: 'pricetag', target: 'owner-services' }, { label: 'Staff & specializations', icon: 'people', target: 'owner-staff' }, { label: 'Business profile & portfolio', icon: 'business', target: 'owner-profile' }, { label: 'Reviews & ratings', icon: 'star', target: 'owner-reviews' }
    ] : [
      { label: 'Upcoming appointments', icon: 'calendar', target: 'stylist-appointments' }, { label: 'Client appointment detail', icon: 'person', target: 'stylist-detail' }, { label: 'Availability & service status', icon: 'toggle', target: 'stylist-status' }, { label: 'Notifications', icon: 'notifications', target: 'stylist-notifications' }
    ];

    if (owner && page.includes('Dashboard')) {
      if (authToken && ownerDashboardError?.includes('No salon is linked')) {
        return <ScreenFrame><OwnerSalonSetupScreen token={authToken} defaultName={authUser?.fullName || ''} onComplete={() => { setOwnerDashboardError(null); void Promise.all([loadOwnerDashboard(), loadSalons()]); }} onLogout={() => { setAuthUser(null); setAuthToken(null); setScreen('login'); }} /></ScreenFrame>;
      }
      return <ScreenFrame><OwnerDashboardScreen
        dashboard={ownerDashboard}
        user={authUser}
        loading={ownerDashboardLoading}
        error={ownerDashboardError}
        unreadNotifications={notificationUnreadCount}
        desktop={isDesktopWeb}
        onNotifications={() => setScreen('owner-notifications')}
        onNavigate={setScreen}
        onReload={() => void loadOwnerDashboard()}
        onLogout={() => {
          setAuthUser(null);
          setAuthToken(null);
          setUserProfile(null);
          setOwnerDashboard(null);
          setOwnerManagement(null);
          setScreen('login');
        }}
      /></ScreenFrame>;
    }

    const dashboardStats = owner ? [
      [String(ownerDashboard?.todayBookings ?? 0), 'Today'],
      [String(ownerDashboard?.pendingBookings ?? 0), 'Pending'],
      [(ownerDashboard?.rating ?? 0).toFixed(1), 'Rating'],
    ] : [['4', 'Today'], ['2', 'Confirmed'], ['4.9', 'Rating']];
    return <ScreenFrame><Header title={page} onBack={() => page.includes('Dashboard') ? setScreen('profile') : setScreen(owner ? 'owner-dashboard' : 'stylist-dashboard')} />{page.includes('Dashboard') && <>{owner && ownerDashboardLoading ? <ActivityIndicator color={C.rose} style={s.dataLoader} /> : owner && ownerDashboardError ? <Pressable onPress={() => void loadOwnerDashboard()} style={s.dataState}><Text style={s.cardTitle}>Could not load salon dashboard</Text><Text style={s.small}>{ownerDashboardError} · Tap to retry</Text></Pressable> : <><Text style={s.greeting}>{owner ? ownerDashboard?.name || authUser?.fullName || 'Your salon' : 'Hi, Aya'}</Text><Text style={s.body}>{owner ? 'Here’s how your salon is doing today.' : 'You have 4 clients on your schedule.'}</Text><View style={s.stats}>{dashboardStats.map(x => <View style={s.stat} key={x[1]}><Text style={s.statValue}>{x[0]}</Text><Text style={s.small}>{x[1]}</Text></View>)}</View>{owner && ownerDashboard && <Text style={s.small}>{ownerDashboard.serviceCount} services · {ownerDashboard.availableStaff} available staff · {ownerDashboard.reviewCount} reviews</Text>}</>}</>}{page.includes('Dashboard') ? nav.map(x => <Pressable onPress={() => setScreen(x.target)} style={s.menuRow} key={x.label}><View style={s.menuIcon}><Ionicons name={x.icon} size={21} color={C.rose} /></View><Text style={[s.cardTitle,{flex:1}]}>{x.label}</Text><Ionicons name="chevron-forward" size={20} color={C.muted} /></Pressable>) : <><View style={s.bookingCard}><Text style={s.eyebrow}>{owner ? 'SALON MANAGEMENT' : 'UPCOMING • 1:00 PM'}</Text><Text style={s.title}>{owner ? page : 'Mia Torres'}</Text><Text style={s.body}>{owner ? 'Review and update your salon information.' : 'Oval face • Wavy, medium hair • Soft Layered Lob'}</Text><Art height={150} quadrant={0} /><View style={s.chipRow}><View style={s.chip}><Text style={s.chipText}>{owner ? 'Active' : 'AI recommendation attached'}</Text></View></View></View>{owner && page === 'Booking requests' && <View style={s.roleRow}><Button label="Approve" onPress={() => {}} /><Button label="Decline" onPress={() => {}} secondary /></View>}<Button label={page.includes('Services') ? 'Add service' : page.includes('Staff') ? 'Add hairstylist' : 'Update status'} onPress={() => {}} /></>}</ScreenFrame>;
  };

  let content: React.ReactNode;
  if (screen === 'splash') content = <ScreenFrame scroll={false}><View style={s.splash}><View style={s.logo}><Image accessibilityLabel="FaceFit logo" source={faceFitLogo} style={s.splashLogoImage} /></View><ActivityIndicator color={C.rose} style={{ marginTop: 38 }} /></View></ScreenFrame>;
  else if (screen === 'onboarding') content = <ScreenFrame scroll={false}><OnboardingScreen onGetStarted={() => setScreen('signup')} onLogin={() => setScreen('login')} /></ScreenFrame>;
  else if (screen === 'login') content = auth(false); else if (screen === 'signup') content = auth(true);
  else if (screen === 'consent') content = <ScreenFrame><Header title="Before your scan" onBack={() => setScreen('signup')} /><View style={s.consentHero}><Ionicons name="shield-checkmark" size={52} color={C.rose} /></View><Text style={s.title}>Your face data stays yours</Text><Text style={s.body}>We use your photo only to analyze facial proportions and recommend hairstyles. You control whether it is saved or deleted.</Text>{[['camera','Camera access','Needed to capture your guided face scan.'],['location','Location access','Used while the app is open to show nearby salons.'],['lock-closed','Private by design','Images and location are handled securely and never used for ads.'],['trash','Your control','Delete your scan and results from Settings anytime.']].map(x => <View style={s.consentRow} key={x[0]}><View style={s.menuIcon}><Ionicons name={x[0] as keyof typeof Ionicons.glyphMap} size={21} color={C.rose} /></View><View style={{flex:1}}><Text style={s.cardTitle}>{x[1]}</Text><Text style={s.small}>{x[2]}</Text></View></View>)}<Pressable accessibilityRole="checkbox" accessibilityState={{ checked: faceAnalysisConsent }} onPress={() => setFaceAnalysisConsent(value => !value)} style={({ pressed }) => [s.checkRow, pressed && s.pressed]}><Ionicons name={faceAnalysisConsent ? 'checkbox' : 'square-outline'} size={24} color={faceAnalysisConsent ? C.rose : C.muted} /><Text style={[s.small,{flex:1}]}>I understand and consent to face-shape analysis as described in the Privacy Notice.</Text></Pressable><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: locationConsent }} onPress={() => setLocationConsent(value => !value)} style={({ pressed }) => [s.checkRow, s.locationCheckRow, pressed && s.pressed]}><Ionicons name={locationConsent ? 'checkbox' : 'square-outline'} size={24} color={locationConsent ? C.rose : C.muted} /><Text style={[s.small,{flex:1}]}>I consent to location access while using the app so FaceFit can show salons near me.</Text></Pressable><Button label="Agree & continue" disabled={!faceAnalysisConsent || !locationConsent} onPress={() => setScreen('home')} /><Text style={[s.link,s.centerText]}>Read the full Privacy Notice</Text></ScreenFrame>;
  else if (screen === 'home') content = home; else if (screen === 'scan') content = scan; else if (screen === 'processing') content = processing; else if (screen === 'result') content = result; else if (screen === 'recommendations') content = recommendations; else if (screen === 'style-detail') content = styleDetail; else if (screen === 'salons') content = salons; else if (screen === 'salon-detail') content = salonDetail; else if (screen === 'service') content = selection('service'); else if (screen === 'stylist') content = selection('stylist'); else if (screen === 'datetime') content = datetime; else if (screen === 'summary') content = summary; else if (screen === 'success') content = success; else if (screen === 'bookings') content = bookings; else if (screen === 'profile') content = profile;
  else if (screen === 'saved') content = accountPage('Saved hairstyles', 'saved'); else if (screen === 'saved-style-detail') content = savedStyleDetail; else if (screen === 'saved-salons') content = accountPage('Saved salons', 'saved-salons'); else if (screen === 'notifications') content = notificationPage(false); else if (screen === 'reviews') content = accountPage('My reviews', 'reviews'); else if (screen === 'settings') content = settingsPage;
  else if (screen === 'stylist-dashboard') content = rolePage('stylist', 'Stylist Dashboard'); else if (screen === 'stylist-appointments') content = rolePage('stylist', 'Appointments'); else if (screen === 'stylist-detail') content = rolePage('stylist', 'Appointment detail'); else if (screen === 'stylist-status') content = rolePage('stylist', 'Service & availability'); else if (screen === 'stylist-notifications') content = rolePage('stylist', 'Notifications');
  else if (screen === 'owner-dashboard') content = rolePage('owner', 'Owner Dashboard'); else if (screen === 'owner-notifications') content = notificationPage(true); else if (screen.startsWith('owner-')) content = ownerManagementPage(screen as Exclude<Screen, 'owner-dashboard' | 'owner-notifications'>); else content = rolePage('owner', 'Reviews & ratings');

  const showAppNavigation = mainScreens.includes(screen) || ['salons', 'salon-detail', 'service', 'stylist', 'datetime', 'summary', 'success', 'saved', 'saved-style-detail', 'saved-salons', 'notifications', 'reviews', 'settings'].includes(screen);
  return <KeyboardAvoidingView style={s.app} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><StatusBar style={screen === 'scan' ? 'light' : 'dark'} /><View style={[s.appViewport, isDesktopWeb && s.appViewportDesktop]}>{isDesktopWeb && showAppNavigation && <DesktopNavigation screen={screen} go={setScreen} />}<View style={s.contentViewport}>{content}</View></View>{!isDesktopWeb && (mainScreens.includes(screen) || screen === 'settings') && !['scan','processing','result','recommendations','style-detail'].includes(screen) && <View style={s.tabShell}><TabBar screen={screen} go={setScreen} /></View>}<Modal visible={mapVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setMapVisible(false)}><SafeAreaView style={s.mapModal}><View style={s.mapHeader}><View><Text style={s.mapTitle}>Your location</Text><Text style={s.small}>Explore salons around your current position</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close map" onPress={() => setMapVisible(false)} style={s.mapClose}><Ionicons name="close" size={24} color={C.ink} /></Pressable></View>{currentLocation && <LocationMap coordinate={currentLocation} salons={mappedSalons} onSelectSalon={salonId => { const salon = salonRecords.find(item => item.id === salonId); if (salon) { setMapVisible(false); void openSalon(salon, 'nearby-map'); } }} />}</SafeAreaView></Modal><OwnerEditorModal editor={ownerEditor} setEditor={setOwnerEditor} saving={ownerEditorSaving} error={ownerEditorError} onSave={() => void saveOwnerEditor()} /><FavoriteToast toast={favoriteToast} onDismiss={dismissFavoriteToast} /></KeyboardAvoidingView>;
}

const s = StyleSheet.create({
  app:{flex:1,width:'100%',backgroundColor:'#EFE8E8'},appViewport:{flex:1,width:'100%'},appViewportDesktop:{width:'100%',alignSelf:'stretch',flexDirection:'row',backgroundColor:C.pale},contentViewport:{flex:1,minWidth:0,width:'100%'},webShell:{flex:1,width:'100%',maxWidth:430,alignSelf:'center',backgroundColor:C.pale,overflow:'hidden'},webShellWeb:{maxWidth:'100%',alignSelf:'stretch'},webShellDesktop:{maxWidth:'100%',alignSelf:'stretch'},safe:{flex:1,width:'100%'},scroll:{padding:20,paddingBottom:120},scrollDesktop:{paddingHorizontal:48,paddingTop:30,paddingBottom:60},pressed:{opacity:.82,transform:[{scale:.985}]},
  desktopNavRail:{width:76,height:'100%',zIndex:5},desktopNav:{position:'absolute',left:0,top:0,bottom:0,backgroundColor:C.white,borderRightWidth:1,borderRightColor:C.line,overflow:'hidden',shadowColor:'#4B2732',shadowOpacity:.12,shadowRadius:18,elevation:8,zIndex:5},desktopNavHoverArea:{flex:1,paddingHorizontal:14,paddingVertical:28},desktopBrand:{height:52,flexDirection:'row',alignItems:'center',gap:12,marginBottom:38},desktopBrandText:{fontSize:19,fontWeight:'900',letterSpacing:1.5,color:C.roseDark},desktopNavLabel:{fontSize:10,fontWeight:'800',letterSpacing:1.4,color:'#A89DA0',marginLeft:12,marginBottom:10},desktopNavItems:{gap:7},desktopNavItem:{height:48,borderRadius:14,paddingHorizontal:4,flexDirection:'row',alignItems:'center',gap:12},desktopNavIcon:{width:38,height:38,alignItems:'center',justifyContent:'center'},desktopNavItemActive:{backgroundColor:C.blush},desktopNavText:{fontSize:14,fontWeight:'700',color:C.muted,minWidth:150},desktopNavTextActive:{color:C.roseDark},desktopHelp:{marginTop:'auto',padding:17,borderRadius:18,backgroundColor:'#FFF3DA',gap:6,minWidth:220},
  header:{height:56,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18},headerTitle:{fontSize:17,fontWeight:'700',color:C.ink},iconButton:{width:40,height:40,borderRadius:20,backgroundColor:C.white,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:C.line},notificationBadge:{position:'absolute',right:-5,top:-5,minWidth:20,height:20,borderRadius:10,backgroundColor:'#C52F5D',borderWidth:2,borderColor:C.white,paddingHorizontal:4,alignItems:'center',justifyContent:'center'},notificationBadgeText:{fontSize:9,fontWeight:'900',color:C.white},notificationMenuCount:{minWidth:25,height:25,borderRadius:13,backgroundColor:'#C52F5D',paddingHorizontal:7,alignItems:'center',justifyContent:'center'},favoriteButtonActive:{backgroundColor:C.blush,borderColor:'#E4B5C1'},favoritePressed:{transform:[{scale:.9}]},logoSmall:{width:46,height:46,borderRadius:14,backgroundColor:C.white,alignItems:'center',justifyContent:'center',overflow:'hidden'},logoImageSmall:{width:'100%',height:'100%',resizeMode:'contain'},
  title:{fontSize:25,lineHeight:31,fontWeight:'800',color:C.ink},display:{fontSize:38,lineHeight:46,fontWeight:'800',color:C.ink,marginBottom:10},body:{fontSize:15,lineHeight:23,color:C.muted,marginBottom:20},small:{fontSize:13,lineHeight:19,color:C.muted},lightSmall:{fontSize:12,color:C.white,marginTop:4},eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:1.2,color:C.rose,marginBottom:8},link:{color:C.rose,fontSize:14,fontWeight:'700'},mutedLink:{color:C.muted,fontSize:14,fontWeight:'700'},centerText:{textAlign:'center'},
  button:{minHeight:54,borderRadius:18,backgroundColor:C.rose,flexDirection:'row',gap:9,alignItems:'center',justifyContent:'center',paddingHorizontal:18,marginTop:12},buttonSecondary:{backgroundColor:C.white,borderWidth:1,borderColor:'#DDBFC7'},buttonDisabled:{opacity:.45},buttonText:{fontSize:16,fontWeight:'800',color:C.white},buttonTextSecondary:{color:C.rose},
  splash:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:C.pale},logo:{width:260,height:260,borderRadius:36,backgroundColor:C.white,alignItems:'center',justifyContent:'center',overflow:'hidden',shadowColor:C.rose,shadowOpacity:.18,shadowRadius:24,elevation:8},splashLogoImage:{width:'100%',height:'100%',resizeMode:'contain'},
  authSwitch:{textAlign:'center',color:C.roseDark,fontWeight:'700',fontSize:14,marginTop:22},
  authError:{padding:13,borderRadius:14,backgroundColor:'#FCE8EC',flexDirection:'row',alignItems:'center',gap:9,marginBottom:4},authErrorText:{flex:1,fontSize:13,lineHeight:19,color:'#81263A',fontWeight:'600'},
  accountTypeLabel:{fontSize:13,fontWeight:'700',color:C.ink,marginBottom:10},accountTypeRow:{flexDirection:'row',gap:10,marginBottom:16},accountTypeCard:{flex:1,minHeight:125,padding:14,borderRadius:17,backgroundColor:C.white,borderWidth:1,borderColor:C.line,gap:6},accountTypeCardActive:{borderWidth:2,borderColor:C.rose,backgroundColor:'#FFF9FA'},accountTypeTitle:{fontSize:14,fontWeight:'800',color:C.ink},accountTypeTitleActive:{color:C.roseDark},accountTypeCaption:{fontSize:11,lineHeight:16,color:C.muted},
  authIntro:{marginVertical:15},field:{height:56,borderRadius:17,backgroundColor:C.white,borderWidth:1,borderColor:C.line,flexDirection:'row',alignItems:'center',paddingHorizontal:16,gap:10,marginBottom:13},input:{flex:1,fontSize:15,color:C.ink,outlineStyle:'none' as never},
  ownerSignupSection:{marginTop:8,paddingTop:18,borderTopWidth:1,borderTopColor:C.line},ownerSignupTitle:{fontSize:20,fontWeight:'900',color:C.ink,marginBottom:5},salonSignupLogoPicker:{minHeight:84,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderStyle:'dashed',borderColor:'#D9B4BE',padding:12,flexDirection:'row',alignItems:'center',gap:12,marginBottom:18},salonSignupLogo:{width:58,height:58,borderRadius:16,resizeMode:'cover'},salonSignupLogoFallback:{width:58,height:58,borderRadius:16,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},coordinateRow:{flexDirection:'row',gap:10},coordinateField:{flex:1,minWidth:0},
  consentHero:{height:150,borderRadius:28,backgroundColor:C.blush,alignItems:'center',justifyContent:'center',marginBottom:24},consentRow:{flexDirection:'row',gap:13,marginTop:18},checkRow:{padding:15,borderRadius:16,backgroundColor:C.white,flexDirection:'row',alignItems:'flex-start',gap:11,marginTop:25},locationCheckRow:{marginTop:10},menuIcon:{width:42,height:42,borderRadius:14,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},
  topRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:22},greeting:{fontSize:25,fontWeight:'800',color:C.ink,marginBottom:3},avatar:{width:46,height:46,borderRadius:23,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},hero:{minHeight:210,borderRadius:24,backgroundColor:C.roseDark,padding:22,flexDirection:'row',alignItems:'center',overflow:'hidden',marginBottom:28},heroKicker:{fontSize:10,fontWeight:'800',letterSpacing:1.1,color:'#F2C7D2',marginBottom:8},heroTitle:{fontSize:27,lineHeight:33,fontWeight:'800',color:C.white,maxWidth:210},heroButton:{marginTop:20,alignSelf:'flex-start',height:42,borderRadius:14,backgroundColor:C.white,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:8},heroButtonText:{fontSize:13,fontWeight:'800',color:C.roseDark},faceMini:{position:'absolute',right:-20,bottom:-20,width:130,height:170,borderWidth:2,borderColor:'#D88A9E',borderRadius:70,alignItems:'center',justifyContent:'center'},
  sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:4},sectionTitle:{fontSize:19,fontWeight:'800',color:C.ink,marginVertical:15},sectionAction:{minWidth:84,minHeight:40,flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:6},art:{width:'100%',borderRadius:20,resizeMode:'cover'},artCrop:{width:'100%',borderRadius:18,overflow:'hidden',backgroundColor:C.blush},artSheet:{width:'200%',height:'200%',resizeMode:'cover'},q1:{transform:[{translateX:'-50%'}]},q2:{transform:[{translateY:'-50%'}]},q3:{transform:[{translateX:'-50%'},{translateY:'-50%'}]},overlayPill:{position:'absolute',bottom:12,left:12,backgroundColor:'rgba(41,35,38,.85)',paddingVertical:8,paddingHorizontal:12,borderRadius:12},overlayText:{color:C.white,fontSize:12,fontWeight:'700'},hRow:{gap:12,paddingRight:10},salonCard:{width:150,padding:10,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderColor:C.line},salonThumb:{height:85,borderRadius:14,alignItems:'center',justifyContent:'center',marginBottom:9,overflow:'hidden'},salonThumbImage:{width:'100%',height:'100%',resizeMode:'cover'},salonHeart:{position:'absolute',right:7,top:7,width:34,height:34,borderRadius:17,backgroundColor:C.white,alignItems:'center',justifyContent:'center',elevation:3},cardTitle:{fontSize:15,fontWeight:'700',color:C.ink,marginBottom:3},tip:{marginTop:25,padding:16,borderRadius:18,backgroundColor:'#FFF3DA',flexDirection:'row',gap:12},
  tabShell:{position:'absolute',bottom:0,left:0,right:0,alignItems:'center'},tabBar:{width:'100%',maxWidth:430,height:82,paddingBottom:15,backgroundColor:C.white,borderTopWidth:1,borderTopColor:C.line,flexDirection:'row',shadowColor:'#000',shadowOpacity:.08,shadowRadius:16,elevation:12},tabBarWeb:{maxWidth:'100%'},tabItem:{flex:1,alignItems:'center',justifyContent:'center',gap:3},tabLabel:{fontSize:11,fontWeight:'600',color:C.muted},tabActive:{color:C.rose,fontWeight:'800'},
  centerPage:{flex:1,padding:24,alignItems:'center',justifyContent:'center'},processIcon:{width:105,height:105,borderRadius:53,backgroundColor:C.blush,alignItems:'center',justifyContent:'center',marginBottom:28},steps:{width:'100%',padding:20,borderRadius:20,backgroundColor:C.white,marginTop:20},step:{flexDirection:'row',gap:12,alignItems:'center',marginVertical:8},stepDot:{width:21,height:21,borderRadius:11,borderWidth:2,borderColor:'#D8C9CD',alignItems:'center',justifyContent:'center'},stepDone:{backgroundColor:C.green,borderColor:C.green},
  resultVisual:{height:285,borderRadius:24,overflow:'hidden',marginBottom:12,position:'relative'},resultImage:{width:'100%',height:'100%',resizeMode:'cover'},outlineOval:{position:'absolute',width:150,height:210,borderRadius:75,borderWidth:2,borderColor:C.white,alignSelf:'center',top:34},confidence:{position:'absolute',right:12,bottom:12,backgroundColor:C.white,borderRadius:12,padding:9},confidenceText:{fontSize:12,fontWeight:'800',color:C.green},chipRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:18},chip:{backgroundColor:C.blush,borderRadius:99,paddingHorizontal:12,paddingVertical:8},chipText:{fontSize:12,fontWeight:'700',color:C.roseDark},
  chatBox:{height:54,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderColor:'#E2C8CF',flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:13,marginBottom:20},chatInput:{flex:1,fontSize:13,color:C.ink,outlineStyle:'none' as never},matchSectionTitle:{fontSize:20,fontWeight:'900',color:C.ink,marginTop:8,marginBottom:3},matchSectionCopy:{fontSize:13,lineHeight:19,color:C.muted,marginBottom:12},recCard:{backgroundColor:C.white,borderRadius:20,overflow:'hidden',marginBottom:14,borderWidth:1,borderColor:C.line},recBody:{padding:14,paddingTop:50},matchBadge:{position:'absolute',top:12,left:14,backgroundColor:C.blush,borderRadius:10,paddingHorizontal:9,paddingVertical:7,zIndex:1},matchText:{fontSize:12,fontWeight:'800',color:C.rose},detailTitle:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:8,marginBottom:12,gap:16},scoreCircle:{width:54,height:54,borderRadius:27,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},scoreText:{fontSize:18,fontWeight:'900',color:C.rose},
  salonSearch:{height:52,borderRadius:17,backgroundColor:C.white,borderWidth:1,borderColor:C.line,flexDirection:'row',alignItems:'center',paddingHorizontal:15,gap:10,marginBottom:12},salonSearchInput:{flex:1,height:'100%',fontSize:14,color:C.ink,outlineStyle:'none' as never},searchClear:{width:30,height:30,alignItems:'center',justifyContent:'center'},clearSearchButton:{minHeight:40,paddingHorizontal:14,alignItems:'center',justifyContent:'center'},segment:{height:48,borderRadius:15,backgroundColor:'#EEE6E7',padding:4,flexDirection:'row',marginBottom:17},segmentActive:{flex:1,borderRadius:12,backgroundColor:C.white,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},segmentItem:{flex:1,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},segmentText:{fontSize:13,fontWeight:'800',color:C.rose},mapMock:{height:150,borderRadius:22,backgroundColor:'#EFE6E0',alignItems:'center',justifyContent:'center',marginBottom:14,overflow:'hidden'},pin:{position:'absolute',top:25,right:80,width:38,height:38,borderRadius:19,backgroundColor:C.rose,alignItems:'center',justifyContent:'center'},listCard:{minHeight:82,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderColor:C.line,padding:13,flexDirection:'row',alignItems:'center',gap:12,marginBottom:12},listFavorite:{width:40,height:40,borderRadius:20,backgroundColor:C.pale,borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center'},salonSquare:{width:58,height:58,borderRadius:16,backgroundColor:C.blush,alignItems:'center',justifyContent:'center',overflow:'hidden'},salonSquareImage:{width:'100%',height:'100%',resizeMode:'cover'},
  mapModal:{flex:1,backgroundColor:C.pale},mapHeader:{minHeight:82,paddingHorizontal:18,paddingVertical:12,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},mapTitle:{fontSize:19,fontWeight:'800',color:C.ink,marginBottom:2},mapClose:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:C.pale,borderWidth:1,borderColor:C.line},
  mapNotice:{marginTop:12,padding:14,borderRadius:15,backgroundColor:C.blush,flexDirection:'row',alignItems:'center',gap:10},mapAttribution:{fontSize:10,color:C.muted,textAlign:'right',marginTop:7},
  dataLoader:{marginVertical:32},dataState:{padding:20,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderColor:C.line,alignItems:'center',gap:5,marginBottom:16},
  salonHero:{height:250,borderRadius:23,overflow:'hidden',marginBottom:14},salonHeroShade:{position:'absolute',left:0,right:0,bottom:0,padding:16,backgroundColor:'rgba(40,25,30,.62)'},salonHeroTitle:{fontSize:23,fontWeight:'800',color:C.white},serviceRow:{paddingVertical:14,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},stylistMini:{width:112,padding:12,borderRadius:18,backgroundColor:C.white},stylistAvatar:{width:50,height:50,borderRadius:25,backgroundColor:C.blush,alignItems:'center',justifyContent:'center',marginBottom:8},quote:{fontSize:15,lineHeight:23,fontStyle:'italic',color:C.muted,backgroundColor:C.white,padding:17,borderRadius:17},
  salonIdentity:{minHeight:245,borderRadius:24,backgroundColor:C.blush,alignItems:'center',justifyContent:'center',padding:24,gap:10,marginBottom:16},salonIdentityName:{fontSize:24,fontWeight:'900',color:C.roseDark,textAlign:'center'},salonLogo:{width:58,height:58,borderRadius:18,backgroundColor:C.rose,alignItems:'center',justifyContent:'center',gap:1,marginBottom:12},salonLogoImage:{resizeMode:'cover'},salonLogoLarge:{width:104,height:104,borderRadius:32,marginBottom:5},salonLogoText:{fontSize:10,fontWeight:'900',letterSpacing:1,color:C.white},salonLogoTextLarge:{fontSize:16},salonProfileHero:{minHeight:220,borderRadius:28,backgroundColor:C.roseDark,padding:25,flexDirection:'row',alignItems:'center',gap:22,marginBottom:14,overflow:'hidden'},salonHeroContent:{flex:1,gap:7},salonProfileName:{fontSize:28,lineHeight:34,fontWeight:'900',color:C.white},salonRatingRow:{flexDirection:'row',alignItems:'center',gap:6},salonRatingText:{fontSize:16,fontWeight:'900',color:C.white},salonHeroMeta:{fontSize:12,fontWeight:'600',color:'#F3C9D3'},salonHeroAddress:{fontSize:13,lineHeight:19,color:'#F8E6EA'},salonInfoGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:22},salonInfoCard:{flexGrow:1,flexBasis:Platform.OS === 'web' ? 180 : 100,minHeight:108,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderColor:C.line,padding:14,gap:4},salonInfoLabel:{fontSize:10,fontWeight:'800',letterSpacing:.8,textTransform:'uppercase',color:C.muted},salonInfoValue:{fontSize:13,fontWeight:'800',color:C.ink},salonAbout:{padding:18,borderRadius:20,backgroundColor:'#FFF0F3',marginBottom:8},salonSectionKicker:{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:C.rose,marginBottom:7},salonLoadWarning:{padding:14,borderRadius:16,backgroundColor:'#FCE8EC',flexDirection:'row',alignItems:'center',gap:9,marginTop:12},salonDetailGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},salonServiceCard:{flexGrow:1,flexBasis:Platform.OS === 'web' ? 280 : '100%',minHeight:112,borderRadius:20,backgroundColor:C.white,borderWidth:1,borderColor:C.line,padding:14,flexDirection:'row',alignItems:'center',gap:12},salonServiceIcon:{width:45,height:45,borderRadius:15,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},salonCardGrow:{flex:1,minWidth:0},salonServiceMeta:{flexDirection:'row',alignItems:'center',gap:10,marginTop:8},salonPrice:{fontSize:15,fontWeight:'900',color:C.roseDark},salonEmptyCard:{minHeight:88,borderRadius:19,backgroundColor:C.white,borderWidth:1,borderStyle:'dashed',borderColor:'#D9CACE',padding:16,flexDirection:'row',alignItems:'center',gap:13},staffCard:{flexGrow:1,flexBasis:Platform.OS === 'web' ? 280 : '100%',minHeight:98,borderRadius:20,backgroundColor:C.white,borderWidth:1,borderColor:C.line,padding:14,flexDirection:'row',alignItems:'center',gap:12},staffCardSelected:{borderWidth:2,borderColor:C.rose,backgroundColor:'#FFF8FA'},staffAvatar:{width:50,height:50,borderRadius:18,backgroundColor:C.roseDark,alignItems:'center',justifyContent:'center'},staffAvatarImage:{width:50,height:50,borderRadius:18,resizeMode:'cover',backgroundColor:C.blush},staffAvatarSelected:{backgroundColor:C.rose},staffInitial:{fontSize:20,fontWeight:'900',color:C.white},availableBadge:{alignSelf:'flex-start',marginTop:6,paddingHorizontal:8,paddingVertical:4,borderRadius:99,backgroundColor:'#E8F3ED',flexDirection:'row',alignItems:'center',gap:5},availableDot:{width:6,height:6,borderRadius:3,backgroundColor:C.green},availableText:{fontSize:10,fontWeight:'800',color:C.green},portfolioGallery:{gap:12,paddingBottom:4},portfolioCustomerCard:{width:250,borderRadius:19,overflow:'hidden',backgroundColor:C.white,borderWidth:1,borderColor:C.line},portfolioCustomerImage:{width:'100%',height:170,resizeMode:'cover'},portfolioCaption:{padding:11,fontSize:11,lineHeight:16,color:C.muted},reviewHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},reviewSummaryPill:{paddingHorizontal:10,paddingVertical:7,borderRadius:99,backgroundColor:'#FFF3DA',flexDirection:'row',alignItems:'center',gap:5},reviewSummaryText:{fontSize:11,fontWeight:'800',color:C.ink},reviewList:{gap:10},reviewCard:{padding:16,borderRadius:19,backgroundColor:C.white,borderWidth:1,borderColor:C.line},reviewTop:{flexDirection:'row',alignItems:'center',gap:10},reviewAvatar:{width:40,height:40,borderRadius:14,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},reviewInitial:{fontSize:16,fontWeight:'900',color:C.roseDark},reviewStars:{flexDirection:'row',gap:2},reviewPhoto:{width:'100%',height:220,borderRadius:16,resizeMode:'cover',marginTop:13,backgroundColor:C.blush},reviewComment:{fontSize:14,lineHeight:21,color:C.ink,marginTop:12},replyPhoto:{width:'100%',height:180,borderRadius:12,resizeMode:'cover',marginBottom:10,backgroundColor:C.blush},reviewComposer:{padding:18,borderRadius:22,backgroundColor:C.white,borderWidth:1,borderColor:C.line,marginTop:14},reviewPicker:{flexDirection:'row',gap:7,marginVertical:13},reviewPhotoPicker:{minHeight:78,borderRadius:17,borderWidth:1,borderStyle:'dashed',borderColor:'#D9B4BE',backgroundColor:'#FFF8FA',padding:12,flexDirection:'row',alignItems:'center',gap:12,marginBottom:12},reviewPhotoPickerIcon:{width:45,height:45,borderRadius:15,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},reviewPhotoPreview:{height:220,borderRadius:18,overflow:'hidden',marginBottom:12,backgroundColor:C.blush},reviewPreviewImage:{width:'100%',height:'100%',resizeMode:'cover'},reviewPhotoRemove:{position:'absolute',right:10,top:10,minHeight:38,borderRadius:12,backgroundColor:'rgba(41,35,38,.82)',paddingHorizontal:11,flexDirection:'row',alignItems:'center',gap:6},reviewPhotoRemoveText:{fontSize:12,fontWeight:'800',color:C.white},reviewInput:{minHeight:92,borderRadius:16,backgroundColor:C.pale,borderWidth:1,borderColor:C.line,padding:13,fontSize:14,color:C.ink,textAlignVertical:'top',outlineStyle:'none' as never},reviewCharacterCount:{fontSize:10,color:C.muted,textAlign:'right',marginTop:5},
  progress:{height:5,borderRadius:3,backgroundColor:'#E7D9DC',overflow:'hidden',marginBottom:12},progressFill:{width:'66%',height:'100%',backgroundColor:C.rose},choiceCard:{minHeight:78,padding:13,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderColor:C.line,flexDirection:'row',alignItems:'center',gap:12,marginBottom:12},choiceSelected:{borderWidth:2,borderColor:C.rose,backgroundColor:'#FFF9FA'},choiceIcon:{width:48,height:48,borderRadius:16,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},bottomSpace:{height:60},monthRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},disabledControl:{opacity:.25},calendar:{flexDirection:'row',flexWrap:'wrap',marginBottom:20},calendarWeekday:{fontSize:11,fontWeight:'800',color:C.muted},day:{width:'14.28%',aspectRatio:1,alignItems:'center',justifyContent:'center',borderRadius:99},dayActive:{backgroundColor:C.rose},dayText:{fontSize:13,fontWeight:'700',color:C.ink},dayTextActive:{color:C.white},dayTextDisabled:{color:'#CFC5C8'},timeGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:18},time:{width:'31%',paddingVertical:13,borderRadius:13,backgroundColor:C.white,alignItems:'center',borderWidth:1,borderColor:C.line},timeActive:{backgroundColor:C.rose,borderColor:C.rose},timeDisabled:{backgroundColor:'#F2EDEE',borderColor:'#EBE4E6'},timeTextActive:{color:C.white},
  summaryCard:{padding:20,borderRadius:22,backgroundColor:C.white,borderWidth:1,borderColor:C.line},summaryLogo:{width:58,height:58,borderRadius:18,backgroundColor:C.blush,alignItems:'center',justifyContent:'center',marginBottom:17},divider:{height:1,backgroundColor:C.line,marginVertical:17},summaryRow:{flexDirection:'row',gap:12,alignItems:'center',marginVertical:9},price:{fontSize:22,fontWeight:'900',color:C.rose},notice:{padding:14,borderRadius:16,backgroundColor:C.blush,flexDirection:'row',gap:10,marginTop:15},successIcon:{width:100,height:100,borderRadius:50,backgroundColor:C.green,alignItems:'center',justifyContent:'center',marginBottom:24},ticket:{width:'100%',padding:20,borderRadius:20,backgroundColor:C.white,alignItems:'center',marginVertical:15},
  notificationList:{gap:10},notificationCard:{minHeight:92,borderRadius:19,backgroundColor:C.white,borderWidth:1,borderColor:C.line,padding:14,flexDirection:'row',alignItems:'center',gap:12},notificationCardUnread:{backgroundColor:'#FFF1F5',borderColor:'#E7AFC0',borderWidth:1.5},notificationIcon:{width:45,height:45,borderRadius:15,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},notificationIconUnread:{backgroundColor:C.rose},notificationTitleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},notificationTitleRead:{color:C.muted,fontWeight:'600'},notificationUnreadDot:{width:8,height:8,borderRadius:4,backgroundColor:C.rose},notificationFooter:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,marginTop:8},notificationDate:{fontSize:10,color:C.muted,flexShrink:1},notificationReadButton:{minHeight:32,borderRadius:11,backgroundColor:C.blush,paddingHorizontal:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4},notificationReadButtonText:{fontSize:10,fontWeight:'900',color:C.roseDark},bookingCard:{padding:19,borderRadius:21,backgroundColor:C.white,borderWidth:1,borderColor:C.line,marginBottom:22},bookingActions:{flexDirection:'row',justifyContent:'space-around'},bookingMeta:{flexDirection:'row',alignItems:'center',gap:12},bookingStatus:{marginLeft:'auto',fontSize:11,fontWeight:'800',textTransform:'uppercase',color:C.green,backgroundColor:'#E8F3ED',paddingHorizontal:10,paddingVertical:6,borderRadius:99},ownerSalonStrip:{minHeight:78,borderRadius:20,backgroundColor:C.blush,padding:12,flexDirection:'row',alignItems:'center',gap:12,marginBottom:18},ownerCardTop:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:10},ownerActionRow:{flexDirection:'row',gap:10,marginTop:16},ownerNote:{fontSize:13,lineHeight:19,color:C.roseDark,backgroundColor:C.pale,padding:11,borderRadius:12,marginTop:10},ownerState:{fontSize:10,fontWeight:'800',color:C.green,backgroundColor:'#E8F3ED',paddingHorizontal:8,paddingVertical:5,borderRadius:99},ownerStateOff:{color:C.muted,backgroundColor:'#EEE8EA'},ownerProfileGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:14},empty:{alignItems:'center',padding:35,borderRadius:20,borderStyle:'dashed',borderWidth:1,borderColor:'#D9CACE',gap:6},profileHead:{flexDirection:'row',alignItems:'center',gap:15,marginBottom:22},profileAvatar:{width:74,height:74,borderRadius:37,backgroundColor:C.rose,alignItems:'center',justifyContent:'center'},profileInitial:{fontSize:30,fontWeight:'900',color:C.white},preferenceCard:{padding:17,borderRadius:20,backgroundColor:C.blush,marginBottom:20},preferenceRow:{flexDirection:'row',flexWrap:'wrap',gap:14},preferenceItem:{width:'45%'},menuRow:{minHeight:68,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',alignItems:'center',gap:13},roleRow:{flexDirection:'row',gap:12},roleCard:{flex:1,padding:17,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderColor:C.line,gap:10},stats:{flexDirection:'row',gap:10,marginVertical:20},stat:{flex:1,padding:14,borderRadius:17,backgroundColor:C.white,alignItems:'center'},statValue:{fontSize:21,fontWeight:'900',color:C.roseDark},
  ownerDashboardHero:{minHeight:220,borderRadius:28,backgroundColor:C.roseDark,padding:23,overflow:'hidden',marginBottom:25},ownerHeroGlow:{position:'absolute',width:230,height:230,borderRadius:115,right:-72,top:-90,backgroundColor:'rgba(255,255,255,.07)'},ownerHeroTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:22},ownerLogoutButton:{minHeight:38,borderRadius:12,backgroundColor:'rgba(255,255,255,.16)',borderWidth:1,borderColor:'rgba(255,255,255,.24)',paddingHorizontal:13,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},ownerLogoutText:{fontSize:12,fontWeight:'900',color:C.white},ownerHeroBadge:{flexDirection:'row',alignItems:'center',gap:7,backgroundColor:'rgba(255,255,255,.12)',borderRadius:99,paddingHorizontal:10,paddingVertical:7},ownerHeroLiveDot:{width:7,height:7,borderRadius:4,backgroundColor:'#9FD7BD'},ownerHeroBadgeText:{fontSize:9,fontWeight:'900',letterSpacing:1.05,color:'#FBEAF0'},ownerHeroStatus:{flexDirection:'row',alignItems:'center',gap:5},ownerHeroStatusText:{fontSize:10,fontWeight:'800',color:'#D8F3E6'},ownerHeroIdentity:{flexDirection:'row',alignItems:'center',gap:17},ownerDashboardPhoto:{width:86,height:86,borderRadius:25,resizeMode:'cover',backgroundColor:C.blush,borderWidth:2,borderColor:'rgba(255,255,255,.45)'},ownerDashboardPhotoFallback:{width:86,height:86,borderRadius:25,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,.14)',borderWidth:2,borderColor:'rgba(255,255,255,.28)'},ownerHeroCopy:{flex:1,minWidth:0},ownerHeroGreeting:{fontSize:13,fontWeight:'600',color:'#F3CCD6',marginBottom:4},ownerHeroTitle:{fontSize:29,lineHeight:35,fontWeight:'900',color:C.white,letterSpacing:-.6},ownerHeroMeta:{flexDirection:'row',alignItems:'center',gap:6,marginTop:12,maxWidth:500},ownerHeroMetaText:{flexShrink:1,fontSize:12,color:'#F3CCD6'},
  ownerDashboardState:{minHeight:145,borderRadius:20,backgroundColor:C.white,borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center',gap:8,padding:18,marginBottom:18},ownerSectionHeading:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',marginTop:5,marginBottom:13},ownerSectionEyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:C.rose,marginBottom:4},ownerSectionTitle:{fontSize:19,fontWeight:'900',color:C.ink},ownerUpdatedPill:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:9,paddingVertical:6,borderRadius:99,backgroundColor:'#E8F3ED'},ownerUpdatedText:{fontSize:9,fontWeight:'900',color:C.green},
  ownerMetricsGrid:{flexDirection:'row',flexWrap:'wrap',gap:11,marginBottom:27},ownerMetricCard:{flexGrow:1,minWidth:135,minHeight:158,borderRadius:21,backgroundColor:C.white,borderWidth:1,borderColor:C.line,padding:15,shadowColor:'#5B2838',shadowOpacity:.04,shadowRadius:10,elevation:1},ownerMetricIcon:{width:40,height:40,borderRadius:13,backgroundColor:C.blush,alignItems:'center',justifyContent:'center',marginBottom:15},ownerMetricRose:{backgroundColor:'#F7E4E8'},ownerMetricGold:{backgroundColor:'#FFF0D9'},ownerMetricPurple:{backgroundColor:'#EFE8FA'},ownerMetricGreen:{backgroundColor:'#E5F2EC'},ownerMetricValue:{fontSize:25,lineHeight:29,fontWeight:'900',color:C.ink},ownerMetricLabel:{fontSize:12,fontWeight:'800',color:C.roseDark,marginTop:2},ownerMetricCaption:{fontSize:10,color:C.muted,marginTop:3},
  ownerManagementGrid:{flexDirection:'row',flexWrap:'wrap',gap:11,marginBottom:24},ownerManagementCard:{flexGrow:1,minWidth:240,minHeight:88,borderRadius:20,backgroundColor:C.white,borderWidth:1,borderColor:C.line,padding:13,flexDirection:'row',alignItems:'center',gap:12},ownerManagementIcon:{width:45,height:45,borderRadius:15,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},ownerManagementCopy:{flex:1,minWidth:0},ownerManagementTitle:{fontSize:13,fontWeight:'800',color:C.ink},ownerManagementDescription:{fontSize:10.5,lineHeight:15,color:C.muted,marginTop:3},ownerHealthPanel:{minHeight:90,borderRadius:21,backgroundColor:'#E8F3ED',borderWidth:1,borderColor:'#CFE6DA',padding:15,flexDirection:'row',alignItems:'center',gap:12},ownerHealthIcon:{width:46,height:46,borderRadius:15,backgroundColor:C.green,alignItems:'center',justifyContent:'center'},ownerHealthTitle:{fontSize:13,fontWeight:'900',color:'#315F4B'},ownerHealthText:{fontSize:10.5,lineHeight:15,color:'#5A7B6C',marginTop:3},
  ownerPageActions:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:17},ownerAddButton:{minHeight:43,borderRadius:14,backgroundColor:C.rose,paddingHorizontal:14,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},ownerAddButtonText:{fontSize:12,fontWeight:'900',color:C.white},ownerEditableCard:{flexGrow:1,flexBasis:Platform.OS === 'web' ? 330 : '100%',minHeight:145,borderRadius:20,backgroundColor:C.white,borderWidth:1,borderColor:C.line,padding:14,flexDirection:'row',alignItems:'flex-start',gap:12},ownerInlineActions:{flexDirection:'row',gap:8,marginTop:12},ownerEditAction:{minHeight:35,borderRadius:11,backgroundColor:C.blush,paddingHorizontal:10,flexDirection:'row',alignItems:'center',gap:5},ownerEditActionText:{fontSize:11,fontWeight:'800',color:C.roseDark},ownerRemoveAction:{minWidth:82,minHeight:35,borderRadius:11,backgroundColor:'#FCE9EC',paddingHorizontal:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5},ownerRemoveActionText:{fontSize:11,fontWeight:'800',color:'#A33A4E'},
  ownerPortfolioGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},ownerPortfolioCard:{width:Platform.OS === 'web' ? 210 : '47%',height:160,borderRadius:18,overflow:'hidden',backgroundColor:C.blush},ownerPortfolioImage:{width:'100%',height:'100%',resizeMode:'cover'},ownerPortfolioRemove:{position:'absolute',right:9,top:9,width:36,height:36,borderRadius:12,backgroundColor:'rgba(41,35,38,.78)',alignItems:'center',justifyContent:'center'},
  salonOwnerReply:{marginTop:14,padding:13,borderRadius:15,backgroundColor:'#FFF4F6',borderLeftWidth:3,borderLeftColor:C.rose},salonOwnerReplyHead:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:7},salonOwnerReplyLabel:{flex:1,fontSize:9,fontWeight:'900',letterSpacing:.7,color:C.roseDark},salonOwnerReplyText:{fontSize:13,lineHeight:19,color:C.ink},salonOwnerReplyDate:{fontSize:9,color:C.muted,marginTop:7},ownerReplyButton:{alignSelf:'flex-start',minHeight:38,borderRadius:12,backgroundColor:C.blush,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:6,marginTop:12},ownerReplyButtonText:{fontSize:11,fontWeight:'900',color:C.roseDark},ownerReplyNotice:{padding:14,borderRadius:16,backgroundColor:C.blush,flexDirection:'row',alignItems:'flex-start',gap:10,marginBottom:17},
  ownerEditorSafe:{flex:1,backgroundColor:C.pale},ownerEditorHeader:{minHeight:82,paddingHorizontal:20,paddingVertical:14,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},ownerEditorKicker:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:C.rose,marginBottom:4},ownerEditorTitle:{fontSize:20,fontWeight:'900',color:C.ink},ownerEditorScroll:{width:'100%',maxWidth:680,alignSelf:'center',padding:20,paddingBottom:35},ownerEditorFieldWrap:{marginBottom:15},ownerEditorLabel:{fontSize:11,fontWeight:'800',color:C.ink,marginBottom:7},ownerEditorInput:{minHeight:53,borderRadius:16,backgroundColor:C.white,borderWidth:1,borderColor:C.line,paddingHorizontal:14,paddingVertical:12,fontSize:14,color:C.ink,outlineStyle:'none' as never},ownerEditorTextarea:{minHeight:110,textAlignVertical:'top'},ownerEditorRow:{flexDirection:'row',gap:11},ownerEditorHalf:{flex:1,minWidth:0},ownerToggleRow:{minHeight:72,borderRadius:17,backgroundColor:C.white,borderWidth:1,borderColor:C.line,padding:13,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:15},ownerSalonPhotoPicker:{minHeight:112,borderRadius:20,backgroundColor:'#FFF8FA',borderWidth:1,borderStyle:'dashed',borderColor:'#D9B4BE',padding:15,flexDirection:'row',alignItems:'center',gap:13,marginBottom:18},ownerSalonPhotoPlaceholder:{width:64,height:64,borderRadius:20,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},ownerSalonPhotoPreview:{height:250,borderRadius:22,overflow:'hidden',backgroundColor:C.blush,marginBottom:18},ownerSalonPhoto:{width:'100%',height:'100%',resizeMode:'cover'},ownerSalonPhotoActions:{position:'absolute',right:10,bottom:10,flexDirection:'row',gap:8},ownerPhotoAction:{minHeight:39,borderRadius:12,backgroundColor:'rgba(41,35,38,.84)',paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:6},ownerPhotoRemoveAction:{backgroundColor:'rgba(139,35,57,.92)'},ownerEditorPhotoPicker:{minHeight:84,borderRadius:17,backgroundColor:'#FFF8FA',borderWidth:1,borderStyle:'dashed',borderColor:'#D9B4BE',padding:14,flexDirection:'row',alignItems:'center',gap:12,marginBottom:16},ownerEditorPhotoPreview:{height:220,borderRadius:19,overflow:'hidden',backgroundColor:C.blush,marginBottom:16},ownerEditorPhoto:{width:'100%',height:'100%',resizeMode:'cover'},ownerEditorPhotoRemove:{position:'absolute',right:10,top:10,minHeight:38,borderRadius:12,backgroundColor:'rgba(41,35,38,.82)',paddingHorizontal:11,flexDirection:'row',alignItems:'center',gap:6},ownerEditorCount:{fontSize:10,color:C.muted,textAlign:'right',marginTop:-9,marginBottom:15},ownerEditorFooter:{paddingHorizontal:20,paddingVertical:13,backgroundColor:C.white,borderTopWidth:1,borderTopColor:C.line,flexDirection:'row',justifyContent:'flex-end',gap:10},ownerEditorButton:{minHeight:48,borderRadius:15,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},ownerEditorCancel:{backgroundColor:C.pale,borderWidth:1,borderColor:C.line},ownerEditorSave:{backgroundColor:C.rose,minWidth:150},ownerEditorCancelText:{fontSize:13,fontWeight:'800',color:C.muted},ownerEditorSaveText:{fontSize:13,fontWeight:'900',color:C.white},
  profileAvatarImage:{width:74,height:74,borderRadius:37,resizeMode:'cover',backgroundColor:C.blush},
  favoriteToast:{position:'absolute',left:18,right:18,bottom:100,minHeight:62,borderRadius:20,backgroundColor:C.roseDark,paddingHorizontal:16,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:12,shadowColor:'#000',shadowOpacity:.22,shadowRadius:14,elevation:12},favoriteToastError:{backgroundColor:'#8F3045'},favoriteToastIcon:{width:36,height:36,borderRadius:18,backgroundColor:'rgba(255,255,255,.18)',alignItems:'center',justifyContent:'center'},favoriteToastText:{flex:1,color:C.white,fontSize:13,fontWeight:'800',lineHeight:18},
  reviewCardEditing:{borderWidth:2,borderColor:C.rose,backgroundColor:'#FFF9FA'},reviewActions:{alignItems:'flex-end',gap:7},reviewEditButton:{minHeight:32,borderRadius:10,backgroundColor:C.blush,paddingHorizontal:9,flexDirection:'row',alignItems:'center',gap:4},reviewEditText:{fontSize:11,fontWeight:'800',color:C.roseDark},reviewComposerHeading:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:12},reviewCancelButton:{minHeight:36,borderRadius:11,backgroundColor:C.blush,paddingHorizontal:11,alignItems:'center',justifyContent:'center'},reviewCancelText:{fontSize:11,fontWeight:'800',color:C.roseDark},
});
