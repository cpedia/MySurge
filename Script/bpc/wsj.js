let body = $response.body

if (/<\/html>|<\/body>/.test(body)) {
    body = body.replace('</body>', `
<script src='https://raw.githubusercontent.com/cpedia/MySurge/main/Script/lib/purify.min.js'></script>
<script type="text/javascript">

if (matchDomain('wsj.com')) {
  if (matchDomain('www.wsj.com'))
    blockJsReferrer();
  if (window.location.pathname.startsWith('/livecoverage/')) {
    window.setTimeout(function () {
      let paywall = document.querySelector('div#cx-lc-snippet');
      let amphtml = document.querySelector('head > link[rel="amphtml"]');
      if (paywall) {
        removeDOMElement(paywall);
        if (amphtml) {
          amp_redirect_not_loop(amphtml);
        } else {
          let fade = document.querySelectorAll('div[class*="-CardWrapper"]');
          for (let elem of fade)
            elem.removeAttribute('class');
        }
      }
    }, 1000);
  } else {
    let url_article = window.location.pathname.includes('/articles/');
    let path_article = window.location.pathname.match(/((\w)+(\-)+){3,}\w+/);
    if (url_article || path_article) {
      if (window.location.pathname.startsWith('/amp/')) {
        amp_unhide_subscr_section();
        let masthead_link = document.querySelector('div.masthead > a[href*="-"]');
        if (masthead_link)
          masthead_link.href = 'https://www.wsj.com';
      } else {
        let snippet = document.querySelector('.snippet-promotion, div#cx-snippet-overlay');
        if (snippet) {
          removeDOMElement(snippet);
          if (!matchDomain('www.wsj.com')) {
            if (url_article)
              window.location.href = window.location.href.replace('wsj.com', 'wsj.com/amp');
            else
              window.location.href = '/amp/articles/' + path_article[0];
          } else {
            let wsj_pro = snippet.querySelector('a[href^="https://wsjpro.com/"]');
            let article = document.querySelector('article');
            if (article) {
              window.setTimeout(function () {
                if (wsj_pro) {
                  article.firstChild.before(googleSearchToolLink(window.location.href));
                  article.firstChild.before(archiveLink(window.location.href, 'BPC > Try for full article text (articles before 2023-10-28)'));
                } else
                  article.firstChild.before(archiveLink(window.location.href));
              }, 500);
              csDoneOnce = true;
              waitDOMElement('div.paywall', 'DIV', node => hideDOMElement(...document.querySelectorAll('div#bpc_archive')), false);
            }
          }
        }
      }
    }
  }
  let ads = document.querySelectorAll('div.wsj-ad, div.adWrapper, div.uds-ad-container');
  hideDOMElement(...ads);
}


// General Functions
function removeDOMElement(...elements) {
  for (let element of elements) {
    if (element)
      element.remove();
  }
}

function hideDOMElement(...elements) {
  for (let element of elements) {
    if (element)
      element.style = 'display:none !important;';
  }
}

function waitDOMElement(selector, tagName = '', callback, multiple = false) {
  new window.MutationObserver(function (mutations) {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        if (!tagName || (node.tagName === tagName)) {
          if (node.matches(selector)) {
            callback(node);
            if (!multiple)
              this.disconnect();
          }
        }
      }
    }
  }).observe(document, {
    subtree: true,
    childList: true
  });
}

function matchDomain(domains, hostname = window.location.hostname) {
  let matched_domain = false;
  if (typeof domains === 'string')
    domains = [domains];
  domains.some(domain => (hostname === domain || hostname.endsWith('.' + domain)) && (matched_domain = domain));
  return matched_domain;
}

function header_nofix(header, msg = 'BPC > no fix') {
  if (header && !document.querySelector('div#bpc_nofix')) {
    let nofix_div = document.createElement('div');
    nofix_div.id = 'bpc_nofix';
    nofix_div.style = 'margin: 20px; font-size: 20px; font-weight: bold; color: red;';
    nofix_div.innerText = msg;
    header.before(nofix_div);
  }
}

function blockJsReferrer() {
  if (document.head && !document.querySelector('head > meta[name="referrer"][content="no-referrer"]')) {
    var meta = document.createElement('meta');
    meta.name = "referrer";
    meta.content = "no-referrer";
    document.head.appendChild(meta);
  }
}

function amp_iframes_replace(weblink = false, source = '') {
  let amp_iframes = document.querySelectorAll('amp-iframe' + (source ? '[src*="'+ source + '"]' : ''));
  let par, elem;
  for (let amp_iframe of amp_iframes) {
    if (!weblink) {
      elem = document.createElement('iframe');
      Object.assign(elem, {
        src: amp_iframe.getAttribute('src'),
        height: amp_iframe.getAttribute('height'),
        width: 'auto',
        style: 'border: 0px;'
      });
      if (amp_iframe.getAttribute('sandbox'))
        elem.sandbox = amp_iframe.getAttribute('sandbox');
      amp_iframe.parentNode.replaceChild(elem, amp_iframe);
    } else {
      par = document.createElement('p');
      par.style = 'margin: 20px 0px;';
      elem = document.createElement('a');
      elem.innerText = 'Media-link';
      elem.setAttribute('href', amp_iframe.getAttribute('src'));
      elem.setAttribute('target', '_blank');
      par.appendChild(elem);
      amp_iframe.parentNode.replaceChild(par, amp_iframe);
    }
  }
}


function amp_redirect_not_loop(amphtml) {
  let amp_redirect_date = Number(sessionStorage.getItem('###_amp_redirect'));
  if (!(amp_redirect_date && Date.now() - amp_redirect_date < 2000)) {
    sessionStorage.setItem('###_amp_redirect', Date.now());
    window.location.href = amphtml.href;
  } else {
    let header = (document.body && document.body.firstChild) || document.documentElement;
    header_nofix(header, 'BPC > redirect to amp failed (disable amp-to-html extension/add-on or browser setting)');
  }
}

function amp_unhide_subscr_section(amp_ads_sel = 'amp-ad, .ad', replace_iframes = true, amp_iframe_link = false, source = '') {
  let preview = document.querySelectorAll('[subscriptions-section="content-not-granted"]');
  removeDOMElement(...preview);
  let subscr_section = document.querySelectorAll('[subscriptions-section="content"]');
  for (let elem of subscr_section)
    elem.removeAttribute('subscriptions-section');
  let amp_ads = document.querySelectorAll(amp_ads_sel);
  hideDOMElement(...amp_ads);
  if (replace_iframes)
    amp_iframes_replace(amp_iframe_link, source);
}

function archiveRandomDomain() {
  let tld_array = ['fo', 'is', 'li', 'md', 'ph', 'vn'];
  let tld = tld_array[randomInt(6)];
  return 'archive.' + tld;
}

function archiveLink(url, text_fail = 'BPC > Try for full article text (no need to report issue for external site):\\r\\n') {
  return externalLink(['archive.today', archiveRandomDomain()], 'https://{domain}?run=1&url={url}', url, text_fail);
}

function googleSearchToolLink(url, text_fail = 'BPC > Full article text (test url & copy html (tab) code to [https://codebeautify.org/htmlviewer]:\\r\\n'){
  return externalLink(['search.google.com'], 'https://search.google.com/test/rich-results?url={url}', encodeURIComponent(url), text_fail);
}

function externalLink(domains, ext_url_templ, url, text_fail = 'BPC > Full article text:\\r\\n') {
  let text_fail_div = document.createElement('div');
  text_fail_div.id = 'bpc_archive';
  text_fail_div.setAttribute('style', 'margin: 20px; font-size: 20px; font-weight: bold; color: red;');
  let parser = new DOMParser();
  text_fail = text_fail.replace(/\\[([^\\]]+)\\]/g, "<a href='$1' target='_blank' style='color: red'>$1</a>");
  let doc = parser.parseFromString('<span>' + text_fail + '</span>', 'text/html');
  let elem = doc.querySelector('span');
  text_fail_div.appendChild(elem);
  for (let domain of domains) {
    let ext_url = ext_url_templ.replace('{domain}', domain).replace('{url}', url.split('?')[0]);
    let a_link = document.createElement('a');
    a_link.innerText = domain;
    a_link.href = ext_url;
    a_link.target = '_blank';
    text_fail_div.appendChild(document.createTextNode(' | '));
    text_fail_div.appendChild(a_link);
  }
  return text_fail_div;
}

function randomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

</script></body>`)

    console.log('Success')
}

$done({ body })