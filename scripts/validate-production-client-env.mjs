function validateProductionClientEnv(mode, env) {
  if (mode !== 'production') {
    return null
  }

  const requiredKeys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
  const missingKeys = requiredKeys.filter((key) => !env[key]?.trim())

  if (!missingKeys.length) {
    return null
  }

  return {
    name: 'validate-production-client-env',
    buildStart() {
      throw new Error(
        [
          'Production build is missing required client environment variables:',
          missingKeys.join(', '),
          'Add them in Vercel → Project Settings → Environment Variables (Production), then redeploy.',
        ].join(' '),
      )
    },
  }
}

export default validateProductionClientEnv
