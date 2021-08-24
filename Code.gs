const CRYPTO_CURRENCIES = {'BTC': 'https://coinmarketcap.com/currencies/bitcoin/', 'ETH': 'https://coinmarketcap.com/currencies/ethereum/'}, // add more cryptocurrencies that you want to follow
      COINMARKET_API_URL = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${Object.keys(CRYPTO_CURRENCIES).join(',')}`,
      COINMARKET_API_KEY = 'YOUR_COINMARKET_API_KEY',
      BOT_TOKEN = 'YOUR_BOT_TOKEN',
      TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      CHAT_ID = 'YOUR_CHAT_ID',
      STEP_PERCENT_ALERT = 1.5;

const getCryptoPrice = () => {
  try {
    let options = {
      'method' : 'get',
      'contentType': 'application/json',
      'headers': {
        'X-CMC_PRO_API_KEY': COINMARKET_API_KEY
      }
    };
    let response = UrlFetchApp.fetch(COINMARKET_API_URL, options);
    let data = JSON.parse(response.getContentText())["data"];
    if (!data) {
      return [];
    }
    Logger.log("Fetch data success");
    data = Object.keys(CRYPTO_CURRENCIES).map(item => {
      let value = data[item];
      value.quote.USD.last_updated = new Date(value.quote.USD.last_updated).toLocaleString('vi-VI', { timeZone: 'Asia/Saigon' });
      return {
        symbol: value.symbol,
        price: value.quote.USD,
      }
    })
    return data;
  } catch (e) {
    Logger.log(`Error: ${e}`);
    return [];
  }
}

const sendTelegram = () => {
  let data = getCryptoPrice();
  if (!data.length) {
    return;
  }
      
  let isAlert = false;
  let prices = data.map(item => {
    if (item.symbol == 'BTC' && Math.abs(item.price.percent_change_24h) > STEP_PERCENT_ALERT) {
      isAlert = true;
    }
    return `<a href="${CRYPTO_CURRENCIES[item.symbol]}">${item.symbol}</a>: <pre>${JSON.stringify(item.price, null, '\t')}</pre>`
  }).join("\n");
      
  if (isAlert) {
    let message = `Click to link for more details <a href="https://coinmarketcap.com/coins/">CoinMarketCap</a>\n${prices}`;
    let text = encodeURIComponent(message);
    let url = `${TELEGRAM_API}?chat_id=${CHAT_ID}&text=${text}&parse_mode=HTML`;
    let response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    let { ok, description } = JSON.parse(response);
    if (ok !== true) {
      Logger.log(`Error: ${description}`);
    } else {
      Logger.log('Send success');
    }
  }
}
