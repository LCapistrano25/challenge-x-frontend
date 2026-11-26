import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & { size?: number };

/** Ícones da área do avaliador (Figma: Material Symbols "Outline" e avisos com contorno). */
function Filled({ size = 24, children, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

function Outline({ size = 20, children, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Figma: "Arquivo". */
export function IconDocument(props: Props) {
  return (
    <Filled {...props}>
      <path d="M6 22q-.825 0-1.413-.588T4 20V4q0-.825.588-1.413T6 2h8l6 6v12q0 .825-.588 1.413T18 22H6Zm7-13V4H6v16h12V9h-5Z" />
    </Filled>
  );
}

/** Figma: "Baixar arquivo". */
export function IconDownloadFile(props: Props) {
  return (
    <Filled size={20} {...props}>
      <path d="m12 16-5-5 1.4-1.45 2.6 2.6V4h2v8.15l2.6-2.6L17 11l-5 5Zm-6 4q-.825 0-1.413-.588T4 18v-3h2v3h12v-3h2v3q0 .825-.588 1.413T18 20H6Z" />
    </Filled>
  );
}

/** Figma: "Abrir link externo". */
export function IconOpenExternal(props: Props) {
  return (
    <Filled size={20} {...props}>
      <path d="M5 21q-.825 0-1.413-.588T3 19V5q0-.825.588-1.413T5 3h7v2H5v14h14v-7h2v7q0 .825-.588 1.413T19 21H5Zm4.7-5.3-1.4-1.4L17.6 5H14V3h7v7h-2V6.4l-9.3 9.3Z" />
    </Filled>
  );
}

/** Figma: "material-symbols:assignment-outline" (estado vazio dos projetos). */
export function IconAssignment(props: Props) {
  return (
    <Filled {...props}>
      <path d="M7 17h7v-2H7v2Zm0-4h10v-2H7v2Zm0-4h10V7H7v2ZM5 21q-.825 0-1.413-.588T3 19V5q0-.825.588-1.413T5 3h4.2q.325-.9 1.088-1.45T12 1q.95 0 1.713.55T14.8 3H19q.825 0 1.413.588T21 5v14q0 .825-.588 1.413T19 21H5Zm0-2h14V5H5v14Zm7-14.75q.325 0 .538-.213t.212-.537q0-.325-.212-.538T12 2.75q-.325 0-.538.213t-.212.537q0 .325.212.537T12 4.25Z" />
    </Filled>
  );
}

/** Figma: "material-symbols:inventory-2-outline" (histórico vazio). */
export function IconInventory(props: Props) {
  return (
    <Filled {...props}>
      <path d="M5 22q-.825 0-1.413-.588T3 20V8.725q-.45-.275-.725-.713T2 7V4q0-.825.588-1.413T4 2h16q.825 0 1.413.588T22 4v3q0 .575-.275 1.012T21 8.725V20q0 .825-.588 1.413T19 22H5Zm0-13v11h14V9H5ZM4 7h16V4H4v3Zm5 7h6v-2H9v2Z" />
    </Filled>
  );
}

/** Figma: "info" dos avisos. */
export function IconInfoCircle(props: Props) {
  return (
    <Outline {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </Outline>
  );
}

/** Aviso de erro e de atenção (círculo com exclamação). */
export function IconAlertCircle(props: Props) {
  return (
    <Outline {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5" />
      <path d="M12 16h.01" />
    </Outline>
  );
}

/** Aviso de sucesso (círculo com check). */
export function IconCheckCircleOutline(props: Props) {
  return (
    <Outline {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </Outline>
  );
}
