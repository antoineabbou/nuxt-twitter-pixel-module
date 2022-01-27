/**
 * @class Tw
 */
 class Tw {
  constructor (twq, options) {
    this.options = options
    this.twq = twq

    this.isEnabled = !options.disabled
  }

  setPixelId (pixelId) {
    this.options.pixelId = pixelId
    this.init()
  }

  /**
   * @method enable
   */
  enable () {
    this.isEnabled = true
    this.init()
    this.track()
  }

  /**
   * @method disable
   */
  disable () {
    this.isEnabled = false
  }

  /**
   * @method init
   */
  init () {
    this.query('init', this.options.pixelId)
  }

  /**
   * @method track
   */
  track (event = null, parameters = null) {
    if (!event) {
      event = this.options.track
    }

    this.query('track', event, parameters)
  }

  /**
   * @method query
   * @param {string} cmd
   * @param {object} option
   * @param {object} parameters
   */
  query (cmd, option, parameters = null) {
    if (this.options.debug) log('Command:', cmd, 'Option:', option, 'Additional parameters:', parameters)
    if (!this.isEnabled) return

    if (!parameters) {
      this.twq(cmd, option)
    } else {
      this.twq(cmd, option, parameters)
    }
  }
}

function getMatchingPixel (options, path) {
  return options.pixels.find(pixel => {
    const routeIndex = pixel.routes.findIndex(route => {
      const minimatch = new Minimatch(route)
      return minimatch.match(path)
    })

    return routeIndex !== -1
  })
}

function log (...messages) {
  console.info.apply(this, ['[nuxt-facebook-pixel-module]', ...messages])
}

export default (ctx, inject) => {
  let _twq
  const parsedOptions = <%= JSON.stringify(options) %>
  const isDev = parsedOptions.dev && !parsedOptions.debug

  if (isDev) log('You are running in development mode. Set "debug: true" in your nuxt.config.js if you would like to trigger tracking events in local.')

  const { path } = ctx.route
  const matchingPixel = getMatchingPixel(parsedOptions, path)

  const pixelOptions = Object.assign({}, matchingPixel || parsedOptions)

  /* eslint-disable */
  if (typeof window !== 'undefined') {
    !function(e, t, n, s, u, a) {
      e.twq || (s = e.twq = function() {
        s.exe ? s.exe.apply(s, arguments) : s.queue.push(arguments);
      },
      s.version = pixelOptions.version, 
      s.queue = [], 
      u = t.createElement(n), 
      u.async = !0, 
      u.src = '//static.ads-twitter.com/uwt.js',
      a = t.getElementsByTagName(n)[0], a.parentNode.insertBefore(u, a))
      _twq = twq;
    }(window, document, 'script');

    if (!isDev && !pixelOptions.disabled) {
      twq('init', pixelOptions.pixelpixelId)
      twq('track', pixelOptions.track)
    } 
  }
  /* eslint-enable */

  const instance = new Tw(_twq, pixelOptions)

  if (ctx.app && ctx.app.router) {
    const router = ctx.app.router
    router.afterEach(({ path }) => {
      /**
       * Change the current pixelId according to the route.
       */
      const matchingPixel = getMatchingPixel(parsedOptions, path)

      const pixelOptions = Object.assign({}, matchingPixel || parsedOptions)
      if (pixelOptions.pixelId !== instance.options.pixelId) {
        instance.setPixelId(pixelOptions.pixelId)
      }

      /**
       * Automatically track PageView
       */
      if (parsedOptions.autoPageView) {
        instance.track('PageView')
      }
    })
  }

  /* eslint-enable */
  ctx.$tw = instance
  inject('tw', instance)
}