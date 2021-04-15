import { join } from 'path'
import { existsSync } from 'fs'
import type { Plugin, ResolvedConfig } from 'vite'
import { generateSW } from 'workbox-build'
import { generateSimpleSWRegister, injectServiceWorker } from './html'
import { generateInjectManifest, generateRegisterSW } from './modules'
import { ResolvedVitePWAOptions, VitePWAOptions } from './types'
import { resolveOptions } from './options'
import { FILE_MANIFEST, FILE_SW_REGISTER, VIRTUAL_MODULES, VIRTUAL_MODULES_MAP, VIRTUAL_MODULES_RESOLVE_PREFIX } from './constants'

export function VitePWA(userOptions: Partial<VitePWAOptions> = {}): Plugin[] {
  let viteConfig: ResolvedConfig
  let options: ResolvedVitePWAOptions
  let useImportRegister = false

  return [
    {
      name: 'vite-plugin-pwa',
      enforce: 'post',
      apply: 'build',
      configResolved(config) {
        viteConfig = config
        options = resolveOptions(userOptions, viteConfig)
      },
      transformIndexHtml: {
        enforce: 'post',
        transform(html) {
          return injectServiceWorker(html, options)
        },
      },
      generateBundle(_, bundle) {
        if (options.manifest) {
          bundle[FILE_MANIFEST] = {
            isAsset: true,
            type: 'asset',
            name: undefined,
            source: `${JSON.stringify(options.manifest, null, options.minify ? 0 : 2)}\n`,
            fileName: FILE_MANIFEST,
          }
        }

        // if virtual register is requested, do not inject.
        if (options.injectRegister === 'auto')
          options.injectRegister = useImportRegister ? null : 'script'

        if (options.injectRegister === 'script' && !existsSync(join(viteConfig.root, 'public', FILE_SW_REGISTER))) {
          bundle[FILE_SW_REGISTER] = {
            isAsset: true,
            type: 'asset',
            name: undefined,
            source: generateSimpleSWRegister(options),
            fileName: FILE_SW_REGISTER,
          }
        }
      },
      async closeBundle() {
        if (!viteConfig.build.ssr) {
          if (options.strategies === 'injectManifest')
            await generateInjectManifest(options, viteConfig)
          else
            await generateSW(options.workbox)
        }
      },
    },
    {
      name: 'vite-plugin-pwa:virtual',
      configResolved(config) {
        viteConfig = config
        options = resolveOptions(userOptions, viteConfig)
      },
      resolveId(id) {
        return VIRTUAL_MODULES.includes(id) ? VIRTUAL_MODULES_RESOLVE_PREFIX + id : undefined
      },
      load(id) {
        if (id.startsWith(VIRTUAL_MODULES_RESOLVE_PREFIX))
          id = id.slice(VIRTUAL_MODULES_RESOLVE_PREFIX.length)
        else
          return

        if (VIRTUAL_MODULES.includes(id)) {
          useImportRegister = true
          return generateRegisterSW(
            options,
            viteConfig.command === 'build' ? 'build' : 'dev',
            VIRTUAL_MODULES_MAP[id],
          )
        }
      },
    },
  ]
}

export { cachePreset } from './cache'
export type { VitePWAOptions as Options }
