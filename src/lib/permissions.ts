/**
 * Sistema de permisos unificado — ZIII Living
 * Plataforma de gestión comunitaria multi-propiedad
 *
 * Roles del sistema:
 *  - admin             : Administrador total del sistema
 *  - corporate_admin   : Administrador multi-propiedad / gestor comunitario
 *  - supervisor        : Supervisor de área (IT o Mantenimiento)
 *  - agent_l1 / l2     : Técnicos de soporte IT o mantenimiento
 *  - auditor           : Solo lectura, reportes y auditoría
 *  - resident          : Residente del condominio — portal propio
 *  - security_guard    : Guardia de seguridad — control de acceso / QR
 *  - requester         : Usuario solicitante (legacy, equivalente a residente en contexto tickets)
 */

export type Role =
  | 'requester'
  | 'agent_l1'
  | 'agent_l2'
  | 'supervisor'
  | 'auditor'
  | 'corporate_admin'
  | 'admin'
  | 'resident'
  | 'security_guard'

export type Permission =
  | 'view_all_tickets'
  | 'manage_tickets'
  | 'assign_tickets'
  | 'close_tickets'
  | 'escalate_tickets'
  | 'view_reports'
  | 'manage_users'
  | 'manage_assets'
  | 'view_beo'
  | 'view_audit'
  | 'manage_locations'
  | 'delete_tickets'
  | 'supervisor_access'
  // Permisos comunitarios
  | 'view_finances'
  | 'manage_finances'
  | 'manage_billing'
  | 'view_residents'
  | 'manage_residents'
  | 'manage_reservations'
  | 'view_access_log'
  | 'manage_access_control'
  | 'manage_surveys'
  | 'vote_surveys'

export interface UserProfile {
  role: Role
  is_it_supervisor?: boolean
  is_maintenance_supervisor?: boolean
  asset_category?: string | null
  hub_visible_modules?: Record<string, boolean> | null
  unit_number?: string | null        // Número de unidad/departamento del residente
  property_id?: string | null        // Propiedad a la que pertenece el residente/guardia
}

/**
 * Verifica si un usuario tiene permisos de supervisor para IT
 * corporate_admin: usa hub_visible_modules['it-helpdesk']
 */
export function isITSupervisor(profile: UserProfile): boolean {
  if (profile.role === 'admin') return true
  if (profile.role === 'supervisor' && profile.asset_category === 'IT') return true
  // corporate_admin: verificar hub_visible_modules (preferido) o is_it_supervisor (legacy)
  if (profile.role === 'corporate_admin') {
    if (profile.hub_visible_modules?.['it-helpdesk'] === true) return true
    if (profile.is_it_supervisor === true) return true
  }
  return false
}

/**
 * Verifica si un usuario tiene permisos de supervisor para Mantenimiento
 * corporate_admin: usa hub_visible_modules['mantenimiento']
 */
export function isMaintenanceSupervisor(profile: UserProfile): boolean {
  if (profile.role === 'admin') return true
  if (profile.role === 'supervisor' && profile.asset_category === 'MAINTENANCE') return true
  // corporate_admin: verificar hub_visible_modules (preferido) o is_maintenance_supervisor (legacy)
  if (profile.role === 'corporate_admin') {
    if (profile.hub_visible_modules?.['mantenimiento'] === true) return true
    if (profile.is_maintenance_supervisor === true) return true
  }
  return false
}

/**
 * Verifica si un rol incluye permisos de supervisor (cualquier área)
 * Requiere el perfil completo para verificar permisos específicos de corporate_admin
 */
export function hasSupervisorPermissions(profile: UserProfile): boolean {
  if (profile.role === 'admin' || profile.role === 'supervisor') return true
  if (profile.role === 'corporate_admin') {
    return profile.is_it_supervisor === true || profile.is_maintenance_supervisor === true
  }
  return false
}

/**
 * Verifica si un rol puede gestionar tickets (agente o superior)
 */
export function canManageTickets(role: Role): boolean {
  return ['agent_l1', 'agent_l2', 'supervisor', 'corporate_admin', 'admin'].includes(role)
}

/**
 * Verifica si un usuario puede asignar/reasignar tickets
 * Requiere perfil para verificar permisos de corporate_admin
 */
export function canAssignTickets(profile: UserProfile): boolean {
  if (['agent_l2', 'supervisor', 'admin'].includes(profile.role)) return true
  if (profile.role === 'corporate_admin') {
    return profile.is_it_supervisor === true || profile.is_maintenance_supervisor === true
  }
  return false
}

/**
 * Verifica si un usuario puede ver todos los tickets (no solo asignados)
 */
export function canViewAllTickets(profile: UserProfile): boolean {
  if (['supervisor', 'admin', 'auditor'].includes(profile.role)) return true
  if (profile.role === 'corporate_admin') {
    return profile.is_it_supervisor === true || profile.is_maintenance_supervisor === true
  }
  return false
}

/**
 * Verifica si un usuario puede acceder a reportes avanzados
 */
export function canViewReports(profile: UserProfile): boolean {
  if (['supervisor', 'admin', 'auditor'].includes(profile.role)) return true
  if (profile.role === 'corporate_admin') {
    return profile.is_it_supervisor === true || profile.is_maintenance_supervisor === true
  }
  return false
}

/**
 * Verifica si un rol puede gestionar usuarios
 */
export function canManageUsers(role: Role): boolean {
  return ['admin'].includes(role)
}

/**
 * Verifica si un usuario puede eliminar tickets
 */
export function canDeleteTickets(profile: UserProfile): boolean {
  if (['admin', 'supervisor'].includes(profile.role)) return true
  if (profile.role === 'corporate_admin') {
    return profile.is_it_supervisor === true || profile.is_maintenance_supervisor === true
  }
  return false
}

/**
 * Verifica si un usuario puede editar activos de tickets
 */
export function canEditTicketAssets(profile: UserProfile): boolean {
  if (['supervisor', 'admin'].includes(profile.role)) return true
  if (profile.role === 'corporate_admin') {
    return profile.is_it_supervisor === true || profile.is_maintenance_supervisor === true
  }
  return false
}

// ─── Permisos Comunitarios ───────────────────────────────────────────────────

/** ¿Puede ver movimientos financieros del condominio? */
export function canViewFinances(profile: UserProfile): boolean {
  // Admin y gestores siempre pueden ver
  if (['admin', 'corporate_admin', 'auditor'].includes(profile.role)) return true
  // Residentes pueden ver finanzas de su propia propiedad (transparencia)
  if (profile.role === 'resident') return true
  return false
}

/** ¿Puede gestionar (crear/editar/eliminar) movimientos financieros? */
export function canManageFinances(profile: UserProfile): boolean {
  return ['admin', 'corporate_admin'].includes(profile.role)
}

/** ¿Puede gestionar facturación y cobros a residentes? */
export function canManageBilling(profile: UserProfile): boolean {
  return ['admin', 'corporate_admin'].includes(profile.role)
}

/** ¿Puede ver el listado de residentes? */
export function canViewResidents(profile: UserProfile): boolean {
  return ['admin', 'corporate_admin', 'security_guard'].includes(profile.role)
}

/** ¿Puede gestionar (agregar/editar/dar de baja) residentes? */
export function canManageResidents(profile: UserProfile): boolean {
  return ['admin', 'corporate_admin'].includes(profile.role)
}

/** ¿Puede gestionar reservas de áreas comunes? (admin aprueba/cancela) */
export function canManageReservations(profile: UserProfile): boolean {
  return ['admin', 'corporate_admin'].includes(profile.role)
}

/** ¿Puede ver el registro de accesos? */
export function canViewAccessLog(profile: UserProfile): boolean {
  return ['admin', 'corporate_admin', 'security_guard', 'auditor'].includes(profile.role)
}

/** ¿Puede operar el módulo de control de acceso (registro de visitantes)? */
export function canManageAccessControl(profile: UserProfile): boolean {
  return ['admin', 'corporate_admin', 'security_guard'].includes(profile.role)
}

/** ¿Puede crear encuestas/votaciones? */
export function canManageSurveys(profile: UserProfile): boolean {
  return ['admin', 'corporate_admin'].includes(profile.role)
}

/** ¿Puede votar en encuestas comunitarias? */
export function canVoteSurveys(profile: UserProfile): boolean {
  return ['resident', 'admin', 'corporate_admin'].includes(profile.role)
}

/** ¿Es un residente activo? */
export function isResident(profile: UserProfile): boolean {
  return profile.role === 'resident'
}

/** ¿Es un guardia de seguridad? */
export function isSecurityGuard(profile: UserProfile): boolean {
  return profile.role === 'security_guard'
}

// ─── Hub visibility helpers ──────────────────────────────────────────────────

/** Módulos visibles en el hub según el rol */
export function getHubModulesForRole(profile: UserProfile): string[] {
  const role = profile.role
  if (role === 'admin') {
    return ['it-helpdesk', 'mantenimiento', 'finanzas', 'residentes', 'control-acceso', 'reservas', 'votaciones', 'corporativo', 'reportes', 'admin']
  }
  if (role === 'corporate_admin') {
    const modules = profile.hub_visible_modules ?? {}
    return Object.entries(modules).filter(([, v]) => v).map(([k]) => k)
  }
  if (role === 'resident') {
    return ['mi-portal', 'reservas', 'votaciones', 'tickets-comunidad']
  }
  if (role === 'security_guard') {
    return ['control-acceso']
  }
  if (role === 'supervisor') {
    return ['it-helpdesk', 'mantenimiento']
  }
  if (role === 'agent_l1' || role === 'agent_l2') {
    return ['it-helpdesk', 'mantenimiento']
  }
  if (role === 'auditor') {
    return ['reportes', 'finanzas', 'control-acceso']
  }
  // requester
  return ['it-helpdesk', 'mantenimiento']
}

/**
 * Verifica si un usuario tiene un permiso específico
 */
export function hasPermission(profile: UserProfile, permission: Permission): boolean {
  const permissionMap: Record<Permission, (profile: UserProfile) => boolean> = {
    view_all_tickets: canViewAllTickets,
    manage_tickets: (p) => canManageTickets(p.role),
    assign_tickets: canAssignTickets,
    close_tickets: (p) => canManageTickets(p.role),
    escalate_tickets: canAssignTickets,
    view_reports: canViewReports,
    manage_users: (p) => canManageUsers(p.role),
    manage_assets: canEditTicketAssets,
    view_beo: () => true,
    view_audit: canViewReports,
    manage_locations: (p) => canManageUsers(p.role),
    delete_tickets: canDeleteTickets,
    supervisor_access: hasSupervisorPermissions,
    view_finances: canViewFinances,
    manage_finances: canManageFinances,
    manage_billing: canManageBilling,
    view_residents: canViewResidents,
    manage_residents: canManageResidents,
    manage_reservations: canManageReservations,
    view_access_log: canViewAccessLog,
    manage_access_control: canManageAccessControl,
    manage_surveys: canManageSurveys,
    vote_surveys: canVoteSurveys,
  }

  return permissionMap[permission]?.(profile) ?? false
}

/**
 * Helper para verificar si es admin o tiene permisos equivalentes
 */
export function isAdminLike(role: Role): boolean {
  return ['admin', 'corporate_admin'].includes(role)
}

/**
 * Helper para verificar si es supervisor o tiene permisos equivalentes
 * DEPRECATED: Usar hasSupervisorPermissions con perfil completo
 */
export function isSupervisorLike(profile: UserProfile): boolean {
  return hasSupervisorPermissions(profile)
}