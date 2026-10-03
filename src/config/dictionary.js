// The washi dictionary is an HTML document the team made before this site
// existed. This page is its frame; the document itself is connected here.
//
// To connect it:
//   1. Put the HTML (and anything it loads) under  public/dictionary/
//      so that it opens at  /dictionary/index.html
//   2. Set `ready` to true below.
//   3. Push to main.
//
// The frame passes the reader's language and theme in the address
// (?lang=en|ja&theme=light|dark); the document may use them or ignore them.
// Until `ready` is true the page says the dictionary is in preparation and
// points to the course glossary instead.
export const DICTIONARY = {
  ready: false,
  src: '/dictionary/index.html',
}
