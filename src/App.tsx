import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote, CalendarDays, CheckCircle2, Eye, Heart, Image as ImageIcon, Lock, LogOut,
  MapPin, Menu, MessageCircle, Palette, Plus, Save, Settings, Share2, Trash2, Upload, Users, X
} from "lucide-react";

type AttendanceStatus = "Hadir" | "Tidak Hadir" | "Masih Ragu";
type AppMode = "invite" | "login" | "admin";
type AdminTab = "Dashboard" | "Acara" | "Mempelai" | "Media" | "Amplop" | "Tamu" | "RSVP" | "Ucapan" | "Tampilan";
type RsvpItem = { name: string; attendance: AttendanceStatus; createdAt: string };
type WishItem = { name: string; message: string; attendance: AttendanceStatus };
type GuestItem = { id: string; name: string; phone: string; sentAt?: string; status?: "Belum Dikirim" | "Terkirim" | "Gagal" };

type WeddingData = {
  brand: string;
  event: {
    guestName: string; groom: string; bride: string; title: string; dateText: string; dateISO: string;
    akadTime: string; receptionTime: string; venue: string; address: string; mapsUrl: string; whatsapp: string;
    quote: string; quoteSource: string; musicUrl: string; coverPhoto: string;
  };
  profiles: { groomBio: string; brideBio: string };
  gallery: string[];
  bank: {
    groomBankName: string; groomAccountNumber: string; groomAccountName: string;
    brideBankName: string; brideAccountNumber: string; brideAccountName: string;
  };
  fonnte: { countryCode: string; messageTemplate: string };
  guests: GuestItem[];
  rsvp: RsvpItem[];
  wishes: WishItem[];
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" };

function Button({ className = "", variant = "default", ...props }: ButtonProps) {
  const styles = {
    default: "bg-[#7B1F1B] text-white hover:bg-[#651814] shadow-lg shadow-[#7B1F1B]/20",
    outline: "border border-[#D7BFAE] bg-white text-[#7B1F1B] hover:bg-[#F8EFE7]",
    ghost: "bg-transparent text-[#7B1F1B] hover:bg-[#F8EFE7]",
  };
  return <button className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.98] ${styles[variant]} ${className}`} {...props} />;
}
function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-3xl border border-[#E7D6CA] bg-white shadow-sm shadow-[#7B1F1B]/5 ${className}`} {...props} />;
}
function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

const STORAGE_KEY = "nadi-invitation-data-v4";
const DEFAULT_COVER = "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=1400&auto=format&fit=crop";
const DEFAULT_GALLERY = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=1200&auto=format&fit=crop",
];

const defaultData: WeddingData = {
  brand: "GitTech Invitation",
  event: {
    guestName: "Sahabatku",
    groom: "Adi Abas Syahizinda",
    bride: "Wulan Nilasari",
    title: "The Wedding Of",
    dateText: "Sabtu, 30 Mei 2026",
    dateISO: "2026-05-30T09:00:00+07:00",
    akadTime: "09.00 WIB",
    receptionTime: "11.00 - selesai",
    venue: "Kediaman Mempelai Wanita",
    address: "Dusun II RT. 015 RW. 005, Desa Citenjo, Kec. Cibingbin, Kab. Kuningan",
    mapsUrl: "https://maps.google.com",
    whatsapp: "6281234567890",
    quote: "Semoga Allah menghimpun yang terserak dari keduanya, memberkahi mereka berdua, dan meningkatkan kualitas keturunan mereka.",
    quoteSource: "Doa untuk kedua mempelai",
    musicUrl: "",
    coverPhoto: DEFAULT_COVER,
  },
  profiles: {
    groomBio: "Putra dari Bapak E. Tawa dan Ibu Dedah Kurniasih.",
    brideBio: "Putri pertama dari Bapak Carsan dan Ibu Casihah Sukmaju.",
  },
  gallery: DEFAULT_GALLERY,
  bank: {
    groomBankName: "BCA", groomAccountNumber: "1234567890", groomAccountName: "Adi Abas Syahizinda",
    brideBankName: "Mandiri", brideAccountNumber: "9876543210", brideAccountName: "Wulan Nilasari",
  },
  fonnte: {
    countryCode: "62",
    messageTemplate: "Assalamu'alaikum {name}, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di acara pernikahan {groom} & {bride}. Link undangan: {link}",
  },
  guests: [{ id: "guest-1", name: "Sahabatku", phone: "6281234567890", status: "Belum Dikirim" }],
  rsvp: [],
  wishes: [{ name: "Keluarga Besar", message: "Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.", attendance: "Hadir" }],
};

function mergeWeddingData(raw: Partial<WeddingData>): WeddingData {
  return {
    ...defaultData,
    ...raw,
    event: { ...defaultData.event, ...(raw.event || {}) },
    profiles: { ...defaultData.profiles, ...(raw.profiles || {}) },
    bank: { ...defaultData.bank, ...(raw.bank || {}) },
    fonnte: { ...defaultData.fonnte, ...(raw.fonnte || {}) },
    gallery: raw.gallery?.length ? raw.gallery : defaultData.gallery,
    guests: raw.guests || defaultData.guests,
    rsvp: raw.rsvp || defaultData.rsvp,
    wishes: raw.wishes || defaultData.wishes,
  };
}
function loadData(): WeddingData {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? mergeWeddingData(JSON.parse(raw) as Partial<WeddingData>) : defaultData; }
  catch { return defaultData; }
}
function saveData(data: WeddingData) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function Input({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <label className="block space-y-1"><span className="text-xs font-semibold text-stone-600">{label}</span><input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-[#E7D6CA] bg-white px-3 py-2 text-sm outline-none focus:border-[#7B1F1B] focus:ring-2 focus:ring-[#7B1F1B]/10" /></label>;
}
function Textarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <label className="block space-y-1"><span className="text-xs font-semibold text-stone-600">{label}</span><textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} className="w-full rounded-xl border border-[#E7D6CA] bg-white px-3 py-2 text-sm outline-none focus:border-[#7B1F1B] focus:ring-2 focus:ring-[#7B1F1B]/10" /></label>;
}
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(file); });
}
function UploadButton({ label, onUpload }: { label: string; onUpload: (dataUrl: string) => void }) {
  return <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#7B1F1B] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#7B1F1B]/20 hover:bg-[#651814]"><Upload className="h-4 w-4" />{label}<input type="file" accept="image/*" className="hidden" onChange={async e => { const file = e.target.files?.[0]; if (file) onUpload(await fileToDataUrl(file)); e.currentTarget.value = ""; }} /></label>;
}
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^?&]+)/, /youtube\.com\/embed\/([^?&]+)/, /youtube\.com\/shorts\/([^?&]+)/];
  for (const p of patterns) { const m = url.match(p); if (m?.[1]) return m[1]; }
  return null;
}
function MusicPlayer({ url, play }: { url: string; play: boolean }) {
  if (!url || !play) return null;
  const id = getYouTubeId(url);
  if (id) return <iframe title="music" className="fixed -left-[9999px] h-1 w-1 opacity-0" allow="autoplay" src={`https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}&controls=0`} />;
  return <audio src={url} autoPlay loop />;
}
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return <motion.div initial={{ opacity: 0, y: 34 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.16 }} transition={{ duration: 0.65, delay, ease: "easeOut" }}>{children}</motion.div>;
}
function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return <div className="mx-auto mb-8 max-w-2xl text-center"><p className="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-[#7B1F1B]">{eyebrow}</p><h2 className="font-serif text-4xl text-[#7B1F1B] md:text-5xl">{title}</h2>{subtitle && <p className="mt-3 text-sm leading-7 text-stone-600 md:text-base">{subtitle}</p>}</div>;
}
function FloatingOrnaments() {
  return <div className="pointer-events-none absolute inset-0 overflow-hidden">{Array.from({ length: 16 }).map((_, i) => <motion.span key={i} initial={{ opacity: 0, y: -30, x: `${(i * 23) % 100}vw` }} animate={{ opacity: [0, 0.45, 0], y: "105vh", rotate: 360 }} transition={{ duration: 9 + (i % 5), delay: i * 0.35, repeat: Infinity, ease: "linear" }} className="absolute top-0 h-2 w-2 rounded-full bg-[#C9A77A]/70" />)}</div>;
}
function normalizePhone(phone: string) { const clean = phone.replace(/[^0-9]/g, ""); return clean.startsWith("0") ? `62${clean.slice(1)}` : clean; }
function buildGuestInviteUrl(name: string) { const url = new URL(window.location.href); url.searchParams.set("to", name); return url.toString(); }
function buildWaMessage(data: WeddingData, guest: GuestItem) {
  return data.fonnte.messageTemplate
    .replaceAll("{name}", guest.name).replaceAll("{groom}", data.event.groom).replaceAll("{bride}", data.event.bride)
    .replaceAll("{date}", data.event.dateText).replaceAll("{venue}", data.event.venue).replaceAll("{link}", buildGuestInviteUrl(guest.name));
}
function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  const items: Array<[number, string]> = [[Math.floor(diff / 86400000), "Hari"], [Math.floor(diff / 3600000) % 24, "Jam"], [Math.floor(diff / 60000) % 60, "Menit"], [Math.floor(diff / 1000) % 60, "Detik"]];
  return <div className="grid grid-cols-4 gap-3">{items.map(([n, l], i) => <motion.div key={l} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-2xl border border-[#E7D6CA] bg-white/90 p-4 text-center shadow-sm"><div className="text-2xl font-black text-[#7B1F1B] md:text-4xl">{n}</div><div className="text-[10px] uppercase tracking-widest text-stone-500">{l}</div></motion.div>)}</div>;
}

function InvitationView({ data, setData }: { data: WeddingData; setData: React.Dispatch<React.SetStateAction<WeddingData>> }) {
  const [opened, setOpened] = useState(false);
  const guestFromUrl = new URLSearchParams(window.location.search).get("to");
  const activeGuestName = guestFromUrl || data.event.guestName || "Sahabatku";
  const [rsvpName, setRsvpName] = useState(activeGuestName);
  const [attendance, setAttendance] = useState<AttendanceStatus>("Hadir");
  const [wish, setWish] = useState("");

  const submitRsvp = () => {
    if (!rsvpName.trim()) return;
    const next: WeddingData = {
      ...data,
      rsvp: [{ name: rsvpName, attendance, createdAt: new Date().toISOString() }, ...data.rsvp],
      wishes: wish.trim() ? [{ name: rsvpName, message: wish, attendance }, ...data.wishes] : data.wishes,
    };
    setData(next); saveData(next); setWish(""); alert("Terima kasih, konfirmasi Anda tersimpan.");
  };

  const shareInvite = async () => {
    const text = `${data.event.title} ${data.event.groom} & ${data.event.bride}`;
    if (navigator.share) await navigator.share({ title: text, text, url: window.location.href });
    else { await navigator.clipboard.writeText(window.location.href); alert("Link berhasil disalin."); }
  };

  return <div className="min-h-screen overflow-hidden bg-[#F3E8DF] text-stone-800">
    <MusicPlayer url={data.event.musicUrl} play={opened} />
    <AnimatePresence mode="wait">{!opened && <motion.div key="cover" exit={{ opacity: 0, scale: 1.03, filter: "blur(10px)" }} transition={{ duration: 0.8 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#7B1F1B] p-4"><FloatingOrnaments /><motion.div initial={{ opacity: 0, y: 34, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-[#F3E8DF] shadow-2xl"><div className="relative h-[420px]"><img src={data.event.coverPhoto || data.gallery[0]} alt="Foto Mempelai" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#7B1F1B]/95" /><div className="absolute bottom-0 left-0 right-0 p-7 text-center text-white"><p className="mb-2 text-xs uppercase tracking-[0.3em]">The Wedding Of</p><h1 className="font-serif text-4xl leading-tight">{data.event.groom.split(" ")[0]} & {data.event.bride.split(" ")[0]}</h1><p className="mt-3 text-sm">{data.event.dateText}</p></div></div><div className="p-7 text-center"><p className="text-xs uppercase tracking-[0.25em] text-stone-500">Teruntuk</p><h2 className="mt-2 text-xl font-bold text-[#7B1F1B]">{activeGuestName}</h2><Button onClick={() => setOpened(true)} className="mt-6 rounded-full px-8 py-6"><Heart className="mr-2 h-4 w-4" /> Buka Undangan</Button><p className="mt-4 text-xs text-stone-500">Mohon maaf bila ada kesalahan penulisan nama atau gelar.</p></div></motion.div></motion.div>}</AnimatePresence>

    <AnimatePresence>{opened && <motion.main initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30, filter: "blur(8px)" }} transition={{ duration: 0.7 }}>
      <Button onClick={() => setOpened(false)} variant="outline" className="fixed bottom-4 left-4 z-40 rounded-full bg-white/90 shadow-xl">Tutup Undangan</Button>

      <section className="relative min-h-screen overflow-hidden bg-[#7B1F1B] px-5 py-12 text-white md:py-20"><FloatingOrnaments /><div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[0.9fr_1.1fr]"><motion.div initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="order-2 text-center md:order-1 md:text-left"><p className="text-sm uppercase tracking-[0.35em] text-[#E9D6C9]">{data.event.title}</p><h1 className="mt-5 font-serif text-5xl leading-tight md:text-7xl">{data.event.groom}<br /><span className="text-[#E9D6C9]">&</span> {data.event.bride}</h1><p className="mt-6 max-w-2xl text-sm leading-7 text-[#F4E8DE] md:text-base">{data.event.quote}</p><p className="mt-2 text-sm text-[#E9D6C9]">{data.event.quoteSource}</p><div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start"><Button onClick={shareInvite} variant="outline" className="rounded-full"><Share2 className="mr-2 h-4 w-4" /> Bagikan</Button><a href={`https://wa.me/${data.event.whatsapp}`} target="_blank" rel="noreferrer"><Button variant="outline" className="rounded-full"><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp</Button></a></div></motion.div><motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="order-1 rounded-[2rem] border-4 border-[#E9D6C9] bg-[#E9D6C9] p-2 shadow-2xl md:order-2"><img src={data.event.coverPhoto || data.gallery[0]} alt="Foto Mempelai" className="h-[520px] w-full rounded-[1.5rem] object-cover" /></motion.div></div></section>

      <Reveal><section className="px-5 py-16"><div className="mx-auto max-w-4xl"><SectionTitle eyebrow="Save The Date" title={data.event.dateText} subtitle="Dengan penuh rasa hormat kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu." /><Countdown target={data.event.dateISO} /></div></section></Reveal>

      <Reveal><section className="bg-[#FFF8F2] px-5 py-16"><div className="mx-auto max-w-5xl"><SectionTitle eyebrow="Kedua Mempelai" title="Bride & Groom" /><div className="grid gap-5 md:grid-cols-2"><Card><CardContent className="p-8 text-center"><h3 className="font-serif text-4xl text-[#7B1F1B]">{data.event.groom}</h3><p className="mt-4 leading-7 text-stone-600">{data.profiles.groomBio}</p></CardContent></Card><Card><CardContent className="p-8 text-center"><h3 className="font-serif text-4xl text-[#7B1F1B]">{data.event.bride}</h3><p className="mt-4 leading-7 text-stone-600">{data.profiles.brideBio}</p></CardContent></Card></div></div></section></Reveal>

      <Reveal><section className="px-5 py-16"><div className="mx-auto max-w-5xl"><SectionTitle eyebrow="Rangkaian Acara" title="Waktu & Tempat" /><div className="grid gap-5 md:grid-cols-2"><Card><CardContent className="p-7"><CalendarDays className="mb-4 h-8 w-8 text-[#7B1F1B]" /><h3 className="text-2xl font-bold text-[#7B1F1B]">Akad Nikah</h3><p className="mt-2 text-stone-600">{data.event.dateText}, pukul {data.event.akadTime}</p></CardContent></Card><Card><CardContent className="p-7"><Users className="mb-4 h-8 w-8 text-[#7B1F1B]" /><h3 className="text-2xl font-bold text-[#7B1F1B]">Resepsi</h3><p className="mt-2 text-stone-600">{data.event.dateText}, pukul {data.event.receptionTime}</p></CardContent></Card></div><motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-5 overflow-hidden rounded-3xl border border-[#D7BFAE] bg-[#7B1F1B] shadow-xl shadow-[#7B1F1B]/15"><div className="p-7 text-white"><div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/15"><MapPin className="h-7 w-7 text-[#F4E8DE]" /></div><p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-[#E9D6C9]">Lokasi Acara</p><h3 className="text-2xl font-bold text-white">{data.event.venue}</h3><p className="mt-3 leading-7 text-[#F4E8DE]">{data.event.address}</p><a href={data.event.mapsUrl} target="_blank" rel="noreferrer"><Button variant="outline" className="mt-5 rounded-full bg-white text-[#7B1F1B] hover:bg-[#F8EFE7]">Buka Google Maps</Button></a></div><div className="h-72 border-t border-white/15 bg-[#F3E8DF]"><iframe title="Lokasi Acara" src={`https://www.google.com/maps?q=${encodeURIComponent(data.event.address)}&output=embed`} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div></motion.div></div></section></Reveal>

      <Reveal><section className="bg-[#FFF8F2] px-5 py-16"><div className="mx-auto max-w-6xl"><SectionTitle eyebrow="Galeri" title="Momen Bahagia" /><div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">{data.gallery.map((src, i) => <motion.img key={`${src}-${i}`} src={src} alt={`Galeri ${i + 1}`} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} whileHover={{ y: -5, scale: 1.03 }} className="h-72 w-full rounded-3xl border-4 border-white object-cover shadow-lg shadow-[#7B1F1B]/10" />)}</div></div></section></Reveal>

      <Reveal><section className="px-5 py-16"><div className="mx-auto max-w-5xl"><SectionTitle eyebrow="Wedding Gift" title="Amplop Digital" subtitle="Doa restu Anda adalah hadiah terbaik. Apabila ingin memberikan tanda kasih, dapat melalui rekening berikut." /><div className="grid gap-5 md:grid-cols-2">{[{ label: "Mempelai Pria", bank: data.bank.groomBankName, no: data.bank.groomAccountNumber, name: data.bank.groomAccountName }, { label: "Mempelai Wanita", bank: data.bank.brideBankName, no: data.bank.brideAccountNumber, name: data.bank.brideAccountName }].map(acc => <Card key={acc.label} className="bg-gradient-to-br from-white to-[#F8EFE7]"><CardContent className="p-7"><div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#7B1F1B]/10 px-4 py-2 text-sm font-bold text-[#7B1F1B]"><Banknote className="h-4 w-4" /> {acc.label}</div><p className="text-sm uppercase tracking-[0.3em] text-[#7B1F1B]">{acc.bank}</p><h3 className="mt-3 text-3xl font-black text-stone-900">{acc.no}</h3><p className="mt-2 text-stone-600">a.n. <b>{acc.name}</b></p><div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => navigator.clipboard.writeText(acc.no)} className="rounded-full">Salin Nomor</Button><Button variant="outline" onClick={() => navigator.clipboard.writeText(`${acc.bank} ${acc.no} a.n. ${acc.name}`)} className="rounded-full">Salin Detail</Button></div></CardContent></Card>)}</div></div></section></Reveal>

      <Reveal><section className="bg-[#7B1F1B] px-5 py-16 text-white"><div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.9fr_1.1fr]"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-[#E9D6C9]">RSVP</p><h2 className="font-serif text-4xl md:text-5xl">Konfirmasi Kehadiran</h2><p className="mt-4 leading-7 text-[#F4E8DE]">Kehadiran dan doa restu Bapak/Ibu/Saudara/i merupakan kehormatan bagi kami.</p></div><Card><CardContent className="space-y-4 p-7"><Input label="Nama" value={rsvpName} onChange={setRsvpName} /><label className="block space-y-1"><span className="text-xs font-semibold text-stone-600">Kehadiran</span><select value={attendance} onChange={e => setAttendance(e.target.value as AttendanceStatus)} className="w-full rounded-xl border border-[#E7D6CA] px-3 py-2 text-sm"><option>Hadir</option><option>Tidak Hadir</option><option>Masih Ragu</option></select></label><Textarea label="Ucapan dan Doa" value={wish} onChange={setWish} placeholder="Tuliskan ucapan terbaik Anda" /><Button onClick={submitRsvp} className="w-full rounded-full py-6"><CheckCircle2 className="mr-2 h-4 w-4" /> Kirim Konfirmasi</Button></CardContent></Card></div></section></Reveal>

      <Reveal><section className="px-5 py-16"><div className="mx-auto max-w-4xl"><SectionTitle eyebrow="Ucapan" title="Doa dari Tamu" /><div className="space-y-4">{data.wishes.map((w, i) => <Card key={`${w.name}-${i}`}><CardContent className="p-5"><div className="flex items-center justify-between gap-4"><h4 className="font-bold text-[#7B1F1B]">{w.name}</h4><span className="rounded-full bg-[#7B1F1B]/10 px-3 py-1 text-xs text-[#7B1F1B]">{w.attendance}</span></div><p className="mt-3 text-stone-600">{w.message}</p></CardContent></Card>)}</div></div></section></Reveal>
      <footer className="bg-[#7B1F1B] px-5 py-10 text-center text-sm text-[#F4E8DE]">Dibuat dengan hormat oleh <b>{data.brand}</b></footer>
    </motion.main>}</AnimatePresence>
  </div>;
}

function AdminPanel({ data, setData, setMode }: { data: WeddingData; setData: React.Dispatch<React.SetStateAction<WeddingData>>; setMode: React.Dispatch<React.SetStateAction<AppMode>> }) {
  const [draft, setDraft] = useState<WeddingData>(data);
  const [active, setActive] = useState<AdminTab>("Acara");
  const [mobileMenu, setMobileMenu] = useState(false);
  const stats = useMemo(() => ({
    guests: draft.guests.length,
    rsvp: draft.rsvp.length,
    hadir: draft.rsvp.filter(x => x.attendance === "Hadir").length,
    tidak: draft.rsvp.filter(x => x.attendance === "Tidak Hadir").length,
    wishes: draft.wishes.length,
  }), [draft]);

  const update = (path: string, value: unknown) => setDraft(prev => {
    const next = structuredClone(prev) as WeddingData;
    const keys = path.split(".");
    let target = next as unknown as Record<string, unknown>;
    keys.slice(0, -1).forEach(k => { target = target[k] as Record<string, unknown>; });
    target[keys[keys.length - 1]] = value;
    return next;
  });
  const persist = () => { setData(draft); saveData(draft); alert("Perubahan berhasil disimpan."); };
  const addGallery = () => update("gallery", [...draft.gallery, DEFAULT_COVER]);
  const removeGallery = (i: number) => update("gallery", draft.gallery.filter((_, idx) => idx !== i));
  const addGuest = () => update("guests", [...draft.guests, { id: crypto.randomUUID(), name: "Nama Tamu", phone: "628", status: "Belum Dikirim" }]);
  const updateGuest = (i: number, field: "name" | "phone", value: string) => update("guests", draft.guests.map((g, idx) => idx === i ? { ...g, [field]: value } : g));
  const deleteGuest = (i: number) => update("guests", draft.guests.filter((_, idx) => idx !== i));
  const deleteWish = (i: number) => update("wishes", draft.wishes.filter((_, idx) => idx !== i));
  const importGuestsFromExcel = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    const imported = rows.map((row, i) => {
      const name = String(row.nama || row.Nama || row.name || row.Name || "").trim();
      const phone = normalizePhone(String(row.wa || row.WA || row.whatsapp || row.WhatsApp || row.nomor || row.Nomor || row.phone || row.Phone || ""));
      return name && phone ? { id: `import-${Date.now()}-${i}`, name, phone, status: "Belum Dikirim" as const } : null;
    }).filter(Boolean) as GuestItem[];
    if (!imported.length) return alert("Pastikan kolom Excel bernama nama dan wa/whatsapp/nomor.");
    update("guests", [...draft.guests, ...imported]);
  };
  const openWhatsappManual = (guest: GuestItem) => window.open(`https://wa.me/${normalizePhone(guest.phone)}?text=${encodeURIComponent(buildWaMessage(draft, guest))}`, "_blank");
  const sendViaFonnte = async (guest: GuestItem, i: number) => {
    try {
      const response = await fetch("/.netlify/functions/send-wa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target: normalizePhone(guest.phone), message: buildWaMessage(draft, guest), countryCode: draft.fonnte.countryCode || "62" }) });
      const result = await response.json();
      if (!result.status) { update("guests", draft.guests.map((g, idx) => idx === i ? { ...g, status: "Gagal" } : g)); alert(`Gagal kirim: ${result.reason || "Tidak diketahui"}`); return; }
      update("guests", draft.guests.map((g, idx) => idx === i ? { ...g, sentAt: new Date().toISOString(), status: "Terkirim" } : g));
      alert(`Undangan berhasil dikirim ke ${guest.name}.`);
    } catch {
      update("guests", draft.guests.map((g, idx) => idx === i ? { ...g, status: "Gagal" } : g));
      alert("Gagal menghubungi Netlify Function.");
    }
  };

  const menu: Array<[AdminTab, React.ElementType]> = [["Dashboard", Settings], ["Acara", CalendarDays], ["Mempelai", Heart], ["Media", ImageIcon], ["Amplop", Banknote], ["Tamu", Users], ["RSVP", Users], ["Ucapan", MessageCircle], ["Tampilan", Palette]];
  const dashboardCards: Array<{ label: string; value: number; Icon: React.ElementType }> = [
    { label: "Total Tamu", value: stats.guests, Icon: Users },
    { label: "Total RSVP", value: stats.rsvp, Icon: CheckCircle2 },
    { label: "Hadir", value: stats.hadir, Icon: Heart },
    { label: "Ucapan", value: stats.wishes, Icon: MessageCircle },
  ];
  const Sidebar = () => <div className="space-y-2"><div className="mb-6 rounded-3xl bg-white/10 p-4"><h2 className="text-xl font-bold text-white">GitTech Admin</h2><p className="text-xs text-[#F4E8DE]">Panel Undangan Pernikahan</p></div>{menu.map(([name, Icon]) => <button key={name} onClick={() => { setActive(name); setMobileMenu(false); }} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${active === name ? "bg-white text-[#7B1F1B] shadow-lg" : "text-[#F4E8DE] hover:bg-white/10"}`}><Icon className="h-4 w-4" /> {name}</button>)}<button onClick={() => setMode("invite")} className="mt-6 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[#F4E8DE] hover:bg-white/10"><Eye className="h-4 w-4" /> Lihat Undangan</button></div>;

  return <div className="min-h-screen bg-[#F3E8DF] text-stone-800">
    <aside className="fixed left-0 top-0 hidden h-full w-72 bg-[#7B1F1B] p-5 lg:block"><Sidebar /></aside>
    <AnimatePresence>{mobileMenu && <motion.aside initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} className="fixed inset-y-0 left-0 z-50 w-72 bg-[#7B1F1B] p-5 lg:hidden"><button onClick={() => setMobileMenu(false)} className="mb-4 text-white"><X /></button><Sidebar /></motion.aside>}</AnimatePresence>
    <main className="lg:pl-72"><header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E7D6CA] bg-white/90 px-5 py-4 backdrop-blur"><div className="flex items-center gap-3"><button onClick={() => setMobileMenu(true)} className="lg:hidden"><Menu /></button><div><h1 className="text-xl font-black text-[#7B1F1B]">{active}</h1><p className="text-xs text-stone-500">Kelola semua konten undangan.</p></div></div><div className="flex gap-2"><Button onClick={persist} className="rounded-full"><Save className="mr-2 h-4 w-4" /> Simpan</Button><Button variant="outline" onClick={() => setMode("login")} className="rounded-full"><LogOut className="mr-2 h-4 w-4" /> Keluar</Button></div></header>
      <div className="p-5 md:p-8">
        {active === "Dashboard" && <div className="grid gap-4 md:grid-cols-4">{dashboardCards.map(({ label, value, Icon }) => <Card key={label}><CardContent className="p-6"><Icon className="mb-4 h-7 w-7 text-[#7B1F1B]" /><p className="text-sm text-stone-500">{label}</p><h3 className="text-3xl font-black text-[#7B1F1B]">{value}</h3></CardContent></Card>)}</div>}

        {active === "Acara" && <Card><CardContent className="grid gap-4 p-6 md:grid-cols-2"><Input label="Nama Tamu Default" value={draft.event.guestName} onChange={v => update("event.guestName", v)} /><Input label="Judul" value={draft.event.title} onChange={v => update("event.title", v)} /><Input label="Tanggal Teks" value={draft.event.dateText} onChange={v => update("event.dateText", v)} /><Input label="Tanggal Countdown ISO" value={draft.event.dateISO} onChange={v => update("event.dateISO", v)} /><Input label="Jam Akad" value={draft.event.akadTime} onChange={v => update("event.akadTime", v)} /><Input label="Jam Resepsi" value={draft.event.receptionTime} onChange={v => update("event.receptionTime", v)} /><Input label="Venue" value={draft.event.venue} onChange={v => update("event.venue", v)} /><Input label="Alamat" value={draft.event.address} onChange={v => update("event.address", v)} /><Input label="Google Maps URL" value={draft.event.mapsUrl} onChange={v => update("event.mapsUrl", v)} /><Input label="WhatsApp Pengantin" value={draft.event.whatsapp} onChange={v => update("event.whatsapp", v)} /><div className="md:col-span-2"><Textarea label="Quote" value={draft.event.quote} onChange={v => update("event.quote", v)} /></div></CardContent></Card>}

        {active === "Mempelai" && <Card><CardContent className="grid gap-4 p-6 md:grid-cols-2"><Input label="Nama Mempelai Pria" value={draft.event.groom} onChange={v => update("event.groom", v)} /><Input label="Nama Mempelai Wanita" value={draft.event.bride} onChange={v => update("event.bride", v)} /><Textarea label="Bio Mempelai Pria" value={draft.profiles.groomBio} onChange={v => update("profiles.groomBio", v)} /><Textarea label="Bio Mempelai Wanita" value={draft.profiles.brideBio} onChange={v => update("profiles.brideBio", v)} /></CardContent></Card>}

        {active === "Media" && <div className="space-y-5"><Card><CardContent className="space-y-4 p-6"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h3 className="font-bold text-[#7B1F1B]">Foto Cover Mempelai</h3><p className="text-sm text-stone-500">Upload langsung dari komputer.</p></div><UploadButton label="Upload Cover" onUpload={url => update("event.coverPhoto", url)} /></div><img src={draft.event.coverPhoto} alt="Cover" className="h-72 w-full rounded-3xl object-cover" /><Input label="URL Musik MP3 / YouTube" value={draft.event.musicUrl} onChange={v => update("event.musicUrl", v)} placeholder="/music.mp3 atau https://youtube.com/watch?v=..." /></CardContent></Card><Card><CardContent className="space-y-4 p-6"><div className="flex items-center justify-between"><div><h3 className="font-bold text-[#7B1F1B]">Galeri Foto</h3><p className="text-sm text-stone-500">Upload foto langsung atau isi link.</p></div><Button onClick={addGallery} className="rounded-full"><Plus className="mr-2 h-4 w-4" /> Tambah</Button></div>{draft.gallery.map((src, i) => <div key={`${src}-${i}`} className="grid gap-3 rounded-2xl border border-[#E7D6CA] p-3 md:grid-cols-[120px_1fr_auto]"><img src={src} alt={`Galeri ${i + 1}`} className="h-24 w-full rounded-xl object-cover" /><div className="space-y-2"><Input label={`Foto ${i + 1}`} value={src} onChange={v => update("gallery", draft.gallery.map((item, idx) => idx === i ? v : item))} /><UploadButton label="Upload Ganti Foto" onUpload={url => update("gallery", draft.gallery.map((item, idx) => idx === i ? url : item))} /></div><Button variant="outline" onClick={() => removeGallery(i)} className="self-center text-red-600"><Trash2 className="h-4 w-4" /></Button></div>)}</CardContent></Card></div>}

        {active === "Amplop" && <div className="grid gap-5 lg:grid-cols-2"><Card><CardContent className="space-y-4 p-6"><h3 className="text-xl font-bold text-[#7B1F1B]">Rekening Mempelai Pria</h3><Input label="Nama Bank" value={draft.bank.groomBankName} onChange={v => update("bank.groomBankName", v)} /><Input label="Nomor Rekening" value={draft.bank.groomAccountNumber} onChange={v => update("bank.groomAccountNumber", v)} /><Input label="Nama Pemilik" value={draft.bank.groomAccountName} onChange={v => update("bank.groomAccountName", v)} /></CardContent></Card><Card><CardContent className="space-y-4 p-6"><h3 className="text-xl font-bold text-[#7B1F1B]">Rekening Mempelai Wanita</h3><Input label="Nama Bank" value={draft.bank.brideBankName} onChange={v => update("bank.brideBankName", v)} /><Input label="Nomor Rekening" value={draft.bank.brideAccountNumber} onChange={v => update("bank.brideAccountNumber", v)} /><Input label="Nama Pemilik" value={draft.bank.brideAccountName} onChange={v => update("bank.brideAccountName", v)} /></CardContent></Card></div>}

        {active === "Tamu" && <div className="space-y-5"><Card><CardContent className="grid gap-4 p-6 md:grid-cols-2"><Input label="Country Code" value={draft.fonnte.countryCode} onChange={v => update("fonnte.countryCode", v)} /><div className="md:col-span-2"><Textarea label="Template WA" value={draft.fonnte.messageTemplate} onChange={v => update("fonnte.messageTemplate", v)} /><p className="mt-2 text-xs text-stone-500">Variabel: {"{name}"}, {"{groom}"}, {"{bride}"}, {"{date}"}, {"{venue}"}, {"{link}"}</p></div></CardContent></Card><Card><CardContent className="space-y-4 p-6"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><h3 className="font-bold text-[#7B1F1B]">Daftar Tamu</h3><div className="flex gap-2"><label className="cursor-pointer rounded-full bg-[#7B1F1B] px-4 py-2 text-sm font-bold text-white">Import Excel<input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importGuestsFromExcel(f); e.currentTarget.value = ""; }} /></label><Button onClick={addGuest} className="rounded-full"><Plus className="mr-2 h-4 w-4" /> Tambah</Button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead><tr className="border-b"><th className="p-3">Nama</th><th className="p-3">WA</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>{draft.guests.map((g, i) => <tr key={g.id} className="border-b"><td className="p-3"><input value={g.name} onChange={e => updateGuest(i, "name", e.target.value)} className="w-full rounded-xl border p-2" /></td><td className="p-3"><input value={g.phone} onChange={e => updateGuest(i, "phone", e.target.value)} className="w-full rounded-xl border p-2" /></td><td className="p-3">{g.status || "Belum Dikirim"}{g.sentAt && <p className="text-xs text-stone-500">{new Date(g.sentAt).toLocaleString("id-ID")}</p>}</td><td className="p-3"><div className="flex gap-2"><Button variant="outline" onClick={() => openWhatsappManual(g)}>Preview WA</Button><Button onClick={() => sendViaFonnte(g, i)}>Kirim WA</Button><Button variant="outline" onClick={() => deleteGuest(i)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button></div></td></tr>)}</tbody></table></div></CardContent></Card></div>}

        {active === "RSVP" && <Card><CardContent className="p-6"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Nama</th><th className="p-3">Status</th><th className="p-3">Waktu</th></tr></thead><tbody>{draft.rsvp.map((item, i) => <tr key={`${item.name}-${i}`} className="border-b"><td className="p-3 font-bold">{item.name}</td><td className="p-3">{item.attendance}</td><td className="p-3">{new Date(item.createdAt).toLocaleString("id-ID")}</td></tr>)}</tbody></table>{!draft.rsvp.length && <p className="py-10 text-center text-stone-500">Belum ada data RSVP.</p>}</div></CardContent></Card>}

        {active === "Ucapan" && <div className="space-y-3">{draft.wishes.map((w, i) => <Card key={`${w.name}-${i}`}><CardContent className="flex items-start justify-between gap-4 p-5"><div><h4 className="font-bold text-[#7B1F1B]">{w.name}</h4><p className="mt-2 text-sm text-stone-600">{w.message}</p></div><Button variant="outline" onClick={() => deleteWish(i)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button></CardContent></Card>)}</div>}

        {active === "Tampilan" && <Card><CardContent className="p-8"><p className="text-xs uppercase tracking-[0.35em] text-[#7B1F1B]">Preview Tema</p><h3 className="mt-3 font-serif text-4xl text-[#7B1F1B]">Maroon Klasik</h3><p className="mt-3 text-stone-600">Tema mengikuti contoh undangan: maroon, cream, elegan, dan fokus foto mempelai.</p></CardContent></Card>}
      </div>
    </main>
  </div>;
}

function Login({ setMode }: { setMode: React.Dispatch<React.SetStateAction<AppMode>> }) {
  const [password, setPassword] = useState("");
  return <div className="flex min-h-screen items-center justify-center bg-[#F3E8DF] p-5"><Card className="w-full max-w-md"><CardContent className="p-8 text-center"><Lock className="mx-auto mb-4 h-10 w-10 text-[#7B1F1B]" /><h1 className="text-2xl font-black text-[#7B1F1B]">Login Admin</h1><p className="mt-2 text-sm text-stone-500">Masuk untuk mengelola undangan.</p><div className="mt-6 text-left"><Input label="Password" type="password" value={password} onChange={setPassword} /></div><Button onClick={() => (password === "admin123" ? setMode("admin") : alert("Password demo: admin123"))} className="mt-5 w-full rounded-full py-6">Masuk Admin</Button><Button variant="ghost" onClick={() => setMode("invite")} className="mt-3 w-full rounded-full">Lihat Undangan</Button></CardContent></Card></div>;
}

export default function App() {
  const [data, setData] = useState<WeddingData>(loadData);
  const [mode, setMode] = useState<AppMode>(() => new URLSearchParams(window.location.search).get("admin") === "true" ? "login" : "invite");
  return <>{mode === "invite" && <InvitationView data={data} setData={setData} />}{mode === "login" && <Login setMode={setMode} />}{mode === "admin" && <AdminPanel data={data} setData={setData} setMode={setMode} />}</>;
}
