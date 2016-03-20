import semver from 'semver'
import url from 'url'
import {map} from 'rxjs/operator/map'
import {publishReplay} from 'rxjs/operator/publishReplay'
import {httpGetJSON} from './util'
import {registry} from './config'
import memoize from 'lodash.memoize'

/**
 * fetch the CommonJS package root JSON document for a specific npm package.
 * @param {String} name - package name.
 * @return {Object} - observable sequence of the JSON document that represents
 * the package root.
 */
const httpGetPackageRoot = memoize((name) =>
  httpGetJSON(url.resolve(registry, name))
    ::publishReplay()
)

export httpGetPackageRoot

/**
 * resolve a package defined via an ambiguous semantic version string to a
 * specific `package.json` file.
 * @param {String} name - package name.
 * @param {String} version - semantic version string to be used as a target.
 * @return {Object} - observable sequence of the `package.json` file.
 */
export function resolve (name, version) {
  return httpGetPackageRoot(name, registry)::map((packageRoot) => {
    const availableVersions = Object.keys(packageRoot.versions)
    const targetVersion = semver.maxSatisfying(availableVersions, version)
    const target = packageRoot.versions[targetVersion]
    if (!target) {
      throw new Error(`no version of ${name} that satisfies ${version}`)
    }
    return target
  })
}