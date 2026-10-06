# -*- coding: utf-8 -*-
"""Hand-crafted SVG visuals matching the site palette, used when a
generated JPG is unavailable. Each entry is a full <svg> document."""

COMMON_DEFS = """
<defs>
<linearGradient id="coral" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8659"/><stop offset="1" stop-color="#FF7A45"/></linearGradient>
<linearGradient id="purple" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B7FF0"/><stop offset="1" stop-color="#6C5CE7"/></linearGradient>
<linearGradient id="teal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#61FFF9"/><stop offset="1" stop-color="#00CEC9"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE29A"/><stop offset="1" stop-color="#FDCB6E"/></linearGradient>
<linearGradient id="cream" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF4F0"/><stop offset="1" stop-color="#FFEADC"/></linearGradient>
<linearGradient id="lavbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF4F0"/><stop offset=".55" stop-color="#FFEADC"/><stop offset="1" stop-color="#EDE9FF"/></linearGradient>
<linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFEADC"/><stop offset=".55" stop-color="#FFD9C4"/><stop offset="1" stop-color="#EDE9FF"/></linearGradient>
</defs>
"""

def wrap(inner, vb="0 0 1200 800"):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s" role="img">' % vb) + COMMON_DEFS + inner + "</svg>"

# ---------------------------------------------------------------- live class
LIVE_CLASS = wrap("""
<rect width="1200" height="800" fill="url(#lavbg)"/>
<circle cx="1080" cy="90" r="130" fill="#D2CCFF" opacity=".55"/>
<circle cx="90" cy="700" r="150" fill="#FFDBC9" opacity=".7"/>
<!-- main teacher tile -->
<rect x="120" y="110" width="640" height="420" rx="28" fill="url(#purple)"/>
<rect x="170" y="160" width="330" height="220" rx="14" fill="#FFFFFF" opacity=".92"/>
<rect x="195" y="190" width="220" height="14" rx="7" fill="#6C5CE7" opacity=".7"/>
<rect x="195" y="222" width="280" height="10" rx="5" fill="#B9B0F5"/>
<rect x="195" y="246" width="250" height="10" rx="5" fill="#B9B0F5"/>
<path d="M200 340 q60 -60 120 -14 q50 36 96 -22" stroke="#FF7A45" stroke-width="7" fill="none" stroke-linecap="round"/>
<circle cx="615" cy="330" r="72" fill="#FFD9B8"/>
<path d="M543 302 q20 -55 72 -55 q52 0 72 55 q-30 -22 -72 -22 q-42 0 -72 22z" fill="#4B240A"/>
<path d="M520 530 q20 -120 95 -120 q75 0 95 120z" fill="#FF7A45"/>
<circle cx="160" cy="150" r="14" fill="#B31B25"/>
<rect x="146" y="136" width="86" height="28" rx="14" fill="rgba(20,10,40,.45)"/>
<circle cx="160" cy="150" r="6" fill="#FB5151"/>
<!-- student tiles -->
<g>
<rect x="790" y="110" width="290" height="195" rx="22" fill="#FFFFFF"/>
<circle cx="935" cy="195" r="44" fill="#F2C094"/><path d="M890 178 q14 -34 45 -34 q31 0 45 34 q-18 -14 -45 -14 q-27 0 -45 14z" fill="#31265A"/><path d="M875 305 q12 -66 60 -66 q48 0 60 66z" fill="#00CEC9"/>
<rect x="1030" y="130" width="34" height="16" rx="8" fill="#61FFF9"/>
</g>
<g>
<rect x="790" y="335" width="290" height="195" rx="22" fill="#FFFFFF"/>
<circle cx="935" cy="420" r="44" fill="#FFD9B8"/><path d="M890 404 q14 -34 45 -34 q31 0 45 34 q-18 -14 -45 -14 q-27 0 -45 14z" fill="#A33702"/><path d="M875 530 q12 -66 60 -66 q48 0 60 66z" fill="#6C5CE7"/>
<rect x="988" y="352" width="70" height="26" rx="13" fill="url(#gold)"/>
<circle cx="1004" cy="365" r="7" fill="#fff"/><circle cx="1024" cy="365" r="7" fill="#fff"/><circle cx="1044" cy="365" r="7" fill="#fff"/>
</g>
<!-- raised hand tile -->
<g>
<rect x="120" y="560" width="290" height="180" rx="22" fill="#FFFFFF"/>
<circle cx="265" cy="655" r="42" fill="#E8B48C"/><path d="M222 640 q13 -32 43 -32 q30 0 43 32 q-17 -13 -43 -13 q-26 0 -43 13z" fill="#4B240A"/><path d="M208 740 q11 -62 57 -62 q46 0 57 62z" fill="#FF7A45"/>
<rect x="330" y="586" width="16" height="60" rx="8" fill="#E8B48C" transform="rotate(18 338 616)"/>
<circle cx="352" cy="586" r="13" fill="#E8B48C"/>
</g>
<!-- poll card -->
<g>
<rect x="440" y="560" width="320" height="180" rx="22" fill="#FFFFFF"/>
<rect x="470" y="588" width="150" height="14" rx="7" fill="#4B240A" opacity=".8"/>
<rect x="470" y="622" width="260" height="18" rx="9" fill="#F1E7DF"/><rect x="470" y="622" width="200" height="18" rx="9" fill="url(#coral)"/>
<rect x="470" y="654" width="260" height="18" rx="9" fill="#F1E7DF"/><rect x="470" y="654" width="130" height="18" rx="9" fill="url(#teal)"/>
<rect x="470" y="686" width="260" height="18" rx="9" fill="#F1E7DF"/><rect x="470" y="686" width="70" height="18" rx="9" fill="url(#purple)"/>
</g>
<!-- reactions -->
<circle cx="835" cy="610" r="34" fill="#FFEFE9"/><path d="M835 626 l-16 -15 a9 9 0 1 1 16 -11 a9 9 0 1 1 16 11z" fill="#FB5151"/>
<circle cx="920" cy="668" r="30" fill="#FFF9E6"/><path d="M920 652 l6 12 13 2 -9 9 2 13 -12 -6 -12 6 2 -13 -9 -9 13 -2z" fill="#FDCB6E"/>
<circle cx="1000" cy="612" r="32" fill="#E8FFFE"/><path d="M988 618 q12 14 24 0 M992 604 a4 4 0 1 0 .1 0 M1008 604 a4 4 0 1 0 .1 0" stroke="#006764" stroke-width="4" fill="none" stroke-linecap="round"/>
""")

# ---------------------------------------------------------------- mobile app
MOBILE_APP = wrap("""
<rect width="1200" height="800" fill="url(#cream)"/>
<circle cx="170" cy="140" r="120" fill="#D2CCFF" opacity=".5"/>
<circle cx="1050" cy="660" r="150" fill="#CCFCFA" opacity=".8"/>
<circle cx="1010" cy="120" r="60" fill="url(#gold)" opacity=".6"/>
<!-- phone 1 -->
<g transform="rotate(-6 380 400)">
<rect x="220" y="90" width="330" height="640" rx="44" fill="#4B240A"/>
<rect x="234" y="104" width="302" height="612" rx="34" fill="#FFF8F4"/>
<rect x="234" y="104" width="302" height="96" rx="34" fill="url(#coral)"/>
<rect x="234" y="160" width="302" height="40" fill="url(#coral)"/>
<circle cx="272" cy="152" r="18" fill="#FFF4F0"/>
<rect x="304" y="138" width="130" height="12" rx="6" fill="#FFFFFF" opacity=".9"/>
<rect x="304" y="158" width="90" height="9" rx="4" fill="#FFDBC9"/>
<rect x="258" y="222" width="254" height="110" rx="20" fill="#FFFFFF"/>
<circle cx="302" cy="277" r="30" fill="#F1E7DF"/><path d="M290 282 l9 9 16 -18" stroke="#FF7A45" stroke-width="6" fill="none" stroke-linecap="round"/>
<rect x="348" y="252" width="140" height="12" rx="6" fill="#4B240A" opacity=".75"/>
<rect x="348" y="274" width="110" height="9" rx="4" fill="#B08968" opacity=".5"/>
<rect x="348" y="292" width="80" height="16" rx="8" fill="rgba(255,122,69,.18)"/>
<rect x="258" y="352" width="254" height="110" rx="20" fill="#FFFFFF"/>
<circle cx="302" cy="407" r="30" fill="rgba(108,92,231,.14)"/><path d="M290 412 l9 9 16 -18" stroke="#6C5CE7" stroke-width="6" fill="none" stroke-linecap="round"/>
<rect x="348" y="382" width="130" height="12" rx="6" fill="#4B240A" opacity=".75"/>
<rect x="348" y="404" width="100" height="9" rx="4" fill="#B08968" opacity=".5"/>
<rect x="348" y="422" width="96" height="16" rx="8" fill="rgba(108,92,231,.16)"/>
<!-- progress rings -->
<g transform="translate(320 570)"><circle r="52" fill="none" stroke="#F1E7DF" stroke-width="14"/><circle r="52" fill="none" stroke="#FF7A45" stroke-width="14" stroke-linecap="round" stroke-dasharray="245 327" transform="rotate(-90)"/></g>
<g transform="translate(450 570)"><circle r="52" fill="none" stroke="#F1E7DF" stroke-width="14"/><circle r="52" fill="none" stroke="#00CEC9" stroke-width="14" stroke-linecap="round" stroke-dasharray="180 327" transform="rotate(-90)"/></g>
<rect x="250" y="652" width="270" height="44" rx="22" fill="url(#purple)"/>
</g>
<!-- phone 2 -->
<g transform="rotate(6 820 410)">
<rect x="650" y="110" width="330" height="620" rx="44" fill="#31265A"/>
<rect x="664" y="124" width="302" height="592" rx="34" fill="#FFFFFF"/>
<rect x="664" y="124" width="302" height="86" rx="34" fill="url(#purple)"/>
<rect x="664" y="172" width="302" height="38" fill="url(#purple)"/>
<rect x="692" y="150" width="150" height="13" rx="6" fill="#FFFFFF" opacity=".9"/>
<rect x="692" y="228" width="246" height="52" rx="16" fill="#F5F1FF" stroke="#D2CCFF" stroke-width="2"/>
<circle cx="720" cy="254" r="11" fill="#6C5CE7"/>
<rect x="744" y="248" width="160" height="12" rx="6" fill="#815032" opacity=".6"/>
<rect x="692" y="294" width="246" height="52" rx="16" fill="#FFFFFF" stroke="#6C5CE7" stroke-width="3"/>
<circle cx="720" cy="320" r="11" fill="#FF7A45"/>
<rect x="744" y="314" width="140" height="12" rx="6" fill="#815032" opacity=".6"/>
<rect x="692" y="360" width="246" height="52" rx="16" fill="#F5F1FF" stroke="#D2CCFF" stroke-width="2"/>
<circle cx="720" cy="386" r="11" fill="#00CEC9"/>
<rect x="744" y="380" width="150" height="12" rx="6" fill="#815032" opacity=".6"/>
<!-- podium -->
<rect x="700" y="560" width="70" height="90" rx="10" fill="url(#gold)"/>
<rect x="780" y="520" width="74" height="130" rx="10" fill="url(#coral)"/>
<rect x="864" y="580" width="70" height="70" rx="10" fill="url(#teal)"/>
<circle cx="735" cy="530" r="17" fill="#FFD9B8"/><circle cx="817" cy="488" r="18" fill="#F2C094"/><circle cx="899" cy="552" r="16" fill="#E8B48C"/>
<path d="M817 462 l5 10 11 2 -8 8 2 11 -10 -5 -10 5 2 -11 -8 -8 11 -2z" fill="#FDCB6E"/>
</g>
""")

# ---------------------------------------------------------------- blockchain
BLOCKCHAIN = wrap("""
<rect width="1200" height="800" fill="url(#lavbg)"/>
<circle cx="1060" cy="130" r="140" fill="#CCFCFA" opacity=".7"/>
<circle cx="140" cy="660" r="150" fill="#D2CCFF" opacity=".55"/>
<!-- certificate -->
<g transform="rotate(-3 600 400)">
<rect x="220" y="180" width="640" height="440" rx="26" fill="#FFFFFF"/>
<rect x="244" y="204" width="592" height="392" rx="18" fill="none" stroke="#FDCB6E" stroke-width="4" stroke-dasharray="2 10"/>
<circle cx="540" cy="300" r="42" fill="url(#gold)"/>
<circle cx="540" cy="300" r="28" fill="#FFF9E6"/>
<path d="M540 284 l7 14 15 2 -11 11 3 15 -14 -7 -14 7 3 -15 -11 -11 15 -2z" fill="#FDCB6E"/>
<rect x="380" y="376" width="320" height="16" rx="8" fill="#4B240A" opacity=".8"/>
<rect x="330" y="412" width="420" height="10" rx="5" fill="#B08968" opacity=".45"/>
<rect x="360" y="436" width="360" height="10" rx="5" fill="#B08968" opacity=".45"/>
<path d="M300 520 q30 -26 60 0 q-30 20 -60 0z" fill="#6C5CE7" opacity=".8"/>
<path d="M720 520 q30 -26 60 0 q-30 20 -60 0z" fill="#FF7A45" opacity=".8"/>
<circle cx="760" cy="540" r="34" fill="url(#coral)"/>
<path d="M748 540 l9 9 16 -18" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>
</g>
<!-- shield -->
<g>
<path d="M890 300 l110 40 v120 q0 96 -110 140 q-110 -44 -110 -140 v-120z" fill="url(#teal)" stroke="#006764" stroke-width="6"/>
<path d="M846 428 l32 32 58 -66" stroke="#FFFFFF" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<!-- chain links -->
<g stroke="#6C5CE7" stroke-width="10" fill="none">
<rect x="180" y="560" width="74" height="44" rx="22" transform="rotate(-18 217 582)"/>
<rect x="248" y="586" width="74" height="44" rx="22" transform="rotate(-18 285 608)"/>
<rect x="316" y="612" width="74" height="44" rx="22" transform="rotate(-18 353 634)"/>
</g>
<!-- QR badge -->
<g transform="translate(960 560)">
<rect x="0" y="0" width="150" height="150" rx="20" fill="#FFFFFF"/>
<rect x="18" y="18" width="34" height="34" rx="6" fill="#31265A"/><rect x="98" y="18" width="34" height="34" rx="6" fill="#31265A"/><rect x="18" y="98" width="34" height="34" rx="6" fill="#31265A"/>
<rect x="66" y="24" width="16" height="16" fill="#6C5CE7"/><rect x="66" y="52" width="16" height="16" fill="#FF7A45"/><rect x="98" y="66" width="16" height="16" fill="#31265A"/><rect x="66" y="84" width="16" height="16" fill="#31265A"/><rect x="98" y="98" width="34" height="34" rx="6" fill="#00CEC9"/><rect x="24" y="66" width="16" height="16" fill="#FDCB6E"/>
</g>
<!-- padlock -->
<g transform="translate(120 180)">
<rect x="0" y="40" width="96" height="78" rx="18" fill="url(#purple)"/>
<path d="M20 44 v-16 a28 28 0 0 1 56 0 v16" stroke="#6C5CE7" stroke-width="12" fill="none"/>
<circle cx="48" cy="76" r="11" fill="#FFF4F0"/>
</g>
""")

# ---------------------------------------------------------------- wellbeing
WELLBEING = wrap("""
<rect width="1200" height="800" fill="url(#cream)"/>
<circle cx="1090" cy="120" r="130" fill="#CCFCFA" opacity=".8"/>
<circle cx="110" cy="690" r="140" fill="#EDE9FF"/>
<!-- mood cards -->
<g>
<rect x="90" y="120" width="230" height="230" rx="30" fill="#FFFFFF"/>
<circle cx="205" cy="212" r="58" fill="url(#gold)"/>
<circle cx="185" cy="200" r="7" fill="#4B240A"/><circle cx="225" cy="200" r="7" fill="#4B240A"/>
<path d="M180 226 q25 22 50 0" stroke="#4B240A" stroke-width="6" fill="none" stroke-linecap="round"/>
<rect x="140" y="296" width="130" height="16" rx="8" fill="#F1E7DF"/>
</g>
<g>
<rect x="350" y="120" width="230" height="230" rx="30" fill="#FFFFFF"/>
<circle cx="465" cy="212" r="58" fill="url(#teal)"/>
<circle cx="445" cy="202" r="7" fill="#004B49"/><circle cx="485" cy="202" r="7" fill="#004B49"/>
<path d="M443 228 q22 12 44 0" stroke="#004B49" stroke-width="6" fill="none" stroke-linecap="round"/>
<rect x="400" y="296" width="130" height="16" rx="8" fill="#F1E7DF"/>
</g>
<g>
<rect x="610" y="120" width="230" height="230" rx="30" fill="#FFFFFF"/>
<circle cx="725" cy="212" r="58" fill="url(#coral)"/>
<circle cx="705" cy="202" r="7" fill="#4B240A"/><circle cx="745" cy="202" r="7" fill="#4B240A"/>
<path d="M705 232 q20 8 40 0" stroke="#4B240A" stroke-width="6" fill="none" stroke-linecap="round"/>
<rect x="660" y="296" width="130" height="16" rx="8" fill="#F1E7DF"/>
</g>
<g>
<rect x="870" y="120" width="230" height="230" rx="30" fill="#FFFFFF"/>
<circle cx="985" cy="212" r="58" fill="url(#purple)"/>
<circle cx="965" cy="204" r="7" fill="#31265A"/><circle cx="1005" cy="204" r="7" fill="#31265A"/>
<path d="M963 230 q22 16 44 0" stroke="#31265A" stroke-width="6" fill="none" stroke-linecap="round"/>
<rect x="920" y="296" width="130" height="16" rx="8" fill="#F1E7DF"/>
</g>
<!-- stress gauge -->
<g transform="translate(330 620)">
<path d="M-190 0 A190 190 0 0 1 190 0" fill="none" stroke="#F1E7DF" stroke-width="40" stroke-linecap="round"/>
<path d="M-190 0 A190 190 0 0 1 0 -190" fill="none" stroke="url(#teal)" stroke-width="40" stroke-linecap="round"/>
<path d="M0 -190 A190 190 0 0 1 134 -134" fill="none" stroke="url(#gold)" stroke-width="40" stroke-linecap="round"/>
<path d="M134 -134 A190 190 0 0 1 190 0" fill="none" stroke="url(#coral)" stroke-width="40" stroke-linecap="round"/>
<line x1="0" y1="0" x2="92" y2="-118" stroke="#4B240A" stroke-width="10" stroke-linecap="round"/>
<circle r="20" fill="#4B240A"/>
</g>
<!-- lotus -->
<g transform="translate(760 620)">
<path d="M0 40 q-70 -20 -84 -92 q72 6 84 92z" fill="#61FFF9" opacity=".8"/>
<path d="M0 40 q70 -20 84 -92 q-72 6 -84 92z" fill="#00CEC9" opacity=".8"/>
<path d="M0 44 q-40 -60 0 -130 q40 70 0 130z" fill="#006764" opacity=".85"/>
<ellipse cx="0" cy="52" rx="70" ry="16" fill="#006764" opacity=".3"/>
</g>
<!-- chat bubble -->
<g transform="translate(930 470)">
<rect x="0" y="0" width="210" height="120" rx="26" fill="#FFFFFF"/>
<path d="M40 118 l-8 34 40 -32z" fill="#FFFFFF"/>
<circle cx="60" cy="60" r="12" fill="#FF7A45"/><circle cx="105" cy="60" r="12" fill="#6C5CE7"/><circle cx="150" cy="60" r="12" fill="#00CEC9"/>
</g>
""")

# ---------------------------------------------------------------- career
CAREER = wrap("""
<rect width="1200" height="800" fill="url(#lavbg)"/>
<circle cx="1050" cy="640" r="170" fill="#FFDBC9" opacity=".7"/>
<circle cx="150" cy="130" r="110" fill="#D2CCFF" opacity=".6"/>
<!-- winding path -->
<path d="M150 690 C 320 640 260 470 450 430 C 660 386 600 260 810 220 C 900 202 970 200 1040 200" stroke="#FFFFFF" stroke-width="86" fill="none" stroke-linecap="round"/>
<path d="M150 690 C 320 640 260 470 450 430 C 660 386 600 260 810 220 C 900 202 970 200 1040 200" stroke="#DD9F7C" stroke-width="6" stroke-dasharray="4 26" fill="none" stroke-linecap="round"/>
<!-- student -->
<g transform="translate(120 560)">
<circle cx="40" cy="30" r="30" fill="#FFD9B8"/><path d="M10 22 q10 -24 30 -24 q20 0 30 24 q-13 -10 -30 -10 q-17 0 -30 10z" fill="#4B240A"/>
<path d="M4 130 q8 -70 36 -70 q28 0 36 70z" fill="#FF7A45"/>
<rect x="58" y="66" width="30" height="44" rx="10" fill="#6C5CE7"/>
</g>
<!-- signposts -->
<g transform="translate(430 300)">
<rect x="-8" y="0" width="16" height="180" rx="8" fill="#815032"/>
<g transform="translate(0 16)"><path d="M0 0 h120 l26 20 -26 20 h-120z" fill="url(#coral)"/><circle cx="26" cy="20" r="11" fill="#FFF4F0"/></g>
<g transform="translate(0 66) scale(-1 1)"><path d="M0 0 h120 l26 20 -26 20 h-120z" fill="url(#purple)"/><circle cx="26" cy="20" r="11" fill="#F0EEFF"/></g>
<g transform="translate(0 116)"><path d="M0 0 h120 l26 20 -26 20 h-120z" fill="url(#teal)"/><circle cx="26" cy="20" r="11" fill="#E8FFFE"/></g>
</g>
<!-- flask, palette, chip icons floating -->
<g transform="translate(270 170)"><path d="M26 0 h28 v26 l26 46 a16 16 0 0 1 -14 24 h-52 a16 16 0 0 1 -14 -24 l26 -46z" fill="url(#teal)"/><circle cx="40" cy="72" r="7" fill="#fff" opacity=".8"/></g>
<g transform="translate(640 90)"><ellipse rx="42" ry="32" fill="url(#gold)"/><circle cx="-18" cy="-6" r="7" fill="#B31B25"/><circle cx="4" cy="-14" r="7" fill="#6C5CE7"/><circle cx="22" cy="0" r="7" fill="#006764"/><circle cx="14" cy="16" r="9" fill="#FFF4F0"/></g>
<g transform="translate(870 90)"><rect x="-26" y="-26" width="52" height="52" rx="10" fill="url(#purple)"/><g stroke="#6C5CE7" stroke-width="5"><line x1="-26" y1="-10" x2="-38" y2="-10"/><line x1="-26" y1="10" x2="-38" y2="10"/><line x1="26" y1="-10" x2="38" y2="-10"/><line x1="26" y1="10" x2="38" y2="10"/><line x1="-10" y1="-26" x2="-10" y2="-38"/><line x1="10" y1="-26" x2="10" y2="-38"/></g><circle r="10" fill="#D2CCFF"/></g>
<!-- college + rocket -->
<g transform="translate(950 130)">
<path d="M0 60 L80 10 L160 60z" fill="url(#coral)"/>
<rect x="6" y="60" width="148" height="14" fill="#FF7A45"/>
<rect x="18" y="74" width="18" height="60" fill="#FFDBC9"/><rect x="52" y="74" width="18" height="60" fill="#FFDBC9"/><rect x="88" y="74" width="18" height="60" fill="#FFDBC9"/><rect x="124" y="74" width="18" height="60" fill="#FFDBC9"/>
<rect x="0" y="134" width="160" height="16" rx="6" fill="#A33702"/>
</g>
<g transform="translate(1105 330) rotate(28)">
<path d="M0 -60 q30 34 30 78 l-30 22 l-30 -22 q0 -44 30 -78z" fill="url(#purple)"/>
<circle cy="-16" r="14" fill="#D2CCFF"/>
<path d="M-30 18 l-22 26 24 -4z" fill="#FF7A45"/><path d="M30 18 l22 26 -24 -4z" fill="#FF7A45"/>
<path d="M0 44 q10 22 0 40 q-10 -18 0 -40z" fill="url(#gold)"/>
</g>
<path d="M1040 430 q30 -40 60 -80" stroke="#6C5CE7" stroke-width="5" stroke-dasharray="3 16" fill="none" stroke-linecap="round"/>
""")

# ---------------------------------------------------------------- peer
PEER = wrap("""
<rect width="1200" height="800" fill="url(#cream)"/>
<circle cx="1080" cy="140" r="130" fill="#CCFCFA" opacity=".8"/>
<circle cx="120" cy="660" r="140" fill="#FFDBC9" opacity=".75"/>
<!-- desk -->
<rect x="240" y="520" width="720" height="30" rx="15" fill="#DD9F7C"/>
<rect x="290" y="550" width="26" height="150" rx="10" fill="#B08968"/>
<rect x="884" y="550" width="26" height="150" rx="10" fill="#B08968"/>
<!-- open book -->
<g transform="translate(600 470)">
<path d="M-120 40 q60 -26 120 -6 q60 -20 120 6 l0 24 q-60 -22 -120 -2 q-60 -20 -120 2z" fill="#FFFFFF" stroke="#D2CCFF" stroke-width="3"/>
<path d="M0 34 l0 28" stroke="#6C5CE7" stroke-width="4"/>
<rect x="-96" y="44" width="70" height="6" rx="3" fill="#B9B0F5"/><rect x="30" y="44" width="70" height="6" rx="3" fill="#B9B0F5"/>
</g>
<!-- tutor (left, explaining with pencil) -->
<g transform="translate(380 300)">
<circle cx="0" cy="40" r="52" fill="#F2C094"/>
<path d="M-52 26 q12 -44 52 -44 q40 0 52 44 q-20 -18 -52 -18 q-32 0 -52 18z" fill="#31265A"/>
<circle cx="-18" cy="42" r="6" fill="#4B240A"/><circle cx="18" cy="42" r="6" fill="#4B240A"/>
<path d="M-14 62 q14 12 28 0" stroke="#4B240A" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M-70 220 q10 -120 70 -120 q60 0 70 120z" fill="#FF7A45"/>
<g transform="translate(96 -20) rotate(35)"><rect x="0" y="0" width="16" height="96" rx="8" fill="#E8B48C"/><path d="M4 -34 l8 0 8 34 -8 12 -8 -12z" fill="#FDCB6E"/><path d="M8 -46 l4 12 -8 0z" fill="#4B240A"/></g>
</g>
<!-- learner (right) -->
<g transform="translate(820 300)">
<circle cx="0" cy="40" r="52" fill="#FFD9B8"/>
<path d="M-52 30 q8 -46 52 -46 q44 0 52 46 q-14 -20 -52 -20 q-38 0 -52 20z" fill="#A33702"/>
<path d="M-44 12 q52 -26 96 6" stroke="#A33702" stroke-width="14" fill="none" stroke-linecap="round"/>
<circle cx="-18" cy="44" r="6" fill="#4B240A"/><circle cx="18" cy="44" r="6" fill="#4B240A"/>
<path d="M-12 64 q12 10 26 0" stroke="#4B240A" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M-70 220 q10 -120 70 -120 q60 0 70 120z" fill="#00CEC9"/>
<rect x="-96" y="120" width="16" height="70" rx="8" fill="#E8B48C" transform="rotate(20 -88 155)"/>
</g>
<!-- floating kudos badges -->
<g transform="translate(300 120)">
<circle r="46" fill="#FFEFE9"/><path d="M0 22 l-22 -20 a12 12 0 1 1 22 -15 a12 12 0 1 1 22 15z" fill="#FB5151"/>
</g>
<g transform="translate(600 96)">
<circle r="42" fill="#FFF9E6"/><path d="M0 -24 l8 16 18 3 -13 13 3 18 -16 -8 -16 8 3 -18 -13 -13 18 -3z" fill="#FDCB6E"/>
</g>
<g transform="translate(900 120)">
<circle r="46" fill="#E8FFFE"/><rect x="-14" y="-22" width="20" height="34" rx="10" fill="#006764"/><path d="M6 6 q22 -4 22 14 l-30 6 q-16 2 -16 -12 l0 -6z" fill="#00CEC9"/>
</g>
<g transform="translate(1020 300)"><circle r="30" fill="#F0EEFF"/><path d="M-12 4 l9 9 16 -18" stroke="#6C5CE7" stroke-width="6" fill="none" stroke-linecap="round"/></g>
<g transform="translate(180 320)"><circle r="26" fill="#FFF4F0" stroke="#FF7A45" stroke-width="4"/><path d="M-8 2 l6 6 11 -12" stroke="#FF7A45" stroke-width="5" fill="none" stroke-linecap="round"/></g>
""")

# ---------------------------------------------------------------- incubator
INCUBATOR = wrap("""
<rect width="1200" height="800" fill="url(#lavbg)"/>
<circle cx="130" cy="120" r="120" fill="#FFDBC9" opacity=".7"/>
<circle cx="1080" cy="680" r="150" fill="#D2CCFF" opacity=".6"/>
<!-- stage -->
<ellipse cx="430" cy="690" rx="330" ry="44" fill="#DD9F7C" opacity=".5"/>
<!-- podium -->
<path d="M320 690 l30 -220 h160 l30 220z" fill="url(#coral)"/>
<rect x="336" y="452" width="188" height="26" rx="12" fill="#A33702"/>
<!-- student speaker -->
<g transform="translate(430 320)">
<circle cx="0" cy="20" r="48" fill="#E8B48C"/>
<path d="M-48 8 q10 -42 48 -42 q38 0 48 42 q-18 -16 -48 -16 q-30 0 -48 16z" fill="#4B240A"/>
<circle cx="-16" cy="24" r="6" fill="#31265A"/><circle cx="16" cy="24" r="6" fill="#31265A"/>
<path d="M-12 42 q12 10 24 0" stroke="#31265A" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M-64 150 q8 -96 64 -96 q56 0 64 96z" fill="#6C5CE7"/>
<rect x="52" y="36" width="16" height="84" rx="8" fill="#E8B48C" transform="rotate(-34 60 78)"/>
</g>
<!-- speech bubble lightbulb -->
<g transform="translate(560 150)">
<rect x="0" y="0" width="200" height="130" rx="28" fill="#FFFFFF"/>
<path d="M40 128 l-6 30 36 -28z" fill="#FFFFFF"/>
<circle cx="100" cy="56" r="30" fill="url(#gold)"/>
<rect x="90" y="84" width="20" height="14" rx="5" fill="#B08968"/>
<g stroke="#FDCB6E" stroke-width="5" stroke-linecap="round"><line x1="100" y1="6" x2="100" y2="-8"/><line x1="56" y1="20" x2="46" y2="10"/><line x1="144" y1="20" x2="154" y2="10"/></g>
</g>
<!-- rocket on trajectory -->
<path d="M760 620 C 820 480 860 380 960 250" stroke="#6C5CE7" stroke-width="5" stroke-dasharray="3 18" fill="none" stroke-linecap="round"/>
<g transform="translate(975 215) rotate(30)">
<path d="M0 -64 q34 36 34 84 l-34 24 l-34 -24 q0 -48 34 -84z" fill="url(#coral)"/>
<circle cy="-18" r="15" fill="#FFE3D6"/>
<path d="M-34 20 l-24 28 26 -4z" fill="#6C5CE7"/><path d="M34 20 l24 28 -26 -4z" fill="#6C5CE7"/>
<path d="M0 48 q12 24 0 44 q-12 -20 0 -44z" fill="url(#gold)"/>
</g>
<!-- coin growth chart -->
<g transform="translate(700 560)">
<rect x="0" y="70" width="56" height="70" rx="10" fill="url(#teal)"/>
<rect x="76" y="30" width="56" height="110" rx="10" fill="url(#purple)"/>
<rect x="152" y="-20" width="56" height="160" rx="10" fill="url(#coral)"/>
<circle cx="28" cy="40" r="24" fill="url(#gold)"/><circle cx="28" cy="40" r="15" fill="none" stroke="#B98A1E" stroke-width="4"/>
<circle cx="180" cy="-52" r="26" fill="url(#gold)"/><circle cx="180" cy="-52" r="16" fill="none" stroke="#B98A1E" stroke-width="4"/>
<path d="M-20 90 q90 -80 250 -140" stroke="#815032" stroke-width="5" fill="none" stroke-dasharray="2 12" stroke-linecap="round"/>
</g>
<!-- judges -->
<g transform="translate(120 470)">
<rect x="-30" y="120" width="300" height="24" rx="12" fill="#DD9F7C"/>
<g transform="translate(20 40)"><circle r="30" cy="20" fill="#FFD9B8"/><path d="M-30 12 q8 -28 30 -28 q22 0 30 28 q-12 -10 -30 -10 q-18 0 -30 10z" fill="#31265A"/><path d="M-38 120 q6 -66 38 -66 q32 0 38 66z" fill="#00CEC9"/></g>
<g transform="translate(120 40)"><circle r="30" cy="20" fill="#F2C094"/><path d="M-30 14 q6 -30 30 -30 q24 0 30 30 q-12 -12 -30 -12 q-18 0 -30 12z" fill="#A33702"/><path d="M-38 120 q6 -66 38 -66 q32 0 38 66z" fill="#FF7A45"/></g>
<g transform="translate(220 40)"><circle r="30" cy="20" fill="#E8B48C"/><path d="M-30 12 q10 -28 30 -28 q20 0 30 28 q-12 -10 -30 -10 q-18 0 -30 10z" fill="#4B240A"/><path d="M-38 120 q6 -66 38 -66 q32 0 38 66z" fill="#6C5CE7"/></g>
<rect x="60" y="150" width="30" height="6" rx="3" fill="#FFF9E6"/><rect x="150" y="150" width="30" height="6" rx="3" fill="#FFF9E6"/>
</g>
""")

# ---------------------------------------------------------------- community
COMMUNITY = wrap("""
<rect width="1200" height="800" fill="url(#sunset)"/>
<circle cx="600" cy="560" r="330" fill="#FFD9C4" opacity=".55"/>
<circle cx="600" cy="560" r="220" fill="#FFCDB8" opacity=".5"/>
<!-- confetti -->
<g>
<rect x="150" y="120" width="16" height="16" rx="3" fill="#FF7A45" transform="rotate(24 158 128)"/>
<rect x="300" y="70" width="14" height="14" rx="3" fill="#6C5CE7" transform="rotate(-18 307 77)"/>
<rect x="470" y="140" width="16" height="16" rx="3" fill="#FDCB6E" transform="rotate(40 478 148)"/>
<rect x="700" y="80" width="14" height="14" rx="3" fill="#00CEC9" transform="rotate(12 707 87)"/>
<rect x="880" y="150" width="16" height="16" rx="3" fill="#FF6B4A" transform="rotate(-30 888 158)"/>
<rect x="1020" y="90" width="14" height="14" rx="3" fill="#6C5CE7" transform="rotate(50 1027 97)"/>
<circle cx="240" cy="220" r="8" fill="#FDCB6E"/><circle cx="560" cy="60" r="7" fill="#00CEC9"/><circle cx="800" cy="210" r="8" fill="#FF7A45"/><circle cx="960" cy="260" r="7" fill="#6C5CE7"/><circle cx="420" cy="250" r="7" fill="#B31B25" opacity=".7"/>
</g>
<!-- caps flying -->
<g transform="translate(250 330) rotate(-14)"><path d="M0 0 L70 -26 L140 0 L70 26z" fill="#31265A"/><path d="M40 12 q30 18 60 0 l0 20 q-30 16 -60 0z" fill="#4935C3"/><path d="M70 26 q4 30 -10 44" stroke="#FDCB6E" stroke-width="5" fill="none"/><circle cx="58" cy="72" r="7" fill="#FDCB6E"/></g>
<g transform="translate(600 260) rotate(8)"><path d="M0 0 L70 -26 L140 0 L70 26z" fill="#31265A"/><path d="M40 12 q30 18 60 0 l0 20 q-30 16 -60 0z" fill="#4935C3"/><path d="M70 26 q4 30 -10 44" stroke="#FDCB6E" stroke-width="5" fill="none"/><circle cx="58" cy="72" r="7" fill="#FDCB6E"/></g>
<g transform="translate(920 330) rotate(18)"><path d="M0 0 L70 -26 L140 0 L70 26z" fill="#31265A"/><path d="M40 12 q30 18 60 0 l0 20 q-30 16 -60 0z" fill="#4935C3"/><path d="M70 26 q4 30 -10 44" stroke="#FDCB6E" stroke-width="5" fill="none"/><circle cx="58" cy="72" r="7" fill="#FDCB6E"/></g>
<!-- crowd -->
<g transform="translate(0 0)">
<g transform="translate(170 560)"><path d="M-58 240 q10 -160 58 -160 q48 0 58 160z" fill="#FF7A45"/><circle cy="-20" r="44" fill="#FFD9B8"/><path d="M-44 -32 q10 -34 44 -34 q34 0 44 34 q-16 -14 -44 -14 q-28 0 -44 14z" fill="#4B240A"/><rect x="-84" y="-92" width="16" height="90" rx="8" fill="#FFD9B8" transform="rotate(18 -76 -47)"/><rect x="68" y="-92" width="16" height="90" rx="8" fill="#FFD9B8" transform="rotate(-18 76 -47)"/></g>
<g transform="translate(340 585)"><path d="M-54 215 q9 -145 54 -145 q45 0 54 145z" fill="#00CEC9"/><circle cy="-18" r="42" fill="#F2C094"/><path d="M-42 -30 q9 -32 42 -32 q33 0 42 32 q-15 -13 -42 -13 q-27 0 -42 13z" fill="#31265A"/><rect x="64" y="-86" width="15" height="84" rx="7" fill="#F2C094" transform="rotate(-22 71 -44)"/></g>
<g transform="translate(520 555)"><path d="M-60 245 q10 -165 60 -165 q50 0 60 165z" fill="#6C5CE7"/><circle cy="-22" r="46" fill="#E8B48C"/><path d="M-46 -34 q10 -36 46 -36 q36 0 46 36 q-17 -15 -46 -15 q-29 0 -46 15z" fill="#A33702"/><rect x="-90" y="-100" width="16" height="94" rx="8" fill="#E8B48C" transform="rotate(22 -82 -53)"/><rect x="74" y="-100" width="16" height="94" rx="8" fill="#E8B48C" transform="rotate(-22 82 -53)"/></g>
<g transform="translate(700 590)"><path d="M-52 210 q9 -140 52 -140 q43 0 52 140z" fill="url(#gold)"/><circle cy="-16" r="40" fill="#FFD9B8"/><path d="M-40 -28 q9 -30 40 -30 q31 0 40 30 q-14 -12 -40 -12 q-26 0 -40 12z" fill="#4B240A"/><rect x="60" y="-80" width="14" height="80" rx="7" fill="#FFD9B8" transform="rotate(-20 67 -40)"/></g>
<g transform="translate(870 560)"><path d="M-58 240 q10 -160 58 -160 q48 0 58 160z" fill="#FF6B4A"/><circle cy="-20" r="44" fill="#F2C094"/><path d="M-44 -32 q10 -34 44 -34 q34 0 44 34 q-16 -14 -44 -14 q-28 0 -44 14z" fill="#31265A"/><rect x="-86" y="-94" width="16" height="90" rx="8" fill="#F2C094" transform="rotate(20 -78 -49)"/></g>
<g transform="translate(1030 595)"><path d="M-50 205 q8 -135 50 -135 q42 0 50 135z" fill="#006764"/><circle cy="-14" r="38" fill="#E8B48C"/><path d="M-38 -26 q8 -28 38 -28 q30 0 38 28 q-13 -11 -38 -11 q-25 0 -38 11z" fill="#4B240A"/><rect x="56" y="-76" width="14" height="76" rx="7" fill="#E8B48C" transform="rotate(-24 63 -38)"/></g>
</g>
""")

SVGS = {
    "live-class": LIVE_CLASS,
    "mobile-app": MOBILE_APP,
    "blockchain": BLOCKCHAIN,
    "wellbeing": WELLBEING,
    "career": CAREER,
    "peer": PEER,
    "incubator": INCUBATOR,
    "community": COMMUNITY,
}
