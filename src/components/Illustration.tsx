import type { IllustrationName } from "@/lib/schema";

// ชั้นผิวหนัง (ใช้ซ้ำในภาพแผลทุกระยะ)
const SkinBase = (
  <>
    <rect x="4" y="50" width="88" height="16" fill="#FBE0A8" />
    <rect x="4" y="30" width="88" height="20" fill="#F4B5A2" />
    <rect x="4" y="22" width="88" height="8" fill="#E59A84" />
    <rect x="4" y="22" width="88" height="44" fill="none" stroke="#D98F76" strokeWidth="1" />
  </>
);

function skin(overlay: React.ReactNode) {
  return (
    <svg width="92" height="68" viewBox="0 0 96 72" aria-hidden="true">
      {SkinBase}
      {overlay}
    </svg>
  );
}

export default function Illustration({ name }: { name?: IllustrationName }) {
  switch (name) {
    case "skin_layers":
      return skin(null);

    case "wound_clot":
      return skin(
        <>
          <path d="M40 22 L48 46 L56 22 Z" fill="#E24B4A" />
          <circle cx="46" cy="30" r="1.6" fill="#fff" />
          <circle cx="50" cy="35" r="1.6" fill="#fff" />
          <circle cx="48" cy="27" r="1.6" fill="#F7C1C1" />
          <path d="M48 9 q4 6 0 10 q-4 -4 0 -10 z" fill="#E24B4A" />
        </>,
      );

    case "wound_inflammation":
      return skin(
        <>
          <path d="M40 22 L48 44 L56 22 Z" fill="#F0A99B" />
          <path d="M32 21 q8 -6 16 0 M48 21 q8 -6 16 0" stroke="#E24B4A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <circle cx="35" cy="40" r="3" fill="#fff" stroke="#E0A0A0" strokeWidth="0.8" />
          <circle cx="35" cy="40" r="1" fill="#C97B9B" />
          <circle cx="60" cy="43" r="3" fill="#fff" stroke="#E0A0A0" strokeWidth="0.8" />
          <circle cx="60" cy="43" r="1" fill="#C97B9B" />
          <ellipse cx="66" cy="33" rx="3" ry="2" fill="#9FC459" stroke="#639922" strokeWidth="0.8" />
        </>,
      );

    case "wound_granulation":
      return skin(
        <>
          <path d="M38 30 q10 -9 20 0 q-1 15 -10 15 q-9 0 -10 -15 z" fill="#F2A6B4" stroke="#E68AA0" strokeWidth="1" />
          <path d="M45 42 v-7 M51 42 v-7" stroke="#E24B4A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <circle cx="48" cy="36" r="1.3" fill="#fff" />
          <path d="M30 26 l7 0 M37 26 l-2.5 -2 M37 26 l-2.5 2" stroke="#639922" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M66 26 l-7 0 M59 26 l2.5 -2 M59 26 l2.5 2" stroke="#639922" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>,
      );

    case "wound_scar":
      return skin(
        <>
          <rect x="43" y="19" width="10" height="4" rx="2" fill="#F2CDBE" stroke="#D98F76" strokeWidth="0.6" />
          <path d="M10 37 h76 M10 42 h76 M10 47 h76" stroke="#D98F76" strokeWidth="0.6" opacity="0.55" />
          <path d="M70 12 l1.3 3 3.2 0.6 -2.4 2.2 0.6 3.2 -2.7 -1.6 -2.7 1.6 0.6 -3.2 -2.4 -2.2 3.2 -0.6 z" fill="#F4C36B" />
        </>,
      );

    case "bacteria":
      return (
        <svg width="30" height="30" viewBox="0 0 26 26" aria-hidden="true">
          <rect x="4" y="9" width="18" height="8" rx="4" fill="#9FC459" stroke="#639922" strokeWidth="1.3" />
          <circle cx="10" cy="13" r="1.3" fill="#3B6D11" />
          <circle cx="16" cy="13" r="1.3" fill="#3B6D11" />
          <path d="M4 13 l-2 -2 M22 13 l2 2" stroke="#639922" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    case "virus":
      return (
        <svg width="30" height="30" viewBox="0 0 26 26" aria-hidden="true">
          <circle cx="13" cy="13" r="6" fill="#E8A0B4" stroke="#C24E73" strokeWidth="1.3" />
          <g stroke="#C24E73" strokeWidth="1.3" strokeLinecap="round">
            <path d="M13 7 v-3" />
            <path d="M13 19 v3" />
            <path d="M7 13 h-3" />
            <path d="M19 13 h3" />
            <path d="M8.8 8.8 l-2 -2" />
            <path d="M17.2 17.2 l2 2" />
            <path d="M17.2 8.8 l2 -2" />
            <path d="M8.8 17.2 l-2 2" />
          </g>
          <circle cx="11" cy="12" r="1" fill="#fff" />
          <circle cx="15" cy="14" r="1" fill="#fff" />
        </svg>
      );

    case "fungus":
      return (
        <svg width="30" height="30" viewBox="0 0 26 26" aria-hidden="true">
          <path d="M5 13 a8 7 0 0 1 16 0 z" fill="#F0B27A" stroke="#C97B2E" strokeWidth="1.3" strokeLinejoin="round" />
          <rect x="11" y="13" width="4" height="8" rx="1.5" fill="#F5D0A0" stroke="#C97B2E" strokeWidth="1.1" />
          <circle cx="10" cy="10" r="1.2" fill="#fff" />
          <circle cx="15" cy="9" r="1.2" fill="#fff" />
        </svg>
      );

    case "parasite":
      return (
        <svg width="30" height="30" viewBox="0 0 26 26" aria-hidden="true">
          <path d="M4 16 q3 -5 6 -2 q3 3 6 -1 q3 -4 6 -1" fill="none" stroke="#A88BD9" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="22" cy="11" r="2.6" fill="#C4ADE8" stroke="#7F77DD" strokeWidth="1.1" />
          <circle cx="21.3" cy="10.5" r="0.7" fill="#3C3489" />
        </svg>
      );

    case "thermometer":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <rect x="14" y="4" width="7" height="20" rx="3.5" fill="#fff" stroke="#E0A23C" strokeWidth="1.5" />
          <rect x="16" y="13" width="3" height="11" fill="#EF9F27" />
          <circle cx="17.5" cy="26" r="6" fill="#EF9F27" stroke="#BA7517" strokeWidth="1.5" />
          <circle cx="15" cy="24" r="1.4" fill="#fff" />
        </svg>
      );

    case "water_glass":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M9 7 h16 l-2 21 a2 2 0 0 1 -2 2 h-8 a2 2 0 0 1 -2 -2 z" fill="#fff" stroke="#8FBF5A" strokeWidth="1.5" />
          <path d="M10.4 16 h13.2 l-1.4 13 a1.5 1.5 0 0 1 -1.5 1.5 h-7.4 a1.5 1.5 0 0 1 -1.5 -1.5 z" fill="#9FD1E8" />
          <path d="M17 19 c2 -2.5 5 0 0 4 c-5 -4 -2 -6.5 0 -4 z" fill="#E24B4A" />
        </svg>
      );

    case "mask":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M6 12 q11 -5 22 0 v6 q-11 8 -22 0 z" fill="#CECBF6" stroke="#7F77DD" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M6 14 q11 4 22 0 M6 17 q11 4 22 0" stroke="#7F77DD" strokeWidth="1.1" fill="none" />
          <path d="M6 12 l-3 -3 M28 12 l3 -3" stroke="#7F77DD" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case "soap":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <rect x="7" y="14" width="20" height="13" rx="4" fill="#F7B8C6" stroke="#E892A6" strokeWidth="1.5" />
          <circle cx="12" cy="9" r="2" fill="#CFE8F5" stroke="#8FBFE0" strokeWidth="1" />
          <circle cx="18" cy="6" r="1.4" fill="#CFE8F5" stroke="#8FBFE0" strokeWidth="1" />
        </svg>
      );

    case "knee":
      return (
        <svg width="30" height="34" viewBox="0 0 40 50" aria-hidden="true">
          <rect x="14" y="3" width="12" height="18" rx="6" fill="#FFDFC8" stroke="#F0C3A6" strokeWidth="1.6" />
          <rect x="14" y="28" width="12" height="18" rx="6" fill="#FFDFC8" stroke="#F0C3A6" strokeWidth="1.6" />
          <circle cx="20" cy="25" r="9" fill="#FFD0B8" stroke="#F0C3A6" strokeWidth="1.6" />
          <rect x="11" y="22" width="18" height="5" rx="2.5" fill="#FBC6D2" stroke="#E89BB0" strokeWidth="1" />
          <path d="M31 16 l4 -2 M33 24 l4 0" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );

    case "pill":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <rect x="6" y="13" width="22" height="9" rx="4.5" fill="#F7B8C6" stroke="#C94F6D" strokeWidth="1.4" />
          <path d="M17 13.5 v8" stroke="#C94F6D" strokeWidth="1.2" />
          <rect x="6" y="13" width="11" height="9" rx="4.5" fill="#FCE2EA" stroke="#C94F6D" strokeWidth="1.4" />
        </svg>
      );

    case "bandage":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <rect x="5" y="13" width="24" height="9" rx="4.5" fill="#F7B8C6" stroke="#E892A6" strokeWidth="1.6" />
          <rect x="13" y="15" width="8" height="5" rx="1.5" fill="#FCE2EA" />
          <circle cx="16" cy="17.5" r="0.8" fill="#E892A6" />
          <circle cx="18.5" cy="17.5" r="0.8" fill="#E892A6" />
        </svg>
      );

    case "shield":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M17 4 l11 4 v8 c0 7 -5 11 -11 14 c-6 -3 -11 -7 -11 -14 v-8 z" fill="#CECBF6" stroke="#7F77DD" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 17 l4 4 7 -8" fill="none" stroke="#3C3489" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "dumbbell":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <circle cx="8" cy="17" r="5" fill="#97C459" stroke="#639922" strokeWidth="1.5" />
          <circle cx="26" cy="17" r="5" fill="#97C459" stroke="#639922" strokeWidth="1.5" />
          <rect x="12" y="15" width="10" height="4" rx="1" fill="#639922" />
          <rect x="3" y="13.5" width="3" height="7" rx="1.5" fill="#639922" />
          <rect x="28" y="13.5" width="3" height="7" rx="1.5" fill="#639922" />
        </svg>
      );

    case "weight":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M11 12 a6 6 0 0 1 12 0" fill="none" stroke="#378ADD" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 13 h18 l-2 15 a2 2 0 0 1 -2 1.8 h-10 a2 2 0 0 1 -2 -1.8 z" fill="#85B7EB" stroke="#378ADD" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );

    case "heart":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M17 29 C6 21 5 13 10 10 c3.5 -2 7 2 7 2 s3.5 -4 7 -2 c5 3 4 11 -7 17 Z" fill="#F4889E" stroke="#D85A7A" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M14 10 q-1 -4 -3 -5 M20 10 q1 -4 3 -5" fill="none" stroke="#D85A7A" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="14" cy="16" r="1.3" fill="#7a2c3e" /><circle cx="20" cy="16" r="1.3" fill="#7a2c3e" />
          <path d="M15 19 q2 2 4 0" fill="none" stroke="#7a2c3e" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="11.5" cy="18.5" r="1.4" fill="#FBC0CE" /><circle cx="22.5" cy="18.5" r="1.4" fill="#FBC0CE" />
        </svg>
      );

    case "lungs":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <rect x="15.5" y="4" width="3" height="9" rx="1.5" fill="#F7C0CC" stroke="#D87A92" strokeWidth="1" />
          <path d="M15.5 11 C9 11 7 19 9 25 C10 28 15 27 15 22 Z" fill="#F4A6B4" stroke="#D87A92" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M18.5 11 C25 11 27 19 25 25 C24 28 19 27 19 22 Z" fill="#F4A6B4" stroke="#D87A92" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="12.5" cy="20" r="1.1" fill="#a35468" /><circle cx="21.5" cy="20" r="1.1" fill="#a35468" />
        </svg>
      );

    case "brain":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M11 12 a6 6 0 0 1 12 0 a4 4 0 0 1 1 7 a5 5 0 0 1 -14 0 a4 4 0 0 1 1 -7 z" fill="#F7B8C6" stroke="#D87A92" strokeWidth="1.2" />
          <path d="M17 8 v17 M12 13 q3 1 0 4 M22 13 q-3 1 0 4" fill="none" stroke="#D87A92" strokeWidth="1" strokeLinecap="round" />
          <circle cx="14" cy="18" r="1.1" fill="#a35468" /><circle cx="20" cy="18" r="1.1" fill="#a35468" />
        </svg>
      );

    case "stomach":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M13 6 c0 5 -1 6 -3 9 c-3 5 1 12 7 12 c5 0 8 -4 7 -8 c-1 -3 -3 -3 -3 -6" fill="#F4B59A" stroke="#D8896A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="14" cy="19" r="1.2" fill="#8a5038" /><circle cx="19" cy="19" r="1.2" fill="#8a5038" />
          <path d="M15 22 q2 1.5 3.5 0" fill="none" stroke="#8a5038" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );

    case "kidney":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M20 6 c-7 0 -11 5 -11 11 c0 6 4 11 10 11 c4 0 5 -3 3 -5 c-3 -3 -3 -9 0 -12 c2 -2 1 -5 -2 -5 z" fill="#F4A6B4" stroke="#D87A92" strokeWidth="1.3" />
          <circle cx="15" cy="16" r="1.3" fill="#8a3a4e" /><circle cx="20" cy="16" r="1.3" fill="#8a3a4e" />
          <path d="M16 20 q2 1.5 4 0" fill="none" stroke="#8a3a4e" strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="12.5" cy="19" r="1.3" fill="#FBC0CE" />
        </svg>
      );

    case "bone":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <g transform="rotate(45 17 17)">
            <rect x="11" y="14" width="12" height="6" rx="3" fill="#FFF6E8" stroke="#E0C39A" strokeWidth="1.2" />
            <circle cx="11" cy="14.5" r="2.6" fill="#FFF6E8" stroke="#E0C39A" strokeWidth="1.2" />
            <circle cx="11" cy="19.5" r="2.6" fill="#FFF6E8" stroke="#E0C39A" strokeWidth="1.2" />
            <circle cx="23" cy="14.5" r="2.6" fill="#FFF6E8" stroke="#E0C39A" strokeWidth="1.2" />
            <circle cx="23" cy="19.5" r="2.6" fill="#FFF6E8" stroke="#E0C39A" strokeWidth="1.2" />
          </g>
        </svg>
      );

    case "tooth":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M11 9 c-3 0 -4 3 -3 8 c0.6 3 1 9 2.5 9 c1.6 0 1.4 -5 3.5 -5 c2.1 0 1.9 5 3.5 5 c1.5 0 1.9 -6 2.5 -9 c1 -5 0 -8 -3 -8 c-2 0 -3 1.2 -4.5 1.2 c-1.5 0 -2.5 -1.2 -4.5 -1.2 z" fill="#FFFFFF" stroke="#CFC4E0" strokeWidth="1.3" strokeLinejoin="round" />
          <circle cx="14" cy="15" r="1.1" fill="#9a8fb0" /><circle cx="19" cy="15" r="1.1" fill="#9a8fb0" />
          <path d="M15 18 q1.5 1.2 3 0" fill="none" stroke="#9a8fb0" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );

    case "intestine":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M8 25 c0 -4 4 -4 4 -8 c0 -4 -4 -4 -4 -8 M14 25 c0 -4 4 -4 4 -8 c0 -4 -4 -4 -4 -8 M20 25 c0 -4 4 -4 4 -8 c0 -4 -4 -4 -4 -8" fill="none" stroke="#F4A6B4" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "eye":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M5 17 q12 -10 24 0 q-12 10 -24 0 z" fill="#fff" stroke="#9CB8D8" strokeWidth="1.3" />
          <circle cx="17" cy="17" r="5" fill="#8FB8E0" stroke="#5A86B8" strokeWidth="1" />
          <circle cx="17" cy="17" r="2.3" fill="#33425a" />
          <circle cx="15.5" cy="15.5" r="1" fill="#fff" />
        </svg>
      );

    case "syringe":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <g transform="rotate(-40 17 17)">
            <rect x="7" y="14.5" width="13" height="5" rx="2" fill="#fff" stroke="#9CC4E0" strokeWidth="1.2" />
            <rect x="9" y="15" width="8" height="4" fill="#CFE8F5" />
            <rect x="4" y="13" width="3" height="8" rx="1" fill="#F4A6B4" />
            <rect x="20" y="16.2" width="4" height="1.6" fill="#9CC4E0" />
            <line x1="24" y1="17" x2="28" y2="17" stroke="#9CC4E0" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        </svg>
      );

    case "capsule":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <g transform="rotate(-35 17 17)">
            <rect x="8" y="13" width="18" height="8" rx="4" fill="#FBD9C0" stroke="#E0A87A" strokeWidth="1.2" />
            <path d="M17 13 v8" stroke="#E0A87A" strokeWidth="1" />
            <rect x="8" y="13" width="9" height="8" rx="4" fill="#F4A6B4" stroke="#D87A92" strokeWidth="1.2" />
          </g>
        </svg>
      );

    case "stethoscope":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M9 6 v6 a6 6 0 0 0 12 0 v-6" fill="none" stroke="#A6C8E8" strokeWidth="2" strokeLinecap="round" />
          <path d="M15 18 v4 a4 4 0 0 0 8 0" fill="none" stroke="#A6C8E8" strokeWidth="2" strokeLinecap="round" />
          <circle cx="9" cy="5" r="1.6" fill="#7AA6D8" /><circle cx="21" cy="5" r="1.6" fill="#7AA6D8" />
          <circle cx="24" cy="22" r="3.5" fill="#F4A6B4" stroke="#D87A92" strokeWidth="1.2" />
        </svg>
      );

    case "iv_bag":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M12 6 h10 v14 a2 2 0 0 1 -2 2 h-6 a2 2 0 0 1 -2 -2 z" fill="#E6F1FB" stroke="#9CC4E0" strokeWidth="1.3" />
          <path d="M12 13 h10 v7 a2 2 0 0 1 -2 2 h-6 a2 2 0 0 1 -2 -2 z" fill="#BFD9F0" />
          <line x1="17" y1="4" x2="17" y2="6" stroke="#9CC4E0" strokeWidth="1.4" />
          <line x1="17" y1="22" x2="17" y2="29" stroke="#9CC4E0" strokeWidth="1.2" />
          <circle cx="17" cy="29" r="1.4" fill="#E88B9A" />
        </svg>
      );

    case "medicine_bottle":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <rect x="12" y="5" width="10" height="4" rx="1" fill="#E0A87A" />
          <rect x="10" y="9" width="14" height="19" rx="3" fill="#F7C0CC" stroke="#D87A92" strokeWidth="1.3" />
          <rect x="13" y="14" width="8" height="9" rx="1.5" fill="#fff" />
          <path d="M17 16 v5 M14.5 18.5 h5" stroke="#D87A92" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );

    case "blood_drop":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M17 5 C12 13 9 17 9 21 a8 8 0 0 0 16 0 c0 -4 -3 -8 -8 -16 z" fill="#E88B9A" stroke="#C2566E" strokeWidth="1.3" />
          <circle cx="14.5" cy="20" r="1.3" fill="#fff" /><circle cx="19.5" cy="20" r="1.3" fill="#fff" />
          <path d="M15 23 q2 1.5 4 0" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    case "gloves":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M10 16 v-4 a1.2 1.2 0 0 1 2.4 0 v3 M12.4 15 v-7 a1.2 1.2 0 0 1 2.4 0 v6 M14.8 14 v-8 a1.2 1.2 0 0 1 2.4 0 v7 M17.2 14 v-7 a1.2 1.2 0 0 1 2.4 0 v6" fill="none" stroke="#7AA6D8" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19.6 13 v-1.5 a1.8 1.8 0 0 1 3.6 0 c0 2 -1.2 3 -2 4" fill="none" stroke="#7AA6D8" strokeWidth="1.1" />
          <path d="M9.5 14 h13 v7 a5 5 0 0 1 -5 5 h-3 a5 5 0 0 1 -5 -5 z" fill="#CFE8F5" stroke="#7AA6D8" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );

    case "nurse":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M9 30 a8 8 0 0 1 16 0 z" fill="#F7C0CC" stroke="#D87A92" strokeWidth="1.2" />
          <circle cx="17" cy="14" r="7" fill="#FFE0C2" stroke="#F0C3A6" strokeWidth="1.2" />
          <path d="M10 11 a7 7 0 0 1 14 0 z" fill="#F4A6B4" stroke="#D87A92" strokeWidth="1.2" />
          <rect x="15.5" y="6" width="3" height="3" fill="#fff" /><path d="M17 6.3 v2.4 M15.8 7.5 h2.4" stroke="#E88B9A" strokeWidth="0.9" />
          <circle cx="14.5" cy="15" r="1.1" fill="#7a5c46" /><circle cx="19.5" cy="15" r="1.1" fill="#7a5c46" />
          <path d="M15 17.5 q2 1.5 4 0" fill="none" stroke="#7a5c46" strokeWidth="1" strokeLinecap="round" />
          <circle cx="12.5" cy="16.5" r="1.3" fill="#FBC0CE" /><circle cx="21.5" cy="16.5" r="1.3" fill="#FBC0CE" />
        </svg>
      );

    case "person":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M8 30 a9 8 0 0 1 18 0 z" fill="#CECBF6" stroke="#9B95E0" strokeWidth="1.2" />
          <circle cx="17" cy="12" r="7" fill="#FFE0C2" stroke="#F0C3A6" strokeWidth="1.2" />
          <path d="M10 11 a7 7 0 0 1 14 0 q-3 -2 -7 -2 q-4 0 -7 2 z" fill="#8a6a4a" />
          <circle cx="14.5" cy="13" r="1.1" fill="#7a5c46" /><circle cx="19.5" cy="13" r="1.1" fill="#7a5c46" />
          <path d="M15 15.5 q2 1.5 4 0" fill="none" stroke="#7a5c46" strokeWidth="1" strokeLinecap="round" />
          <circle cx="12.5" cy="14.5" r="1.3" fill="#FBC0CE" /><circle cx="21.5" cy="14.5" r="1.3" fill="#FBC0CE" />
        </svg>
      );

    case "flower":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <g fill="#F7B8C6" stroke="#E08AA0" strokeWidth="1">
            <ellipse cx="17" cy="9" rx="3.2" ry="4.5" /><ellipse cx="17" cy="25" rx="3.2" ry="4.5" />
            <ellipse cx="9" cy="17" rx="4.5" ry="3.2" /><ellipse cx="25" cy="17" rx="4.5" ry="3.2" />
            <ellipse cx="11.5" cy="11.5" rx="3.6" ry="3.6" /><ellipse cx="22.5" cy="11.5" rx="3.6" ry="3.6" />
            <ellipse cx="11.5" cy="22.5" rx="3.6" ry="3.6" /><ellipse cx="22.5" cy="22.5" rx="3.6" ry="3.6" />
          </g>
          <circle cx="17" cy="17" r="4" fill="#FAD98A" stroke="#E0B85A" strokeWidth="1" />
        </svg>
      );

    case "star":
      return (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M17 5 l3.2 6.8 7.3 0.9 -5.4 5 1.5 7.3 -6.6 -3.6 -6.6 3.6 1.5 -7.3 -5.4 -5 7.3 -0.9 z" fill="#FAD98A" stroke="#E0B85A" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="14.5" cy="16" r="1" fill="#C99A30" /><circle cx="19.5" cy="16" r="1" fill="#C99A30" />
          <path d="M15 18.5 q2 1.2 4 0" fill="none" stroke="#C99A30" strokeWidth="0.9" strokeLinecap="round" />
        </svg>
      );

    case "heart_deco":
      return (
        <svg width="26" height="26" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M17 28 C5 19 4 11 9.5 9 c3.5 -1.3 7.5 2 7.5 2 s4 -3.3 7.5 -2 c5.5 2 4.5 10 -7.5 19 Z" fill="#F4889E" stroke="#D85A7A" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );

    case "leaf":
      return (
        <svg width="26" height="26" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M8 26 C8 14 16 7 26 7 C26 19 18 26 8 26 Z" fill="#B8DDA0" stroke="#7FA85A" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M10 24 Q18 16 24 9" fill="none" stroke="#7FA85A" strokeWidth="1" />
        </svg>
      );

    default:
      return null;
  }
}
