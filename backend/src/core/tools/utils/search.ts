import * as cheerio from 'cheerio';

interface SearchResults {
  success: true;
  zci: {
    title: string;
    text: string;
    url: string;
  } | null;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

// TODO: Captcha handling
export const search = {
  async duckduckgo(query: string, page: number) {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&t=h_&ia=web&p=${page}`
    );
    const html = await res.text();
    const $ = cheerio.load(html);

    const zci = $('.zci');
    const zero_click_abstract = zci.find('#zero_click_abstract');
    const title = zci.find('.zci__heading a');
    zero_click_abstract.find('a').remove();

    const result_zci_text = zero_click_abstract.text().trim();
    const result_zci = result_zci_text
      ? ({
          title: title.text(),
          text: result_zci_text,
          url: title.attr('href')!
        } satisfies SearchResults['zci'])
      : null;

    const results = $('#links')
      .find('.links_main.links_deep.result__body')
      .get()
      .map(el => {
        const title = $(el).find('.result__a');
        const url = new URL(`https:${title.attr('href')}`).searchParams.get('uddg')!;
        const snippet = $(el).find('.result__snippet');
        return {
          title: title.text(),
          url,
          snippet: snippet.text()
        } satisfies SearchResults['results'] extends Array<infer T> | undefined ? T : never;
      });

    return {
      success: true,
      zci: result_zci,
      results
    } satisfies SearchResults;
  }
} as const;
