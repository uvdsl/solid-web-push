"use strict";

import { Parser, Prefixes, Quad, Store } from "n3";

interface ParsedN3 {
  store: Store;
  prefixes: Prefixes;
}

/**
 * #######################
 * ### BASIC REQUESTS  ###
 * #######################
 */

/**
 *
 * @param uri: the URI to strip from its fragment #
 * @return substring of the uri prior to fragment #
 */
function _stripFragment(uri: string): string {
  const indexOfFragment = uri.indexOf("#");
  if (indexOfFragment !== -1) {
    uri = uri.substring(0, indexOfFragment);
  }
  return uri;
}


/**
 * Parse text/turtle to N3.
 * @param text text/turtle
 * @param baseIRI string
 * @return Promise ParsedN3
 */
export async function parseToN3(
  text: string,
  baseIRI: string
): Promise<ParsedN3> {
  const store = new Store();
  const parser = new Parser({ baseIRI: _stripFragment(baseIRI), blankNodePrefix: ''}); // { blankNodePrefix: 'any' } does not have the effect I thought
  return new Promise((resolve, reject) => {
    // parser.parse is actually async but types don't tell you that.
    parser.parse(text, (error: Error, quad: Quad, prefixes: Prefixes) => {
      if (error) reject(error);
      if (quad) store.addQuad(quad);
      else resolve({ store, prefixes });
    });
  });
}
