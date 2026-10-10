/**
 * Calibração dos 6 Bots de Xadrez Estilo Chess.com
 * Parâmetros de profundidade UCI, tempo de reflexão e perfis com avatares vetoriais SVG.
 */

export const BOTS = [
  {
    id: 'pipoca',
    name: 'Pipoca',
    elo: 400,
    category: 'Iniciante',
    description: 'Adora passear pelo tabuleiro e comer peões sem olhar as consequências!',
    skillLevel: 0,
    depth: 1,
    movetime: 100,
    avatar: `<svg viewBox="0 0 100 100" class="bot-avatar-svg">
      <circle cx="50" cy="50" r="48" fill="#ffb74d" stroke="#f57c00" stroke-width="3"/>
      <!-- Orelhas de cachorrinho -->
      <ellipse cx="25" cy="30" rx="14" ry="22" fill="#8d6e63" transform="rotate(-20 25 30)"/>
      <ellipse cx="75" cy="30" rx="14" ry="22" fill="#8d6e63" transform="rotate(20 75 30)"/>
      <!-- Rosto -->
      <circle cx="50" cy="55" r="32" fill="#ffe0b2"/>
      <!-- Olhos -->
      <circle cx="38" cy="48" r="6" fill="#3e2723"/>
      <circle cx="40" cy="46" r="2" fill="#ffffff"/>
      <circle cx="62" cy="48" r="6" fill="#3e2723"/>
      <circle cx="64" cy="46" r="2" fill="#ffffff"/>
      <!-- Focinho e boca sorridente -->
      <ellipse cx="50" cy="60" rx="7" ry="5" fill="#3e2723"/>
      <path d="M 45 65 Q 50 72 55 65" fill="none" stroke="#3e2723" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 50 68 Q 50 78 54 75 Q 56 70 50 68" fill="#e57373"/>
    </svg>`
  },
  {
    id: 'gabi',
    name: 'Gabi',
    elo: 800,
    category: 'Casual',
    description: 'Joga por diversão nos fins de semana, desenvolve as peças mas às vezes cai em truques.',
    skillLevel: 2,
    depth: 2,
    movetime: 200,
    avatar: `<svg viewBox="0 0 100 100" class="bot-avatar-svg">
      <circle cx="50" cy="50" r="48" fill="#4dd0e1" stroke="#00acc1" stroke-width="3"/>
      <!-- Cabelo -->
      <circle cx="50" cy="45" r="34" fill="#6d4c41"/>
      <!-- Rosto -->
      <circle cx="50" cy="54" r="26" fill="#ffccbc"/>
      <!-- Franja -->
      <path d="M 28 42 Q 50 50 72 42 Q 50 34 28 42" fill="#5d4037"/>
      <!-- Óculos estilosos -->
      <circle cx="40" cy="52" r="8" fill="none" stroke="#e91e63" stroke-width="2.5"/>
      <circle cx="60" cy="52" r="8" fill="none" stroke="#e91e63" stroke-width="2.5"/>
      <line x1="48" y1="52" x2="52" y2="52" stroke="#e91e63" stroke-width="2.5"/>
      <!-- Olhos por trás das lentes -->
      <circle cx="40" cy="52" r="3.5" fill="#263238"/>
      <circle cx="60" cy="52" r="3.5" fill="#263238"/>
      <!-- Sorriso -->
      <path d="M 42 66 Q 50 73 58 66" fill="none" stroke="#d81b60" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'marcos',
    name: 'Marcos',
    elo: 1200,
    category: 'Intermediário',
    description: 'Estudou aberturas clássicas, adora controlar o centro e procura combinações táticas.',
    skillLevel: 5,
    depth: 4,
    movetime: 350,
    avatar: `<svg viewBox="0 0 100 100" class="bot-avatar-svg">
      <circle cx="50" cy="50" r="48" fill="#81c784" stroke="#43a047" stroke-width="3"/>
      <!-- Camisa gola polo -->
      <path d="M 25 85 L 50 68 L 75 85 Z" fill="#1b5e20"/>
      <!-- Rosto -->
      <ellipse cx="50" cy="50" rx="25" ry="30" fill="#f5d0b5"/>
      <!-- Cabelo moderno -->
      <path d="M 26 44 C 26 25 74 25 74 44 C 65 33 35 33 26 44 Z" fill="#212121"/>
      <!-- Olhos focados -->
      <circle cx="40" cy="48" r="4" fill="#212121"/>
      <circle cx="60" cy="48" r="4" fill="#212121"/>
      <circle cx="41" cy="47" r="1.5" fill="#ffffff"/>
      <circle cx="61" cy="47" r="1.5" fill="#ffffff"/>
      <!-- Sobrancelhas determinadas -->
      <line x1="34" y1="42" x2="45" y2="44" stroke="#212121" stroke-width="2" stroke-linecap="round"/>
      <line x1="55" y1="44" x2="66" y2="42" stroke="#212121" stroke-width="2" stroke-linecap="round"/>
      <!-- Nariz e sorriso confiante -->
      <path d="M 50 49 L 48 56 L 53 56" fill="none" stroke="#d7ccc8" stroke-width="2"/>
      <path d="M 43 64 Q 50 68 57 64" fill="none" stroke="#5d4037" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'helena',
    name: 'Mestre Helena',
    elo: 1600,
    category: 'Avançado',
    description: 'Jogadora de torneios regionais. Excelente cálculo posicional e punição implacável de erros.',
    skillLevel: 10,
    depth: 7,
    movetime: 600,
    avatar: `<svg viewBox="0 0 100 100" class="bot-avatar-svg">
      <circle cx="50" cy="50" r="48" fill="#ba68c8" stroke="#8e24aa" stroke-width="3"/>
      <!-- Cabelo comprido escuro -->
      <path d="M 22 55 C 22 26 78 26 78 55 C 78 78 72 82 72 82 L 28 82 C 28 82 22 78 22 55 Z" fill="#311b92"/>
      <!-- Rosto -->
      <circle cx="50" cy="52" r="24" fill="#ffdfba"/>
      <path d="M 28 42 Q 50 36 72 42 Z" fill="#311b92"/>
      <!-- Olhos expressivos -->
      <ellipse cx="40" cy="50" rx="5" ry="3.5" fill="#ffffff"/>
      <circle cx="40" cy="50" r="2.8" fill="#1a237e"/>
      <ellipse cx="60" cy="50" rx="5" ry="3.5" fill="#ffffff"/>
      <circle cx="60" cy="50" r="2.8" fill="#1a237e"/>
      <!-- Sorriso sutil e brinco -->
      <circle cx="26" cy="56" r="3" fill="#ffd700"/>
      <circle cx="74" cy="56" r="3" fill="#ffd700"/>
      <path d="M 44 65 Q 50 68 56 65" fill="none" stroke="#ad1457" stroke-width="2" stroke-linecap="round"/>
      <path d="M 47 30 L 50 22 L 53 30 Z" fill="#ffd700"/>
    </svg>`
  },
  {
    id: 'viktor',
    name: 'Viktor',
    elo: 2000,
    category: 'Mestre',
    description: 'Veterano frio e analítico. Converte pequenas vantagens em finais técnicos perfeitos.',
    skillLevel: 15,
    depth: 11,
    movetime: 900,
    avatar: `<svg viewBox="0 0 100 100" class="bot-avatar-svg">
      <circle cx="50" cy="50" r="48" fill="#78909c" stroke="#455a64" stroke-width="3"/>
      <!-- Terno e gravata -->
      <path d="M 25 90 L 50 65 L 75 90 Z" fill="#263238"/>
      <path d="M 48 68 L 50 82 L 52 68 Z" fill="#d32f2f"/>
      <!-- Rosto austero -->
      <rect x="30" y="30" width="40" height="42" rx="10" fill="#f5d0b5"/>
      <!-- Cabelo grisalho penteado -->
      <path d="M 28 36 C 28 20 72 20 72 36 L 28 36 Z" fill="#cfd8dc"/>
      <!-- Bigode clássico -->
      <path d="M 38 60 Q 50 56 62 60 Q 50 63 38 60 Z" fill="#90a4ae"/>
      <!-- Olhos penetrantes -->
      <line x1="36" y1="45" x2="46" y2="45" stroke="#263238" stroke-width="3"/>
      <line x1="54" y1="45" x2="64" y2="45" stroke="#263238" stroke-width="3"/>
      <circle cx="41" cy="49" r="2.5" fill="#263238"/>
      <circle cx="59" cy="49" r="2.5" fill="#263238"/>
    </svg>`
  },
  {
    id: 'deep-nova',
    name: 'Deep Nova',
    elo: 3200,
    category: 'Grande Mestre AI',
    description: 'Entidade de inteligência artificial de máxima profundidade. Visão tática quase invencível.',
    skillLevel: 20,
    depth: 16,
    movetime: 1500,
    avatar: `<svg viewBox="0 0 100 100" class="bot-avatar-svg">
      <circle cx="50" cy="50" r="48" fill="#0d1b2a" stroke="#00e5ff" stroke-width="3"/>
      <!-- Circuitos de fundo -->
      <path d="M 15 50 L 35 50 L 42 35" fill="none" stroke="#00e5ff" stroke-width="1.5" stroke-dasharray="2 3"/>
      <path d="M 85 50 L 65 50 L 58 65" fill="none" stroke="#00e5ff" stroke-width="1.5" stroke-dasharray="2 3"/>
      <!-- Placa facial cibernética -->
      <polygon points="50,20 78,35 78,65 50,82 22,65 22,35" fill="#1b263b" stroke="#00e5ff" stroke-width="2"/>
      <!-- Olho óptico central / Visor -->
      <rect x="30" y="44" width="40" height="12" rx="6" fill="#000000" stroke="#76ff03" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="4.5" fill="#76ff03">
        <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <!-- Coroa digital GM -->
      <path d="M 40 26 L 50 15 L 60 26 L 55 30 L 45 30 Z" fill="#ffd700"/>
    </svg>`
  }
];

export function getBotById(id) {
  return BOTS.find(b => b.id === id) || BOTS[0];
}
