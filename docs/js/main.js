/* global codecopy */

window.$docsify = {
  repo: 'microlinkhq/keyvhq',
  maxLevel: 3,
  auto2top: true,
  externalLinkRel: 'noopener noreferrer',
  plugins: [
    function (hook) {
      hook.ready(function () {
        codecopy('pre')
      })
    }
  ]
}
