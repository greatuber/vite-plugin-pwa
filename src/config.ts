import fs from 'fs'
import { resolve } from 'path'
import { ResolvedConfig } from 'vite'
import { GenerateSWConfig, InjectManifestConfig } from 'workbox-build'
import { ManifestOptions, VitePWAOptions, ResolvedVitePWAOptions } from './types'
import { cachePreset } from './cache'

export function resolveBathPath(base: string) {
  return !base.startsWith('/') ? `/${base}` : base
}

export function resolveOptions(options: Partial<VitePWAOptions>, viteConfig: ResolvedConfig): ResolvedVitePWAOptions {
  const root = viteConfig.root
  const pkg = fs.existsSync('package.json')
    ? JSON.parse(fs.readFileSync('package.json', 'utf-8'))
    : {}

  const {
    // prevent tsup replacing `process.env`
    // eslint-disable-next-line dot-notation
    mode = (process['env']['NODE_ENV'] || 'production') as ('production' | 'development'),
    srcDir = 'public',
    outDir = viteConfig.build.outDir || 'dist',
    inlineRegister = true,
    filename = 'sw.js',
    strategies = 'generateSW',
    scope,
    minify = true,
  } = options

  // @ts-expect-error
  const basePath = resolveBathPath(viteConfig.base || viteConfig.build.base)
  const swSrc = resolve(root, srcDir, filename)
  const swDest = resolve(root, outDir, filename)
  const outDirRoot = resolve(root, outDir)

  const defaultWorkbox: GenerateSWConfig = {
    swDest,
    globDirectory: outDirRoot,
    offlineGoogleAnalytics: false,
    runtimeCaching: cachePreset,
    mode,
    navigateFallback: 'index.html',
  }

  const defaultInjectManifest: InjectManifestConfig = {
    swSrc,
    swDest,
    globDirectory: outDirRoot,
    injectionPoint: 'self.__WB_MANIFEST',
  }

  const defaultManifest: Partial<ManifestOptions> = {
    name: pkg.name,
    short_name: pkg.name,
    start_url: './', // Relative to the manifest URL, which already includes the base.
    display: 'standalone',
    background_color: '#ffffff',
    lang: 'en',
  }

  const workbox = Object.assign({}, defaultWorkbox, options.workbox || {})
  const manifest = Object.assign({}, defaultManifest, options.manifest || {})
  const injectManifest = Object.assign({}, defaultInjectManifest, options.injectManifest || {})

  return {
    mode,
    swDest,
    srcDir,
    outDir,
    inlineRegister,
    filename,
    strategies,
    workbox,
    manifest,
    injectManifest,
    basePath,
    scope: scope || basePath,
    minify,
  }
}
