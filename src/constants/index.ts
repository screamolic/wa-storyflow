import type { Persona, Structure } from "@/src/types";

export const PERSONAS_GROUPED = {
  "Bisnis & Profesional": {
    "Brand Official": "Formal, sopan, berorientasi layanan, dan berwibawa.",
    "Pakar/Expert": "Informatif, percaya diri, menggunakan istilah teknis yang mudah dipahami.",
    "Sales/Marketer": "Persuasif, menonjolkan value/benefit, dan berorientasi pada konversi."
  },
  "Kasual & Hiburan": {
    "Bestie Santai": "Ramah, komunikatif, pakai bahasa gaul/slang ringan, dan banyak emoji.",
    "Hype & FOMO": "Energi tinggi, antusias, sering pakai huruf kapital untuk penekanan.",
    "Humoris/Savage": "Cerdas, jenaka, sarkas ringan, dan menghibur."
  },
  "Informasi & Edukasi": {
    "Mentor Edukasi": "Terstruktur, membimbing, sabar, dan memberikan tips berharga.",
    "Jurnalis Cepat": "Objektif, to the point, fokus pada fakta dan kecepatan informasi.",
    "Storyteller": "Naratif, memancing emosi, pandai mengatur alur cerita."
  },
  "Kritis & Analitis": {
    "Kritikus Tajam": "Sinis, analitis, berani, menggunakan data, fakta, dan pertanyaan retoris yang menohok.",
    "Pengamat Politik": "Kritis terhadap kebijakan, fokus pada intrik, spekulasi logis, dan dampak jangka panjang pada rakyat.",
    "Watchdog": "Sangat waspada, vokal terhadap ketidakadilan, gaya bicara provokatif namun berbasis data."
  }
};

export const PERSONA_TO_STRUCTURE_CATEGORIES: Record<string, string[]> = {
  "Bisnis & Profesional": ["Promosi & Sales (Bottom)", "Edukasi & Value (Mid)", "Update Singkat"],
  "Kasual & Hiburan": ["Engagement & Interaksi (Top)", "Update Singkat", "Edukasi & Value (Mid)"],
  "Informasi & Edukasi": ["Edukasi & Value (Mid)", "Engagement & Interaksi (Top)", "Update Singkat"],
  "Kritis & Analitis": ["Kritis & Investigatif", "Engagement & Interaksi (Top)", "Update Singkat"]
};

export const STRUCTURES_GROUPED = {
  "Engagement & Interaksi (Top)": {
    "Storytelling (Hook-Story-Offer)": "Mulai dari hook menarik, narasi pengalaman, lalu solusi.",
    "POV (Point of View)": "Gunakan sudut pandang relateable dengan audiens.",
    "Unpopular Opinion": "Opini kontroversial ringan untuk memancing reply/diskusi."
  },
  "Kritis & Investigatif": {
    "Analisa 5W+1H Kritis": "Bedah tuntas sebuah isu dari sisi yang jarang dibahas publik.",
    "Spekulasi Intrik": "Paparkan fakta, lalu tarik benang merah spekulatif tentang kemungkinan yang terjadi di balik layar.",
    "Rangkaian Pertanyaan": "Gunakan deretan pertanyaan retoris untuk membuat audiens berpikir kritis."
  },
  "Edukasi & Value (Mid)": {
    "Tips & Trik Listicle": "Poin-poin singkat yang bisa langsung dipraktekkan.",
    "Kesalahan Umum (DON'T DO)": "Daftar kesalahan yang sering terjadi beserta solusinya.",
    "Start & Stop": "Saran apa yang harus mulai dilakukan dan apa yang harus dihentikan."
  },
  "Promosi & Sales (Bottom)": {
    "Hard Selling (AIDA)": "Attention, Interest, Desire, dan Action yang sangat jelas.",
    "Promo Terbatas (Urgency)": "Menonjolkan kelangkaan, diskon, dan batas waktu.",
    "Social Proof / Testimoni": "Menceritakan keberhasilan atau kepuasan pelanggan lain."
  },
  "Update Singkat": {
    "Update Kilat": "Sangat singkat, 1 kalimat inti tanpa basa-basi.",
    "Breaking News": "Format mendesak dengan label [BREAKING NEWS] dan info penting."
  }
};

export const BG_COLORS = [
  "#000000", "#128C7E", "#075E54", "#34B7F1", "#25D366",
  "#746769", "#5E5E5E", "#8E44AD", "#2980B9", "#C0392B"
];

