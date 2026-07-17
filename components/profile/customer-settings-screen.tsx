import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getApiAssetUrl, updateProfile, type PrivacySettings, type UserProfile } from '@/services/api';

type Props = {
  token: string;
  profile: UserProfile;
  privacy: PrivacySettings | null;
  privacyLoading: boolean;
  privacyError: string | null;
  onBack: () => void;
  onSaved: (profile: UserProfile) => void;
  onTogglePrivacy: (key: keyof PrivacySettings) => void;
  onReloadPrivacy: () => void;
  onLogout: () => void;
};

const colors = { rose: '#A94F67', roseDark: '#743548', blush: '#F7E4E8', pale: '#FFF8F6', ink: '#292326', muted: '#7C7074', line: '#EDE3E5', white: '#FFFFFF' };

export function CustomerSettingsScreen({ token, profile, privacy, privacyLoading, privacyError, onBack, onSaved, onTogglePrivacy, onReloadPrivacy, onLogout }: Props) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone || '');
  const [hairType, setHairType] = useState(profile.hairType || '');
  const [hairLength, setHairLength] = useState(profile.hairLength || '');
  const [hairTexture, setHairTexture] = useState(profile.hairTexture || '');
  const [imageUri, setImageUri] = useState<string | null>(getApiAssetUrl(profile.profileImageUrl));
  const [imageData, setImageData] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setFullName(profile.fullName); setEmail(profile.email); setPhone(profile.phone || '');
    setHairType(profile.hairType || ''); setHairLength(profile.hairLength || ''); setHairTexture(profile.hairTexture || '');
    setImageUri(getApiAssetUrl(profile.profileImageUrl)); setImageData(undefined);
  }, [profile]);

  const choosePhoto = async () => {
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return Alert.alert('Photo access needed', 'Allow FaceFit to select your profile picture.');
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: .65, base64: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64 || asset.base64.length * .75 > 2.5 * 1024 * 1024) return Alert.alert('Photo could not be used', 'Choose a JPG, PNG, or WebP photo smaller than 2.5 MB.');
    const mime = ['image/jpeg', 'image/png', 'image/webp'].includes(asset.mimeType || '') ? asset.mimeType : 'image/jpeg';
    setImageUri(asset.uri); setImageData(`data:${mime};base64,${asset.base64}`);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true); setSaveError(null); setSaveSuccess(false);
    try {
      const updated = await updateProfile(token, { fullName, email, phone, hairType, hairLength, hairTexture, imageData });
      onSaved(updated);
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to update your profile.');
    } finally { setSaving(false); }
  };

  return <>
    <View style={styles.header}><Pressable accessibilityRole="button" onPress={onBack} style={styles.iconButton}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable><Text style={styles.headerTitle}>Privacy & settings</Text><View style={styles.iconButton} /></View>
    <View style={styles.photoSection}>
      {imageUri ? <Image accessibilityLabel="Profile picture" source={{ uri: imageUri }} style={styles.photo} /> : <View style={styles.photoFallback}><Text style={styles.initial}>{fullName.charAt(0).toUpperCase() || '?'}</Text></View>}
      <View style={styles.photoActions}><Pressable accessibilityRole="button" onPress={() => void choosePhoto()} style={styles.photoButton}><Ionicons name="camera-outline" size={18} color={colors.roseDark} /><Text style={styles.photoButtonText}>{imageUri ? 'Change photo' : 'Add photo'}</Text></Pressable>{imageUri && <Pressable accessibilityRole="button" onPress={() => { setImageUri(null); setImageData(null); }} style={styles.removeButton}><Text style={styles.removeText}>Remove</Text></Pressable>}</View>
    </View>
    <Text style={styles.sectionLabel}>PERSONAL INFORMATION</Text>
    <Field label="Full name" value={fullName} onChange={setFullName} icon="person-outline" />
    <Field label="Email" value={email} onChange={setEmail} icon="mail-outline" keyboardType="email-address" />
    <Field label="Phone" value={phone} onChange={setPhone} icon="call-outline" keyboardType="phone-pad" />
    <Text style={styles.sectionLabel}>HAIR PROFILE</Text>
    <Field label="Hair type" value={hairType} onChange={setHairType} icon="cut-outline" placeholder="e.g. Straight, curly" />
    <Field label="Hair length" value={hairLength} onChange={setHairLength} icon="resize-outline" placeholder="e.g. Short, medium" />
    <Field label="Hair texture" value={hairTexture} onChange={setHairTexture} icon="sparkles-outline" placeholder="e.g. Fine, thick" />
    {saveSuccess && <View accessibilityRole="alert" style={styles.success}><Ionicons name="checkmark-circle" size={21} color="#315F4B" /><View style={styles.grow}><Text style={styles.successTitle}>Profile saved</Text><Text style={styles.successText}>Your photo and personal information are up to date.</Text></View></View>}
    {saveError && <View style={styles.error}><Ionicons name="alert-circle" size={19} color="#81263A" /><Text style={styles.errorText}>{saveError}</Text></View>}
    <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={[styles.saveButton, saving && styles.disabled]}>{saving ? <ActivityIndicator color={colors.white} /> : <><Ionicons name="checkmark" size={20} color={colors.white} /><Text style={styles.saveText}>Save profile</Text></>}</Pressable>
    <Text style={styles.sectionLabel}>PRIVACY</Text>
    {privacyLoading ? <ActivityIndicator color={colors.rose} /> : privacyError ? <Pressable onPress={onReloadPrivacy} style={styles.error}><Text style={styles.errorText}>{privacyError} · Tap to retry</Text></Pressable> : privacy && <>{<PrivacyRow label="Notifications" detail="Receive booking and account updates" active={privacy.notificationsEnabled} onPress={() => onTogglePrivacy('notificationsEnabled')} icon="notifications-outline" />}<PrivacyRow label="Save scan history" detail="Keep face analyses in your account" active={privacy.saveScanHistory} onPress={() => onTogglePrivacy('saveScanHistory')} icon="scan-outline" /></>}
    <Pressable accessibilityRole="button" onPress={onLogout} style={styles.logout}><Ionicons name="log-out-outline" size={19} color={colors.rose} /><Text style={styles.logoutText}>Log out</Text></Pressable>
  </>;
}

function Field({ label, value, onChange, icon, placeholder, keyboardType = 'default' }: { label: string; value: string; onChange: (value: string) => void; icon: keyof typeof Ionicons.glyphMap; placeholder?: string; keyboardType?: 'default' | 'email-address' | 'phone-pad' }) { return <View style={styles.fieldWrap}><Text style={styles.label}>{label}</Text><View style={styles.field}><Ionicons name={icon} size={19} color={colors.muted} /><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#A89DA0" keyboardType={keyboardType} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'} style={styles.input} /></View></View>; }
function PrivacyRow({ label, detail, active, onPress, icon }: { label: string; detail: string; active: boolean; onPress: () => void; icon: keyof typeof Ionicons.glyphMap }) { return <Pressable onPress={onPress} style={styles.privacyRow}><View style={styles.privacyIcon}><Ionicons name={icon} size={21} color={colors.rose} /></View><View style={styles.grow}><Text style={styles.privacyTitle}>{label}</Text><Text style={styles.small}>{detail}</Text></View><Ionicons name={active ? 'toggle' : 'toggle-outline'} size={34} color={active ? colors.rose : colors.muted} /></Pressable>; }

const styles = StyleSheet.create({ header:{height:56,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18},headerTitle:{fontSize:17,fontWeight:'700',color:colors.ink},iconButton:{width:40,height:40,borderRadius:20,backgroundColor:colors.white,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.line},photoSection:{alignItems:'center',padding:20,borderRadius:22,backgroundColor:colors.white,borderWidth:1,borderColor:colors.line,marginBottom:22},photo:{width:112,height:112,borderRadius:56,resizeMode:'cover'},photoFallback:{width:112,height:112,borderRadius:56,backgroundColor:colors.rose,alignItems:'center',justifyContent:'center'},initial:{fontSize:42,fontWeight:'900',color:colors.white},photoActions:{flexDirection:'row',gap:9,marginTop:14},photoButton:{minHeight:40,paddingHorizontal:13,borderRadius:13,backgroundColor:colors.blush,flexDirection:'row',alignItems:'center',gap:6},photoButtonText:{fontSize:12,fontWeight:'800',color:colors.roseDark},removeButton:{minHeight:40,paddingHorizontal:13,justifyContent:'center'},removeText:{fontSize:12,fontWeight:'800',color:'#A33A4E'},sectionLabel:{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:colors.rose,marginTop:10,marginBottom:11},fieldWrap:{marginBottom:13},label:{fontSize:11,fontWeight:'800',color:colors.ink,marginBottom:7},field:{height:54,borderRadius:16,backgroundColor:colors.white,borderWidth:1,borderColor:colors.line,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:14},input:{flex:1,height:'100%',fontSize:14,color:colors.ink,outlineStyle:'none' as never},success:{padding:14,borderRadius:15,backgroundColor:'#E8F3ED',borderWidth:1,borderColor:'#CFE6DA',flexDirection:'row',alignItems:'center',gap:10,marginBottom:10},successTitle:{fontSize:13,fontWeight:'900',color:'#315F4B'},successText:{fontSize:11,lineHeight:16,color:'#5A7B6C',marginTop:2},saveButton:{minHeight:52,borderRadius:17,backgroundColor:colors.rose,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginVertical:10},saveText:{fontSize:15,fontWeight:'900',color:colors.white},disabled:{opacity:.5},error:{padding:13,borderRadius:14,backgroundColor:'#FCE8EC',flexDirection:'row',alignItems:'center',gap:8,marginBottom:10},errorText:{flex:1,fontSize:12,color:'#81263A'},privacyRow:{minHeight:70,borderBottomWidth:1,borderBottomColor:colors.line,flexDirection:'row',alignItems:'center',gap:13},privacyIcon:{width:42,height:42,borderRadius:14,backgroundColor:colors.blush,alignItems:'center',justifyContent:'center'},privacyTitle:{fontSize:15,fontWeight:'700',color:colors.ink},small:{fontSize:12,lineHeight:18,color:colors.muted},grow:{flex:1},logout:{minHeight:52,borderRadius:17,backgroundColor:colors.white,borderWidth:1,borderColor:'#DDBFC7',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:24},logoutText:{fontSize:15,fontWeight:'800',color:colors.rose} });
