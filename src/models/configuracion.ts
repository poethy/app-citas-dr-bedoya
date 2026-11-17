export interface Configuracion {
  anticipacionAgendarHoras: number;
  anticipacionCambiosHoras: number;
  nombreProfesional: string;
  especialidad: string;
  /** «Consultorio 201, Ed. Torcoroma» */
  lugar: string;
  /** «Calle 18 # 5-27, Pereira» */
  direccion: string;
  telefono: string | null;
  coordenadas: { latitud: number; longitud: number } | null;
}
