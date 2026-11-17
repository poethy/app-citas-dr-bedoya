// Tipos generados desde la base de Supabase (proyecto app-citas-dr-bedoya), 17/11/2026.
// Se recortaron las funciones internas que la app no puede llamar (validaciones, avisos,
// recordatorios) y se simplificaron los genéricos Tables/TablesInsert/TablesUpdate/Enums.
// Para regenerarlos después de una migración:
//   npx supabase gen types typescript --project-id hiechbnorpgzrwfgufjp > src/types/database.ts
// (y volver a quitar las funciones internas). Son la referencia de cómo responde la API;
// las interfaces de src/types/api.ts y los modelos de src/models/ se construyen a partir de estos.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bloqueos: {
        Row: {
          creado_en: string
          creado_por: string | null
          id: string
          motivo: string
          rango: unknown
        }
        Insert: {
          creado_en?: string
          creado_por?: string | null
          id?: string
          motivo: string
          rango: unknown
        }
        Update: {
          creado_en?: string
          creado_por?: string | null
          id?: string
          motivo?: string
          rango?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "bloqueos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bloqueos_recurrentes: {
        Row: {
          dia_semana: number
          hora_fin: string
          hora_inicio: string
          id: string
          motivo: string
        }
        Insert: {
          dia_semana: number
          hora_fin: string
          hora_inicio: string
          id?: string
          motivo: string
        }
        Update: {
          dia_semana?: number
          hora_fin?: string
          hora_inicio?: string
          id?: string
          motivo?: string
        }
        Relationships: []
      }
      citas: {
        Row: {
          actualizado_en: string
          creado_en: string
          creado_por: string | null
          estado: Database["public"]["Enums"]["estado_cita"]
          fin: string
          id: string
          inicio: string
          numero: number
          origen: Database["public"]["Enums"]["origen_cita"]
          paciente_id: string
          recordatorio_enviado_para: string | null
          respondida_en: string | null
          servicio_id: string
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          creado_por?: string | null
          estado: Database["public"]["Enums"]["estado_cita"]
          fin: string
          id?: string
          inicio: string
          numero?: never
          origen?: Database["public"]["Enums"]["origen_cita"]
          paciente_id: string
          recordatorio_enviado_para?: string | null
          respondida_en?: string | null
          servicio_id: string
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          creado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_cita"]
          fin?: string
          id?: string
          inicio?: string
          numero?: never
          origen?: Database["public"]["Enums"]["origen_cita"]
          paciente_id?: string
          recordatorio_enviado_para?: string | null
          respondida_en?: string | null
          servicio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "citas_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion: {
        Row: {
          anticipacion_agendar_horas: number
          anticipacion_cambios_horas: number
          direccion: string
          especialidad: string
          id: number
          latitud: number | null
          longitud: number | null
          lugar: string
          nombre_profesional: string
          recordatorio_horas_antes: number
          telefono: string | null
        }
        Insert: {
          anticipacion_agendar_horas?: number
          anticipacion_cambios_horas?: number
          direccion: string
          especialidad: string
          id?: number
          latitud?: number | null
          longitud?: number | null
          lugar: string
          nombre_profesional: string
          recordatorio_horas_antes?: number
          telefono?: string | null
        }
        Update: {
          anticipacion_agendar_horas?: number
          anticipacion_cambios_horas?: number
          direccion?: string
          especialidad?: string
          id?: number
          latitud?: number | null
          longitud?: number | null
          lugar?: string
          nombre_profesional?: string
          recordatorio_horas_antes?: number
          telefono?: string | null
        }
        Relationships: []
      }
      horario_atencion: {
        Row: {
          dia_semana: number
          hora_fin: string
          hora_inicio: string
        }
        Insert: {
          dia_semana: number
          hora_fin: string
          hora_inicio: string
        }
        Update: {
          dia_semana?: number
          hora_fin?: string
          hora_inicio?: string
        }
        Relationships: []
      }
      notificaciones: {
        Row: {
          cita_id: string | null
          creado_en: string
          cuerpo: string
          destinatario_id: string
          enviada_push: boolean
          id: string
          leida: boolean
          tipo: string
          titulo: string
        }
        Insert: {
          cita_id?: string | null
          creado_en?: string
          cuerpo: string
          destinatario_id: string
          enviada_push?: boolean
          id?: string
          leida?: boolean
          tipo: string
          titulo: string
        }
        Update: {
          cita_id?: string | null
          creado_en?: string
          cuerpo?: string
          destinatario_id?: string
          enviada_push?: boolean
          id?: string
          leida?: boolean
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          correo: string | null
          creado_en: string
          id: string
          nombre: string
          perfil_id: string | null
          telefono: string
        }
        Insert: {
          correo?: string | null
          creado_en?: string
          id?: string
          nombre: string
          perfil_id?: string | null
          telefono: string
        }
        Update: {
          correo?: string | null
          creado_en?: string
          id?: string
          nombre?: string
          perfil_id?: string | null
          telefono?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          correo: string
          creado_en: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          telefono: string
        }
        Insert: {
          correo: string
          creado_en?: string
          id: string
          nombre: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          telefono?: string
        }
        Update: {
          correo?: string
          creado_en?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          telefono?: string
        }
        Relationships: []
      }
      servicios: {
        Row: {
          activo: boolean
          confirmacion: Database["public"]["Enums"]["tipo_confirmacion"]
          duracion_min: number
          id: string
          nombre: string
          precio_cop: number
        }
        Insert: {
          activo?: boolean
          confirmacion: Database["public"]["Enums"]["tipo_confirmacion"]
          duracion_min: number
          id?: string
          nombre: string
          precio_cop: number
        }
        Update: {
          activo?: boolean
          confirmacion?: Database["public"]["Enums"]["tipo_confirmacion"]
          duracion_min?: number
          id?: string
          nombre?: string
          precio_cop?: number
        }
        Relationships: []
      }
      tokens_push: {
        Row: {
          actualizado_en: string
          perfil_id: string
          token: string
        }
        Insert: {
          actualizado_en?: string
          perfil_id: string
          token: string
        }
        Update: {
          actualizado_en?: string
          perfil_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "tokens_push_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancelar_cita: {
        Args: { p_cita_id: string }
        Returns: Database["public"]["Tables"]["citas"]["Row"]
      }
      crear_bloqueo: {
        Args: { p_fin: string; p_inicio: string; p_motivo: string }
        Returns: Database["public"]["Tables"]["bloqueos"]["Row"]
      }
      disponibilidad_dia: { Args: { p_fecha: string }; Returns: Json }
      es_odontologo: { Args: never; Returns: boolean }
      paciente_actual_id: { Args: never; Returns: string }
      registrar_cita_consultorio: {
        Args: {
          p_inicio: string
          p_nombre: string
          p_servicio_id: string
          p_telefono: string
        }
        Returns: Database["public"]["Tables"]["citas"]["Row"]
      }
      reprogramar_cita: {
        Args: { p_cita_id: string; p_nuevo_inicio: string }
        Returns: Database["public"]["Tables"]["citas"]["Row"]
      }
      responder_solicitud: {
        Args: { p_aprobar: boolean; p_cita_id: string }
        Returns: Database["public"]["Tables"]["citas"]["Row"]
      }
      solicitar_cita: {
        Args: { p_inicio: string; p_servicio_id: string }
        Returns: Database["public"]["Tables"]["citas"]["Row"]
      }
    }
    Enums: {
      estado_cita: "pendiente" | "confirmada" | "rechazada" | "cancelada"
      origen_cita: "app" | "consultorio"
      rol_usuario: "paciente" | "odontologo"
      tipo_confirmacion: "inmediata" | "aprobacion"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
      estado_cita: ["pendiente", "confirmada", "rechazada", "cancelada"],
      origen_cita: ["app", "consultorio"],
      rol_usuario: ["paciente", "odontologo"],
      tipo_confirmacion: ["inmediata", "aprobacion"],
    },
  },
} as const
