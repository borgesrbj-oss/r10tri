/** Remove credenciais antes de serializar um perfil para o navegador ou a API. */
export function publicProfile<T extends { intervalsIcuApiKey?: string | null }>(profile: T | null) {
  if (!profile) return null;
  const { intervalsIcuApiKey, ...publicFields } = profile;
  return { ...publicFields, hasIntervalsKey: Boolean(intervalsIcuApiKey?.trim()) };
}
