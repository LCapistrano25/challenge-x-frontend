import type { ReactNode, SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

// Todos os ícones herdam a cor do texto (currentColor). Troque os caminhos se o Figma usar outro set.
function make(children: ReactNode, displayName: string) {
  const Icon = ({ size = 20, ...rest }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
  Icon.displayName = displayName;
  return Icon;
}

export const IconHome = make(
  <>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </>,
  'IconHome',
);
export const IconClipboard = make(
  <>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4V3h6v1" />
    <path d="M9 11h6M9 15h6" />
  </>,
  'IconClipboard',
);
export const IconArchive = make(
  <>
    <rect x="3" y="4" width="18" height="5" rx="1" />
    <path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
    <path d="M10 13h4" />
  </>,
  'IconArchive',
);
export const IconHelp = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.2-2.5 3.6" />
    <path d="M12 17.5h.01" />
  </>,
  'IconHelp',
);
export const IconUser = make(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </>,
  'IconUser',
);
export const IconUsers = make(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
    <path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
  </>,
  'IconUsers',
);
export const IconCalendar = make(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </>,
  'IconCalendar',
);
export const IconFile = make(
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h6" />
  </>,
  'IconFile',
);
export const IconMessage = make(
  <>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
    <path d="M9 11h6M9 14h4" />
  </>,
  'IconMessage',
);
export const IconDownload = make(
  <>
    <path d="M12 3v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M5 20h14" />
  </>,
  'IconDownload',
);
export const IconUpload = make(
  <>
    <path d="M12 16V4" />
    <path d="m7 8 5-5 5 5" />
    <path d="M5 20h14" />
  </>,
  'IconUpload',
);
export const IconCheck = make(<path d="m5 12.5 4.5 4.5L19 7.5" />, 'IconCheck');
export const IconClose = make(<path d="M6 6l12 12M18 6 6 18" />, 'IconClose');
export const IconMenu = make(<path d="M4 6h16M4 12h16M4 18h16" />, 'IconMenu');
export const IconPlus = make(<path d="M12 5v14M5 12h14" />, 'IconPlus');
export const IconTrash = make(
  <>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="m6 7 1 13h10l1-13" />
  </>,
  'IconTrash',
);
export const IconSearch = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
  'IconSearch',
);
export const IconLock = make(
  <>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
  </>,
  'IconLock',
);
export const IconChevronDown = make(<path d="m6 9 6 6 6-6" />, 'IconChevronDown');
export const IconChevronLeft = make(<path d="m15 6-6 6 6 6" />, 'IconChevronLeft');
export const IconChevronRight = make(<path d="m9 6 6 6-6 6" />, 'IconChevronRight');
export const IconInfo = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </>,
  'IconInfo',
);
export const IconAlert = make(
  <>
    <path d="M10.3 4.3 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </>,
  'IconAlert',
);
export const IconCheckCircle = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.5 2.7 2.7L16 9.5" />
  </>,
  'IconCheckCircle',
);
