import {
  Armchair, ArrowRight, Bell, BellOff, Bird, BookOpen, Brush, Building2, Cake, CalendarDays, Camera, Car,
  ChartColumn, Check, Church, CircleCheck, CircleHelp, CircleX, Clock, Compass, CreditCard, Crown, DoorOpen,
  Drama, Dumbbell, ExternalLink, Feather, FileText, Flame, Flower2, FolderOpen, Gem, Gift, Globe, Hand,
  Handshake, Heart, Hourglass, House, Info, KeyRound, Landmark, Laptop, Lightbulb, Link, Lock, Luggage, Mail,
  MapPin, Menu, MessageCircle, Mic, Minus, Music, Paperclip, Pencil, Plane, Plus, Rocket, Save, Scissors, Search, Send, Settings,
  Shield, Shirt, ShoppingBag, ShoppingCart, Smartphone, Sparkles, Store, Tag, Tent, Ticket, TrendingUp, Trash2,
  TriangleAlert, Trophy, Undo2, User, Users, Utensils, Video, Wallet, Wine, X,
} from 'lucide-react'

// One consistent line-icon set (Lucide) instead of platform emoji, which look
// different on every phone. Usage:
//   <Icon name="ticket" />            a named icon
//   <Icon glyph="🎟️" />              an emoji stored in data -> its icon
// Icons inherit the surrounding text colour and size (1.1em by default).
const ICONS = {
  armchair: Armchair, arrow: ArrowRight, bell: Bell, bellOff: BellOff, bird: Bird, book: BookOpen, brush: Brush,
  building: Building2, cake: Cake, calendar: CalendarDays, camera: Camera, car: Car, chart: ChartColumn,
  check: Check, church: Church, checkCircle: CircleCheck, help: CircleHelp, xCircle: CircleX, clock: Clock,
  compass: Compass, card: CreditCard, crown: Crown, door: DoorOpen, masks: Drama, ball: Dumbbell,
  external: ExternalLink, feather: Feather, file: FileText, flame: Flame, flower: Flower2, folder: FolderOpen,
  ring: Gem, gift: Gift, globe: Globe, hand: Hand, handshake: Handshake, heart: Heart, hourglass: Hourglass,
  home: House, info: Info, key: KeyRound, landmark: Landmark, laptop: Laptop, idea: Lightbulb, link: Link,
  lock: Lock, luggage: Luggage, mail: Mail, pin: MapPin, chat: MessageCircle, mic: Mic, music: Music,
  clip: Paperclip, pencil: Pencil, plane: Plane, rocket: Rocket, save: Save, scissors: Scissors, search: Search,
  send: Send, settings: Settings, shield: Shield, shirt: Shirt, bag: ShoppingBag, cart: ShoppingCart,
  phone: Smartphone, sparkles: Sparkles, store: Store, tag: Tag, tent: Tent, ticket: Ticket, trend: TrendingUp, trash: Trash2,
  alert: TriangleAlert, trophy: Trophy, undo: Undo2, user: User, users: Users, food: Utensils, video: Video,
  wallet: Wallet, menu: Menu, plus: Plus, minus: Minus, wine: Wine, x: X,
}

// Every emoji used anywhere in the app -> the icon that replaces it.
const GLYPHS = {
  '#️⃣': 'tag', '#⃣': 'tag',
  '🤵': 'user', '👰': 'user', '🎸': 'music', '🙏': 'heart',
  '🎉': 'sparkles', '✨': 'sparkles', '🚀': 'rocket', '🔥': 'flame', '💡': 'idea',
  '💍': 'ring', '💐': 'flower', '🌸': 'flower', '🎀': 'gift', '🎁': 'gift', '🎂': 'cake',
  '🎟️': 'ticket', '🎟': 'ticket', '🎤': 'mic', '🎵': 'music', '🎶': 'music', '🎪': 'tent', '🎭': 'masks',
  '🎥': 'video', '📷': 'camera', '📸': 'camera',
  '💬': 'chat', '✉️': 'mail', '💌': 'mail', '📨': 'mail', '📤': 'send', '📲': 'phone', '📱': 'phone',
  '❤️': 'heart', '🤍': 'heart',
  '📍': 'pin', '🧭': 'compass', '🌍': 'globe', '🌐': 'globe', '✈️': 'plane', '🚗': 'car', '🧳': 'luggage',
  '⚠️': 'alert', '⚠': 'alert', '❌': 'xCircle', '✅': 'checkCircle', '❓': 'help', 'ℹ️': 'info',
  '🏪': 'store', '🛒': 'cart', '🏷️': 'tag', '💳': 'card', '💰': 'wallet', '🧾': 'file', '📄': 'file',
  '📜': 'file', '📝': 'pencil', '✏️': 'pencil', '📎': 'clip', '💾': 'save',
  '🔒': 'lock', '🔑': 'key', '🛡️': 'shield', '🔔': 'bell', '🔕': 'bellOff',
  '⛪': 'church', '🕌': 'landmark', '🏛️': 'landmark', '🏢': 'building', '🏠': 'home', '🕊️': 'bird',
  '🤝': 'handshake', '👤': 'user', '🤵': 'user', '👰': 'user', '👥': 'users', '👪': 'users', '👑': 'crown',
  '👋': 'hand', '🚪': 'door', '🪑': 'armchair',
  '📅': 'calendar', '⏳': 'hourglass', '🕓': 'clock',
  '📊': 'chart', '📈': 'trend', '🔍': 'search', '🔎': 'search', '🔗': 'link',
  '📘': 'book', '📖': 'book', '🗂️': 'folder', '📁': 'folder', '🗑️': 'trash',
  '🍽️': 'food', '🥂': 'wine', '🍾': 'wine', '👗': 'shirt', '💄': 'brush', '🧵': 'scissors', '✂': 'scissors',
  '🧺': 'bag', '🐐': 'bird', '🪶': 'feather', '⚽': 'ball', '💻': 'laptop', '⚙️': 'settings',
  '↩': 'undo', '↗': 'external', '🟡': 'sparkles',
}
// Event categories -> icon (used for events that have no photo).
const CATEGORY_ICONS = { Musique: 'music', Festival: 'tent', Sport: 'trophy', Tech: 'laptop', Culturel: 'masks', Gastronomie: 'food', Mariage: 'ring' }
export const categoryIcon = (category) => CATEGORY_ICONS[category] || 'ticket'

export const hasIcon = (glyph) => Boolean(GLYPHS[glyph])

export function Icon({ name, glyph, size = '1.1em', strokeWidth = 2, className, style, ...rest }) {
  const Cmp = ICONS[name || GLYPHS[glyph]]
  if (!Cmp) return glyph ? <span aria-hidden="true">{glyph}</span> : null
  return (
    <Cmp
      width={size} height={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" focusable="false"
      style={{ verticalAlign: '-0.18em', flexShrink: 0, ...style }}
      {...rest}
    />
  )
}

export default Icon
