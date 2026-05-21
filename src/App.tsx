import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Eye,
  Gift,
  Heart,
  Image as ImageIcon,
  Lock,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Palette,
  Plus,
  Save,
  Settings,
  Share2,
  Trash2,
  Users,
  X,
} from "lucide-react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
};

function Button({ className = "", variant = "default", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-sky-500 text-white hover:bg-sky-600",
    outline: "border border-sky-100 bg-white text-sky-600 hover:bg-sky-50",
    ghost: "bg-transparent text-sky-600 hover:bg-sky-50",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border border-sky-100 bg-white shadow-sm ${className}`} {...props} />;
}

function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

type AttendanceStatus = "Hadir" | "Tidak Hadir" | "Masih Ragu";
type AppMode = "invite" | "login" | "admin";
type AdminTab = "Dashboard" | "Acara" | "Mempelai" | "Media" | "Amplop" | "Tamu" | "RSVP" | "Ucapan" | "Tampilan";

type RsvpItem = {
  name: string;
  attendance: AttendanceStatus;
  createdAt: string;
};

type WishItem = {
  name: string;
  message: string;
  attendance: AttendanceStatus;
};

type GuestItem = {
  id: string;
  name: string;
  phone: string;
  sentAt?: string;
  status?: "Belum Dikirim" | "Terkirim" | "Gagal";
};

type WeddingData = {
  brand: string;
  theme: {
    primary: string;
    secondary: string;
    dark: string;
    light: string;
    border: string;
  };
  event: {
    guestName: string;
    groom: string;
    bride: string;
    title: string;
    dateText: string;
    dateISO: string;
    akadTime: string;
    receptionTime: string;
    venue: string;
    address: string;
    mapsUrl: string;
    whatsapp: string;
    quote: string;
    quoteSource: string;
    musicUrl: string;
    videoUrl: string;
  };
  profiles: {
    groomBio: string;
    brideBio: string;
  };
  gallery: string[];
  bank: {
    groomBankName: string;
    groomAccountNumber: string;
    groomAccountName: string;
    brideBankName: string;
    brideAccountNumber: string;
    brideAccountName: string;
  };
  fonnte: {
    token: string;
    countryCode: string;
    messageTemplate: string;
  };
  guests: GuestItem[];
  rsvp: RsvpItem[];
  wishes: WishItem[];
};

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
};

const STORAGE_KEY = "gittech-wedding-data";

const defaultData: WeddingData = {
  brand: "GitTech Invitation",
  theme: {
    primary: "#7DB7E8",
    secondary: "#DCEEFF",
    dark: "#23415A",
    light: "#FFFFFF",
    border: "#CFE4F7",
  },
  event: {
    guestName: "Bapak/Ibu/Saudara/i",
    groom: "Raka Pratama",
    bride: "Aulia Maharani",
    title: "The Wedding of",
    dateText: "Minggu, 21 Juni 2026",
    dateISO: "2026-06-21T09:00:00+07:00",
    akadTime: "09.00 WIB",
    receptionTime: "11.00 - 14.00 WIB",
    venue: "The Grand Ballroom, Jakarta",
    address: "Jl. Sudirman No. 88, Jakarta Pusat",
    mapsUrl: "https://maps.google.com",
    whatsapp: "6281234567890",
    quote:
      "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup agar kamu merasa tenteram kepadanya.",
    quoteSource: "QS. Ar-Rum: 21",
    musicUrl: "",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  profiles: {
    groomBio: "Putra dari Bapak Ahmad Pratama dan Ibu Siti Aminah.",
    brideBio: "Putri dari Bapak Hendra Wijaya dan Ibu Ratna Dewi.",
  },
  gallery: [
    "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop",
  ],
  bank: {
    groomBankName: "BCA",
    groomAccountNumber: "1234567890",
    groomAccountName: "Raka Pratama",
    brideBankName: "Mandiri",
    brideAccountNumber: "9876543210",
    brideAccountName: "Aulia Maharani",
  },
  fonnte: {
    token: "",
    countryCode: "62",
    messageTemplate:
      "Assalamu'alaikum {name}, dengan hormat kami mengundang Bapak/Ibu/Saudara/i untuk hadir di acara pernikahan {groom} & {bride}. Silakan buka undangan berikut: {link}",
  },
  guests: [
    { id: "guest-1", name: "Bapak Ahmad", phone: "6281234567890", status: "Belum Dikirim" },
    { id: "guest-2", name: "Ibu Sari", phone: "6289876543210", status: "Belum Dikirim" },
  ],
  rsvp: [],
  wishes: [
    {
      name: "Keluarga Besar",
      message: "Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.",
      attendance: "Hadir",
    },
  ],
};

function mergeWeddingData(raw: Partial<WeddingData>): WeddingData {
  return {
    ...defaultData,
    ...raw,
    theme: { ...defaultData.theme, ...(raw.theme || {}) },
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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? mergeWeddingData(JSON.parse(raw) as Partial<WeddingData>) : defaultData;
  } catch {
    return defaultData;
  }
}

function saveData(data: WeddingData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function Input({ label, value, onChange, placeholder, type = "text" }: InputProps) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder }: InputProps) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <textarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto mb-8 max-w-2xl text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-500">{eyebrow}</p>
      <h2 className="font-serif text-3xl text-slate-800 md:text-5xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">{subtitle}</p>}
    </div>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 42 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.75, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function FloatingPetals() {
  const petals = Array.from({ length: 18 }, (_, index) => index);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((item) => (
        <motion.span
          key={item}
          initial={{ opacity: 0, y: -40, x: `${(item * 17) % 100}vw`, rotate: 0 }}
          animate={{ opacity: [0, 0.55, 0], y: "105vh", rotate: 360 }}
          transition={{ duration: 8 + (item % 5), delay: item * 0.35, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 h-2.5 w-2.5 rounded-full bg-sky-200/70 shadow-[0_0_24px_rgba(125,183,232,0.5)]"
        />
      ))}
    </div>
  );
}

function normalizePhone(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, "");
  if (clean.startsWith("0")) return `62${clean.slice(1)}`;
  return clean;
}

function buildGuestInviteUrl(name: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set("to", name);
  return url.toString();
}

function buildWaMessage(data: WeddingData, guest: GuestItem): string {
  return data.fonnte.messageTemplate
    .replaceAll("{name}", guest.name)
    .replaceAll("{groom}", data.event.groom)
    .replaceAll("{bride}", data.event.bride)
    .replaceAll("{date}", data.event.dateText)
    .replaceAll("{venue}", data.event.venue)
    .replaceAll("{link}", buildGuestInviteUrl(guest.name));
}

function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const diff = Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  const items: Array<[number, string]> = [
    [days, "Hari"],
    [hours, "Jam"],
    [mins, "Menit"],
    [secs, "Detik"],
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map(([num, label], index) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20, scale: 0.94 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ y: -5, scale: 1.03 }}
          className="rounded-2xl border border-sky-100 bg-white/85 p-4 text-center shadow-sm shadow-sky-100/70 backdrop-blur"
        >
          <div className="text-2xl font-bold text-slate-800 md:text-4xl">{num}</div>
          <div className="mt-1 text-xs uppercase tracking-widest text-slate-500">{label}</div>
        </motion.div>
      ))}
    </div>
  );
}

function InvitationView({ data, setData }: { data: WeddingData; setData: React.Dispatch<React.SetStateAction<WeddingData>> }) {
  const [opened, setOpened] = useState<boolean>(false);
  const guestFromUrl = new URLSearchParams(window.location.search).get("to");
  const activeGuestName = guestFromUrl || data.event.guestName || "";
  const [rsvpName, setRsvpName] = useState<string>(activeGuestName);
  const [attendance, setAttendance] = useState<AttendanceStatus>("Hadir");
  const [wish, setWish] = useState<string>("");

  const shareText = `${data.event.title} ${data.event.groom} & ${data.event.bride} - ${data.event.dateText}`;

  const submitRsvp = () => {
    if (!rsvpName.trim()) return;
    const next: WeddingData = {
      ...data,
      rsvp: [{ name: rsvpName, attendance, createdAt: new Date().toISOString() }, ...data.rsvp],
      wishes: wish.trim() ? [{ name: rsvpName, message: wish, attendance }, ...data.wishes] : data.wishes,
    };
    setData(next);
    saveData(next);
    setWish("");
  };

  const shareInvite = async () => {
    if (navigator.share) {
      await navigator.share({ title: shareText, text: shareText, url: window.location.href });
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    alert("Link undangan berhasil disalin.");
  };

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-white via-sky-50 to-white text-slate-800">
      <AnimatePresence mode="wait">
        {!opened && (
          <motion.div
            key="cover"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white via-sky-50 to-blue-100 p-5 text-slate-800"
          >
            <FloatingPetals />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#dceeff,transparent_36%),radial-gradient(circle_at_bottom,#ffffff,transparent_32%)]" />
            <motion.div
              initial={{ y: 44, opacity: 0, scale: 0.94 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -28, opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="relative w-full max-w-xl rounded-[2rem] border border-white/80 bg-white/80 p-8 text-center shadow-2xl shadow-sky-200/60 backdrop-blur md:p-10"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-500 shadow-inner"
              >
                <Heart className="h-6 w-6" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, letterSpacing: "0.6em" }}
                animate={{ opacity: 1, letterSpacing: "0.32em" }}
                transition={{ delay: 0.15, duration: 0.85 }}
                className="mb-4 text-xs font-semibold uppercase text-sky-500"
              >
                Undangan Pernikahan
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.85 }}
                className="font-serif text-5xl leading-tight text-slate-800 md:text-7xl"
              >
                {data.event.groom} <span className="text-sky-500">&</span> {data.event.bride}
              </motion.h1>
              <p className="mt-6 text-sm uppercase tracking-[0.25em] text-slate-500">Kepada Yth.</p>
              <p className="mt-2 text-2xl font-semibold text-slate-700">{activeGuestName}</p>
              <Button
                onClick={() => setOpened(true)}
                className="mt-8 rounded-full bg-sky-500 px-8 py-6 text-white shadow-lg shadow-sky-200 hover:bg-sky-600"
              >
                <Heart className="mr-2 h-4 w-4" /> Buka Undangan
              </Button>
              <p className="mt-5 text-xs text-slate-500">Mohon maaf apabila terdapat kesalahan penulisan nama atau gelar.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {opened && data.event.musicUrl && <audio src={data.event.musicUrl} autoPlay loop />}

      <AnimatePresence mode="wait">
        {opened && (
          <motion.div
            key="invitation-content"
            initial={{ opacity: 0, y: 32, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 34, scale: 0.985, filter: "blur(8px)" }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-4 left-4 z-40">
              <Button onClick={() => setOpened(false)} className="rounded-full border border-sky-100 bg-white px-5 text-sky-600 shadow-xl shadow-sky-100 hover:bg-sky-50">
                Tutup Undangan
              </Button>
            </motion.div>

            <section className="relative overflow-hidden bg-gradient-to-br from-white via-sky-50 to-blue-100 px-5 py-20 text-slate-800 md:py-28">
              <FloatingPetals />
              <div className="relative mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
                <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.45em] text-sky-500">{data.event.title}</p>
                  <h1 className="font-serif text-6xl leading-tight text-slate-800 md:text-8xl">
                    {data.event.groom}
                    <br />
                    <span className="text-sky-500">&</span> {data.event.bride}
                  </h1>
                  <p className="mt-6 max-w-xl text-base leading-8 text-slate-600">{data.event.quote}</p>
                  <p className="mt-2 text-sm font-medium text-sky-600">{data.event.quoteSource}</p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button onClick={shareInvite} className="rounded-full bg-sky-500 px-6 text-white shadow-lg shadow-sky-200 hover:bg-sky-600">
                      <Share2 className="mr-2 h-4 w-4" /> Bagikan
                    </Button>
                    <a href={`https://wa.me/${data.event.whatsapp}`} target="_blank" rel="noreferrer">
                      <Button variant="outline" className="rounded-full border-sky-200 bg-white/70 px-6 text-sky-600 hover:bg-sky-50">
                        <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                      </Button>
                    </a>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, rotate: -1.5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  className="rounded-[2rem] border border-white/80 bg-white/60 p-3 shadow-2xl shadow-sky-200/60 backdrop-blur"
                >
                  <img src={data.gallery[0]} alt="Couple" className="h-[480px] w-full rounded-[1.5rem] object-cover" />
                </motion.div>
              </div>
            </section>

            <Reveal>
              <section className="px-5 py-16">
                <div className="mx-auto max-w-4xl">
                  <SectionTitle
                    eyebrow="Menuju Hari Bahagia"
                    title={data.event.dateText}
                    subtitle="Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu."
                  />
                  <Countdown target={data.event.dateISO} />
                </div>
              </section>
            </Reveal>

            <Reveal>
              <section className="bg-white px-5 py-16">
                <div className="mx-auto max-w-6xl">
                  <SectionTitle eyebrow="Mempelai" title="Bride & Groom" />
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
                      <CardContent className="p-8 text-center">
                        <h3 className="font-serif text-4xl text-slate-800">{data.event.groom}</h3>
                        <p className="mt-4 leading-7 text-slate-600">{data.profiles.groomBio}</p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
                      <CardContent className="p-8 text-center">
                        <h3 className="font-serif text-4xl text-slate-800">{data.event.bride}</h3>
                        <p className="mt-4 leading-7 text-slate-600">{data.profiles.brideBio}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </section>
            </Reveal>

            <Reveal>
              <section className="px-5 py-16">
                <div className="mx-auto max-w-6xl">
                  <SectionTitle eyebrow="Rangkaian Acara" title="Jadwal Pernikahan" />
                  <div className="grid gap-5 md:grid-cols-2">
                    <Card className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
                      <CardContent className="p-7">
                        <CalendarDays className="mb-4 h-8 w-8 text-sky-500" />
                        <h3 className="text-2xl font-semibold text-slate-800">Akad Nikah</h3>
                        <p className="mt-2 text-slate-600">
                          {data.event.dateText}, pukul {data.event.akadTime}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
                      <CardContent className="p-7">
                        <Users className="mb-4 h-8 w-8 text-sky-500" />
                        <h3 className="text-2xl font-semibold text-slate-800">Resepsi</h3>
                        <p className="mt-2 text-slate-600">
                          {data.event.dateText}, pukul {data.event.receptionTime}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <Card className="mt-5 rounded-3xl border-sky-100 bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xl shadow-sky-200">
                    <CardContent className="p-7">
                      <MapPin className="mb-4 h-8 w-8 text-white" />
                      <h3 className="text-2xl font-semibold">{data.event.venue}</h3>
                      <p className="mt-2 text-sky-50">{data.event.address}</p>
                      <a href={data.event.mapsUrl} target="_blank" rel="noreferrer">
                        <Button className="mt-5 rounded-full bg-white text-sky-600 hover:bg-sky-50">Buka Google Maps</Button>
                      </a>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </Reveal>

            <Reveal>
              <section className="bg-white px-5 py-16">
                <div className="mx-auto max-w-6xl">
                  <SectionTitle eyebrow="Galeri" title="Momen Bahagia" />
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {data.gallery.map((src, idx) => (
                      <motion.img
                        key={`${src}-${idx}`}
                        src={src}
                        alt={`Gallery ${idx + 1}`}
                        whileHover={{ scale: 1.035, y: -4 }}
                        className="h-64 w-full rounded-3xl object-cover shadow-sm shadow-sky-100 transition duration-500 hover:shadow-xl hover:shadow-sky-200"
                      />
                    ))}
                  </div>
                  <div className="mt-8 overflow-hidden rounded-3xl border border-sky-100 bg-sky-50 shadow-sm shadow-sky-100">
                    <iframe title="Wedding Video" src={data.event.videoUrl} className="aspect-video w-full" allowFullScreen />
                  </div>
                </div>
              </section>
            </Reveal>

            <Reveal>
              <section className="px-5 py-16">
                <div className="mx-auto max-w-5xl">
                  <SectionTitle
                    eyebrow="Wedding Gift"
                    title="Amplop Digital"
                    subtitle="Doa restu Bapak/Ibu/Saudara/i adalah hadiah terbaik bagi kami. Apabila ingin memberikan tanda kasih, dapat melalui amplop digital berikut."
                  />
                  <div className="relative grid gap-5 rounded-[2rem] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-blue-100 p-5 shadow-2xl shadow-sky-200/60 md:grid-cols-2 md:p-8">
                    {[
                      {
                        label: "Rekening Mempelai Pria",
                        bankName: data.bank.groomBankName,
                        accountNumber: data.bank.groomAccountNumber,
                        accountName: data.bank.groomAccountName,
                      },
                      {
                        label: "Rekening Mempelai Wanita",
                        bankName: data.bank.brideBankName,
                        accountNumber: data.bank.brideAccountNumber,
                        accountName: data.bank.brideAccountName,
                      },
                    ].map((account) => (
                      <motion.div
                        key={account.label}
                        whileHover={{ y: -4, scale: 1.01 }}
                        className="rounded-[1.7rem] border border-white/80 bg-white/85 p-6 shadow-xl shadow-sky-100 backdrop-blur"
                      >
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-600">
                          <Banknote className="h-4 w-4" /> {account.label}
                        </div>
                        <p className="text-sm uppercase tracking-[0.3em] text-sky-500">{account.bankName}</p>
                        <h3 className="mt-3 text-3xl font-bold tracking-wide text-slate-800 md:text-4xl">{account.accountNumber}</h3>
                        <p className="mt-3 text-slate-600">
                          a.n. <span className="font-semibold text-slate-800">{account.accountName}</span>
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                          <Button
                            onClick={() => navigator.clipboard.writeText(account.accountNumber)}
                            className="rounded-full bg-sky-500 px-5 text-white hover:bg-sky-600"
                          >
                            Salin Nomor
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(`${account.bankName} ${account.accountNumber} a.n. ${account.accountName}`)}
                            className="rounded-full border-sky-200 bg-white px-5 text-sky-600 hover:bg-sky-50"
                          >
                            Salin Detail
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            </Reveal>

            <Reveal>
              <section className="bg-gradient-to-br from-sky-500 to-blue-600 px-5 py-16 text-white">
                <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.9fr_1.1fr]">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-100">RSVP</p>
                    <h2 className="font-serif text-4xl md:text-5xl">Konfirmasi Kehadiran</h2>
                    <p className="mt-4 leading-7 text-sky-50">Kehadiran dan doa restu Bapak/Ibu/Saudara/i merupakan kehormatan bagi kami.</p>
                  </div>
                  <Card className="rounded-3xl border-white/60 bg-white text-slate-800 shadow-xl shadow-blue-700/10">
                    <CardContent className="space-y-4 p-7">
                      <Input label="Nama" value={rsvpName} onChange={setRsvpName} />
                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-slate-600">Kehadiran</span>
                        <select
                          value={attendance}
                          onChange={(event) => setAttendance(event.target.value as AttendanceStatus)}
                          className="w-full rounded-xl border border-sky-100 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        >
                          <option>Hadir</option>
                          <option>Tidak Hadir</option>
                          <option>Masih Ragu</option>
                        </select>
                      </label>
                      <Textarea label="Ucapan dan Doa" value={wish} onChange={setWish} placeholder="Tuliskan ucapan terbaik Anda" />
                      <Button onClick={submitRsvp} className="w-full rounded-full bg-sky-500 py-6 text-white hover:bg-sky-600">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Kirim Konfirmasi
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </Reveal>

            <Reveal>
              <section className="px-5 py-16">
                <div className="mx-auto max-w-4xl">
                  <SectionTitle eyebrow="Ucapan" title="Doa dari Tamu" />
                  <div className="space-y-4">
                    {data.wishes.map((item, idx) => (
                      <Card key={`${item.name}-${idx}`} className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="font-semibold text-slate-800">{item.name}</h4>
                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-700">{item.attendance}</span>
                          </div>
                          <p className="mt-3 text-slate-600">{item.message}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </section>
            </Reveal>

            <footer className="bg-white px-5 py-10 text-center text-sm text-slate-500">
              Dibuat dengan hormat oleh <span className="font-semibold text-sky-600">{data.brand}</span>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminPanel({
  data,
  setData,
  setMode,
}: {
  data: WeddingData;
  setData: React.Dispatch<React.SetStateAction<WeddingData>>;
  setMode: React.Dispatch<React.SetStateAction<AppMode>>;
}) {
  const [draft, setDraft] = useState<WeddingData>(data);
  const [active, setActive] = useState<AdminTab>("Acara");
  const [mobileMenu, setMobileMenu] = useState<boolean>(false);

  const stats = useMemo(
    () => ({
      guests: draft.guests.length,
      hadir: draft.rsvp.filter((item) => item.attendance === "Hadir").length,
      tidak: draft.rsvp.filter((item) => item.attendance === "Tidak Hadir").length,
      wishes: draft.wishes.length,
    }),
    [draft],
  );

  const update = (path: string, value: unknown) => {
    setDraft((prev) => {
      const next = structuredClone(prev) as WeddingData;
      const keys = path.split(".");
      let target: Record<string, unknown> = next as unknown as Record<string, unknown>;
      keys.slice(0, -1).forEach((key) => {
        target = target[key] as Record<string, unknown>;
      });
      target[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const persist = () => {
    setData(draft);
    saveData(draft);
    alert("Perubahan berhasil disimpan.");
  };

  const addGallery = () => {
    update("gallery", [
      ...draft.gallery,
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200&auto=format&fit=crop",
    ]);
  };

  const removeGallery = (idx: number) => update("gallery", draft.gallery.filter((_, itemIndex) => itemIndex !== idx));
  const deleteWish = (idx: number) => update("wishes", draft.wishes.filter((_, itemIndex) => itemIndex !== idx));

  const updateGuest = (idx: number, field: keyof Pick<GuestItem, "name" | "phone">, value: string) => {
    update(
      "guests",
      draft.guests.map((guest, itemIndex) =>
        itemIndex === idx ? { ...guest, [field]: value, status: guest.status || "Belum Dikirim" } : guest,
      ),
    );
  };

  const addGuest = () => {
    update("guests", [...draft.guests, { id: crypto.randomUUID(), name: "Nama Tamu", phone: "628", status: "Belum Dikirim" }]);
  };

  const deleteGuest = (idx: number) => update("guests", draft.guests.filter((_, itemIndex) => itemIndex !== idx));

  const importGuestsFromExcel = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    const importedGuests: GuestItem[] = rows
      .map((row, index) => {
        const name = String(row.nama || row.Nama || row.name || row.Name || "").trim();
        const phone = normalizePhone(
          String(row.wa || row.WA || row.whatsapp || row.WhatsApp || row.nomor || row.Nomor || row.phone || row.Phone || ""),
        );
        return name && phone ? { id: `import-${Date.now()}-${index}`, name, phone, status: "Belum Dikirim" as const } : null;
      })
      .filter(Boolean) as GuestItem[];

    if (!importedGuests.length) {
      alert("File tidak terbaca. Pastikan kolom Excel bernama nama dan wa/whatsapp/nomor.");
      return;
    }
    update("guests", [...draft.guests, ...importedGuests]);
  };

  const openWhatsappManual = (guest: GuestItem) => {
    const message = encodeURIComponent(buildWaMessage(draft, guest));
    window.open(`https://wa.me/${normalizePhone(guest.phone)}?text=${message}`, "_blank");
  };

  const sendViaFonnte = async (guest: GuestItem, idx: number) => {
    if (!draft.fonnte.token.trim()) {
      alert("Masukkan token Fonnte terlebih dahulu di bagian Tamu.");
      return;
    }

    try {
      const form = new FormData();
      form.append("target", normalizePhone(guest.phone));
      form.append("message", buildWaMessage(draft, guest));
      form.append("countryCode", draft.fonnte.countryCode || "62");

      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: { Authorization: draft.fonnte.token },
        body: form,
      });

      if (!response.ok) throw new Error("Gagal mengirim pesan");
      update(
        "guests",
        draft.guests.map((item, itemIndex) =>
          itemIndex === idx ? { ...item, sentAt: new Date().toISOString(), status: "Terkirim" } : item,
        ),
      );
      alert(`Undangan berhasil dikirim ke ${guest.name}.`);
    } catch {
      update("guests", draft.guests.map((item, itemIndex) => (itemIndex === idx ? { ...item, status: "Gagal" } : item)));
      alert("Gagal mengirim via Fonnte. Untuk produksi, sebaiknya request dikirim melalui backend agar token aman dan tidak terkendala CORS.");
    }
  };

  const menu: Array<[AdminTab, React.ElementType]> = [
    ["Dashboard", Settings],
    ["Acara", CalendarDays],
    ["Mempelai", Heart],
    ["Media", ImageIcon],
    ["Amplop", Banknote],
    ["Tamu", Users],
    ["RSVP", Users],
    ["Ucapan", MessageCircle],
    ["Tampilan", Palette],
  ];

  const Sidebar = () => (
    <div className="space-y-2">
      <div className="mb-6 rounded-3xl bg-white/10 p-4">
        <h2 className="text-xl font-bold text-white">GitTech Admin</h2>
        <p className="text-xs text-sky-100">Panel Undangan Pernikahan</p>
      </div>
      {menu.map(([name, Icon]) => (
        <button
          key={name}
          onClick={() => {
            setActive(name);
            setMobileMenu(false);
          }}
          className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
            active === name ? "bg-white text-sky-700 shadow-lg" : "text-sky-50 hover:bg-white/10"
          }`}
        >
          <Icon className="h-4 w-4" /> {name}
        </button>
      ))}
      <button onClick={() => setMode("invite")} className="mt-6 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-sky-50 hover:bg-white/10">
        <Eye className="h-4 w-4" /> Lihat Undangan
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800">
      <aside className="fixed left-0 top-0 hidden h-full w-72 bg-gradient-to-b from-sky-500 to-blue-700 p-5 lg:block">
        <Sidebar />
      </aside>

      <AnimatePresence>
        {mobileMenu && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-sky-500 to-blue-700 p-5 lg:hidden"
          >
            <button onClick={() => setMobileMenu(false)} className="mb-4 text-white">
              <X />
            </button>
            <Sidebar />
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sky-100 bg-white/90 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenu(true)} className="lg:hidden">
              <Menu />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{active}</h1>
              <p className="text-xs text-slate-500">Kelola semua konten undangan dari satu panel.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={persist} className="rounded-full bg-sky-500 hover:bg-sky-600">
              <Save className="mr-2 h-4 w-4" /> Simpan
            </Button>
            <Button variant="outline" onClick={() => setMode("login")} className="rounded-full border-sky-100 text-sky-600">
              <LogOut className="mr-2 h-4 w-4" /> Keluar
            </Button>
          </div>
        </header>

        <div className="p-5 md:p-8">
          {active === "Dashboard" && (
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["Total Tamu", stats.guests, Users],
                ["Hadir", stats.hadir, CheckCircle2],
                ["Tidak Hadir", stats.tidak, X],
                ["Ucapan", stats.wishes, MessageCircle],
              ].map(([label, value, Icon]) => {
                const DashboardIcon = Icon as React.ElementType;
                return (
                  <Card key={String(label)} className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
                    <CardContent className="p-6">
                      <DashboardIcon className="mb-4 h-7 w-7 text-sky-500" />
                      <p className="text-sm text-slate-500">{label}</p>
                      <h3 className="mt-1 text-3xl font-bold text-slate-800">{value}</h3>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {active === "Acara" && (
            <Card className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
              <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                <Input label="Nama Tamu Default" value={draft.event.guestName} onChange={(value) => update("event.guestName", value)} />
                <Input label="Judul" value={draft.event.title} onChange={(value) => update("event.title", value)} />
                <Input label="Tanggal Teks" value={draft.event.dateText} onChange={(value) => update("event.dateText", value)} />
                <Input label="Tanggal Countdown ISO" value={draft.event.dateISO} onChange={(value) => update("event.dateISO", value)} />
                <Input label="Jam Akad" value={draft.event.akadTime} onChange={(value) => update("event.akadTime", value)} />
                <Input label="Jam Resepsi" value={draft.event.receptionTime} onChange={(value) => update("event.receptionTime", value)} />
                <Input label="Venue" value={draft.event.venue} onChange={(value) => update("event.venue", value)} />
                <Input label="Alamat" value={draft.event.address} onChange={(value) => update("event.address", value)} />
                <Input label="Google Maps URL" value={draft.event.mapsUrl} onChange={(value) => update("event.mapsUrl", value)} />
                <Input label="WhatsApp Pengantin" value={draft.event.whatsapp} onChange={(value) => update("event.whatsapp", value)} />
                <div className="md:col-span-2">
                  <Textarea label="Quote" value={draft.event.quote} onChange={(value) => update("event.quote", value)} />
                </div>
              </CardContent>
            </Card>
          )}

          {active === "Mempelai" && (
            <Card className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
              <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                <Input label="Nama Mempelai Pria" value={draft.event.groom} onChange={(value) => update("event.groom", value)} />
                <Input label="Nama Mempelai Wanita" value={draft.event.bride} onChange={(value) => update("event.bride", value)} />
                <Textarea label="Bio Mempelai Pria" value={draft.profiles.groomBio} onChange={(value) => update("profiles.groomBio", value)} />
                <Textarea label="Bio Mempelai Wanita" value={draft.profiles.brideBio} onChange={(value) => update("profiles.brideBio", value)} />
              </CardContent>
            </Card>
          )}

          {active === "Media" && (
            <div className="space-y-5">
              <Card className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
                <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                  <Input label="URL Musik" value={draft.event.musicUrl} onChange={(value) => update("event.musicUrl", value)} />
                  <Input label="URL Video Embed" value={draft.event.videoUrl} onChange={(value) => update("event.videoUrl", value)} />
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">Galeri Foto</h3>
                    <Button onClick={addGallery} className="rounded-full bg-sky-500 hover:bg-sky-600">
                      <Plus className="mr-2 h-4 w-4" /> Tambah
                    </Button>
                  </div>
                  {draft.gallery.map((src, idx) => (
                    <div key={`${src}-${idx}`} className="grid gap-2 md:grid-cols-[1fr_auto]">
                      <Input
                        label={`Foto ${idx + 1}`}
                        value={src}
                        onChange={(value) => update("gallery", draft.gallery.map((item, itemIndex) => (itemIndex === idx ? value : item)))}
                      />
                      <Button variant="outline" onClick={() => removeGallery(idx)} className="self-end rounded-xl border-sky-100 text-sky-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {active === "Amplop" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
                <CardContent className="space-y-4 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">Rekening 1</p>
                  <h3 className="text-xl font-bold text-slate-800">Mempelai Pria</h3>
                  <Input label="Nama Bank" value={draft.bank.groomBankName} onChange={(value) => update("bank.groomBankName", value)} />
                  <Input label="Nomor Rekening" value={draft.bank.groomAccountNumber} onChange={(value) => update("bank.groomAccountNumber", value)} />
                  <Input label="Nama Pemilik Rekening" value={draft.bank.groomAccountName} onChange={(value) => update("bank.groomAccountName", value)} />
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
                <CardContent className="space-y-4 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">Rekening 2</p>
                  <h3 className="text-xl font-bold text-slate-800">Mempelai Wanita</h3>
                  <Input label="Nama Bank" value={draft.bank.brideBankName} onChange={(value) => update("bank.brideBankName", value)} />
                  <Input label="Nomor Rekening" value={draft.bank.brideAccountNumber} onChange={(value) => update("bank.brideAccountNumber", value)} />
                  <Input label="Nama Pemilik Rekening" value={draft.bank.brideAccountName} onChange={(value) => update("bank.brideAccountName", value)} />
                </CardContent>
              </Card>
            </div>
          )}

          {active === "Tamu" && (
            <div className="space-y-5">
              <Card className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
                <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                  <Input label="Token API Fonnte" value={draft.fonnte.token} onChange={(value) => update("fonnte.token", value)} placeholder="Masukkan token Fonnte" />
                  <Input label="Country Code" value={draft.fonnte.countryCode} onChange={(value) => update("fonnte.countryCode", value)} placeholder="62" />
                  <div className="md:col-span-2">
                    <Textarea
                      label="Template Pesan WhatsApp"
                      value={draft.fonnte.messageTemplate}
                      onChange={(value) => update("fonnte.messageTemplate", value)}
                      placeholder="Gunakan variabel {name}, {groom}, {bride}, {date}, {venue}, {link}"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Variabel tersedia: {"{name}"}, {"{groom}"}, {"{bride}"}, {"{date}"}, {"{venue}"}, {"{link}"}.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
                <CardContent className="space-y-4 p-6">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <h3 className="font-semibold text-slate-800">Daftar Tamu Undangan</h3>
                      <p className="text-sm text-slate-500">Import Excel/CSV dengan kolom: nama dan wa/whatsapp/nomor.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-600 hover:bg-sky-100">
                        Import Excel
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) importGuestsFromExcel(file);
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                      <Button onClick={addGuest} className="rounded-full bg-sky-500 hover:bg-sky-600">
                        <Plus className="mr-2 h-4 w-4" /> Tambah Tamu
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-sky-100">
                          <th className="p-3">Nama</th>
                          <th className="p-3">Nomor WhatsApp</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {draft.guests.map((guest, idx) => (
                          <tr key={guest.id} className="border-b border-sky-50 align-top">
                            <td className="p-3">
                              <input
                                value={guest.name}
                                onChange={(event) => updateGuest(idx, "name", event.target.value)}
                                className="w-full rounded-xl border border-sky-100 px-3 py-2 outline-none focus:border-sky-400"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                value={guest.phone}
                                onChange={(event) => updateGuest(idx, "phone", event.target.value)}
                                className="w-full rounded-xl border border-sky-100 px-3 py-2 outline-none focus:border-sky-400"
                              />
                            </td>
                            <td className="p-3">
                              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                                {guest.status || "Belum Dikirim"}
                              </span>
                              {guest.sentAt && <p className="mt-2 text-xs text-slate-500">{new Date(guest.sentAt).toLocaleString("id-ID")}</p>}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-2">
                                <Button onClick={() => openWhatsappManual(guest)} variant="outline" className="rounded-full border-sky-100 text-sky-600">
                                  Preview WA
                                </Button>
                                <Button onClick={() => sendViaFonnte(guest, idx)} className="rounded-full bg-sky-500 hover:bg-sky-600">
                                  Kirim WA
                                </Button>
                                <Button onClick={() => deleteGuest(idx)} variant="outline" className="rounded-full border-red-100 text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {active === "RSVP" && (
            <Card className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-sky-100">
                        <th className="p-3">Nama</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Waktu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft.rsvp.map((item, idx) => (
                        <tr key={`${item.name}-${idx}`} className="border-b border-sky-50">
                          <td className="p-3 font-medium">{item.name}</td>
                          <td className="p-3">{item.attendance}</td>
                          <td className="p-3 text-slate-500">{new Date(item.createdAt).toLocaleString("id-ID")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {draft.rsvp.length === 0 && <p className="py-10 text-center text-slate-500">Belum ada data RSVP.</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {active === "Ucapan" && (
            <div className="space-y-3">
              {draft.wishes.map((item, idx) => (
                <Card key={`${item.name}-${idx}`} className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
                  <CardContent className="flex items-start justify-between gap-4 p-5">
                    <div>
                      <h4 className="font-semibold text-slate-800">{item.name}</h4>
                      <p className="mt-2 text-sm text-slate-600">{item.message}</p>
                      <span className="mt-3 inline-block rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-700">{item.attendance}</span>
                    </div>
                    <Button variant="outline" onClick={() => deleteWish(idx)} className="rounded-xl border-sky-100 text-sky-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {active === "Tampilan" && (
            <Card className="rounded-3xl border-sky-100 bg-white shadow-sm shadow-sky-100">
              <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                <Input label="Nama Brand" value={draft.brand} onChange={(value) => update("brand", value)} />
                <Input label="Warna Utama" value={draft.theme.primary} onChange={(value) => update("theme.primary", value)} />
                <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-white via-sky-50 to-blue-100 p-8 text-slate-800 shadow-inner">
                  <p className="text-xs uppercase tracking-[0.35em] text-sky-500">Preview Tema</p>
                  <h3 className="mt-3 font-serif text-4xl">Putih & Biru Soft</h3>
                  <p className="mt-3 text-slate-600">Tema premium modern dengan kombinasi putih bersih, biru lembut, dan efek motion halus.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

function Login({ setMode }: { setMode: React.Dispatch<React.SetStateAction<AppMode>> }) {
  const [password, setPassword] = useState<string>("");

  const login = () => {
    if (password === "admin123") setMode("admin");
    else alert("Password demo: admin123");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-sky-50 to-blue-100 p-5">
      <Card className="w-full max-w-md rounded-3xl border-sky-100 bg-white/90 shadow-2xl shadow-sky-200/60 backdrop-blur">
        <CardContent className="p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-500">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Login Admin</h1>
            <p className="mt-2 text-sm text-slate-500">Masuk untuk mengelola undangan pernikahan.</p>
          </div>
          <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Masukkan password" />
          <Button onClick={login} className="mt-5 w-full rounded-full bg-sky-500 py-6 hover:bg-sky-600">
            Masuk Admin
          </Button>
          <p className="mt-4 text-center text-xs text-slate-500">
            Password demo: <b>admin123</b>
          </p>
          <Button variant="ghost" onClick={() => setMode("invite")} className="mt-3 w-full rounded-full text-sky-600">
            Lihat Undangan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<WeddingData>(loadData);
  const [mode, setMode] = useState<AppMode>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("admin") === "true" ? "login" : "invite";
  });

  return (
    <div>
      {mode === "invite" && <InvitationView data={data} setData={setData} />}
      {mode === "login" && <Login setMode={setMode} />}
      {mode === "admin" && <AdminPanel data={data} setData={setData} setMode={setMode} />}
    </div>
  );
}
