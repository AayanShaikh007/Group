import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import GroupMap from './src/GroupMap';
import { defaultServer, Group, loadSession, request, saveSession, Session } from './src/api';

const messageOf = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Try again.';
function Button({ title, onPress, secondary = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, (disabled || pressed) && { opacity: .55 }]}><Text style={[styles.buttonText, secondary && { color: '#145a45' }]}>{title}</Text></Pressable>;
}
function Field({ label, value, onChange, placeholder, maxLength = 100, multiline = false }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; multiline?: boolean }) {
  return <View style={{ gap: 7 }}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} style={[styles.input, multiline && { minHeight: 90, textAlignVertical: 'top' }]} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#7e8d85" maxLength={maxLength} multiline={multiline} autoCapitalize="sentences" /></View>;
}

export default function App() { return <SafeAreaProvider><GroupApp /></SafeAreaProvider>; }
function GroupApp() {
  const [session, setSession] = useState<Session | null>(null), [loaded, setLoaded] = useState(false);
  const [group, setGroup] = useState<Group | null>(null), [tab, setTab] = useState('Gathering');
  const [mode, setMode] = useState('create'), [name, setName] = useState(''), [groupName, setGroupName] = useState(''), [code, setCode] = useState('');
  const [server, setServer] = useState(defaultServer), [showServer, setShowServer] = useState(false);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [online, setOnline] = useState(false);
  const [text, setText] = useState(''), [meeting, setMeeting] = useState(''), [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false), [confirmLeave, setConfirmLeave] = useState(false);
  const watch = useRef<Location.LocationSubscription | null>(null), generation = useRef(0), sessionRef = useRef<Session | null>(null);
  const chat = useRef<ScrollView>(null), syncing = useRef(false), locationQueue = useRef<Promise<unknown>>(Promise.resolve());
  sessionRef.current = session;
  useEffect(() => { loadSession().then(s => { setSession(s); if (s) setServer(s.server); }).catch(() => setError('Could not restore your membership. Please join again.')).finally(() => setLoaded(true)); }, []);
  const call = <T,>(path: string, method = 'GET', body?: unknown) => request<T>(session!.server, path, method, body, session!.token);
  async function refresh(s = sessionRef.current) {
    if (!s || syncing.current) return;
    syncing.current = true;
    try { const next = await request<Group>(s.server, '/group', 'GET', undefined, s.token); if (sessionRef.current?.token === s.token) { setGroup(next); setOnline(true); } }
    catch (e) { if (sessionRef.current?.token === s.token) { setOnline(false); setError(messageOf(e)); } }
    finally { syncing.current = false; }
  }
  useEffect(() => {
    if (!session) return;
    refresh(session);
    const timer = setInterval(() => { if (AppState.currentState === 'active') refresh(session); }, 3000);
    return () => { clearInterval(timer); generation.current++; watch.current?.remove(); watch.current = null; };
  }, [session?.token]);
  function publishLocation(latitude: number, longitude: number, run: number) {
    const s = sessionRef.current;
    const next = locationQueue.current.catch(() => {}).then(async () => {
      if (!s || run !== generation.current || AppState.currentState !== 'active') return;
      await request(s.server, '/location', 'PUT', { latitude, longitude }, s.token);
    });
    locationQueue.current = next;
    return next;
  }
  async function stopSharing() {
    generation.current++; watch.current?.remove(); watch.current = null; setSharing(false);
    const s = sessionRef.current;
    if (s) try { await locationQueue.current.catch(() => {}); await request(s.server, '/location', 'DELETE', undefined, s.token); await refresh(s); }
    catch (e) { setError(messageOf(e) + ' Your last location will expire within two minutes.'); }
  }
  useEffect(() => { const sub = AppState.addEventListener('change', state => { if (state !== 'active') void stopSharing(); }); return () => sub.remove(); }, []);
  async function perform(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError('');
    try { await action(); } catch (e) { setError(messageOf(e)); } finally { setBusy(false); }
  }
  async function enter() {
    const url = server.trim().replace(/\/$/, '');
    if (!/^https?:\/\//i.test(url)) throw new Error('Enter a server address starting with http:// or https://.');
    const data = await request<Omit<Session, 'server'>>(url, mode === 'create' ? '/groups' : '/join', 'POST', mode === 'create' ? { name: groupName.trim(), memberName: name.trim() } : { code: code.trim(), memberName: name.trim() });
    const s = { ...data, server: url }; await saveSession(s); setSession(s); setGroup(null); setTab('Gathering');
  }
  async function startSharing() {
    const run = ++generation.current;
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') throw new Error('Location permission is needed to share. You can still use chat without it.');
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    if (run !== generation.current || AppState.currentState !== 'active') return;
    await publishLocation(position.coords.latitude, position.coords.longitude, run);
    if (run !== generation.current) return;
    const subscription = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 0 }, p => {
      if (run !== generation.current) return;
      publishLocation(p.coords.latitude, p.coords.longitude, run).catch(e => { setError(messageOf(e)); void stopSharing(); });
    });
    if (run !== generation.current) { subscription.remove(); return; }
    watch.current = subscription; setSharing(true); await refresh();
  }
  // Renew a stationary location as well as movement updates. Every location expires after two minutes.
  useEffect(() => {
    if (!sharing) return;
    const timer = setInterval(async () => {
      const run = generation.current;
      try { const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }); if (run === generation.current && AppState.currentState === 'active') await publishLocation(p.coords.latitude, p.coords.longitude, run); }
      catch (e) { setError(messageOf(e)); void stopSharing(); }
    }, 30000);
    return () => clearInterval(timer);
  }, [sharing, session?.token]);
  async function leave() {
    await stopSharing(); await call('/membership', 'DELETE'); await saveSession(null);
    setSession(null); setGroup(null); setConfirmLeave(false); setCode(''); setError('');
  }
  const me = group?.members.find(m => m.id === session?.memberId);
  return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    {!loaded ? <ActivityIndicator style={{flex:1}} color="#145a45" /> : <>
      <View style={styles.top}><View><Text style={styles.brand}>group<Text style={{color:'#93ad40'}}> together</Text></Text><Text style={styles.small}>{session ? 'A little less planning. A lot more together.' : 'Good company, one simple place.'}</Text></View>{session && <View style={styles.pill}><Text style={styles.small}>{online ? '● Connected' : '○ Reconnecting'}</Text></View>}</View>
      {!!error && <View accessibilityRole="alert" style={styles.error}><Text style={{color:'#8a3025',flex:1}}>{error}</Text><Pressable accessibilityRole="button" accessibilityLabel="Dismiss error" onPress={() => setError('')}><Text>✕</Text></Pressable></View>}
      {!session ? <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}><Text style={styles.eyebrow}>MAKE ROOM FOR YOUR PEOPLE</Text><Text style={styles.title}>Meet up. Stay close.</Text><Text style={styles.body}>Create a private group, share the code, and keep everyone in the loop.</Text><View style={styles.heroCircles}><Text style={styles.circle}>A</Text><Text style={[styles.circle,{backgroundColor:'#dce7ae'}]}>B</Text><Text style={[styles.circle,{backgroundColor:'#e6cfc1'}]}>You</Text></View></View>
        <View style={styles.tabs}>{['create','join'].map(m => <Pressable key={m} accessibilityRole="button" onPress={() => {setMode(m);setError('');}} style={[styles.tab, mode===m && styles.activeTab]}><Text style={styles.label}>{m==='create'?'Create a group':'Join a group'}</Text></Pressable>)}</View>
        <Field label="Your name" value={name} onChange={setName} maxLength={40} placeholder="What should people call you?" />
        {mode==='create' ? <Field label="Group name" value={groupName} onChange={setGroupName} maxLength={60} placeholder="Saturday crew" /> : <Field label="Invite code" value={code} onChange={v => setCode(v.toUpperCase())} maxLength={8} placeholder="8-character code" />}
        <Button title={busy?'Connecting…':mode==='create'?'Bring everyone together':'Join the group'} onPress={() => perform(enter)} disabled={busy || !name.trim() || !(mode==='create'?groupName.trim():code.trim().length===8)} />
        <Text style={styles.small}>No account needed. Your membership is saved on this device.</Text>
        <Pressable accessibilityRole="button" onPress={() => setShowServer(!showServer)}><Text style={styles.link}>Connection settings</Text></Pressable>
        {showServer && <Field label="Server address" value={server} onChange={setServer} placeholder="https://your-server.example" maxLength={250} />}
      </ScrollView> : !group ? <View style={[styles.content,{flex:1,justifyContent:'center'}]}><ActivityIndicator color="#145a45" /><Text style={styles.body}>Opening your group…</Text><Button title="Try again" onPress={() => refresh()} secondary /><Button title="Forget membership on this device" secondary onPress={() => perform(async () => { await saveSession(null); setSession(null); setError(''); })} /></View> : <>
        <View style={styles.groupHeading}><Text style={styles.eyebrow}>YOUR PEOPLE, YOUR PLACE</Text><Text style={styles.heading}>{group.name}</Text><Text style={styles.small}>{group.members.length} {group.members.length===1?'person':'people'} · Invite code {group.code}</Text></View>
        {tab==='Chat' ? <>
          <ScrollView ref={chat} style={{flex:1}} contentContainerStyle={styles.content} onContentSizeChange={() => chat.current?.scrollToEnd({animated:true})}>
            {!group.messages.length && <View style={styles.card}><Text style={styles.heading}>Say the first hello.</Text><Text style={styles.body}>Plans, updates, or just a friendly wave. This is your group’s conversation.</Text></View>}
            {group.messages.map(m => <View key={m.id} style={[styles.bubble,m.memberId===session.memberId && styles.myBubble]}><Text style={[styles.label,m.memberId===session.memberId && {color:'#dce7ae'}]}>{m.memberId===session.memberId?'You':m.name}</Text><Text style={[styles.message,m.memberId===session.memberId && {color:'#fff'}]}>{m.text}</Text><Text style={[styles.small,m.memberId===session.memberId && {color:'#c6d9cf'}]}>{new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</Text></View>)}
          </ScrollView><View style={styles.composer}><TextInput accessibilityLabel="Message" style={[styles.input,{flex:1,maxHeight:110}]} multiline value={text} onChangeText={setText} maxLength={1000} placeholder="Message your people…" /><Button title="Send" disabled={busy || !text.trim()} onPress={() => perform(async () => {await call('/messages','POST',{text});setText('');await refresh();})} /></View>
        </> : <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {tab==='Gathering' && <>
            <View style={styles.hero}><Text style={styles.eyebrow}>THE PLAN</Text><Text style={styles.heading}>{group.meeting || 'Where shall we meet?'}</Text><Text style={styles.body}>{group.meeting?'Your meeting details, all in one place.':'Add a meeting point and time so everyone knows the plan.'}</Text>
              {group.ownerId===session.memberId && <Button title={editing?'Cancel':'Edit the plan'} secondary onPress={() => {setMeeting(group.meeting);setEditing(!editing);}} />}
              {editing && <><Field label="Meeting place and time" value={meeting} onChange={setMeeting} maxLength={300} multiline placeholder="Central Park entrance · Saturday at 2 pm" /><Button title="Save plan" disabled={busy} onPress={() => perform(async () => {await call('/meeting','PUT',{meeting});setEditing(false);await refresh();})} /></>}
            </View>
            <View style={styles.card}><Text style={styles.heading}>The more, the merrier.</Text><Text style={styles.body}>Send this code to the people you want to join.</Text><Text selectable style={styles.code}>{group.code}</Text><Button title="Share invite" onPress={() => perform(async () => {await Share.share({message:`Join ${group.name} on Group Together. Invite code: ${group.code}`});})} /></View>
            <Button title="Open group conversation →" secondary onPress={() => setTab('Chat')} />
          </>}
          {tab==='People' && <>
            <View style={styles.hero}><Text style={styles.heading}>Find your people.</Text><Text style={styles.body}>{sharing?'Your location is sharing while the app is open.':'Choose when to share your location. Sharing stops when you leave the app.'}</Text><Button title={busy?'Please wait…':sharing?'Stop sharing location':'Share my location'} disabled={busy} onPress={() => perform(sharing?stopSharing:startSharing)} /></View>
            <GroupMap members={group.members} />
            {group.members.map(m => <View key={m.id} style={styles.card}><View style={styles.row}><Text style={styles.avatar}>{m.name.slice(0,1).toUpperCase()}</Text><View style={{flex:1}}><Text style={styles.heading}>{m.name}{m.id===session.memberId?' (you)':''}</Text><Text style={styles.small}>{m.location?'Location shared recently':'Location private'}</Text></View></View>{m.location && <Button title="View in Maps ↗" secondary onPress={() => perform(async () => {await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${m.location!.latitude},${m.location!.longitude}`);})} />}</View>)}
          </>}
          {tab==='Settings' && <>
            <View style={styles.card}><Text style={styles.heading}>Hello, {me?.name}.</Text><Text style={styles.body}>You belong to {group.name}. Your membership stays on this device until you leave.</Text></View>
            <View style={styles.card}><Text style={styles.heading}>You’re in control.</Text><Text style={styles.body}>Location sharing is off by default. It stops when the app goes into the background. If your connection drops, your last shared location disappears within two minutes.</Text><Text style={styles.small}>Messages remain with the group after you leave. The group is deleted when its last member leaves.</Text></View>
            <View style={styles.card}><Text style={styles.label}>Connection</Text><Text selectable style={styles.small}>{session.server}</Text><Button title="Refresh group" secondary onPress={() => perform(async () => {await refresh();})} /></View>
            {confirmLeave ? <View style={styles.card}><Text style={styles.heading}>Leave {group.name}?</Text><Text style={styles.body}>You can rejoin with the invite code while the group still exists.</Text><Button title="Leave group" disabled={busy} onPress={() => perform(leave)} /><Button title="Stay here" secondary onPress={() => setConfirmLeave(false)} /></View> : <Button title="Leave group" secondary onPress={() => setConfirmLeave(true)} />}
          </>}
        </ScrollView>}
        <View style={styles.nav}>{['Gathering','Chat','People','Settings'].map((t,i) => <Pressable key={t} accessibilityRole="button" accessibilityState={{selected:tab===t}} style={[styles.navItem,tab===t && styles.activeTab]} onPress={() => setTab(t)}><Text style={{fontSize:19,color:'#145a45'}}>{['◉','☏','♧','⚙'][i]}</Text><Text style={styles.navText}>{t}</Text></Pressable>)}</View>
      </>}
    </>}
  </KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#fafbf6'},top:{padding:20,gap:8,flexDirection:'row',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap'},brand:{fontSize:23,fontWeight:'800',color:'#145a45',letterSpacing:-1},small:{fontSize:12,color:'#63756a',lineHeight:19},pill:{backgroundColor:'#edf2e4',padding:8,borderRadius:20},content:{padding:20,gap:18,paddingBottom:30},hero:{backgroundColor:'#edf2e4',padding:24,borderRadius:24,gap:17},eyebrow:{fontSize:10,fontWeight:'800',color:'#577a57',letterSpacing:2},title:{fontSize:39,lineHeight:43,fontWeight:'800',color:'#163e30',letterSpacing:-1.5},heading:{fontSize:21,fontWeight:'700',color:'#163e30',lineHeight:28},body:{fontSize:15,color:'#56695b',lineHeight:23},heroCircles:{flexDirection:'row',gap:8},circle:{width:54,height:54,borderRadius:27,backgroundColor:'#ceddd4',textAlign:'center',textAlignVertical:'center',paddingTop:Platform.OS==='web'?17:0,color:'#163e30',fontWeight:'700'},tabs:{flexDirection:'row',backgroundColor:'#eef0e8',borderRadius:16,padding:4},tab:{flex:1,padding:13,borderRadius:12,alignItems:'center'},activeTab:{backgroundColor:'#dce7ae'},label:{fontSize:13,fontWeight:'700',color:'#254a39'},input:{borderWidth:1,borderColor:'#d6ded1',padding:14,borderRadius:14,backgroundColor:'#fff',fontSize:16,color:'#163e30'},button:{backgroundColor:'#145a45',paddingVertical:15,paddingHorizontal:18,borderRadius:14,alignItems:'center',justifyContent:'center'},secondary:{backgroundColor:'#e4ecda'},buttonText:{fontSize:14,color:'#fff',fontWeight:'700'},link:{fontSize:13,color:'#145a45',textDecorationLine:'underline'},error:{marginHorizontal:20,backgroundColor:'#ffebe5',padding:13,borderRadius:12,flexDirection:'row',gap:10},groupHeading:{paddingHorizontal:20,paddingBottom:14,gap:6},card:{backgroundColor:'#fff',borderColor:'#e0e6d9',borderWidth:1,borderRadius:20,padding:20,gap:12},code:{fontSize:30,fontWeight:'800',color:'#145a45',letterSpacing:4},nav:{padding:10,borderTopWidth:1,borderColor:'#e0e6d9',flexDirection:'row',gap:5,backgroundColor:'#fff'},navItem:{flex:1,alignItems:'center',borderRadius:12,paddingVertical:10,gap:4},navText:{fontSize:11,color:'#254a39',fontWeight:'600'},bubble:{backgroundColor:'#eaf0e3',borderRadius:18,padding:15,gap:5,alignSelf:'flex-start',maxWidth:'90%'},myBubble:{alignSelf:'flex-end',backgroundColor:'#145a45'},message:{fontSize:16,lineHeight:23,color:'#163e30'},composer:{flexDirection:'row',padding:12,gap:8,alignItems:'center',backgroundColor:'#fff'},row:{flexDirection:'row',alignItems:'center',gap:12},avatar:{width:44,height:44,borderRadius:22,backgroundColor:'#dce7ae',textAlign:'center',paddingTop:10,fontSize:20,fontWeight:'700',color:'#145a45'}
});
