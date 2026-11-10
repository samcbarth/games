/* Site-wide ad and network ids. Leave a value empty and its slots render nothing.
   Fill these in once the accounts exist (see README.md). */
window.SITE_CONFIG = {
  ADSENSE_CLIENT: '',          // e.g. 'ca-pub-1234567890123456'
  AD_SLOTS: {                  // AdSense ad unit ids per slot position
    intro: '',                 // after the intro / below the game
    mid: '',                   // mid content
    end: '',                   // end of content
    sidebar: '',               // desktop sidebar
    between: ''                // shown only between rounds (after game over), below the play area
  },
  AMAZON_TAG: ''               // not used on this AdSense site, kept for network consistency
};
