import { ESTADO_LABEL, type EstadoPresupuesto } from '@/lib/types';

export default function Badge({ estado }: { estado: EstadoPresupuesto }) {
  return <span className={`badge badge-${estado}`}>{ESTADO_LABEL[estado]}</span>;
}