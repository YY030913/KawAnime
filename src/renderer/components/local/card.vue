<template lang="pug">
  v-card
    v-img(
        :src="picture || ''",
        :lazy-src="picture || ''",
        height='250px',
        @mouseenter='showOverlay',
        @mouseleave='hideOverlay'
      )
      transition-group(name='overlay-trans')
        v-container.overlay(
          v-if='hover',
          key='overlay',
          fill-height,
          fluid,
          pa-0
        )
          v-layout(fill-height, align-center row, wrap, ml-0)
            v-flex.overlay-icon(@click='play', xs6, fill-height)
              v-icon.large play_arrow
            v-flex.pa-0.download-container(xs6, fill-height)
              v-layout.ma-0(fill-height, column)
                v-flex.overlay-icon(@click='more', xs6, fill-height)
                  v-icon.large more_horiz
                v-flex.overlay-icon.delete(@click='remove', xs6, fill-height)
                  v-icon.large(color='#EF5350') delete

        v-container(
          v-else,
          key='main'
          fill-height,
          fluid,
          pa-0
        )
          v-layout.text(fill-height, column, justify-space-between)
            template(v-if='file.eps')
              v-flex(xs2, pt-0)
                .entry-eps
                  div(
                    @mouseenter='setEpHover(true)',
                    @mouseleave='setEpHover(false)',
                  )
                    v-autocomplete(
                      label='Episode',
                      v-model='currentEp',
                      :items='eps',
                      hide-details,
                      dense
                    )
            template(v-else)
              v-flex.entry-ep(xs2)
                span {{ file.animeType2 }}
            v-flex.text-center(v-if='!picture', xs2)
              v-progress-circular(indeterminate)
            v-flex.entry-title(xs2)
              div {{ file.title }}

    v-card-actions
      v-layout.actions(justify-space-around)
        template(v-for='list in lists')
          v-tooltip(top)
            template(v-slot:activator='{ on }')
              v-btn(
                v-on='on',
                @click='_addTo(list.list)',
                icon
              )
                v-icon(:color="_isIn(list.list) ? '#66BB6A' : 'default'") {{ list.icon }}
            span {{ _isIn(list.list) ? 'Remove from' : 'Add to' }} {{ list.name }}
</template>

<script>
import { mapGetters } from 'vuex'

import Status from '@/mixins/lists/status.js'
import Ipc from '@/mixins/localFiles/ipc.js'

export default {
  name: 'Local-Card',

  mixins: [ Status, Ipc ],

  props: ['file', 'reset'],

  mounted () {
    this.getInfo()

    if (this.file.eps) this.currentEp = this.file.eps[0].ep
  },

  data: () => ({
    epHover: false,
    hover: false,
    wantsHover: false,
    info: null,
    currentEp: null
  }),

  computed: {
    ...mapGetters('info', [ 'getEntryInfo' ]),
    lists: {
      get () {
        return this.$store.state.watchLists.listNames
      },
      set () {}
    },
    inside: {
      get () {
        return this.$store.state.localFiles.inside
      },
      set () {}
    },
    picture () {
      return (this.info && this.info.img) || null
    },
    name () {
      // Useful for list status mixins
      return this.file.title
    },
    eps () {
      return (this.file.eps || [])
        .map((e) => e.ep)
        .reverse()
    },
    title () {
      return `${this.file.title} - ${this.currentEp || this.file.ep || this.file.animeType2 || 'N/A'}`
    },
    path () {
      return this.currentEp
        ? this.file.eps.find((ep) => ep.ep === this.currentEp).path
        : this.file.path
    }
  },

  methods: {
    showOverlay () {
      this.wantsHover = true

      setImmediate(() => {
        if (!this.epHover) this.hover = true
      })
    },
    setEpHover (bool) {
      this.epHover = bool

      setImmediate(() => {
        if (!bool && this.wantsHover) this.showOverlay()
      })
    },
    hideOverlay () {
      this.wantsHover = false

      setImmediate(() => { this.hover = false })
    },
    updateInfo () {
      this.$log(`No local information for ${this.file.title}, retrieving...`)
      this.$store.dispatch('info/get', { name: this.file.title })
    },
    setInfo () {
      this.$set(this, 'info', this.getEntryInfo(this.file.title, true))
    },
    getInfo () {
      this.$store.dispatch('info/getLocalInfo', {
        name: this.file.title
      })
    },
    remove () {
      this.$electron.shell.moveItemToTrash(this.path)

      this.$store.dispatch('history/append', {
        type: 'Delete',
        text: this.title
      })

      this.$emit('refresh')
    },
    more () {
      if (this.info) {
        this.$emit('more', this.info, this.file)
      }
    },
    play () {
      if (this.inside) {
        this.$store.dispatch('streaming/play', {
          link: this.path,
          name: this.title,
          neighbours: null
        })
      } else {
        this.$electron.shell.openItem(this.path)

        this.$store.dispatch('history/append', {
          type: 'Play',
          text: this.title
        })
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
  // Overlay part
  .overlay-trans-enter, .overlay-trans-leave-to
    opacity 0

  .overlay-trans-enter-active, .overlay-trans-leave
    transition all .5s

  .overlay
    background-color rgba(0, 0, 0, 0.7)

  .overlay-icon
    position relative
    display flex
    justify-content center
    align-items center
    transition all .25s
    cursor pointer

    &:hover
      background-color rgba(255, 255, 255, 0.20)

    .large
      font-size 72px

    &.delete:hover
      background-color rgba(200, 34, 30, 0.2)

  // Not overlay
  .text
    font-size 18px
    letter-spacing 0.07em
    font-weight bold
    color white

  .entry-title
    padding-top 10px
    background linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.01))

    div
      font-size 20px
      padding 8px
      text-align center

  .entry-eps
    text-align right

    &>div
      padding 8px 10px
      display inline-block
      width 30%
      border-radius 0 0 0 3px
      background-color rgba(0, 0, 0, 0.6)

  .entry-ep
    text-align right
    font-size 18px
    letter-spacing 0.03em
    padding-top 0 !important

    span
      height 100%
      padding 8px 12px
      border-radius 0 0 0 3px
      background-color rgba(0, 0, 0, 0.6)

  .actions
    padding 4px 16px !important
</style>
