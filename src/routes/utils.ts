export const isProviderValid = (
  provider: string | undefined,
  openIDConfigUrl: string | undefined,
) => (provider || openIDConfigUrl) && !(provider && openIDConfigUrl)