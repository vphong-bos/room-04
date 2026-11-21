// Original SVG scenery for Room 04 when WebGL is unavailable.
// Coordinates are in the same viewBox as the controller's target overlays.

const frameWidth = 1200;
const frameHeight = 800;

const group = (x, y, artwork, scale = 1, angle = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${artwork}</g>`;

const shadow = (x, y, width, height, opacity = .16) =>
  `<ellipse cx="${x}" cy="${y}" rx="${width}" ry="${height}" fill="#35392d" opacity="${opacity}"/>`;

const gradients = `
  <linearGradient id="r04-sky" x2="0" y2="1">
    <stop stop-color="#e4e9e5"/><stop offset=".6" stop-color="#f7f4e9"/><stop offset="1" stop-color="#f8f3e7"/>
  </linearGradient>
  <linearGradient id="r04-plaster" x2="1" y2=".3">
    <stop stop-color="#f3eee1"/><stop offset=".65" stop-color="#e7e3d5"/><stop offset="1" stop-color="#cfcfc0"/>
  </linearGradient>
  <linearGradient id="r04-roof" x2=".3" y2="1">
    <stop stop-color="#718171"/><stop offset="1" stop-color="#4d6151"/>
  </linearGradient>
  <linearGradient id="r04-wall" x2=".35" y2="1">
    <stop stop-color="#d7d2c3"/><stop offset=".42" stop-color="#ece6d7"/><stop offset="1" stop-color="#e3decd"/>
  </linearGradient>
  <linearGradient id="r04-tile" x2=".4" y2="1">
    <stop stop-color="#a79f8e"/><stop offset=".4" stop-color="#c7bdab"/><stop offset="1" stop-color="#d8cdb9"/>
  </linearGradient>
  <linearGradient id="r04-doorway" x2=".9" y2="1">
    <stop stop-color="#626358"/><stop offset="1" stop-color="#35392f"/>
  </linearGradient>
  <linearGradient id="r04-water" x2=".15" y2="1">
    <stop stop-color="#b3c9bd"/><stop offset=".6" stop-color="#8faaa1"/><stop offset="1" stop-color="#79968f"/>
  </linearGradient>
  <linearGradient id="r04-blue" x2="1" y2=".7">
    <stop stop-color="#668ea2"/><stop offset=".55" stop-color="#517b93"/><stop offset="1" stop-color="#34586f"/>
  </linearGradient>
  <linearGradient id="r04-wood" x2=".2" y2="1">
    <stop stop-color="#b4a184"/><stop offset="1" stop-color="#8f765c"/>
  </linearGradient>
  <radialGradient id="r04-edge" cx=".51" cy=".49" r=".71">
    <stop offset=".57" stop-color="#534b3a" stop-opacity="0"/>
    <stop offset="1" stop-color="#534b3a" stop-opacity=".21"/>
  </radialGradient>`;

// Animation stays inside the inline SVG and follows both motion controls.
const motionStyle = `
  <style>
    @keyframes r04-fan-sweep { 0%, 100% { transform: scaleX(.83); } 49%, 55% { transform: scaleX(1); } }
    @keyframes r04-fan-blades { to { transform: rotate(360deg); } }
    @keyframes r04-water-shift { 0%, 100% { opacity: .55; } 50% { opacity: .82; } }
    @keyframes r04-drip { 0%, 35% { opacity: 0; transform: translateY(-6px); } 46% { opacity: .85; } 75%, 100% { opacity: 0; transform: translateY(28px); } }
    @keyframes r04-bench-rock { 0%, 100% { transform: rotate(-1.2deg); } 53% { transform: rotate(-.35deg); } }
    .r04-fan-sweep { animation: r04-fan-sweep 12s ease-in-out infinite; }
    .r04-fan-blades { animation: r04-fan-blades 1.1s linear infinite; }
    .r04-water-shift { animation: r04-water-shift 9s ease-in-out infinite; }
    .r04-drop { animation: r04-drip var(--r04-drip-time) linear infinite; }
    .r04-loose-bench { transform-origin: 417px 647px; animation: r04-bench-rock 3.6s ease-in-out infinite; }
    .motion-paused .r04-motion { animation: none; }
    @media (prefers-reduced-motion: reduce) { .r04-motion { animation: none; } }
  </style>`;

function blueChair(x, y, scale = 1) {
  return group(x, y, `
    ${shadow(4, 57, 78, 13)}
    <path d="m-16 4-18 51m67-55 12 49" stroke="#35596c" stroke-width="9" fill="none"/>
    <path d="m-64 6-15 60 8-2 23-51zm115 4 8 53 8-1-3-63z" fill="#426b80"/>
    <path d="M-57-105Q-59-122-40-123l66 4q17 1 18 15l3 77-96-5z" fill="url(#r04-blue)"/>
    <path d="m-54-103 5 66m89-62 3 67" fill="none" stroke="#8ca5a6" stroke-width="2" opacity=".57"/>
    <path d="M-34-85v40m17-39v40m17-39v40m17-38v39m16-37v39" fill="none" stroke="#3b6076" stroke-width="4" opacity=".78"/>
    <path d="M-50-29 43-26 65 5 56 16-60 16-72 9Z" fill="#608597"/>
    <path d="m-72 8 20 5 107 1 10-9-3 13-118 4-13-5z" fill="#355b72"/>
    <path d="M-51-63-75-47l2 58m119-72 28 11-10 54" fill="none" stroke="#416f86" stroke-width="8" stroke-linejoin="round"/>
    <path d="m-49-65-28 16 18 4 23-13m81-5 31 10-14 6-29-10" fill="#7593a2"/>
    <path d="m-30-101 4-1 9 1" fill="none" stroke="#e8e6db" stroke-width="2" stroke-linecap="round"/>
  `, scale);
}

function woodChair(x, y, scale = 1, angle = 0) {
  return group(x, y, `
    ${shadow(4, 62, 48, 9, .12)}
    <path d="m-40-26-3-97m80 96 2-95m-47 38-1 52m19-50 1 51m-40-52 2 53" fill="none" stroke="#695b48" stroke-width="6"/>
    <path d="m-44-119 85 6-1 17-84-6z" fill="#91816a"/>
    <path d="m-41-120 82 6m-69 19 49 3" stroke="#b4a389" stroke-width="2" fill="none"/>
    <path d="m-36-17-9 83m79-81 7 75m-65-91-7 76m53-73 8 72" fill="none" stroke="#6c5d4b" stroke-width="7"/>
    <path d="m-45-21 70-10 23 17v10l-78 11-16-12z" fill="#79674f"/>
    <path d="m-45-21 70-10 23 17-79 12z" fill="#ac9679"/>
  `, scale, angle);
}

function suitcase(x, y) {
  return group(x, y, `
    ${shadow(8, 47, 58, 8, .21)}
    <path d="m-45-49 77-8 22 14v86l-85 9-14-13z" fill="#72685a" stroke="#5e584c" stroke-width="2"/>
    <path d="m-31-40 85-3v86l-85 9z" fill="#8d7966"/>
    <path d="M-39-49 32-55 51-42-30-39z" fill="#a08d77"/>
    <path d="m-19-35 60-3 3 71-62 7z" fill="none" stroke="#b7a895" stroke-width="1.3"/>
    <path d="m-11-51-1-9q0-4 6-5l23-1q7 0 8 5l2 8" stroke="#50483f" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="m-40-31 1 67m13-67v69m71-73v63" fill="none" stroke="#634f44" opacity=".73"/>
    <path d="m-30 48 9-1v5l-8 1zm73-6 8-1v5l-8 1z" fill="#4f473f"/>
  `, .91, 5);
}

function houseWindow(x, y, scale = 1) {
  return group(x, y, `
    <path d="m-94-69 180 3v125l-180-5z" fill="#8d8c7a"/>
    <path d="m-88-64 168 3v113l-168-5z" fill="#c8c5b3"/>
    <path d="m-80-57 152 3v95l-152-3z" fill="#7b8b83"/>
    <path d="m-78-54 65 1v89l-65-1zm78 2 69 1v89l-69-1z" fill="#ccc8b7"/>
    <path d="m-77-53 62 2-6 88-57-2zm81 2 64 2v88l-58-2z" fill="#9d9f91" opacity=".64"/>
    <path d="m-78-54 54 2-54 41zm84 2 62 1-60 37z" fill="#dcddd0" opacity=".28"/>
    <path d="m-87 42 171 5 14 10-197-4z" fill="#efebdc"/>
    <path d="m-99 53 197 4v7l-197-5z" fill="#9b9b89"/>
  `, scale);
}

const outsideGround = `
  <path d="M0 345Q229 323 475 351t725-3v452H0Z" fill="#9fa187"/>
  <path d="M0 401Q292 368 494 388t706 11v401H0Z" fill="#969980"/>
  <path d="m0 760 342-197 545-1 313 119v119H0Z" fill="#b8b5a6"/>
  <path d="m0 764 342-201 545-1 313 120v118H0Z" fill="#d0caba" opacity=".56"/>
  <path d="m50 800 448-230m177-1 42 231m227-156-573 1m742 80-968-5" fill="none" stroke="#9c998b" stroke-width="1.6" opacity=".66"/>
  <path d="m190 744 61-13 36 5 66-4m316-93 15 5 16-1m162 139 31-9 29 1" fill="none" stroke="#a6a193" opacity=".6"/>
  <path d="M872 555q163 15 328 89v97Q1076 627 872 566Z" fill="#aaa98e"/>
  <path d="M883 566q142 21 317 131m-269-122q139 26 269 111M961 583q118 28 239 82" fill="none" stroke="#799173" stroke-width="2" opacity=".44"/>
  <path d="m924 579 14 1m6 8 51 5m6 10 39 5m-104-24 44 5m36 16 41 12m-83-24 20 4m-30-4 56 11m67 24 45 17" fill="none" stroke="#6e7c61" stroke-width="1.5" opacity=".46"/>
  <path d="m0 553 27-10m-10 15 46-13m25 20 62-15m-53 40 75-22m-65 34 73-24m902-75 49 1m-11 19 80-2m-61 14h61" fill="none" stroke="#7d866d" stroke-width="1.4" opacity=".59"/>`;

const hose = `
  <path d="M129 535c-8 26 34 32 28 49s-82 60-74 89 117 39 146 16-79-46-114-23 39 63 145 38q43-10 47-27" fill="none" stroke="#4e6256" stroke-width="5" stroke-linecap="round"/>
  <path d="M129 535c-8 26 34 32 28 49s-82 60-74 89 117 39 146 16-79-46-114-23 39 63 145 38q43-10 47-27" fill="none" stroke="#919c84" stroke-width="1.1" stroke-opacity=".8"/>
  <path d="m301 677 11-9" stroke="#5e6153" stroke-width="7" stroke-linecap="round"/>`;

function frontHouse(open) {
  return `
    <path d="m0 218 879 9v331L0 581Z" fill="url(#r04-plaster)"/>
    <path d="m879 227 201 82v208l-201 41z" fill="#c4c6b7"/>
    <path d="m-50 88 781-46 165 182L-8 252Z" fill="url(#r04-roof)"/>
    <path d="m731 42 157 112 207 145-210-74z" fill="#687768"/>
    <path d="m731 42 157 112 207 145" fill="none" stroke="#7d8b79" stroke-width="5"/>
    <path d="M8 102 123 246M112 98l113 145M219 89l115 150M324 83l121 152M433 80l126 152M542 73l132 156M672 62l122 164" stroke="#414f44" stroke-width="2.5" opacity=".44"/>
    <path d="m0 251 887-25 208 74v12l-212-71L0 267Z" fill="#535f50"/>
    <path d="m0 267 880-26-1 24L0 292Z" fill="#8d8c78" opacity=".27"/>
    <path d="m0 556 880-18 200-42v18l-202 44L0 579Z" fill="#a8aa98"/>
    <path d="m0 348 180-7m-107 164 38-2m283-163 27-5m294 158 58-3m88-68 19-3m-869 91 28-4" stroke="#afa998" opacity=".49"/>
    ${houseWindow(258, 379, 1.2)}
    ${houseWindow(777, 372, .69)}
    <path d="m924 343 81 28v81l-81-21z" fill="#a2a592" stroke="#d8d8c8" stroke-width="6"/>
    <path d="m929 348 71 25v74l-71-18z" fill="#89968a"/>
    <path d="m964 360v79m-35-65 71 22" stroke="#c4c4b1" stroke-width="4"/>
    <path d="m529 580 133-5 20 13-159 6z" fill="#a9a594"/>
    <path d="m533 573 132-4-3 7-133 5z" fill="#e8e2d3"/>
    <path d="m533 577 2-259 129-1v253" fill="url(#r04-doorway)" stroke="#bbb8a7" stroke-width="13"/>
    ${open ? `
      <path d="m607 503 35-2v14l-35 1zm6 9-2 51m27-50 7 50" fill="none" stroke="#a58c6d" stroke-width="7"/>
      <path d="m542 324 70 21v203l-70 20z" fill="#737d6c"/>
      <path d="m547 331 58 19v189l-58 19z" fill="#89917d"/>
      <path d="m552 357 47 11v82l-47 3zm0 108 47-5v63l-47 16z" fill="none" stroke="#67725f" stroke-width="2"/>
      <path d="m604 451-10 1" stroke="#c2af83" stroke-width="4" stroke-linecap="round"/>
    ` : `
      <path d="m542 326 115-2v242l-115 2z" fill="#858e7a"/>
      <path d="m552 340 94-1v108l-94 1zm0 121 94-1v93l-94 3z" fill="none" stroke="#66715f" stroke-width="3"/>
      <path d="m637 454 15-1" stroke="#c6af82" stroke-width="5" stroke-linecap="round"/>
    `}
    <path d="M127 518v18m-9-19h22" fill="none" stroke="#8c8a74" stroke-width="4"/>
    ${hose}
    ${blueChair(361, 541, .96)}
    ${suitcase(515, 577)}`;
}

function backHouse() {
  return `
    <path d="m44 302 228-126 924 31v360l-925 1-227-67z" fill="url(#r04-plaster)"/>
    <path d="m44 302 228-126-1 392-227-67z" fill="#c1c1b2"/>
    <path d="M23 287 205 134l204-87L272 178 34 311z" fill="#617363"/>
    <path d="m409 47 743 15 95 147-975-31z" fill="url(#r04-roof)"/>
    <path d="M467 53 337 180M584 56 468 184M711 58 605 188M838 60l-80 133m201-130-55 135m189-132-39 137" stroke="#394f42" stroke-width="2.5" opacity=".43"/>
    <path d="m19 311 253-133 975 31v17l-973-31-253 132z" fill="#515f50"/>
    <path d="m44 479 228 68 928-6v23l-929 5-227-67z" fill="#a6a894"/>
    <path d="m61 360 113-47v102l-113 26z" fill="#878f80" stroke="#d5d4c4" stroke-width="8"/>
    ${houseWindow(410, 366, .97)}
    ${houseWindow(994, 377, 1.26)}
    <path d="m587 558 194-1 27 30-245 1z" fill="#aea697"/>
    <path d="m594 553 181-1 8 9-196 1z" fill="#e4dfd0"/>
    <path d="M597 554V294l178 5v254" stroke="#b0af9e" stroke-width="17" fill="url(#r04-doorway)"/>
    <path d="m610 399 52 91 108 64H603z" fill="#777c68"/>
    <path d="m631 439 59 83 41 30h-83l-29-71z" fill="#b7b29d" opacity=".56"/>
    <path d="m603 301-81 36v235l81-24z" fill="#747b70"/>
    <path d="m598 309-68 33v221l68-20z" fill="#a7ac9b"/>
    <path d="m594 319-61 29 1 63 62-23z" fill="#d2cbb2" opacity=".6"/>
    <path d="m538 424 56-23v125l-56 21z" fill="none" stroke="#7e8776" stroke-width="2" opacity=".45"/>
    <path d="m539 474 13-4" stroke="#5f6356" stroke-width="5" stroke-linecap="round"/>
    <text transform="translate(541 386) skewY(-22)" fill="#696d60" opacity=".74" font-size="25" font-family="sans-serif" letter-spacing="1">04</text>
    <path d="m539 372 32-13m-38 24 43-16m-46 26 42-16" stroke="#e3dcc6" opacity=".4"/>
    <path d="M1030 515q-19 77 39 89t131 38m-173-125q-18 77 37 91t136 38" fill="none" stroke="#636e5a" stroke-width="3"/>
    <path d="m0 800 323-234 213-6-291 240z" fill="#a5a68d"/>`;
}

function exterior(view, add) {
  if (view.step === 2) {
    add('backdoor', 'Back door', 671, 420);
    add('number', 'Door number', 558, 375);
    add('hose', 'Hose', 1064, 608);
    return outsideGround + backHouse();
  }

  if (view.step === 0) add('frontdoor', 'Front door', 604, 444);
  else add('sidepath', 'Side path', 925, 584);
  add('chair', 'Blue plastic chair', 349, 470);
  add('hose', 'Hose', 231, 692);
  return outsideGround + frontHouse(view.step === 1);
}

function tileFloor(wallBottom) {
  return `
    <path d="M0 ${wallBottom}H1200V800H0Z" fill="url(#r04-tile)"/>
    <path d="M0 ${wallBottom + 15}H1200M0 ${wallBottom + 40}H1200M0 ${wallBottom + 78}H1200M0 ${wallBottom + 136}H1200M0 ${wallBottom + 222}H1200"
      fill="none" stroke="#8e8979" stroke-width="1.6" opacity=".66"/>
    <path d="M238 ${wallBottom} 0 715M347 ${wallBottom} 79 800M445 ${wallBottom} 334 800M547 ${wallBottom} 559 800M647 ${wallBottom} 798 800M749 ${wallBottom} 1097 800M853 ${wallBottom} 1200 692M968 ${wallBottom} 1200 588"
      fill="none" stroke="#8e8979" stroke-width="1.6" opacity=".61"/>
    <path d="m310 ${wallBottom + 88} 92-10 102 2 45 7-130 8zm526 46 88 18-121 12-43-9zm-434 95 47-6 47 6-8 10-64 3z"
      fill="#e7dcc7" opacity=".19"/>`;
}

function mug(x, y, scale = 1, angle = 0, resting = true) {
  return group(x, y, `
    ${resting ? shadow(4, 22, 27, 6, .21) : ''}
    <path d="M16-13q20-7 20 6 0 12-19 14" fill="none" stroke="#aaa697" stroke-width="7"/>
    <path d="M18-13q16-7 17 6 0 8-15 12" fill="none" stroke="#e8dfcb" stroke-width="4"/>
    <path d="M-22-17h45l-4 31q-5 10-20 10t-18-10z" fill="#e2d9c3"/>
    <path d="M-16-11h6v23l-3 5z" fill="#f1e9d7" opacity=".66"/>
    <ellipse cy="-17" rx="22" ry="8" fill="#f0e6d1"/>
    <ellipse cy="-16.3" rx="17" ry="5" fill="#817c6a"/>
    <path d="M-15-17q14-5 29-1l2 2q-16 4-32 0z" fill="#a9a28b"/>
  `, scale, angle);
}

function fish(x, y, scale = 1, angle = 0) {
  return group(x, y, `
    <path d="M-17 0Q-8-9 4-5L12 0 4 5Q-8 9-17 0ZM12 0 20-6v12Z" fill="#496c80"/>
    <path d="M-6-5q0 5 3 9m4-9q0 5 3 8" fill="none" stroke="#dedfd2" stroke-width="1"/>
    <circle cx="-11" r="1.1" fill="#dbe0d5"/>
  `, scale, angle);
}

function wallFan() {
  const blades = [0, 120, 240].map(angle => `
    <path transform="rotate(${angle})" d="M-5-5Q-13-16-8-42q11-8 26 3Q17-31 5-4Z" fill="#a4a69a"/>`).join('');
  return group(440, 191, `
    <path d="M-28 13h23v33h-30z" fill="#a7a496"/>
    <path d="m-22 39 25-21" fill="none" stroke="#777b70" stroke-width="8"/>
    <g class="r04-motion r04-fan-sweep">
      <circle r="51" fill="#c9c8ba" stroke="#888c80" stroke-width="3"/>
      <g class="r04-motion r04-fan-blades">${blades}</g>
      <circle r="45" fill="none" stroke="#757c73" opacity=".62"/>
      <circle r="37" fill="none" stroke="#757c73" opacity=".42"/>
      <circle r="25" fill="none" stroke="#757c73" opacity=".42"/>
      <path d="M0-48v96m-48-48h96m-82-34 68 68m-68 0 68-68m-78 15 88 39m-65-63 42 88m-42-1 40-87m-64 64 88-39"
        fill="none" stroke="#888e82" opacity=".65"/>
      <circle r="8" fill="#909487" stroke="#72776d"/>
    </g>
    <path d="m5 48-4 65" stroke="#77705e" stroke-width="1.6"/>
    <path d="m-3 111 11 2 1 7-13-2z" fill="#9e8d6a" stroke="#716951" stroke-width="1"/>
    <path d="m-1 112-1 6m4-5-1 6m4-5v5" stroke="#ded4b8" opacity=".63"/>
  `);
}

const desk = `
  <path d="m319 403-6 103m157-90 3 95m-125-97-4 51m96-50 2 54" stroke="#7a6d57" stroke-width="8"/>
  <path d="m306 388 147-6 35 15v13l-157 12-25-19z" fill="#8a7961"/>
  <path d="m306 388 147-6 35 15-157 15z" fill="#b6a68a"/>
  <path d="m331 414 152-12m-141 12-2 9" stroke="#ded1b3" opacity=".57"/>
  <path d="m332 407 21-2-1 9-20 2z" fill="#baad88"/>
  <path d="m333 412 18-2" stroke="#dfd3b3" opacity=".8"/>`;

function roomWindow({side = false, glare = false} = {}) {
  const outside = side ? `
    <path d="M-136-94H136v101L-136-25Z" fill="#d5dacf"/>
    <path d="m-136 13 272-30v118h-272z" fill="#9da28a"/>
    <path d="m-136 79 272-43v66h-272z" fill="#c4c1ac"/>
    <path d="m-136 81 272-43m-265 54 83-4" fill="none" stroke="#ddd5bd" opacity=".63"/>
    <path d="m-103-11 103-11h112" stroke="#929881" opacity=".42"/>` : `
    <path d="M-136-94H136V-5H-136z" fill="#dbe3d9"/>
    <path d="m-136-21 272-18V99h-272Z" fill="#b6b8a4"/>
    <path d="m-131 31 216-46 43 52-213 54z" fill="#d1c9b6"/>
    <path d="m-117 36 197-42 34 39-197 49z" fill="#8caba1"/>
    <path d="m-117 38 34 42m-2-48 38 40m15-49 36 35m14-48 37 34m11-44 28 35M-97 62l201-47" fill="none" stroke="#c0cbbb" stroke-width="1.2" opacity=".64"/>
    <path d="m-126 56 2-49m208 8 3-45m-211 42 212-39m-213 57 213-40" fill="none" stroke="#747e70" stroke-width="3"/>
    <path d="m38-18 32-6 2 37-29 7z" fill="#ece0c7"/>
    <path d="m44-18 1 35m24-40 1 35" stroke="#b4ac91" opacity=".66"/>`;
  return `
    <path d="M-146-103H146V105H-146z" fill="#9d9b88"/>
    ${outside}
    ${glare ? '<path d="M-136-94H136V100H-136z" fill="#d8ded0" opacity=".27"/>' : ''}
    <path d="M-139-94H139V100H-139zM-8-93V100M-138 9H138" fill="none" stroke="#dcd9c7" stroke-width="8"/>
    <path d="M-135-92 128-90-135 13z" fill="#fbf6e3" opacity=".16"/>
    <path d="m-148 97 294 1 13 13-317-1z" fill="#e6dfce"/>
    <path d="m-158 110 317 1v8l-317-1z" fill="#a9a692"/>`;
}

const counter = `
  <path d="m735 450 465 1v349H787z" fill="#adaf9c"/>
  <path d="m743 472 457-1v12H743z" fill="#818674"/>
  <path d="m700 450 61-37 439 4v64H719z" fill="#d4d1bf"/>
  <path d="m700 450 500 8v14l-491-9z" fill="#ded8c8"/>
  <path d="m768 485 15 315m122-316 5 316m164-315v315" stroke="#89917c" stroke-width="2" opacity=".85"/>
  <path d="m805 520 68 1m71 1 81 1m73 0 91 1" fill="none" stroke="#737867" stroke-width="4" stroke-linecap="round"/>
  <path d="m786 436 54-16 194 2 43 15-8 13-248-3z" fill="#8b938a" stroke="#aeb3a9" stroke-width="3"/>
  <path d="m806 436 42-11 176 2 32 11-14 6-208-2z" fill="#737e78"/>
  <ellipse cx="954" cy="438" rx="12" ry="3" fill="#505e55"/>`;

function tap(x, y, step) {
  const turns = Math.max(0, step - 3);
  const handleAngle = [30, 6, -16, -44, -44][turns] ?? -44;
  const water = [
    '<path d="M14-33q-1 17 0 49" fill="none" stroke="#e1ece2" stroke-width="2.8" opacity=".78"/><path d="M12 16l-7 2m11-1 6 3" stroke="#dce8dc" opacity=".58"/>',
    '<path d="M14-33v10m0 6v6" stroke="#e1ece2" stroke-width="2.4" opacity=".75"/><path class="r04-motion r04-drop" style="--r04-drip-time:1.4s" d="M13-9q-4 6 1 8 4-2-1-8Z" fill="#e1ebe0"/>',
    '<path class="r04-motion r04-drop" style="--r04-drip-time:2.8s" d="M13-16q-4 6 1 8 4-2-1-8Z" fill="#e1ebe0"/>',
  ][turns] ?? '';
  return group(x, y, `
    <ellipse cx="-33" cy="1" rx="13" ry="4" fill="#777e76"/>
    <path d="M-34-2v-33q0-14 13-14H1q13 0 13 10v5" fill="none" stroke="#67756e" stroke-width="8"/>
    <path d="M-35-5v-30q0-13 13-13H1q12 0 12 9" fill="none" stroke="#c4c6b8" stroke-width="4"/>
    <path d="M-35-46v-12" fill="none" stroke="#7a8478" stroke-width="6"/>
    <path d="M-49-54h27" transform="rotate(${handleAngle} -35 -54)" fill="none" stroke="#adb0a1" stroke-width="6" stroke-linecap="round"/>
    ${step >= 3 ? water : ''}
  `);
}

function corridor(step) {
  const leading = step >= 7;
  return `
    <path d="M46 0h298l23 493H44Z" fill="#a6a797"/>
    <path d="M66 73 321 95l14 392H66Z" fill="#777f70"/>
    <path d="M66 76 235 195v251L66 489Z" fill="${leading ? '#a8af98' : '#929a85'}"/>
    <path d="m235 195 86-100 14 392-100-41z" fill="#b1b29d"/>
    <path d="m235 195 68-1 6 238-74 14z" fill="${leading ? '#e1e1c9' : '#c2c8b4'}"/>
    <path d="m66 489 169-43 74-14 27 55-232 140-73-15z" fill="${leading ? '#c9c6ad' : '#a9ad95'}"/>
    <path d="m66 351 169-17 74 4v93l-74 15-169 43z" fill="#828f79" opacity=".46"/>
    <path d="m66 357 169-18 74 6m-243 152 182-41 75 0m-229 71 170-56 68 1m-213 77 148-58m-38 23 48-44" fill="none" stroke="#686f60" opacity=".53"/>
    <path d="m45 0 21 81v410l-22 11zM322 92l22-92 23 493-31-5z" fill="#d9d4c4"/>
    ${leading ? '<path d="m239 429 69-6 27 66-125 61-71 2z" fill="#ebe4c7" opacity=".22"/>' : ''}
  `;
}

function interior(view, add) {
  const {step} = view;
  const firstPush = step === 1;
  const chairX = step === 0 ? 560 : firstPush ? 593 : 574;
  const chairY = step < 2 ? 529 : 508;
  const cupX = step === 2 ? 767 : 916;
  const cupY = step === 2 ? 421 : 441;

  if (step < 2) add('chair', 'Passage chair', chairX, chairY - 56);
  if (step === 2) add('cup', 'Cup', cupX, cupY - 8);
  if (step >= 3 && step <= 5) add('tap', 'Tap', 857, 367);
  if (step === 6) add('window', 'Sink window', 937, 278);
  if (step === 7) add('left', 'Left corridor', 252, 404);
  add('fan', 'Wall fan', 440, 191);
  add('tape', 'Tape on the desk', 347, 410);
  add('pattern', 'Blue-patterned dish', 1060, 420);
  if (step >= 3) add('cup', 'Cup', cupX + 13, cupY - 2);

  return `
    <path d="M0 0H1200V512H0Z" fill="url(#r04-wall)"/>
    <path d="M0 336 595 345l605-12v176H0Z" fill="#a4af97"/>
    <path d="M0 491 595 499l605-8v18H0Z" fill="#858b77"/>
    ${tileFloor(500)}
    ${corridor(step)}
    <path d="m369 0 20 0 7 499-29-6zM397 332l33 2-3 151-31 6z" fill="#eee8da" opacity=".3"/>
    <path d="m516 84 20 330m-154-119 27 2m-2 167 46 3" fill="none" stroke="#afa994" opacity=".34"/>
    <path d="m583 496 2-277 139 4v280" fill="url(#r04-doorway)" stroke="#c6c3b1" stroke-width="11"/>
    ${step < 2 ? `
      <path d="m710 228 32 28 1 258-32-18z" fill="#959c85"/>
      <path d="m610 451 99 14 1 31-119-2z" fill="#929781"/>
      <path d="m722 367 12 9" stroke="#cfc3a2" stroke-width="4"/>
    ` : `
      <path d="m590 225 129 3v268l-130-2z" fill="#919b82"/>
      <path d="m603 244 101 4v102l-101-2zm0 118 101 2v116l-101-2z" fill="none" stroke="#73816d" stroke-width="2"/>
      <path d="m605 366 13 1" stroke="#c6b18a" stroke-width="4" stroke-linecap="round"/>
    `}
    <path d="m1181 0-9 504 28 7V0Z" fill="#b9b5a5" opacity=".53"/>
    ${group(985, 244, roomWindow({glare: step < 6}), 1.2)}
    <path d="m836 384 325 2 39 104-356-44z" fill="#f1e7ce" opacity="${step === 6 ? '.32' : '.15'}"/>
    ${wallFan()}
    ${desk}
    ${woodChair(chairX, chairY, .91, firstPush ? 8 : step >= 2 ? -5 : 0)}
    ${firstPush ? '<path d="m610 585 20 2-3 4-15-1z" fill="#77786d" opacity=".73"/>' : ''}
    ${counter}
    ${group(1063, 423, '<path d="M-34-11Q-14 8 24 3l8-14-20-7-39 3z" fill="#d6d7c7" stroke="#b0b4a3"/><ellipse cy="-12" rx="34" ry="9" fill="#e8e5d4"/>' + fish(11, -12, .58, -9) + '<path d="m-31-13 36 1-17 8-17-3z" fill="#ede8d8"/>')}
    ${tap(902, 415, step)}
    ${step >= 2 ? mug(cupX, cupY, step === 2 ? .89 : .67, step === 2 ? -7 : 0) : ''}
    ${step === 2 ? '<path d="m749 441 18 2m-14 3 13 1" stroke="#f0ead7" stroke-width="1.3" opacity=".74"/>' : ''}
  `;
}

function platePot(x, y, scale, body, plate, patterned = false) {
  return group(x, y, `
    <ellipse cy="7" rx="47" ry="10" fill="#5d6455" opacity=".15"/>
    <ellipse cy="3" rx="44" ry="10" fill="${plate}"/>
    <path d="M-42 4Q-3 16 40 4" fill="none" stroke="#858776" stroke-width="1.4" opacity=".62"/>
    ${patterned ? fish(23, 5, .66, -10) : ''}
    <path d="m-29-51 7 48q16 8 42 2l9-50z" fill="${body}"/>
    <path d="m-25-46 9 1 4 45-9-2z" fill="#e0c3a9" opacity=".29"/>
    <ellipse cy="-50" rx="31" ry="8" fill="#ab9a84"/>
    <ellipse cy="-51" rx="25" ry="5" fill="#665e4d"/>
    <path d="M-3-53q-6-50-23-70m29 70q4-56 29-74m-27 73q10-33 30-40m-38 40q-14-30-30-30m32 30q0-51 7-67" fill="none" stroke="#657654" stroke-width="2"/>
    <path d="M-19-106q-23-7-25-23 20 3 25 23m8 17q-19-1-23-18 18 4 23 18m34-24q2-16 23-20-4 14-23 20m-7 16q5-12 24-14-3 12-24 14m-5-24q-4-15 7-25 2 15-7 25m-24 45q-15-1-30-13 10-7 30 13m22 6q9-17 25-19-3 11-25 19" fill="#738269"/>
  `, scale);
}

function towel(x, y, scale = 1, angle = 0) {
  return group(x, y, `
    <path d="m-44-9 58-9 34 14-13 14-73 4-9-10z" fill="#a9a38e" opacity=".47"/>
    <path d="m-42-13 57-9 31 14-11 10-69 9-12-10z" fill="#dfdac7"/>
    <path d="m-42-13 57-9 31 14-70 10z" fill="#ebe4d2"/>
    <path d="m-43-6 17 12 68-9m-63 2 49-6" fill="none" stroke="#bfb6a0" stroke-width="1.4" opacity=".86"/>
    <path d="m-34-11 48-8 18 6" fill="none" stroke="#f6ebd2" stroke-width="1.2"/>
  `, scale, angle);
}

const poolWater = `
  <path d="M0 539 692 654l508-71v217H0Z" fill="url(#r04-water)"/>
  <path d="M0 539 692 654l508-71v12l-508 75L0 554Z" fill="#56796f" opacity=".36"/>
  <path d="M0 546 692 654l508-71M0 616l626 98 574-79M0 684l618 93 582-88M0 756l329 44m-286 0 271-208m-57 208 251-176m-41 176 216-148m25 148 139-169m62 169 102-192m118 192 51-211" fill="none" stroke="#678b81" stroke-width="1.4" opacity=".37"/>
  <g class="r04-motion r04-water-shift" opacity=".62" stroke="#e0e3c8" stroke-width="2" fill="none" stroke-linecap="round">
    <path d="M0 584q110 6 190 34 38 12 102 12m-73 28q63 2 110 15t120 9m-89 39q79-9 143 8t118 11m-75-45q81 4 124-7m52 51q74-8 134-3t142-13m-63-48q38-6 74-1 53 5 116-13m-106-18 59-13M0 730q52 7 81 17m24-59q42 13 71 11"/>
    <path d="M9 607q70 8 118 21m295 33 59 13m-286 34 62 10m382 48 90-8m162-62 80-9m70 63 132-18" opacity=".48"/>
  </g>`;

function pool(view, add) {
  const moved = view.step >= 1;
  if (moved) add('room', 'Room door', 916, 438);
  else add('towel', 'Folded towel', 674, 527);
  add('fish', 'Blue fish plate', 553, 418);
  add('plates', 'Plates under the pots', 422, 421);
  add('cup', 'Cup', 817, 645);

  return `
    <path d="M0 0H1200V569L0 513Z" fill="url(#r04-wall)"/>
    <path d="M0 404 872 423l328-58v204L0 513Z" fill="#b5b7a2"/>
    <path d="m0 492 870 30 330-69v119L0 538Z" fill="#949883"/>
    <path d="M0 513 870 543l330-59v108l-509 82L0 550Z" fill="url(#r04-tile)"/>
    <path d="m0 520 870 30 330-58m-1200 41 692 115 508-70m-1000-50-74 26m218-21-51 52m275-44-52 78m251-72-21 96m173-101 32 61m92-82 53 61"
      fill="none" stroke="#9c9885" stroke-width="1.4" opacity=".7"/>
    <path d="M-53 128h805v269H-53z" fill="#969b89"/>
    <path d="M-53 139h794v248H-53z" fill="url(#r04-sky)"/>
    <path d="m0 320 747-28v94H0Z" fill="#b2b9a2"/>
    <path d="m0 356 748-21v51H0Z" fill="#9ca58b"/>
    <path d="M93 138v249m229-249v249m224-249v249m192-248v248M0 274h738" fill="none" stroke="#d1d1bc" stroke-width="10"/>
    <path d="M-5 147 737 146M-5 382 738 382" fill="none" stroke="#e8e3d2" stroke-width="14"/>
    <path d="M-5 114H756" stroke="#8a8c7c" stroke-width="5"/>
    <path d="M-9 118q46-6 116 4L85 368q-39-9-94-2zm654 3q59-7 107 0v243q-48-10-83 3z" fill="#dfd9c7"/>
    <path d="m20 121-6 242m33-243-10 243m40-243-14 242m605-241 20 242m6-243 17 240m14-240 10 241" stroke="#bcb8a5" stroke-width="2" opacity=".72"/>
    <path d="M0 381h738l56 25-794 10z" fill="#d8d4be"/>
    <path d="m0 416 794-10v13L0 429Z" fill="#8b8d7a"/>
    <path d="m0 422 794-10" stroke="#a8a794" opacity=".66"/>
    ${platePot(209, 414, .8, '#9c7e68', '#c9c5ad')}
    ${platePot(391, 418, 1.08, '#a09075', '#aaa995')}
    ${platePot(531, 415, .92, '#a4826e', '#e1dbc8', true)}
    ${platePot(661, 415, .63, '#968c74', '#beb7a1')}
    <path d="m760 0 59 0 18 532-77-4z" fill="#e1dece"/>
    <path d="m821 219 161-20v335l-144 11z" fill="url(#r04-doorway)" stroke="#b4b7a5" stroke-width="12"/>
    ${moved ? `
      <path d="m843 546 127-11-27-56-78 12z" fill="#968e79"/>
      <path d="m975 210 84 43v274l-84 4z" fill="#89937e"/>
      <path d="m987 224 59 33v99l-59-13zm0 142 59 10v139l-59 3z" fill="none" stroke="#66745f" stroke-width="2"/>
      <path d="m1024 377 17 3" stroke="#c0ad89" stroke-width="5" stroke-linecap="round"/>
      ${towel(981, 508, .73, -4)}
    ` : `
      <path d="m827 224 150-19v325l-134 9z" fill="#89947f"/>
      <path d="m842 239 121-15v122l-118 7zm5 124 116-7v162l-109 8z" fill="none" stroke="#6b7b65" stroke-width="2"/>
      <path d="m859 371 16-2" stroke="#beae8c" stroke-width="5" stroke-linecap="round"/>
    `}
    ${poolWater}
    ${blueChair(678, 534, 1.08)}
    ${moved ? '' : towel(678, 534)}
    ${shadow(552, 798, 111, 17, .13)}
    <path d="m476 800 9-21q18-14 36 1l13 20zm64 0 11-24q17-16 35-2l17 26z" fill="#686b5e" opacity=".43"/>
    <path d="M1048 800q-59-71-143-134-14-12-39-16l-8 7 11 14q19 14 35 29 56 56 79 100z" fill="#b09b83"/>
    <path d="M985 800q-25-56-85-106-16-13-31-23l-10-12 6 18 25 23q58 55 74 100z" fill="#938773" opacity=".48"/>
    ${mug(821, 658, 1.21, 5, false)}
    <path d="m869 653-13-6q-10-3-13 3-1 4 7 7l16 8z" fill="#b9a58c"/>
  `;
}

const cardboard = (x, y, scale = 1, angle = 0) => group(x, y, `
  <path d="m-21-5 31-5 16 10-34 6z" fill="#bba583" stroke="#8f7e63" stroke-width="1"/>
  <path d="m-8 6 33-5v3L-9 9l-12-11v-3z" fill="#967f60"/>
  <path d="m-12-2 22-4" stroke="#d8c4a1" stroke-width="1.1"/>`, scale, angle);

function photograph(x, y, scale = 1, angle = 0, showBack = false) {
  const surface = showBack ? '' : `
    <path d="m-24-10 43-3 10 19-48 5z" fill="#a8a192"/>
    <path d="m-24-10 23-2 10 21-27 2z" fill="#c7beab"/>`;
  return group(x, y, `
    <path d="m-31-14 54-3 12 26-60 7z" fill="#f0e6d2" stroke="#a19a86" stroke-width="1.5"/>
    ${surface}
    <path d="m20 9 15-1-6 7z" fill="#ded2ba"/>
  `, scale, angle);
}

function tabletop() {
  return `
    ${shadow(624, 556, 325, 39, .13)}
    <path d="m403 420-18 165m408-164 28 167m-318-174-9 95m242-89 3 102" fill="none" stroke="#736149" stroke-width="16"/>
    <path d="m395 439-13 145m414-145 23 149" fill="none" stroke="#a08a6a" stroke-width="5"/>
    <path d="M488 360h229l162 70v25l-512 9-13-25Z" fill="#806951"/>
    <path d="M488 360h229l162 70-512 12-13-4Z" fill="url(#r04-wood)"/>
    <path d="m368 439 506-12m-471-8 441-10m-366-37 267-1m-324 32 157-4m94 0 129-2" fill="none" stroke="#d7c3a0" opacity=".51"/>
    <path d="M367 450 879 438m-506 23 493-10" fill="none" stroke="#624f3e" opacity=".6"/>`;
}

function bench(step) {
  const moving = step > 0 && step < 5;
  return `
    ${shadow(608, 651, 220, 24, .18)}
    ${step === 0 ? photograph(755, 638, .9, -3) : ''}
    ${step === 3 ? cardboard(778, 642, 1.18, -6) : ''}
    ${step === 4 ? cardboard(743, 639, .87, -1) : ''}
    ${step >= 5 ? cardboard(743, 643, .72, 2) : ''}
    <g${moving ? ' transform="rotate(-.7 417 647)" class="r04-motion r04-loose-bench"' : ''}>
      <path d="m438 569-21 77 14 3 17-78zm300 0 0 71 14 1 5-78zm-243-14-2 67 10 3 5-69zm198 0 3 61 13-2-1-62z" fill="#765f49"/>
      <path d="m446 572-15 73m320-63-1 55" stroke="#a28c6c" stroke-width="3"/>
      <path d="m422 565 297-30 53 27-5 20-332 19-13-11z" fill="#856d53"/>
      <path d="m422 565 297-30 53 27-338 27z" fill="url(#r04-wood)"/>
      <path d="m448 570 284-24m-276 35 301-24m-311 37 310-20" fill="none" stroke="#b4a086" opacity=".66"/>
      <path d="m425 561 72-6 36 25-90 9-16-8z" fill="#a5a292"/>
      <path d="m425 561 69-10 39 24-88 10z" fill="#c1baaa"/>
      <path d="m429 565 72-9m-57 27 84-10m-81 14 82-8" stroke="#dfd4bd" stroke-width="1.8" opacity=".68"/>
    </g>`;
}

function finalTable(add) {
  add('photo', 'Photograph', 585, 623);
  add('cup', 'Cup', 741, 591);
  return `
    <path d="M0 0H1200V600H0Z" fill="url(#r04-wall)"/>
    <path d="M0 471 1200 460v140H0Z" fill="#a8af98"/>
    <path d="M0 562 1200 553v43H0Z" fill="#89947c"/>
    <path d="M236-36 958-26v504H238Z" fill="#a1a38f"/>
    <path d="M250-26 946-16v481H251Z" fill="url(#r04-sky)"/>
    <path d="m251 263 202-3 493-34v239H251Z" fill="#a8ae94"/>
    <path d="m251 408 695-83v144H251Z" fill="#d0ccb9"/>
    <path d="m262 414 684-82m-573 134 573-98m-334 26 44 72m170-95 51 98" fill="none" stroke="#a8a691" opacity=".78"/>
    <path d="m268 262 175-3m325-24 178-11m-660 134 81-13m473-65 75-8" fill="none" stroke="#7c8d75" opacity=".52"/>
    ${group(657, 415, `
      ${shadow(0, 11, 54, 13, .14)}
      <path d="M-37-26q7-11 20-7 7 2 7 19l6 20q2 14-14 17-23 5-27-10-2-11 3-20z" fill="#696d61"/>
      <path d="M4-26q8-11 20-8 7 2 7 16l8 18q5 13-11 17-21 5-27-8-4-10 1-24z" fill="#757666"/>
      <path d="M-36-24q5-8 14-6 6 3 6 12-9-4-20 3zm43-1q6-8 15-6 6 3 6 10-9-2-21 3z" fill="#4b514a"/>
      <path d="M-44 12q11 7 38-2m8-2q15 4 36-3" stroke="#b3ae97" stroke-width="2" fill="none"/>
      <path d="M-40 3q11-7 26-4l4 10q-13 7-30 4zm45-4q13-9 24-6l6 9q-13 7-29 5z" fill="#838171"/>
      <path d="m-36-11 17-3m-18 8 19-3m25-5 17-4m-16 8 18-3" stroke="#b4ad97" stroke-width="1.5"/>
    `, .88, 7)}
    <path d="M242 0v469h711V0M515 0v468m259-467v468" fill="none" stroke="#d1cfbc" stroke-width="14"/>
    <path d="M246 17 949 21 246 300Z" fill="#f6f2dd" opacity=".15"/>
    <path d="m219 467 753-8 35 27-828 6z" fill="#e7deca"/>
    <path d="m179 492 828-6v10l-828 9z" fill="#9c9985"/>
    ${woodChair(225, 640, 1.06, -9)}
    ${woodChair(1007, 637, 1.14, 8)}
    <path d="m310 558 539-7 273 249H24Z" fill="url(#r04-wood)"/>
    <path d="m323 567 524-5m-557 27 561-9m-593 43 440-8m84-3 132-3m-718 57 765-9m-850 80 929-14m-844-23 476-6" stroke="#d1bb98" fill="none" opacity=".32"/>
    <path d="m443 730 345-9m-548-54 201-4m437 68 87-3m-679 18 77-4" stroke="#705d45" fill="none" opacity=".35"/>
    ${shadow(586, 625, 67, 17, .13)}
    ${photograph(585, 622, 1.66, -7)}
    ${mug(741, 604, 1.34)}
  `;
}

function table(view, add) {
  const {step} = view;
  if (view.letterFound || step === 6) return finalTable(add);

  const photoX = step === 0 ? 757 : step === 1 ? 621 : 572;
  const photoY = step === 0 ? 639 : step === 1 ? 405 : 407;
  if (step === 1) add('turnphoto', 'Photograph', photoX, photoY);
  else add('photo', 'Photograph', photoX, photoY);
  if (step === 2) add('cardboard', 'Cardboard on the sill', 662, 327);
  if (step === 3) add('fold', 'Cardboard', 778, 642);
  if (step === 4) add('fold', 'Folded cardboard', 743, 639);
  if (step === 5) add('sit', 'Bench', 622, 571);
  add('cup', 'Cup', 720, 399);

  return `
    <path d="M0 0H1200V541H0Z" fill="url(#r04-wall)"/>
    <path d="M0 349 1200 338v203H0Z" fill="#abb099"/>
    <path d="m0 477 1200-18v31H0Z" fill="#8c947d"/>
    ${tileFloor(490)}
    <path d="M0 0h155l-4 493-151 42ZM1200 0h-159l35 490 124 46Z" fill="#b0ad9d" opacity=".4"/>
    <path d="m0 524 151-31V0M1200 535l-123-47-36-488" fill="none" stroke="#959683" opacity=".32"/>
    ${group(653, 200, roomWindow({side: true}), 1.14)}
    <path d="m475 338 357-2 118 126-241 62-278-105z" fill="#e9e0c5" opacity=".23"/>
    ${step === 2 ? cardboard(662, 326, .89, -7) : ''}
    ${woodChair(613, 388, .82)}
    ${woodChair(329, 492, 1.02, -11)}
    ${woodChair(907, 499, 1.04, 11)}
    ${tabletop()}
    ${mug(720, 412, .8)}
    ${step === 1 ? shadow(616, 430, 42, 8, .2) : ''}
    ${step >= 1 ? photograph(photoX, photoY, step === 1 ? 1.58 : .98, step === 1 ? -13 : -2, step === 2) : ''}
    ${bench(step)}
  `;
}

const scenes = [exterior, interior, pool, table];
const backgrounds = ['url(#r04-sky)', '#e0dbc9', '#d1d3bf', '#dfd9c8'];

export function buildFallback(view) {
  const {chapter} = view;
  const targets = [];
  const add = (id, label, x, y) => targets.push({id, label, x, y});
  const artwork = scenes[chapter](view, add);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${frameWidth} ${frameHeight}" preserveAspectRatio="xMidYMid meet">
    <defs>${gradients}</defs>${motionStyle}
    <rect width="${frameWidth}" height="${frameHeight}" fill="${backgrounds[chapter]}"/>
    ${artwork}
    <rect width="${frameWidth}" height="${frameHeight}" fill="url(#r04-edge)" pointer-events="none"/>
  </svg>`;
  return {svg, targets};
}
