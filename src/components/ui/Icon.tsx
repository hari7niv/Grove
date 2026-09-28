/**
 * Custom SVG icon set for Grove.
 *
 * Consistent outline style, 24x24 viewBox, 1.5px stroke weight.
 * These are drawn as path data — no emoji, no stock icons.
 */

import React from 'react';
import Svg, { Path, Circle, Rect, Polyline, Line } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const defaultProps: Required<IconProps> = {
  size: 24,
  color: '#1A1A18',
  strokeWidth: 1.5,
};

function makeIcon(
  pathFn: (p: Required<IconProps>) => React.ReactNode,
) {
  return function Icon(props: IconProps) {
    const p = { ...defaultProps, ...props };
    return (
      <Svg
        width={p.size}
        height={p.size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={p.color}
        strokeWidth={p.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {pathFn(p)}
      </Svg>
    );
  };
}

// ─── Navigation Icons ───────────────────────────────────────────

export const HomeIcon = makeIcon(() => (
  <>
    <Path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" />
  </>
));

export const GardenIcon = makeIcon(() => (
  <>
    <Path d="M12 22V14" />
    <Path d="M12 14C12 14 7 13 7 8C7 5 9 3 12 2C15 3 17 5 17 8C17 13 12 14 12 14Z" />
    <Path d="M7.5 17C5.5 16 4 14 4 11.5" />
    <Path d="M16.5 17C18.5 16 20 14 20 11.5" />
  </>
));

export const FitnessIcon = makeIcon(() => (
  <>
    <Path d="M6.5 6.5L17.5 17.5" />
    <Path d="M3 10L6.5 6.5" />
    <Path d="M17.5 17.5L21 14" />
    <Path d="M14 3L10 7" />
    <Path d="M17 7L14 3" />
    <Path d="M7 17L10 21" />
    <Path d="M10 21L14 17" />
  </>
));

export const TasksIcon = makeIcon(() => (
  <>
    <Rect x="3" y="3" width="18" height="18" rx="3" />
    <Path d="M8 12L11 15L16 9" />
  </>
));

export const BookIcon = makeIcon(() => (
  <>
    <Path d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20" />
    <Path d="M6.5 2H20V22H6.5C5.11929 22 4 20.8807 4 19.5V4.5C4 3.11929 5.11929 2 6.5 2Z" />
    <Line x1="8" y1="6" x2="16" y2="6" />
    <Line x1="8" y1="10" x2="13" y2="10" />
  </>
));

export const TargetIcon = makeIcon(() => (
  <>
    <Circle cx="12" cy="12" r="9" />
    <Circle cx="12" cy="12" r="5" />
    <Circle cx="12" cy="12" r="1" />
  </>
));

export const BrainIcon = makeIcon(() => (
  <>
    <Path d="M12 2C9 2 6.5 4 6.5 7C5 7.5 4 9 4 10.5C4 12.5 5.5 14 7 14.5V22H17V14.5C18.5 14 20 12.5 20 10.5C20 9 19 7.5 17.5 7C17.5 4 15 2 12 2Z" />
    <Path d="M9 14.5V17" />
    <Path d="M15 14.5V17" />
    <Path d="M12 10V14" />
  </>
));

export const MoreIcon = makeIcon(() => (
  <>
    <Circle cx="12" cy="5" r="1" fill="currentColor" />
    <Circle cx="12" cy="12" r="1" fill="currentColor" />
    <Circle cx="12" cy="19" r="1" fill="currentColor" />
  </>
));

// ─── Action Icons ───────────────────────────────────────────────

export const PlusIcon = makeIcon(() => (
  <>
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </>
));

export const SearchIcon = makeIcon(() => (
  <>
    <Circle cx="11" cy="11" r="7" />
    <Path d="M21 21L16.5 16.5" />
  </>
));

export const SettingsIcon = makeIcon(() => (
  <>
    <Circle cx="12" cy="12" r="3" />
    <Path d="M12 1V4M12 20V23M4.22 4.22L6.34 6.34M17.66 17.66L19.78 19.78M1 12H4M20 12H23M4.22 19.78L6.34 17.66M17.66 6.34L19.78 4.22" />
  </>
));

export const ChevronRightIcon = makeIcon(() => (
  <Polyline points="9 6 15 12 9 18" />
));

export const ChevronLeftIcon = makeIcon(() => (
  <Polyline points="15 6 9 12 15 18" />
));

export const ClockIcon = makeIcon(() => (
  <>
    <Circle cx="12" cy="12" r="9" />
    <Polyline points="12 7 12 12 15 15" />
  </>
));

export const CalendarIcon = makeIcon(() => (
  <>
    <Rect x="3" y="4" width="18" height="18" rx="2" />
    <Line x1="16" y1="2" x2="16" y2="6" />
    <Line x1="8" y1="2" x2="8" y2="6" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </>
));

export const PlayIcon = makeIcon(() => (
  <Path d="M6 4L20 12L6 20V4Z" fill="currentColor" />
));

export const PauseIcon = makeIcon(() => (
  <>
    <Rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
    <Rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
  </>
));

export const CheckIcon = makeIcon(() => (
  <Polyline points="5 12 10 17 19 7" />
));

export const XIcon = makeIcon(() => (
  <>
    <Line x1="6" y1="6" x2="18" y2="18" />
    <Line x1="18" y1="6" x2="6" y2="18" />
  </>
));

export const LeafIcon = makeIcon(() => (
  <>
    <Path d="M12 22C12 22 4 16 4 10C4 6 7 2 12 2C17 2 20 6 20 10C20 16 12 22 12 22Z" />
    <Path d="M12 22V10" />
    <Path d="M8 14C10 12 12 12 12 12" />
    <Path d="M16 10C14 12 12 12 12 12" />
  </>
));

export const DropletIcon = makeIcon(() => (
  <Path d="M12 2L6 10C6 14.4183 8.68629 18 12 18C15.3137 18 18 14.4183 18 10L12 2Z" />
));

export const TrendUpIcon = makeIcon(() => (
  <>
    <Polyline points="3 17 9 11 13 15 21 7" />
    <Polyline points="15 7 21 7 21 13" />
  </>
));

export const BarChartIcon = makeIcon(() => (
  <>
    <Rect x="3" y="12" width="4" height="9" rx="1" />
    <Rect x="10" y="7" width="4" height="14" rx="1" />
    <Rect x="17" y="3" width="4" height="18" rx="1" />
  </>
));

export const MapPinIcon = makeIcon(() => (
  <>
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </>
));

export const RssIcon = makeIcon(() => (
  <>
    <Path d="M4 11a9 9 0 0 1 9 9" />
    <Path d="M4 4a16 16 0 0 1 16 16" />
    <Circle cx="5" cy="19" r="1" fill="currentColor" />
  </>
));

export const BookmarkIcon = makeIcon(({ color }) => (
  <Path d="M19 21L12 16L5 21V5C5 4.44772 5.44772 4 6 4H18C18.5523 4 19 4.44772 19 5V21Z" />
));

export const BookmarkFilledIcon = makeIcon(({ color }) => (
  <Path d="M19 21L12 16L5 21V5C5 4.44772 5.44772 4 6 4H18C18.5523 4 19 4.44772 19 5V21Z" fill={color} />
));

export const ExternalLinkIcon = makeIcon(() => (
  <>
    <Path d="M18 13V19C18 19.5523 17.5523 20 17 20H5C4.44772 20 4 19.5523 4 19V7C4 6.44772 4.44772 6 5 6H11" />
    <Polyline points="15 3 21 3 21 9" />
    <Line x1="10" y1="14" x2="21" y2="3" />
  </>
));

export const TrashIcon = makeIcon(() => (
  <>
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6" />
    <Path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6" />
  </>
));

export const RefreshIcon = makeIcon(() => (
  <>
    <Polyline points="23 4 23 10 17 10" />
    <Path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </>
));

// ─── Gamification & Badges ─────────────────────────────────────

export const FireIcon = makeIcon(() => (
  <>
    <Path d="M12 2C12 2 15 5 15 9C15 13 12 16 12 16C12 16 9 13 9 9C9 5 12 2 12 2Z" />
    <Path d="M12 2C12 2 18 5 19 12C20 18 17 22 12 22C7 22 4 18 5 12C6 5 12 2 12 2Z" />
  </>
));

export const TrophyIcon = makeIcon(() => (
  <>
    <Path d="M8 21H16" />
    <Path d="M12 17V21" />
    <Path d="M7 4H17V10C17 12.7614 14.7614 15 12 15C9.23858 15 7 12.7614 7 10V4Z" />
    <Path d="M7 6H4V9C4 10.6569 5.34315 12 7 12" />
    <Path d="M17 6H20V9C20 10.6569 18.6569 12 17 12" />
  </>
));

export const ShieldIcon = makeIcon(() => (
  <>
    <Path d="M12 22S8 18 8 12V5L12 3L16 5V12C16 18 12 22 12 22Z" />
    <Path d="M12 3V22" />
  </>
));

// ─── Icon map for dynamic lookup ────────────────────────────────

export const icons = {
  home: HomeIcon,
  garden: GardenIcon,
  fitness: FitnessIcon,
  tasks: TasksIcon,
  book: BookIcon,
  target: TargetIcon,
  brain: BrainIcon,
  more: MoreIcon,
  plus: PlusIcon,
  search: SearchIcon,
  settings: SettingsIcon,
  chevronRight: ChevronRightIcon,
  chevronLeft: ChevronLeftIcon,
  clock: ClockIcon,
  calendar: CalendarIcon,
  play: PlayIcon,
  pause: PauseIcon,
  check: CheckIcon,
  x: XIcon,
  leaf: LeafIcon,
  droplet: DropletIcon,
  trendUp: TrendUpIcon,
  barChart: BarChartIcon,
  rss: RssIcon,
  bookmark: BookmarkIcon,
  bookmarkFilled: BookmarkFilledIcon,
  externalLink: ExternalLinkIcon,
  trash: TrashIcon,
  refresh: RefreshIcon,
  fire: FireIcon,
  trophy: TrophyIcon,
  shield: ShieldIcon,
} as const;

export type IconName = keyof typeof icons;

